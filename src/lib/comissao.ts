// Tabela de comissão padrão da equipe de vendas — faixas por faturamento
// (líquido, negócios aprovados) acumulado no mês. Espelha a lógica em
// supabase/migrations/*_comissao_retroativa.sql (fn_faixa_comissao), que é
// quem efetivamente lança a comissão no Financeiro a cada venda aprovada.
// Este arquivo só existe para a UI (Equipe.tsx) exibir uma prévia consistente
// com o que o banco vai calcular — não faz nenhum lançamento sozinho.
export const FAIXAS_COMISSAO = [
  { min: 0, max: 9999.99, percentual: 0.05 },
  { min: 10000, max: 19999.99, percentual: 0.075 },
  { min: 20000, max: Infinity, percentual: 0.1 },
] as const;

export const BONUS_COMISSAO_LIMIAR = 40000;
export const BONUS_COMISSAO_VALOR = 1000;

export function calcularPercentualComissao(faturamentoMesAcumulado: number): number {
  const faixa = FAIXAS_COMISSAO.find((f) => faturamentoMesAcumulado <= f.max) ?? FAIXAS_COMISSAO[FAIXAS_COMISSAO.length - 1];
  return faixa.percentual;
}

// Comissão do mês exibida em Equipe.tsx: faixa atual (definida pelo total do
// mês) aplicada sobre o total do mês inteiro. Isso bate exatamente com a
// soma real das transações lançadas no banco (comissao + ajuste_comissao),
// porque cada mudança de faixa gera um lançamento de ajuste retroativo que
// reajusta as vendas anteriores do mês para a faixa nova — não é uma
// estimativa, é o valor final.
export function estimarComissaoMes(faturamentoMesAcumulado: number): number {
  const base = faturamentoMesAcumulado * calcularPercentualComissao(faturamentoMesAcumulado);
  const bonus = faturamentoMesAcumulado >= BONUS_COMISSAO_LIMIAR ? BONUS_COMISSAO_VALOR : 0;
  return base + bonus;
}
