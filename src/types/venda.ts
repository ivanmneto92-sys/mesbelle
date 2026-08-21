export interface ItemCarrinho {
  id: string; // id temporário do item no carrinho (client-side)
  vestidoId: string;
  nome: string;
  sku: string;
  fotoUrl: string | null;
  categoria: string;
  valorOriginal: number; // vestidos.preco_aluguel
  desconto: number; // R$ de desconto neste item
  valorFinal: number; // valorOriginal - desconto
  dataRetirada: string | null; // YYYY-MM-DD
  dataDevolucao: string | null; // YYYY-MM-DD
  disponivel: boolean | null; // null = não verificado ainda
  verificando: boolean;
}

export type FormaPagamento = "pix" | "dinheiro" | "credito" | "debito" | "boleto" | "misto";

export interface DadosPagamento {
  forma: FormaPagamento;
  parcelas: number; // 1 = à vista; >1 apenas para crédito
  descontoGeral: number; // R$ desconto aplicado no total
  observacoes: string;
}

export interface ResumoPedido {
  subtotal: number;
  descontoItens: number; // soma dos descontos por item
  descontoGeral: number; // desconto no total
  total: number;
}
