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
const monthStart = () => {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export function useDashboard(range: DateRange) {
  const [kpis, setKpis] = useState<DashboardKpi>(emptyKpi);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const hoje = today();
    const ontem = yesterday();
    const ms = monthStart();

    const [
      receitasHojeRes, leadsNovosRes, leadsMesRes, logisticaRes,
      txPeriodoRes, leadsPeriodoRes, agendamentosPeriodoRes, agendamentosHojeRes, alugueisPeriodoRes, negociosPeriodoRes,
    ] = await Promise.all([
      supabase.from("transacoes_financeiras").select("valor, data, tipo").gte("data", ontem).lte("data", hoje).eq("tipo", "entrada"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("criado_em", hoje),
      supabase.from("leads").select("id, status_funil, criado_em").gte("criado_em", ms),
      supabase.from("alugueis_logistica").select("id, status_logistica"),
      // KPIs do período selecionado
      supabase.from("transacoes_financeiras").select("valor, data, tipo").gte("data", range.from).lte("data", range.to),
      supabase.from("leads").select("id, status_funil, criado_em").gte("criado_em", range.from).lte("criado_em", range.to),
      // Agendamentos: tabela real da Agenda (visita/prova/retirada/ajuste/devolucao),
      // não mais leads.prova_data — o funil de leads antigo não sabe nada sobre a
      // maior parte dos tipos de agendamento.
      supabase.from("agendamentos").select("id").gte("data_hora", `${range.from}T00:00:00`).lte("data_hora", `${range.to}T23:59:59`),
      supabase.from("agendamentos").select("id", { count: "exact", head: true }).gte("data_hora", `${hoje}T00:00:00`).lte("data_hora", `${hoje}T23:59:59`),
      supabase.from("alugueis_logistica").select("id, data_saida").gte("data_saida", range.from).lte("data_saida", range.to),
      supabase.from("negocios").select("id, status_negociacao, criado_em").eq("status_negociacao", "aprovado").gte("criado_em", range.from).lte("criado_em", range.to),
    ]);

    // KPI: Faturamento (hoje/ontem — widgets fixos)
    const receitas = (receitasHojeRes.data ?? []) as Array<{ valor: number; data: string }>;
    const faturamentoHoje = receitas.filter(r => r.data === hoje).reduce((s, r) => s + Number(r.valor), 0);
    const faturamentoOntem = receitas.filter(r => r.data === ontem).reduce((s, r) => s + Number(r.valor), 0);

    const leadsNovosHoje = leadsNovosRes.count ?? 0;

    // KPI: Logística
    const logistica = (logisticaRes.data ?? []) as Array<{ id: string; status_logistica: string }>;
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

    const agendamentos = (agendamentosPeriodoRes.data ?? []).length;
    const alugueisPeriodo = (alugueisPeriodoRes.data ?? []).length;
    const negociosAprovados = (negociosPeriodoRes.data ?? []).length;

    const ticketMedio = negociosAprovados > 0 ? faturamentoPeriodo / negociosAprovados : 0;
    const conversaoPorAgendamento = agendamentos > 0 ? (convertidosPeriodo / agendamentos) * 100 : 0;
    const custoPorAgendamento = agendamentos > 0 ? despesasPeriodo / agendamentos : 0;
    const custoDeAquisicao = volumeLeads > 0 ? despesasPeriodo / volumeLeads : 0;

    setKpis({
      faturamentoPeriodo, volumeLeads, agendamentos, alugueis: alugueisPeriodo,
      ticketMedio, conversaoPorAgendamento, custoPorAgendamento, custoDeAquisicao,
      faturamentoHoje, faturamentoOntem, agendamentosHoje: agendamentosHojeRes.count ?? 0,
      leadsNovosHoje, entregasPendentes, entregasAtrasadas, conversaoMes,
    });
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
      .on("postgres_changes", { event: "*", schema: "public", table: "transacoes_financeiras" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "negocios" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { kpis, loading };
}
