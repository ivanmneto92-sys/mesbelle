import { useLeads } from "./useLeads";
import type { DateRange } from "./useDateRange";

export interface MeusKpis {
  totalMeusLeads: number;
  meusAgendamentos: number;
  taxaConversao: number; // leads → compareceu_alugou
  clientesAtivos: number; // enviado_comercial = true
  clientesSemCompra: number; // em atendimento/agendado sem ter comprado
  negociosFechados: number;
  faturamentoGerado: number;
  projecaoGanho: number; // placeholder — regra de comissão a definir
}

export function useMeusKpis(range: DateRange): MeusKpis {
  const { leads, negocios } = useLeads();

  const leadsPeriodo = leads.filter(
    (l) => l.criadoEm && l.criadoEm >= range.from && l.criadoEm <= range.to + "T23:59:59"
  );

  const agendamentos = leadsPeriodo.filter(
    (l) => l.provaData && l.provaData >= range.from && l.provaData <= range.to
  );

  const convertidos = leadsPeriodo.filter((l) =>
    ["compareceu_alugou"].includes(l.statusFunil ?? "")
  );

  const clientesAtivos = leads.filter((l) => l.enviadoComercial);
  const clientesSemCompra = leads.filter(
    (l) =>
      ["em_atendimento", "prova_agendada", "agendado"].includes(l.statusFunil ?? "") &&
      !l.enviadoComercial
  );

  const negociosFechados = negocios.filter((n) => n.statusNegociacao === "aprovado");
  const faturamentoGerado = negociosFechados.reduce(
    (s, n) => s + (n.valorNegociado - n.desconto),
    0
  );

  return {
    totalMeusLeads: leadsPeriodo.length,
    meusAgendamentos: agendamentos.length,
    taxaConversao: leadsPeriodo.length > 0 ? (convertidos.length / leadsPeriodo.length) * 100 : 0,
    clientesAtivos: clientesAtivos.length,
    clientesSemCompra: clientesSemCompra.length,
    negociosFechados: negociosFechados.length,
    faturamentoGerado,
    projecaoGanho: 0,
  };
}
