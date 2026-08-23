import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail } from "../_shared/resend.ts";

// Chamada pelo Database Webhook de INSERT em agendamentos — não valida um JWT
// de usuário comum: exige que o Authorization bearer seja exatamente a
// service role key deste projeto (configurado como header do próprio
// webhook), para não ficar aberta a qualquer chamada externa disparando
// e-mails em nome do sistema.
const TZ = "America/Sao_Paulo";

interface Atelier {
  nome: string;
  endereco: string;
  telefone: string;
  mapsUrl: string;
}

interface AgendamentoPayload {
  id: string;
  tipo: string;
  data_hora: string;
  duracao_minutos: number;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_telefone: string | null;
  observacoes: string | null;
  vestido_id: string | null;
  funcionaria_id: string | null;
}

interface AgendamentoEnriquecido extends AgendamentoPayload {
  vestido_nome: string;
  funcionaria_nome: string;
}

const TIPO_LABEL: Record<string, string> = {
  visita: "Visita ao Atelier",
  prova: "Prova de Vestido",
  retirada: "Retirada do Vestido",
  ajuste: "Ajuste / Costureira",
  devolucao: "Devolução do Vestido",
};

const TIPO_EMOJI: Record<string, string> = {
  visita: "👋",
  prova: "👗",
  retirada: "📦",
  ajuste: "🪡",
  devolucao: "🔄",
};

const TIPO_COR: Record<string, string> = {
  visita: "#3B82F6",
  prova: "#8B5CF6",
  retirada: "#10B981",
  ajuste: "#F59E0B",
  devolucao: "#EF4444",
};

const TIPO_INSTRUCAO: Record<string, string> = {
  visita: "Será um prazer receber você em nosso atelier! Nossa equipe estará pronta para apresentar nossas peças e entender o que você busca.",
  prova: "Lembre-se de trazer o sapato ou um sapato de altura similar ao que pretende usar no evento. Também recomendamos trazer lingerie adequada para a prova.",
  retirada: "No dia da retirada, apresente seu documento de identidade e o comprovante do contrato. O vestido estará devidamente embalado e pronto para você.",
  ajuste: "Traga o vestido já escolhido para o ajuste. Nossa costureira fará as marcações necessárias para um caimento perfeito.",
  devolucao: "Devolva o vestido limpo e na mesma embalagem em que foi entregue. Evite atrasos para não gerar taxas adicionais.",
};

// ── Template base MesBelle ──────────────────────────────────────────────────
function baseLayout(conteudo: string, atelier: Atelier): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${atelier.nome}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:#4a1535;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">
                ${atelier.nome}
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#e8b4d0;letter-spacing:3px;text-transform:uppercase;">
                Atelier de Vestidos
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
              ${conteudo}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#9CA3AF;">${atelier.endereco}</p>
              <p style="margin:0;font-size:13px;color:#9CA3AF;">${atelier.telefone}</p>
              <p style="margin:16px 0 0;font-size:11px;color:#D1D5DB;">
                Você está recebendo este e-mail pois possui um agendamento na ${atelier.nome}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Link "Adicionar ao Google Agenda" ───────────────────────────────────────
function googleCalendarLink(
  titulo: string,
  dataHoraIso: string,
  duracaoMin: number,
  descricao: string,
  endereco: string,
): string {
  const inicio = new Date(dataHoraIso);
  const fim = new Date(inicio.getTime() + duracaoMin * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    dates: `${fmt(inicio)}/${fmt(fim)}`,
    details: descricao,
    location: endereco,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── E-mail para o CLIENTE ────────────────────────────────────────────────────
function emailCliente(ag: AgendamentoEnriquecido, atelier: Atelier): string {
  const tipo = ag.tipo ?? "visita";
  const label = TIPO_LABEL[tipo] ?? tipo;
  const emoji = TIPO_EMOJI[tipo] ?? "📅";
  const cor = TIPO_COR[tipo] ?? "#4a1535";
  const instrucao = TIPO_INSTRUCAO[tipo] ?? "";

  const dataHoraFormatada = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(ag.data_hora));

  const gcLink = googleCalendarLink(
    `${emoji} ${label} — ${atelier.nome}`,
    ag.data_hora,
    ag.duracao_minutos ?? 60,
    `${instrucao}\n\nEndereço: ${atelier.endereco}`,
    atelier.endereco,
  );

  const primeiroNome = (ag.cliente_nome ?? "").split(" ")[0];

  const conteudo = `
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1a1a1a;">
      Olá, ${primeiroNome}! 🎉
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#6B7280;line-height:1.6;">
      Seu agendamento foi confirmado. Estamos ansiosas para te receber!
    </p>
    <div style="border:2px solid ${cor};border-radius:12px;overflow:hidden;margin-bottom:28px;">
      <div style="background:${cor};padding:16px 24px;">
        <span style="font-size:22px;">${emoji}</span>
        <span style="font-size:16px;font-weight:700;color:#ffffff;margin-left:8px;">${label}</span>
      </div>
      <div style="padding:20px 24px;background:#fafafa;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0e6f0;vertical-align:top;">
              <span style="font-size:13px;color:#9CA3AF;display:block;margin-bottom:2px;">📅 Data e Horário</span>
              <span style="font-size:15px;font-weight:600;color:#1a1a1a;text-transform:capitalize;">${dataHoraFormatada}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0e6f0;vertical-align:top;">
              <span style="font-size:13px;color:#9CA3AF;display:block;margin-bottom:2px;">⏱ Duração estimada</span>
              <span style="font-size:15px;color:#374151;">${ag.duracao_minutos ?? 60} minutos</span>
            </td>
          </tr>
          ${ag.vestido_nome ? `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0e6f0;vertical-align:top;">
              <span style="font-size:13px;color:#9CA3AF;display:block;margin-bottom:2px;">🎀 Peça</span>
              <span style="font-size:15px;color:#374151;">${ag.vestido_nome}</span>
            </td>
          </tr>` : ""}
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #f0e6f0;vertical-align:top;">
              <span style="font-size:13px;color:#9CA3AF;display:block;margin-bottom:2px;">📍 Endereço</span>
              <span style="font-size:15px;color:#374151;">${atelier.endereco}</span>
              ${atelier.mapsUrl ? `<a href="${atelier.mapsUrl}" style="font-size:13px;color:#4a1535;text-decoration:none;display:inline-block;margin-top:4px;">Ver no mapa →</a>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;vertical-align:top;">
              <span style="font-size:13px;color:#9CA3AF;display:block;margin-bottom:2px;">📞 Telefone</span>
              <span style="font-size:15px;color:#374151;">${atelier.telefone}</span>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <div style="background:#fdf6fb;border-left:4px solid #4a1535;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#4a1535;text-transform:uppercase;letter-spacing:1px;">
        O que saber antes de vir
      </p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${instrucao}</p>
    </div>
    ${ag.observacoes ? `
    <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Observações</p>
      <p style="margin:0;font-size:14px;color:#374151;font-style:italic;">${ag.observacoes}</p>
    </div>` : ""}
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${gcLink}" target="_blank" style="display:inline-block;background:#4a1535;color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
        📅 Adicionar ao Google Agenda
      </a>
    </div>
    <p style="margin:0;font-size:14px;color:#9CA3AF;text-align:center;line-height:1.6;">
      Dúvidas? Entre em contato pelo WhatsApp
      <strong style="color:#4a1535;">${atelier.telefone}</strong><br>
      Até breve! 💜
    </p>
  `;
  return baseLayout(conteudo, atelier);
}

// ── E-mail para FUNCIONÁRIA / ADMIN ──────────────────────────────────────────
function emailInterno(ag: AgendamentoEnriquecido, destinatarioNome: string, atelier: Atelier): string {
  const tipo = ag.tipo ?? "visita";
  const label = TIPO_LABEL[tipo] ?? tipo;
  const emoji = TIPO_EMOJI[tipo] ?? "📅";
  const cor = TIPO_COR[tipo] ?? "#4a1535";

  const dataHoraFormatada = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(ag.data_hora));

  const siteUrl = Deno.env.get("SITE_URL") ?? "";

  const conteudo = `
    <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a1a1a;">Olá, ${destinatarioNome}!</p>
    <p style="margin:0 0 28px;font-size:14px;color:#6B7280;">Um novo agendamento foi registrado no sistema.</p>
    <div style="margin-bottom:20px;">
      <span style="display:inline-block;background:${cor};color:#ffffff;font-size:13px;font-weight:700;padding:6px 16px;border-radius:20px;">
        ${emoji} ${label}
      </span>
    </div>
    <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f0e6f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
      <tbody>
        <tr style="background:#fdf6fb;">
          <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#4a1535;width:140px;border-bottom:1px solid #f0e6f0;">Cliente</td>
          <td style="padding:12px 20px;font-size:14px;color:#1a1a1a;border-bottom:1px solid #f0e6f0;">
            <strong>${ag.cliente_nome}</strong>
            ${ag.cliente_telefone ? `<br><span style="font-size:12px;color:#6B7280;">${ag.cliente_telefone}</span>` : ""}
            ${ag.cliente_email ? `<br><span style="font-size:12px;color:#6B7280;">${ag.cliente_email}</span>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#4a1535;border-bottom:1px solid #f0e6f0;">Data e hora</td>
          <td style="padding:12px 20px;font-size:14px;color:#1a1a1a;text-transform:capitalize;border-bottom:1px solid #f0e6f0;">${dataHoraFormatada}</td>
        </tr>
        <tr style="background:#fdf6fb;">
          <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#4a1535;border-bottom:1px solid #f0e6f0;">Duração</td>
          <td style="padding:12px 20px;font-size:14px;color:#374151;border-bottom:1px solid #f0e6f0;">${ag.duracao_minutos ?? 60} minutos</td>
        </tr>
        ${ag.vestido_nome ? `
        <tr>
          <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#4a1535;border-bottom:1px solid #f0e6f0;">Peça</td>
          <td style="padding:12px 20px;font-size:14px;color:#374151;border-bottom:1px solid #f0e6f0;">${ag.vestido_nome}</td>
        </tr>` : ""}
        ${ag.funcionaria_nome ? `
        <tr style="background:#fdf6fb;">
          <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#4a1535;border-bottom:1px solid #f0e6f0;">Responsável</td>
          <td style="padding:12px 20px;font-size:14px;color:#374151;border-bottom:1px solid #f0e6f0;">${ag.funcionaria_nome}</td>
        </tr>` : ""}
        ${ag.observacoes ? `
        <tr>
          <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#4a1535;vertical-align:top;">Observações</td>
          <td style="padding:12px 20px;font-size:14px;color:#6B7280;font-style:italic;">${ag.observacoes}</td>
        </tr>` : ""}
      </tbody>
    </table>
    <div style="text-align:center;">
      <a href="${siteUrl}/comercial/calendario" style="display:inline-block;background:#4a1535;color:#ffffff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;">
        Ver agenda completa →
      </a>
    </div>
  `;
  return baseLayout(conteudo, atelier);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      return json({ error: "Não autorizado" }, 401);
    }

    const payload = await req.json();
    const ag = (payload.record ?? payload) as AgendamentoPayload;
    if (!ag?.id) {
      return json({ skipped: "sem registro" });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const atelier: Atelier = {
      nome: Deno.env.get("ATELIER_NOME") ?? "MesBelle",
      endereco: Deno.env.get("ATELIER_ENDERECO") ?? "",
      telefone: Deno.env.get("ATELIER_TELEFONE") ?? "",
      mapsUrl: Deno.env.get("ATELIER_MAPS_URL") ?? "",
    };

    let vestidoNome = "";
    if (ag.vestido_id) {
      const { data: v } = await supabaseAdmin.from("vestidos").select("nome").eq("id", ag.vestido_id).single();
      vestidoNome = v?.nome ?? "";
    }

    let funcionariaNome = "";
    if (ag.funcionaria_id) {
      const { data: fu } = await supabaseAdmin.auth.admin.getUserById(ag.funcionaria_id);
      funcionariaNome = String(fu?.user?.user_metadata?.nome ?? fu?.user?.email ?? "");
    }

    const agEnriquecido: AgendamentoEnriquecido = {
      ...ag,
      vestido_nome: vestidoNome,
      funcionaria_nome: funcionariaNome,
    };

    const tipo = ag.tipo ?? "visita";
    const emoji = TIPO_EMOJI[tipo] ?? "📅";
    const label = TIPO_LABEL[tipo] ?? tipo;

    // ── 1. E-mail para a cliente ──────────────────────────────────────────
    if (ag.cliente_email) {
      await enviarEmail({
        para: ag.cliente_email,
        assunto: `${emoji} Agendamento confirmado: ${label}`,
        html: emailCliente(agEnriquecido, atelier),
      });
      console.log(`[notificar-agendamento] E-mail enviado à cliente: ${ag.cliente_email}`);
    }

    // ── 2. E-mail para a funcionária responsável ──────────────────────────
    if (ag.funcionaria_id) {
      const { data: funcUser } = await supabaseAdmin.auth.admin.getUserById(ag.funcionaria_id);
      if (funcUser?.user?.email) {
        const nome = String(funcUser.user.user_metadata?.nome ?? "Funcionária");
        await enviarEmail({
          para: funcUser.user.email,
          assunto: `${emoji} Novo agendamento: ${label} — ${ag.cliente_nome}`,
          html: emailInterno(agEnriquecido, nome, atelier),
        });
      }
    }

    // ── 3. E-mail para todos os admins ────────────────────────────────────
    const { data: adminRoles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    for (const ar of adminRoles ?? []) {
      if (ar.user_id === ag.funcionaria_id) continue; // evitar duplicata
      const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(ar.user_id);
      if (!adminUser?.user?.email) continue;
      const nomeAdmin = String(adminUser.user.user_metadata?.nome ?? "Admin");
      await enviarEmail({
        para: adminUser.user.email,
        assunto: `${emoji} Novo agendamento: ${label} — ${ag.cliente_nome}`,
        html: emailInterno(agEnriquecido, nomeAdmin, atelier),
      });
    }

    console.log(`[notificar-agendamento] E-mails enviados para agendamento ${ag.id}`);
    return json({ success: true });
  } catch (err) {
    console.error("[notificar-agendamento] erro:", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
