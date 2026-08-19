export type TipoTransacao = "entrada" | "saida";
export type StatusTransacao = "pago" | "pendente" | "cancelado";
export type TipoCusto = "fixo" | "variavel";

export interface Transacao {
  id: string;
  tipo: TipoTransacao;
  data: string; // YYYY-MM-DD
  descricao: string;
  categoria: string;
  valor: number; // always positive
  status: StatusTransacao;
  tipoCusto?: TipoCusto | null;
  leadId?: string | null;
  observacoes?: string | null;
}

export interface CategoriaOption {
  value: string;
  label: string;
  tipo: TipoTransacao;
  tipoCusto: TipoCusto | null;
}

export const CATEGORIAS: CategoriaOption[] = [
  // Receitas
  { value: "locacao", label: "Locação de Vestido", tipo: "entrada", tipoCusto: null },
  { value: "venda", label: "Venda", tipo: "entrada", tipoCusto: null },
  { value: "receita_outros", label: "Outros (Receita)", tipo: "entrada", tipoCusto: null },
  // Despesas Variáveis
  { value: "comissao", label: "Comissão de Vendedora", tipo: "saida", tipoCusto: "variavel" },
  { value: "imposto", label: "Impostos & Taxas", tipo: "saida", tipoCusto: "variavel" },
  { value: "custo_producao", label: "Custo de Produção/Ajuste", tipo: "saida", tipoCusto: "variavel" },
  { value: "devolucao", label: "Devolução / Reembolso", tipo: "saida", tipoCusto: "variavel" },
  // Despesas Fixas
  { value: "aluguel_atelier", label: "Aluguel do Ateliê", tipo: "saida", tipoCusto: "fixo" },
  { value: "salario", label: "Salários & Pró-labore", tipo: "saida", tipoCusto: "fixo" },
  { value: "marketing", label: "Marketing & Publicidade", tipo: "saida", tipoCusto: "fixo" },
  { value: "servico", label: "Serviços & Assinaturas", tipo: "saida", tipoCusto: "fixo" },
  { value: "manutencao", label: "Manutenção & Reparos", tipo: "saida", tipoCusto: "fixo" },
  { value: "outros", label: "Outros (Despesa)", tipo: "saida", tipoCusto: "fixo" },
];

export const CATEGORIAS_VARIAVEIS = CATEGORIAS.filter((c) => c.tipoCusto === "variavel").map((c) => c.value);
export const CATEGORIAS_FIXAS = CATEGORIAS.filter((c) => c.tipoCusto === "fixo").map((c) => c.value);
