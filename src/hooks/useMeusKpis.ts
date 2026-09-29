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

  // "Minhas Métricas" — só conta o que é deste funcionário: leads que ele
  // atende (atendidoPor) e negócios que ele fechou (vendedorId). Sem isso,
  // useLeads()/negocios (select "*" sem filtro) misturava números da loja
  // inteira, inclusive negócios sem vendedor vinculado, na tela de um único
  // vendedor.
  const meusLeads = leads.filter((l) => l.atendidoPor === user?.id);
  const meusNegocios = negocios.filter((n) => n.vendedorId === user?.id);

  const leadsPeriodo = meusLeads.filter(
    (l) => l.criadoEm && l.criadoEm >= range.from && l.criadoEm <= range.to + "T23:59:59"
  );

  const agendamentos = agendamentosPeriodo ?? [];

  const convertidos = leadsPeriodo.filter((l) =>
    ["compareceu_alugou"].includes(l.statusFunil ?? "")
  );

  const clientesAtivos = meusLeads.filter((l) => l.enviadoComercial);
  const clientesSemCompra = meusLeads.filter(
    (l) =>
      ["em_atendimento", "prova_agendada", "agendado"].includes(l.statusFunil ?? "") &&
      !l.enviadoComercial
  );

  const meusNegociosAprovados = meusNegocios.filter((n) => n.statusNegociacao === "aprovado");

  // "Negócios Fechados"/"Faturamento Gerado" respeitam o período escolhido
  // no DateRangePicker da tela, igual a "Leads no Período".
  const negociosFechados = meusNegociosAprovados.filter(
    (n) => n.criadoEm && n.criadoEm >= range.from && n.criadoEm <= range.to + "T23:59:59"
  );
  const faturamentoGerado = negociosFechados.reduce(
    (s, n) => s + (n.valorNegociado - n.desconto),
    0
  );

  // Base da faixa de comissão: faturamento líquido do mês CORRENTE (não do
  // período do filtro) — mesma janela usada pelo trigger no banco
  // (fn_negocio_aprovado_gera_transacao), que reseta todo mês.
  const faturamentoMesAtual = meusNegociosAprovados
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
