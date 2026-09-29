import { useLeads } from "./useLeads";
import { useAgenda } from "./useAgenda";
import { useAuth } from "@/contexts/AuthContext";
import type { DateRange } from "./useDateRange";
import { estimarComissaoMes } from "@/lib/comissao";

const now = new Date();
const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

export interface MeusKpis {
  totalMeusLeads: number;
  meusAgendamentos: number;
  taxaConversao: number; // leads → compareceu_alugou
  clientesAtivos: number; // enviado_comercial = true
  clientesSemCompra: number; // em atendimento/agendado sem ter comprado
  negociosFechados: number;
  faturamentoGerado: number;
  faturamentoMesAtual: number; // negócios aprovados, só o mês corrente (base da faixa de comissão)
  projecaoGanho: number; // comissão do mês corrente (normal + ajuste + bônus), pela tabela de faixas
  // ── Métricas comerciais em destaque no painel ──────────────────────
  totalAgendamentos: number; // agendamentos do funcionário no período
  totalFechamentos: number; // negócios aprovados
  previaComissao: number; // mesmo valor de projecaoGanho — comissão do mês corrente
  totalFaturamento: number; // soma de valorNegociado - desconto dos negócios aprovados
}

export function useMeusKpis(range: DateRange): MeusKpis {
  const { user } = useAuth();
  const { leads, negocios } = useLeads();
  // Agendamentos reais da Agenda (visita/prova/retirada/ajuste/devolucao) no
  // período, filtrados para o funcionário logado — não mais leads.provaData,
  // que só conhece "provas" que passaram pelo fluxo antigo do CRM.
  const { data: agendamentosPeriodo } = useAgenda(
    new Date(`${range.from}T00:00:00`),
    new Date(`${range.to}T23:59:59`),
    user?.id,
  );

  const leadsPeriodo = leads.filter(
    (l) => l.criadoEm && l.criadoEm >= range.from && l.criadoEm <= range.to + "T23:59:59"
  );

  const agendamentos = agendamentosPeriodo ?? [];

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

  // Base da faixa de comissão: faturamento líquido do mês CORRENTE (não do
  // período do filtro) — mesma janela usada pelo trigger no banco
  // (fn_negocio_aprovado_gera_transacao), que reseta todo mês.
  const faturamentoMesAtual = negociosFechados
    .filter((n) => n.criadoEm?.slice(0, 7) === mesAtual)
    .reduce((s, n) => s + (n.valorNegociado - n.desconto), 0);
  const projecaoGanho = estimarComissaoMes(faturamentoMesAtual);

  return {
    totalMeusLeads: leadsPeriodo.length,
    meusAgendamentos: agendamentos.length,
    taxaConversao: leadsPeriodo.length > 0 ? (convertidos.length / leadsPeriodo.length) * 100 : 0,
    clientesAtivos: clientesAtivos.length,
    clientesSemCompra: clientesSemCompra.length,
    negociosFechados: negociosFechados.length,
    faturamentoGerado,
    faturamentoMesAtual,
    projecaoGanho,
    totalAgendamentos: agendamentos.length,
    totalFechamentos: negociosFechados.length,
    previaComissao: projecaoGanho,
    totalFaturamento: faturamentoGerado,
  };
}
