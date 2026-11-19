import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail, templateBase, botaoCTA, escapeHtml, formatBRL, formatDataHoraBR } from "../_shared/resend.ts";

// Relatório diário dos agendamentos — chamado por um pg_cron job (Parte 2 do
// prompt), nunca pelo navegador, por isso não valida um JWT de usuário: em
// vez disso exige que o Authorization bearer seja exatamente a service role
// key deste projeto (o próprio job de cron é configurado para mandar esse
// header). Isso evita que qualquer um dispare o relatório publicamente.
const TZ = "America/Sao_Paulo";

const TIPO_LABEL: Record<string, string> = {
  visita: "Visita",
  prova: "Prova",
  retirada: "Retirada",
  ajuste: "Ajuste",
  devolucao: "Devolução",
};

const TIPO_COR: Record<string, string> = {
  visita: "#3B82F6",
  prova: "#8B5CF6",
  retirada: "#10B981",
  ajuste: "#F59E0B",
  devolucao: "#EF4444",
};

interface EventoRow {
  id: string;
  tipo: string;
  data_hora: string;
  cliente_nome: string;
  observacoes: string | null;
  funcionaria_id: string | null;
  vestidos: { nome: string } | null;
  funcionaria_nome?: string | null;
}

function formatarHora(isoString: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(
    new Date(isoString),
  );
}

function blocoEvento(ag: EventoRow): string {
  const cor = TIPO_COR[ag.tipo] ?? "#6B7280";
  const label = TIPO_LABEL[ag.tipo] ?? ag.tipo;
  return `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #f0e6f0; vertical-align: top;">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="
            background: ${cor};
            color: white;
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            margin-top: 2px;
          ">${label}</div>
          <div>
            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">
              ${formatarHora(ag.data_hora)} — ${escapeHtml(ag.cliente_nome)}
            </p>
            ${ag.vestidos?.nome
              ? `<p style="margin: 2px 0 0; font-size: 13px; color: #6B7280;">🎀 ${escapeHtml(ag.vestidos.nome)}</p>`
              : ""}
            ${ag.funcionaria_nome
              ? `<p style="margin: 2px 0 0; font-size: 13px; color: #6B7280;">👤 Responsável: ${escapeHtml(ag.funcionaria_nome)}</p>`
              : ""}
            ${ag.observacoes
              ? `<p style="margin: 4px 0 0; font-size: 12px; color: #9CA3AF; font-style: italic;">${escapeHtml(ag.observacoes)}</p>`
              : ""}
          </div>
        </div>
      </td>
    </tr>
  `;
}

interface Pendencia {
  cliente_nome: string;
  vestido_nome: string | null;
  valor: number;
  reserva_expira_em: string | null;
  vendedor_id: string | null;
  legado: boolean;
}

// Vendas que ainda dependem da assinatura do contrato — a venda só fecha
// (e só entra no financeiro/comissão) quando a cliente assina.
function blocoPendencias(pendencias: Pendencia[], urlContratos: string): string {
  if (pendencias.length === 0) return "";
  const fimHoje = Date.now() + 24 * 3600 * 1000;
  const linhas = pendencias.map((p) => {
    const venceHoje = !p.legado && p.reserva_expira_em && new Date(p.reserva_expira_em).getTime() < fimHoje;
    const situacao = p.legado
      ? `<span style="color:#b91c1c;">venda antiga sem contrato assinado</span>`
      : `<span style="color:${venceHoje ? "#b91c1c" : "#b45309"};">reserva até ${escapeHtml(formatDataHoraBR(p.reserva_expira_em))}${venceHoje ? " — vence hoje" : ""}</span>`;
    return `<tr><td style="padding:8px 0;border-bottom:1px solid #f0e6f0;font-size:14px;">
      <strong>${escapeHtml(p.cliente_nome)}</strong>${p.vestido_nome ? ` · ${escapeHtml(p.vestido_nome)}` : ""}
      <span style="color:#6b7280;"> · ${escapeHtml(formatBRL(p.valor))}</span><br/>
      <span style="font-size:12px;">${situacao}</span></td></tr>`;
  }).join("");
  return `
    <div style="margin-top:28px;padding:16px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;">
      <h3 style="margin:0 0 6px;color:#9a3412;font-size:16px;">✍️ ${pendencias.length} venda(s) aguardando assinatura do contrato</h3>
      <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Sem assinatura em 48h a venda expira e a peça é liberada.</p>
      <table width="100%" cellpadding="0" cellspacing="0">${linhas}</table>
      ${botaoCTA("Coletar assinaturas", urlContratos)}
    </div>`;
}

function montarCorpoRelatorio(
  eventos: EventoRow[],
  tituloRelatorio: string,
  dataFormatada: string,
  urlAgenda: string,
  extraHtml = "",
): string {
  const totalEventos = eventos.length;
  const eventosHtml = eventos.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0">${eventos.map(blocoEvento).join("")}</table>`
    : `<p style="color: #9CA3AF; font-style: italic; text-align: center; padding: 24px 0;">Nenhum agendamento para hoje.</p>`;

  const conteudo = `
    <h2 style="margin: 0 0 4px; color: #4a1535; font-size: 20px;">${tituloRelatorio}</h2>
    <p style="margin: 0 0 24px; color: #6B7280; font-size: 14px;">
      ${dataFormatada} · ${totalEventos} evento${totalEventos !== 1 ? "s" : ""}
    </p>
    ${eventosHtml}
    <div style="margin-top: 28px; text-align: center;">
      ${botaoCTA("Abrir agenda completa", urlAgenda)}
    </div>
    ${extraHtml}
  `;
  return templateBase(conteudo);
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

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) throw new Error("SITE_URL não configurado nos secrets da Edge Function");

    const agora = new Date();
    const hojeStr = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(agora); // "2024-08-21"
    const inicioDia = new Date(`${hojeStr}T00:00:00-03:00`).toISOString();
    const fimDia = new Date(`${hojeStr}T23:59:59-03:00`).toISOString();
    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
      timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(agora);
    const dataFormatadaCapitalizada = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

    const { data: todosEventos, error } = await supabaseAdmin
      .from("agendamentos")
      .select("*, vestidos (nome)")
      .gte("data_hora", inicioDia)
      .lte("data_hora", fimDia)
      .order("data_hora", { ascending: true });
    if (error) throw error;

    const funcionariaIds = [
      ...new Set((todosEventos ?? []).map((e) => e.funcionaria_id).filter((id): id is string => !!id)),
    ];
    const nomesMap: Record<string, string> = {};
    for (const fid of funcionariaIds) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(fid);
      if (u?.user) {
        nomesMap[fid] = String(u.user.user_metadata?.nome ?? u.user.email ?? fid);
      }
    }

    const eventos: EventoRow[] = (todosEventos ?? []).map((e) => ({
      ...e,
      funcionaria_nome: e.funcionaria_id ? nomesMap[e.funcionaria_id] ?? null : null,
    }));

    // Vendas aguardando assinatura (pré-vendas) e vendas antigas fechadas sem
    // contrato assinado.
    const [{ data: negPend }, { data: ctrAssinados }] = await Promise.all([
      supabaseAdmin
        .from("negocios")
        .select("id, cliente_nome, vestido_nome, valor_negociado, desconto, reserva_expira_em, vendedor_id, status_negociacao, aprovado_sem_assinatura_motivo")
        .in("status_negociacao", ["aguardando_assinatura", "aprovado"]),
      supabaseAdmin.from("contratos").select("negocio_id").eq("status_assinatura", "assinado").not("negocio_id", "is", null),
    ]);
    const assinados = new Set((ctrAssinados ?? []).map((c) => c.negocio_id));
    const pendencias: Pendencia[] = (negPend ?? [])
      .filter((n) => n.status_negociacao === "aguardando_assinatura" || (!assinados.has(n.id) && !n.aprovado_sem_assinatura_motivo))
      .map((n) => ({
        cliente_nome: n.cliente_nome,
        vestido_nome: n.vestido_nome,
        valor: Math.max(Number(n.valor_negociado) - Number(n.desconto ?? 0), 0),
        reserva_expira_em: n.reserva_expira_em,
        vendedor_id: n.vendedor_id,
        legado: n.status_negociacao === "aprovado",
      }));

    // Cada destinatário é enviado de forma independente — a falha de um
    // e-mail (endereço rejeitado pelo Resend, etc.) não deve impedir o
    // relatório de chegar aos demais.
    const erros: string[] = [];
    const enviarComLog = async (descricao: string, para: string, assunto: string, html: string) => {
      try {
        await enviarEmail({ para, assunto, html });
        console.log(`[relatorio-diario] ${descricao} enviado: ${para}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[relatorio-diario] falha ao enviar ${descricao} (${para}): ${msg}`);
        erros.push(`${descricao}: ${msg}`);
      }
    };

    // ── Enviar para os admins ──────────────────────────────────────────────
    const { data: adminRoles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    for (const ar of adminRoles ?? []) {
      const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(ar.user_id);
      if (!adminUser?.user?.email) continue;
      await enviarComLog(
        "relatório do admin",
        adminUser.user.email,
        `📅 Agenda do dia — ${dataFormatadaCapitalizada}`,
        montarCorpoRelatorio(eventos, "Relatório completo do dia", dataFormatadaCapitalizada, `${siteUrl}/comercial/calendario`,
          blocoPendencias(pendencias, `${siteUrl}/comercial/contratos`)),
      );
    }

    // ── Enviar para cada funcionária (apenas os dela) ──────────────────────
    const { data: vendedorRoles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "vendedor");
    for (const vr of vendedorRoles ?? []) {
      const eventosDaFuncionaria = eventos.filter((e) => e.funcionaria_id === vr.user_id);
      const pendenciasDaFuncionaria = pendencias.filter((p) => p.vendedor_id === vr.user_id);
      if (eventosDaFuncionaria.length === 0 && pendenciasDaFuncionaria.length === 0) continue;

      const { data: funcUser } = await supabaseAdmin.auth.admin.getUserById(vr.user_id);
      if (!funcUser?.user?.email) continue;
      const nomeFunc = String(funcUser.user.user_metadata?.nome ?? "Funcionária");

      await enviarComLog(
        "relatório da funcionária",
        funcUser.user.email,
        `📅 Seus agendamentos de hoje — ${dataFormatadaCapitalizada}`,
        montarCorpoRelatorio(
          eventosDaFuncionaria,
          `Olá, ${nomeFunc}! Estes são seus agendamentos de hoje`,
          dataFormatadaCapitalizada,
          `${siteUrl}/minha-agenda`,
          blocoPendencias(pendenciasDaFuncionaria, `${siteUrl}/meu-contrato`),
        ),
      );
    }

    console.log(`[relatorio-diario] Concluído. ${eventos.length} eventos no dia. Erros: ${erros.length}`);
    return json({ success: erros.length === 0, totalEventos: eventos.length, erros: erros.length > 0 ? erros : undefined });
  } catch (err) {
    console.error("[relatorio-diario] erro:", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
