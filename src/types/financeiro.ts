export type TipoTransacao = "entrada" | "saida";
export type CategoriaTransacao = "Aluguel" | "Venda" | "Material" | "Pessoal" | "Fixo" | "Variável" | "Marketing" | "Imposto" | "Outros";
export type StatusTransacao = "pago" | "pendente";

export interface Transacao {
  id: string;
  tipo: TipoTransacao;
  data: string; // YYYY-MM-DD
  descricao: string;
  categoria: CategoriaTransacao;
  valor: number; // always positive
  status: StatusTransacao;
}

export interface ConfigImpostos {
  simplesNacional: number;
  iss: number;
  debito: number;
  creditoVista: number;
  creditoParcelado: number;
}
