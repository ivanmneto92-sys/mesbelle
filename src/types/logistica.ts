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
  // Termo de Retirada — assinatura digital da cliente (igual ao contrato).
  assinaturaBase64?: string;
  dataAssinatura?: string;
  ipAssinatura?: string;
  userAgentAssinatura?: string;
}

// Mapa do Aluguel — jornada da peça após o contrato assinado/pago, para o
// Aluguel normal (peça já existe no Acervo). Uma jornada por reserva: o
// mesmo vestido pode ter várias reservas ao longo do tempo, cada uma com
// sua própria linha do tempo independente.
export interface EtapaJornadaAluguel {
  id: string;
  reservaId: string;
  nomeEtapa: string;
  isConcluido: boolean;
  updatedAt: string;
}

export interface JornadaAluguelItem {
  reservaId: string;
  vestidoNome: string;
  clienteNome: string;
  dataRetirada: string;
  dataDevolucao: string;
}
