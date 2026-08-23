import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail, templateBase, botaoCTA } from "../_shared/resend.ts";

// Chamada pelo Database Webhook de INSERT em agendamentos (Parte 4 do
// prompt) — não valida um JWT de usuário comum: exige que o Authorization
// bearer seja exatamente a service role key deste projeto (configurado como
// header do próprio webhook), para não ficar aberta a qualquer chamada
// externa disparando e-mails em nome do sistema.
const TZ = "America/Sao_Paulo";

const TIPO_LABEL: Record<string, string> = {
  visita: "Visita",
  prova: "Prova",
  retirada: "Retirada",
  ajuste: "Ajuste",
  devolucao: "Devolução",
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

interface AgendamentoPayload {
  id: string;
  tipo: string;
  data_hora: string;
  duracao_minutos: number;
  cliente_nome: string;
  cliente_telefone: string | null;
  observacoes: string | null;
  vestido_id: string | null;
  funcionaria_id: string | null;
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
    // Database Webhooks enviam o registro em payload.record
    const ag = (payload.record ?? payload) as AgendamentoPayload;
    if (!ag?.id) {
      return json({ skipped: "sem registro" });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) throw new Error("SITE_URL não configurado nos secrets da Edge Function");

    const dataHoraFormatada = new Intl.DateTimeFormat("pt-BR", {
      timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(ag.data_hora));

    const tipo = ag.tipo ?? "visita";
    const emoji = TIPO_EMOJI[tipo] ?? "📅";
    const label = TIPO_LABEL[tipo] ?? tipo;
    const corTipo = TIPO_COR[tipo] ?? "#4a1535";

    let vestidoNome = "";
    if (ag.vestido_id) {
      const { data: v } = await supabaseAdmin.from("vestidos").select("nome").eq("id", ag.vestido_id).single();
      vestidoNome = v?.nome ?? "";
    }

    const montarHtml = (destinatario: string) => {
      const conteudo = `
        <p style="font-size: 16px; color: #374151; margin: 0 0 24px;">
          Olá, <strong>${destinatario}</strong>! Um novo agendamento foi criado.
        </p>
        <div style="
          border-left: 4px solid ${corTipo};
          background: ${corTipo}11;
          border-radius: 0 8px 8px 0;
          padding: 16px 20px;
          margin-bottom: 24px;
        ">
          <div style="
            display: inline-block;
            background: ${corTipo};
            color: white;
            border-radius: 6px;
            padding: 3px 10px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 10px;
          ">${emoji} ${label}</div>
          <table cellpadding="0" cellspacing="0" style="width: 100%;">
            <tr>
              <td style="padding: 3px 0; font-size: 14px; color: #6B7280; width: 120px;">Cliente</td>
              <td style="padding: 3px 0; font-size: 14px; font-weight: 600; color: #111827;">${ag.cliente_nome}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; font-size: 14px; color: #6B7280;">Data e hora</td>
              <td style="padding: 3px 0; font-size: 14px; font-weight: 600; color: #111827; text-transform: capitalize;">${dataHoraFormatada}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; font-size: 14px; color: #6B7280;">Duração</td>
              <td style="padding: 3px 0; font-size: 14px; color: #111827;">${ag.duracao_minutos} minutos</td>
            </tr>
            ${vestidoNome ? `
            <tr>
              <td style="padding: 3px 0; font-size: 14px; color: #6B7280;">Vestido</td>
              <td style="padding: 3px 0; font-size: 14px; color: #111827;">${vestidoNome}</td>
            </tr>` : ""}
            ${ag.cliente_telefone ? `
            <tr>
              <td style="padding: 3px 0; font-size: 14px; color: #6B7280;">Telefone</td>
              <td style="padding: 3px 0; font-size: 14px; color: #111827;">${ag.cliente_telefone}</td>
            </tr>` : ""}
            ${ag.observacoes ? `
            <tr>
              <td style="padding: 3px 0; font-size: 14px; color: #6B7280; vertical-align: top;">Observações</td>
              <td style="padding: 3px 0; font-size: 14px; color: #6B7280; font-style: italic;">${ag.observacoes}</td>
            </tr>` : ""}
          </table>
        </div>
        <div style="text-align: center;">
          ${botaoCTA("Ver agenda completa", `${siteUrl}/comercial/calendario`)}
        </div>
      `;
      return templateBase(conteudo);
    };

    // ── Enviar para a funcionária responsável ──────────────────────────────
    if (ag.funcionaria_id) {
      const { data: funcUser } = await supabaseAdmin.auth.admin.getUserById(ag.funcionaria_id);
      if (funcUser?.user?.email) {
        const nome = String(funcUser.user.user_metadata?.nome ?? "Funcionária");
        await enviarEmail({
          para: funcUser.user.email,
          assunto: `${emoji} Novo agendamento: ${label} — ${ag.cliente_nome}`,
          html: montarHtml(nome),
        });
      }
    }

    // ── Enviar para todos os admins ─────────────────────────────────────────
    const { data: adminRoles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    for (const ar of adminRoles ?? []) {
      // Evitar duplicata se o admin também for a funcionária responsável
      if (ar.user_id === ag.funcionaria_id) continue;
      const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(ar.user_id);
      if (!adminUser?.user?.email) continue;
      const nomeAdmin = String(adminUser.user.user_metadata?.nome ?? "Admin");
      await enviarEmail({
        para: adminUser.user.email,
        assunto: `${emoji} Novo agendamento: ${label} — ${ag.cliente_nome}`,
        html: montarHtml(nomeAdmin),
      });
    }

    console.log(`[notificar-agendamento] E-mails enviados para agendamento ${ag.id}`);
    return json({ success: true });
  } catch (err) {
    console.error("[notificar-agendamento] erro:", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
