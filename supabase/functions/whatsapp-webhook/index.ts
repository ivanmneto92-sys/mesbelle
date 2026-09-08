import { createClient } from "npm:@supabase/supabase-js@2";

// Webhook oficial do WhatsApp Cloud API (Meta): recebe toda mensagem enviada
// pelo número da loja e cria o lead automaticamente no CRM (ou, se já existir
// um lead com aquele telefone, só anexa a mensagem em notas_internas — nunca
// duplica). Endpoint público, sem Bearer de usuário (a Meta não manda um), a
// segurança vem de dois lugares: o handshake de verificação abaixo (GET, na
// hora de configurar o webhook no painel da Meta) e a assinatura
// X-Hub-Signature-256 (HMAC-SHA256 com o App Secret) em cada POST — mesmo
// modelo de confiança usado no webhook público de assinatura de contrato
// deste projeto, nunca confiando em dado do payload sem validar a origem.

interface WhatsAppContato {
  wa_id: string;
  profile?: { name?: string };
}

interface WhatsAppMensagem {
  id: string;
  from: string;
  type: string;
  text?: { body?: string };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { filename?: string };
}

function normalizarDigitos(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

// Compara pelos últimos 8 dígitos (o número local, sem DDI/DDD) — cobre leads
// cadastrados com ou sem "55"/DDD na frente, contra o "from" do WhatsApp
// (que sempre vem com DDI 55 + DDD).
function mesmoNumero(a: string, b: string): boolean {
  const da = normalizarDigitos(a);
  const db = normalizarDigitos(b);
  if (da.length < 8 || db.length < 8) return false;
  return da.slice(-8) === db.slice(-8);
}

function extrairTexto(msg: WhatsAppMensagem): string {
  switch (msg.type) {
    case "text": return msg.text?.body?.trim() || "(mensagem vazia)";
    case "image": return "[Imagem]" + (msg.image?.caption ? ` ${msg.image.caption}` : "");
    case "video": return "[Vídeo]" + (msg.video?.caption ? ` ${msg.video.caption}` : "");
    case "audio": return "[Áudio]";
    case "document": return "[Documento]" + (msg.document?.filename ? ` ${msg.document.filename}` : "");
    case "sticker": return "[Figurinha]";
    case "location": return "[Localização]";
    default: return `[Mensagem: ${msg.type}]`;
  }
}

function hexParaBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function assinaturaValida(req: Request, bodyText: string, appSecret: string): Promise<boolean> {
  const header = req.headers.get("x-hub-signature-256");
  if (!header?.startsWith("sha256=")) return false;
  const recebido = hexParaBytes(header.slice("sha256=".length));
  if (!recebido) return false;

  const chave = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
  );
  return await crypto.subtle.verify("HMAC", chave, recebido, new TextEncoder().encode(bodyText));
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Handshake de verificação — a Meta chama isso uma vez, quando você salva a
  // URL do webhook no painel do app.
  if (req.method === "GET") {
    const modo = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (modo === "subscribe" && verifyToken && token === verifyToken) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const bodyText = await req.text();

  const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
  if (appSecret) {
    const ok = await assinaturaValida(req, bodyText, appSecret);
    if (!ok) return new Response("Assinatura inválida", { status: 401 });
  }

  // A Meta espera 200 rápido e reentrega o evento se não receber — por isso
  // qualquer erro de processamento aqui ainda responde 200 (só loga), nunca
  // deixa virar um retry-storm por causa de um payload inesperado.
  try {
    const payload = JSON.parse(bodyText);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;
        const value = change.value ?? {};
        const mensagens: WhatsAppMensagem[] = value.messages ?? [];
        const contatos: WhatsAppContato[] = value.contacts ?? [];

        for (const msg of mensagens) {
          // Idempotência: insere o wamid antes de processar; se já existir
          // (reentrega da Meta), o insert falha por PK e pulamos.
          const { error: dupErr } = await supabase
            .from("whatsapp_webhook_eventos")
            .insert({ wamid: msg.id });
          if (dupErr) continue;

          const telefone = normalizarDigitos(msg.from);
          if (!telefone) continue;

          const contato = contatos.find((c) => c.wa_id === msg.from);
          const nomePerfil = contato?.profile?.name?.trim();
          const texto = extrairTexto(msg);
          const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

          const { data: leadsExistentes } = await supabase
            .from("leads")
            .select("id, telefone, notas_internas")
            .order("created_at", { ascending: false });
          const leadExistente = (leadsExistentes ?? []).find((l) => mesmoNumero(l.telefone, telefone));

          if (leadExistente) {
            const notaAnterior = String(leadExistente.notas_internas ?? "");
            const notaNova = `${notaAnterior ? notaAnterior + "\n" : ""}[WhatsApp ${agora}] ${texto}`;
            await supabase.from("leads").update({ notas_internas: notaNova }).eq("id", leadExistente.id);
          } else {
            await supabase.from("leads").insert({
              nome: nomePerfil || `Lead WhatsApp ${telefone}`,
              telefone,
              status_funil: "novo_lead",
              notas_internas: `[WhatsApp ${agora}] ${texto}`,
            });
          }
        }
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (err) {
    console.error("[whatsapp-webhook] erro ao processar:", err);
    return new Response("EVENT_RECEIVED", { status: 200 });
  }
});
