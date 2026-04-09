export type StatusLogistica = "para_enviar" | "em_transito" | "com_cliente" | "atrasado" | "devolvido";

export interface AluguelLogistica {
  id: string;
  vestidoNome: string;
  clienteNome: string;
  clienteTelefone: string;
  enderecoEntrega: string;
  dataSaida: string;
  dataRetorno: string;
  statusLogistica: StatusLogistica;
  codigoRastreio?: string;
}
