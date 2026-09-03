export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export const CATEGORIA_LABELS: Record<string, string> = {
  locacao: "Locação de Vestido",
  venda: "Venda",
  receita_outros: "Outros (Receita)",
  comissao: "Comissão de Vendedora",
  imposto: "Impostos & Taxas",
  taxa_cartao: "Taxa de Cartão",
  custo_producao: "Custo de Produção/Ajuste",
  devolucao: "Devolução / Reembolso",
  aluguel_atelier: "Aluguel do Ateliê",
  salario: "Salários & Pró-labore",
  marketing: "Marketing & Publicidade",
  servico: "Serviços & Assinaturas",
  manutencao: "Manutenção & Reparos",
  outros: "Outros (Despesa)",
};

export function categoriaLabel(categoria?: string | null): string {
  if (!categoria) return "Outros";
  return CATEGORIA_LABELS[categoria] ?? categoria;
}
