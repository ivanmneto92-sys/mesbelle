// Facilita o preenchimento pra quem digita sem se preocupar com maiúscula/
// minúscula (ex: sempre em minúsculo) — corrige em tempo real pra primeira
// letra maiúscula e o resto minúsculo, sem precisar lembrar de ajustar.
export function capitalizarPrimeiraLetra(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export const CATEGORIA_LABELS: Record<string, string> = {
  locacao: "Locação de Vestido",
  venda: "Venda",
  receita_outros: "Outros (Receita)",
  comissao: "Comissão de Vendedora",
  ajuste_comissao: "Ajuste de Comissão (mudança de faixa)",
  bonus_comissao: "Bônus de Faturamento",
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

export function categoriaLabel(categoria?: string | null, vendedorNome?: string | null): string {
  if (!categoria) return "Outros";
  if (categoria === "comissao" && vendedorNome) return `Comissão (${vendedorNome})`;
  return CATEGORIA_LABELS[categoria] ?? categoria;
}
