import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DateRange } from "@/hooks/useDateRange";

export interface DashboardKpi {
  faturamentoPeriodo: number;
  volumeLeads: number;
  agendamentos: number;
  alugueis: number;
  ticketMedio: number;
  conversaoPorAgendamento: number; // 0-100 (percentual)
  custoPorAgendamento: number;
  custoDeAquisicao: number;
  // mantidos para não quebrar outros componentes
  faturamentoHoje: number;
  faturamentoOntem: number;
  agendamentosHoje: number;
  leadsNovosHoje: number;
  entregasPendentes: number;
  entregasAtrasadas: number;
  conversaoMes: number;
}

export interface AgendaItem {
  time: string;
  type: "prova" | "entrega" | "retirada";
  title: string;
  subtitle: string;
  href: string;
}

export interface AlertaItem {
  severity: "urgent" | "warn" | "info";
  text: string;
  href: string;
  cta: string;
}

export interface ScoreData {
  score: number; // 0-100
  nps: number;          // 0-100
  noPrazo: number;      // 0-100
  conversao: number;    // 0-100
}

const emptyKpi: DashboardKpi = {
  faturamentoPeriodo: 0, volumeLeads: 0, agendamentos: 0, alugueis: 0,
  ticketMedio: 0, conversaoPorAgendamento: 0, custoPorAgendamento: 0, custoDeAquisicao: 0,
  faturamentoHoje: 0, faturamentoOntem: 0, agendamentosHoje: 0, leadsNovosHoje: 0,
  entregasPendentes: 0, entregasAtrasadas: 0, conversaoMes: 0,
};

const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};
const daysAgo = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const monthStart = () => {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export function useDashboard(range: DateRange) {
  const [kpis, setKpis] = useState<DashboardKpi>(emptyKpi);
  const [agendaHoje, setAgendaHoje] = useState<AgendaItem[]>([]);
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [score, setScore] = useState<ScoreData>({ score: 0, nps: 0, noPrazo: 0, conversao: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const hoje = today();
    const ontem = yesterday();
    const ms = monthStart();
    const d30 = daysAgo(30);

    const [
      receitasHojeRes, leadsHojeRes, leadsNovosRes, leadsMesRes, logisticaRes,
      contratosRes, avaliacoesRes,
      txPeriodoRes, leadsPeriodoRes, provasPeriodoRes, alugueisPeriodoRes, negociosPeriodoRes,
    ] = await Promise.all([
      supabase.from("transacoes_financeiras").select("valor, data, tipo").gte("data", ontem).lte("data", hoje).eq("tipo", "entrada"),
      supabase.from("leads").select("id, nome, prova_data, prova_hora, tipo_evento, criado_em, status_funil, enviado_comercial, created_at"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("criado_em", hoje),
      supabase.from("leads").select("id, status_funil, criado_em").gte("criado_em", ms),
      supabase.from("alugueis_logistica").select("id, vestido_nome, cliente_nome, status_logistica, data_saida, data_retorno"),
      supabase.from("contratos").select("id, numero, status_assinatura, created_at").eq("status_assinatura", "pendente"),
      supabase.from("avaliacoes_clientes").select("nota, data").gte("data", d30),
      // KPIs do período selecionado
      supabase.from("transacoes_financeiras").select("valor, data, tipo").gte("data", range.from).lte("data", range.to),
      supabase.from("leads").select("id, status_funil, criado_em").gte("criado_em", range.from).lte("criado_em", range.to),
      supabase.from("leads").select("id").gte("prova_data", range.from).lte("prova_data", range.to),
      supabase.from("alugueis_logistica").select("id, data_saida").gte("data_saida", range.from).lte("data_saida", range.to),
      supabase.from("negocios").select("id, status_negociacao, criado_em").eq("status_negociacao", "aprovado").gte("criado_em", range.from).lte("criado_em", range.to),
    ]);

    // KPI: Faturamento (hoje/ontem — widgets fixos)
    const receitas = (receitasHojeRes.data ?? []) as Array<{ valor: number; data: string }>;
    const faturamentoHoje = receitas.filter(r => r.data === hoje).reduce((s, r) => s + Number(r.valor), 0);
    const faturamentoOntem = receitas.filter(r => r.data === ontem).reduce((s, r) => s + Number(r.valor), 0);

    // KPI: Agendamentos hoje + leads novos hoje
    const leadsAll = (leadsHojeRes.data ?? []) as Array<{
      id: string; nome: string; prova_data: string | null; prova_hora: string | null;
      tipo_evento: string; criado_em: string; status_funil: string; enviado_comercial: boolean; created_at: string;
    }>;
    const provasHoje = leadsAll.filter(l => l.prova_data === hoje);
    const leadsNovosHoje = leadsNovosRes.count ?? 0;

    // KPI: Logística
    const logistica = (logisticaRes.data ?? []) as Array<{
      id: string; vestido_nome: string; cliente_nome: string; status_logistica: string; data_saida: string; data_retorno: string;
    }>;
    const entregasPendentes = logistica.filter(l => ["para_enviar", "em_transito", "entregue"].includes(l.status_logistica)).length;
    const entregasAtrasadas = logistica.filter(l => l.status_logistica === "atrasado").length;

    // KPI: Conversão do mês
    const leadsMes = (leadsMesRes.data ?? []) as Array<{ status_funil: string }>;
    const convertidosMes = leadsMes.filter(l => ["convertido", "fechado", "aprovado"].includes(l.status_funil)).length;
    const conversaoMes = leadsMes.length > 0 ? (convertidosMes / leadsMes.length) * 100 : 0;

    // === KPIs do período selecionado ===
    const txPeriodo = (txPeriodoRes.data ?? []) as Array<{ valor: number; data: string; tipo: string }>;
    const faturamentoPeriodo = txPeriodo.filter(t => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0);
    const despesasPeriodo = txPeriodo.filter(t => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0);

    const leadsPeriodo = (leadsPeriodoRes.data ?? []) as Array<{ id: string; status_funil: string; criado_em: string }>;
    const volumeLeads = leadsPeriodo.length;
    const convertidosPeriodo = leadsPeriodo.filter(l => ["convertido", "fechado", "aprovado"].includes(l.status_funil)).length;

    const agendamentos = (provasPeriodoRes.data ?? []).length;
    const alugueisPeriodo = (alugueisPeriodoRes.data ?? []).length;
    const negociosAprovados = (negociosPeriodoRes.data ?? []).length;

    const ticketMedio = negociosAprovados > 0 ? faturamentoPeriodo / negociosAprovados : 0;
    const conversaoPorAgendamento = agendamentos > 0 ? (convertidosPeriodo / agendamentos) * 100 : 0;
    const custoPorAgendamento = agendamentos > 0 ? despesasPeriodo / agendamentos : 0;
    const custoDeAquisicao = volumeLeads > 0 ? despesasPeriodo / volumeLeads : 0;

    setKpis({
      faturamentoPeriodo, volumeLeads, agendamentos, alugueis: alugueisPeriodo,
      ticketMedio, conversaoPorAgendamento, custoPorAgendamento, custoDeAquisicao,
      faturamentoHoje, faturamentoOntem, agendamentosHoje: provasHoje.length,
      leadsNovosHoje, entregasPendentes, entregasAtrasadas, conversaoMes,
    });

    // Agenda hoje
    const agenda: AgendaItem[] = [];
    provasHoje.forEach(l => {
      agenda.push({
        time: l.prova_hora || "—",
        type: "prova",
        title: l.nome,
        subtitle: `Prova — ${l.tipo_evento || "evento"}`,
        href: "/crm",
      });
    });
    logistica.filter(l => l.data_saida === hoje).forEach(l => {
      agenda.push({
        time: "—",
        type: "retirada",
        title: l.cliente_nome,
        subtitle: `Retirada — ${l.vestido_nome}`,
        href: "/operacional/logistica",
      });
    });
    logistica.filter(l => l.data_retorno === hoje).forEach(l => {
      agenda.push({
        time: "—",
        type: "entrega",
        title: l.cliente_nome,
        subtitle: `Devolução — ${l.vestido_nome}`,
        href: "/operacional/logistica",
      });
    });
    agenda.sort((a, b) => (a.time || "z").localeCompare(b.time || "z"));
    setAgendaHoje(agenda.slice(0, 6));

    // Alertas
    const al: AlertaItem[] = [];
    if (entregasAtrasadas > 0) {
      al.push({ severity: "urgent", text: `${entregasAtrasadas} vestido${entregasAtrasadas > 1 ? "s" : ""} não devolvido${entregasAtrasadas > 1 ? "s" : ""} — prazo expirado`, href: "/operacional/logistica", cta: "Cobrar" });
    }
    const contratosPendentes = ((contratosRes.data ?? []) as Array<{ numero: string; created_at: string }>)
      .filter(c => (Date.now() - new Date(c.created_at).getTime()) > 3 * 24 * 60 * 60 * 1000);
    contratosPendentes.slice(0, 2).forEach(c => {
      al.push({ severity: "urgent", text: `Contrato ${c.numero} pendente há mais de 3 dias`, href: "/comercial", cta: "Ver" });
    });
    provasHoje.slice(0, 2).forEach(l => {
      al.push({ severity: "info", text: `Prova agendada hoje: ${l.nome} — ${l.prova_hora || "horário a definir"}`, href: "/crm", cta: "Abrir" });
    });
    const leadsNovosNaoEnviados = leadsAll.filter(l => !l.enviado_comercial && (Date.now() - new Date(l.created_at).getTime()) < 24 * 60 * 60 * 1000);
    leadsNovosNaoEnviados.slice(0, 2).forEach(l => {
      al.push({ severity: "info", text: `Novo lead: ${l.nome}`, href: "/crm", cta: "Atender" });
    });
    setAlertas(al.slice(0, 6));

    // Score
    const avs = (avaliacoesRes.data ?? []) as Array<{ nota: number; data: string }>;
    const npsAvg = avs.length > 0 ? avs.reduce((s, a) => s + a.nota, 0) / avs.length : 0;
    const nps = (npsAvg / 5) * 100;

    const devolvidos = logistica.filter(l => l.status_logistica === "devolvido" && l.data_retorno >= d30);
    const noPrazoCount = devolvidos.length; // simplificação: todos devolvidos contam como no prazo (precisaria comparar com data prevista)
    const atrasadosUlt30 = logistica.filter(l => l.status_logistica === "atrasado").length;
    const totalRet = noPrazoCount + atrasadosUlt30;
    const noPrazo = totalRet > 0 ? (noPrazoCount / totalRet) * 100 : 100;

    const conversao = conversaoMes;
    const scoreFinal = Math.round((nps + noPrazo + conversao) / 3);

    setScore({ score: scoreFinal, nps: Math.round(nps), noPrazo: Math.round(noPrazo), conversao: Math.round(conversao) });
    setLoading(false);
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime — recarrega ao detectar mudanças nas tabelas que alimentam o dashboard
  useEffect(() => {
    const channel = supabase
      .channel(`dashboard_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "alugueis_logistica" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "avaliacoes_clientes" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "transacoes_financeiras" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "negocios" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { kpis, agendaHoje, alertas, score, loading };
}
