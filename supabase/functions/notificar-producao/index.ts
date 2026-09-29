import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail } from "../_shared/resend.ts";

// Chamada pelo trigger fn_notificar_producao_etapa (net.http_post) sempre
// que etapas_producao.is_concluido muda — mesmo padrão de segurança do
// notificar-agendamento: só aceita o Authorization = service role key.
//
// Mapeia a transição concluída/reaberta de uma etapa nos 6 pontos de
// notificação da Jornada do Primeiro Aluguel:
//   1     Envio pra Costureira → Modelista concluída (1ª vez)
//   2     Agendar Prova        → Bordadeira concluída (1ª vez)
//   3.1   Retirada             → Segunda Prova concluída (1ª vez)
//   3.2   Ajuste novo          → Modelista reaberta ("Volta à Modelista")
//   3.2.1 Agendar Prova        → Bordadeira concluída (após ajuste)
//   3.2.2 Retirada             → Segunda Prova concluída (após ajuste)
// A flag producoes.ajuste_solicitado (setada no ponto 3.2) distingue a
// rodada normal da rodada de ajuste para os pontos 2/3.1 vs 3.2.1/3.2.2.

interface EtapaRecord {
  id: string;
  producao_id: string;
  nome_etapa: string;
  is_concluido: boolean;
}

interface ProducaoRow {
  id: string;
  titulo_vestido: string;
  cliente_nome: string;
  negocio_id: string | null;
  ajuste_solicitado: boolean;
}

type TipoNotificacao = "envio_costureira" | "agendar_prova" | "retirada" | "ajuste_novo" | "agendar_prova_ajuste" | "retirada_ajuste";

const NOTIF_INFO: Record<TipoNotificacao, { numero: string; titulo: string; emoji: string; mensagem: string }> = {
  envio_costureira: { numero: "1", titulo: "Peça enviada para a Costureira", emoji: "🧵", mensagem: "A peça saiu da Modelista e entrou na fase de bordado/costura." },
  agendar_prova: { numero: "2", titulo: "Hora de agendar a prova", emoji: "📅", mensagem: "A peça está pronta para a Primeira Prova — agende com a cliente." },
  retirada: { numero: "3.1", titulo: "Pronta para retirada", emoji: "📦", mensagem: "A peça passou pela Segunda Prova e está pronta para a Entrega Final." },
  ajuste_novo: { numero: "3.2", titulo: "Novo ajuste solicitado", emoji: "🪡", mensagem: "A peça voltou para a Modelista para um novo ajuste." },
  agendar_prova_ajuste: { numero: "3.2.1", titulo: "Agendar nova prova (após ajuste)", emoji: "📅", mensagem: "A peça está pronta para uma nova prova, depois do ajuste." },
  retirada_ajuste: { numero: "3.2.2", titulo: "Pronta para retirada (após ajuste)", emoji: "📦", mensagem: "A peça passou pela nova prova e está pronta para a Entrega Final." },
};

function determinarTipo(nome: string, foiConcluido: boolean, foiReaberto: boolean, ajusteSolicitado: boolean): TipoNotificacao | null {
  if (nome === "Modelista" && foiReaberto) return "ajuste_novo";
  if (nome === "Modelista" && foiConcluido && !ajusteSolicitado) return "envio_costureira";
  if (nome === "Bordadeira" && foiConcluido) return ajusteSolicitado ? "agendar_prova_ajuste" : "agendar_prova";
  if (nome === "Segunda Prova" && foiConcluido) return ajusteSolicitado ? "retirada_ajuste" : "retirada";
  return null;
}

function emailHtml(info: { numero: string; titulo: string; emoji: string; mensagem: string }, producao: ProducaoRow, destinatarioNome: string): string {
  const siteUrl = Deno.env.get("SITE_URL") ?? "";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Més Belle</title></head>
<body style="margin:0;padding:0;background:#f5f0f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#4a1535;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">Més Belle</p>
            <p style="margin:6px 0 0;font-size:12px;color:#e8b4d0;letter-spacing:3px;text-transform:uppercase;">Produção — Primeiro Aluguel</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a1a1a;">Olá, ${destinatarioNome}!</p>
            <p style="margin:0 0 28px;font-size:14px;color:#6B7280;">Uma etapa da produção avançou.</p>
            <div style="margin-bottom:20px;">
              <span style="display:inline-block;background:#4a1535;color:#ffffff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;margin-right:8px;">${info.numero}</span>
              <span style="display:inline-block;background:#fdf6fb;color:#4a1535;font-size:13px;font-weight:700;padding:6px 16px;border-radius:20px;">${info.emoji} ${info.titulo}</span>
            </div>
            <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f0e6f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <tbody>
                <tr style="background:#fdf6fb;">
                  <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#4a1535;width:140px;border-bottom:1px solid #f0e6f0;">Peça</td>
                  <td style="padding:12px 20px;font-size:14px;color:#1a1a1a;border-bottom:1px solid #f0e6f0;"><strong>${producao.titulo_vestido}</strong></td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#4a1535;">Cliente</td>
                  <td style="padding:12px 20px;font-size:14px;color:#374151;">${producao.cliente_nome}</td>
                </tr>
              </tbody>
            </table>
            <p style="margin:0 0 28px;font-size:14px;color:#374151;line-height:1.6;">${info.mensagem}</p>
            <div style="text-align:center;">
              <a href="${siteUrl}/operacional/producao" style="display:inline-block;background:#4a1535;color:#ffffff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;">Ver Produção →</a>
            </div>
          </td>
        </tr>
        <tr><td style="padding:16px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#D1D5DB;">Notificação automática do sistema Més Belle.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
    const novo = payload.record as EtapaRecord | undefined;
    const antigo = payload.old_record as EtapaRecord | undefined;
    if (!novo?.id || !antigo) {
      return json({ skipped: "sem registro" });
    }

    const foiConcluido = antigo.is_concluido === false && novo.is_concluido === true;
    const foiReaberto = antigo.is_concluido === true && novo.is_concluido === false;
    if (!foiConcluido && !foiReaberto) {
      return json({ skipped: "sem mudança relevante" });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const { data: producao } = await supabaseAdmin
      .from("producoes")
      .select("id, titulo_vestido, cliente_nome, negocio_id, ajuste_solicitado")
      .eq("id", novo.producao_id)
      .single();
    if (!producao) return json({ skipped: "produção não encontrada" });

    const tipo = determinarTipo(novo.nome_etapa, foiConcluido, foiReaberto, (producao as ProducaoRow).ajuste_solicitado);
    if (!tipo) return json({ skipped: "transição não mapeada para notificação" });

    if (tipo === "ajuste_novo") {
      await supabaseAdmin.from("producoes").update({ ajuste_solicitado: true }).eq("id", producao.id);
    }

    const info = NOTIF_INFO[tipo];

    const erros: string[] = [];
    const enviarComLog = async (descricao: string, para: string, html: string) => {
      try {
        await enviarEmail({ para, assunto: `${info.emoji} [${info.numero}] ${info.titulo} — ${(producao as ProducaoRow).cliente_nome}`, html });
        console.log(`[notificar-producao] ${descricao} enviado: ${para}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[notificar-producao] falha ao enviar ${descricao} (${para}): ${msg}`);
        erros.push(`${descricao}: ${msg}`);
      }
    };

    // ── Vendedora responsável pelo negócio (se este Primeiro Aluguel veio
    // de uma venda) ──────────────────────────────────────────────────────
    let vendedorId: string | null = null;
    if ((producao as ProducaoRow).negocio_id) {
      const { data: negocio } = await supabaseAdmin
        .from("negocios")
        .select("vendedor_id")
        .eq("id", (producao as ProducaoRow).negocio_id!)
        .single();
      vendedorId = negocio?.vendedor_id ?? null;
    }
    if (vendedorId) {
      const { data: vendedorUser } = await supabaseAdmin.auth.admin.getUserById(vendedorId);
      if (vendedorUser?.user?.email) {
        const nome = String(vendedorUser.user.user_metadata?.nome ?? "Vendedora");
        await enviarComLog("e-mail da vendedora", vendedorUser.user.email, emailHtml(info, producao as ProducaoRow, nome));
      }
    }

    // ── Todos os admins ───────────────────────────────────────────────────
    const { data: adminRoles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    for (const ar of adminRoles ?? []) {
      if (ar.user_id === vendedorId) continue; // evita duplicata
      const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(ar.user_id);
      if (!adminUser?.user?.email) continue;
      const nomeAdmin = String(adminUser.user.user_metadata?.nome ?? "Admin");
      await enviarComLog("e-mail do admin", adminUser.user.email, emailHtml(info, producao as ProducaoRow, nomeAdmin));
    }

    console.log(`[notificar-producao] Concluído para etapa ${novo.id} (${tipo}). Erros: ${erros.length}`);
    return json({ success: erros.length === 0, tipo, erros: erros.length > 0 ? erros : undefined });
  } catch (err) {
    console.error("[notificar-producao] erro:", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
