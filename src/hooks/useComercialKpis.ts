import { useMemo } from "react";
import { Lead, Contrato, Negocio } from "@/types/comercial";
import { DateRange } from "@/hooks/useDateRange";

export interface ComercialKpis {
  // Funil
  volumeLeads: number;
  agendamentos: number;
  taxaLeadAgendamento: number;      // 0-100
  clientesNaLoja: number;
  taxaComparecimento: number;       // 0-100
  agendamentosFechados: number;
  taxaFechamento: number;           // 0-100
  // Financeiro
  faturamentoPeriodo: number;
  ticketMedio: number;
  negociosAprovados: number;
}

export function useComercialKpis(
  leads: Lead[],
  contratos: Contrato[],
  negocios: Negocio[],
  range: DateRange,
): ComercialKpis {
  return useMemo(() => {
    const { from, to } = range;

    const inRange = (dateStr: string | undefined | null) => {
      if (!dateStr) return false;
      const d = dateStr.slice(0, 10);
      return d >= from && d <= to;
    };

    // 1. Volume de leads criados no período
    const leadsNoPeriodo = leads.filter((l) => inRange(l.criadoEm));
    const volumeLeads = leadsNoPeriodo.length;

    // 2. Agendamentos no período (prova_data dentro do range)
    const leadsAgendados = leads.filter((l) => inRange(l.provaData));
    const agendamentos = leadsAgendados.length;

    // 3. Taxa lead → agendamento
    const taxaLeadAgendamento = volumeLeads > 0
      ? Math.round((agendamentos / volumeLeads) * 100)
      : 0;

    // 4/6. Clientes que estiveram na loja / agendamentos fechados
    // Prioridade: novos status do funil de Agendamento; fallback: enviado_comercial + negócios aprovados
    const hasNewStatuses = leads.some(
      (l) => l.statusFunil === "compareceu_alugou" || l.statusFunil === "compareceu_nao_alugou"
    );

    let clientesNaLoja: number;
    let agendamentosFechados: number;

    if (hasNewStatuses) {
      clientesNaLoja = leads.filter(
        (l) =>
          ["compareceu_alugou", "compareceu_nao_alugou"].includes(l.statusFunil) &&
          inRange(l.provaData)
      ).length;
      agendamentosFechados = leads.filter(
        (l) => l.statusFunil === "compareceu_alugou" && inRange(l.provaData)
      ).length;
    } else {
      const negociosPeriodo = negocios.filter((n) => inRange(n.criadoEm));
      agendamentosFechados = negociosPeriodo.filter(
        (n) => n.statusNegociacao === "aprovado"
      ).length;
      clientesNaLoja = negociosPeriodo.length;
    }

    // 5. Taxa de comparecimento
    const taxaComparecimento = agendamentos > 0
      ? Math.round((clientesNaLoja / agendamentos) * 100)
      : 0;

    // 7. Taxa de fechamento
    const taxaFechamento = clientesNaLoja > 0
      ? Math.round((agendamentosFechados / clientesNaLoja) * 100)
      : 0;

    // 8. Faturamento (contratos assinados no período)
    const contratosPeriodo = contratos.filter(
      (c) => c.statusAssinatura === "assinado" && inRange(c.dataCriacao)
    );
    const faturamentoPeriodo = contratosPeriodo.reduce((s, c) => s + c.valorTotal, 0);

    // Ticket médio e negócios aprovados
    const negociosAprovados = negocios.filter(
      (n) => n.statusNegociacao === "aprovado" && inRange(n.criadoEm)
    ).length;
    const ticketMedio = contratosPeriodo.length > 0
      ? faturamentoPeriodo / contratosPeriodo.length
      : 0;

    return {
      volumeLeads, agendamentos, taxaLeadAgendamento,
      clientesNaLoja, taxaComparecimento,
      agendamentosFechados, taxaFechamento,
      faturamentoPeriodo, ticketMedio, negociosAprovados,
    };
  }, [leads, contratos, negocios, range]);
}
