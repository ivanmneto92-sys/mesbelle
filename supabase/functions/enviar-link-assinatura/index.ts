// Envia por e-mail, para a cliente, o link para assinar o contrato
// (botão "Enviar por e-mail" na tela de Contratos). Exige usuário logado com
// acesso ao CRM. O link é o mesmo signing_token do contrato — de pré-venda,
// válido até o fim da reserva da peça (48h).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail, templateBase, botaoCTA, escapeHtml, formatBRL, formatDataHoraBR } from "../_shared/resend.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { contrato_id } = (await req.json()) as { contrato_id?: string };
    if (!contrato_id) return json({ error: "contrato_id é obrigatório" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "não autenticado" }, 401);
    const { data: pode } = await admin.rpc("can_write_crm", { _user_id: userData.user.id });
    if (!pode) return json({ error: "sem permissão" }, 403);

    const { data: c } = await admin
      .from("contratos")
      .select("id, numero, nome_cliente, email_cliente, valor_total, status_assinatura, signing_token, token_expires_at")
      .eq("id", contrato_id)
      .maybeSingle();
    if (!c) return json({ error: "contrato não encontrado" }, 404);
    if (c.status_assinatura !== "pendente") return json({ error: "este contrato não está aguardando assinatura" }, 400);
    if (!c.email_cliente?.trim()) return json({ error: "cliente sem e-mail cadastrado" }, 400);

    let token = c.signing_token as string | null;
    let expira = c.token_expires_at as string | null;
    if (!token || (expira && new Date(expira) <= new Date())) {
      token = crypto.randomUUID();
      expira = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
      await admin.from("contratos").update({ signing_token: token, token_expires_at: expira }).eq("id", c.id);
    }

    const link = `${Deno.env.get("SITE_URL") ?? "https://mesbelle.com.br"}/assinar/${token}`;
    await enviarEmail({
      para: c.email_cliente.trim(),
      assunto: `Assine seu contrato — Més Belle #${c.numero}`,
      html: templateBase(`
        <h2 style="color:#4a1535;font-size:20px;margin:0 0 16px;">Seu contrato está pronto para assinatura</h2>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
          Olá, <strong>${escapeHtml(c.nome_cliente)}</strong>! Seu contrato de locação
          <strong>#${escapeHtml(c.numero)}</strong> (${escapeHtml(formatBRL(Number(c.valor_total)))}) está pronto.
          Leia e assine pelo celular ou computador — leva menos de um minuto.
        </p>
        ${botaoCTA("Ler e assinar o contrato", link)}
        <p style="color:#6b7280;font-size:13px;margin:16px 0 0;">
          ${expira ? `Sua reserva está garantida até <strong>${escapeHtml(formatDataHoraBR(expira))}</strong>. ` : ""}Qualquer dúvida, é só responder pelo WhatsApp da loja.
        </p>`),
    });

    return json({ ok: true });
  } catch (err) {
    console.error("[enviar-link-assinatura]", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
