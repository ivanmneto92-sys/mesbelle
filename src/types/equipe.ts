export type TipoContrato = "CLT" | "PJ";

export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  tipoContrato: TipoContrato;
  percentualComissao: number; // ex: 0.05 = 5%
  ativo: boolean;
  telefone?: string;
  email?: string;
}

export interface AvaliacaoCliente {
  id: string;
  funcionarioId: string;
  data: string; // YYYY-MM-DD
  nota: number; // 1-5
  comentario?: string;
}

export interface VendaFuncionario {
  funcionarioId: string;
  mes: string; // YYYY-MM
  quantidade: number;
  valorTotal: number;
}
