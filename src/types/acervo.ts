export type VestidoStatus = "disponivel" | "alugado" | "ajuste" | "manutencao" | "producao" | "inativo";
export type ReservaStatus = "aluguel" | "lavanderia" | "ajuste";
export type ProducaoStatus = "em_producao" | "pausado" | "concluido";
export type CategoriaPeca = "vestido" | "bolsa" | "acessorio" | "sapato" | "conjunto" | "outros";

export interface Vestido {
  id: string;
  nome: string;
  sku: string | null;
  categoriaPeca: CategoriaPeca;
  cor: string;
  tamanho: string;
  comprimento: string;
  precoAluguel: number;
  precoVenda: number;
  status: VestidoStatus;
  isConsignado: boolean;
  // Foto de capa — sempre a primeira de imagensUrls (mantida à parte porque
  // cards/listas mostram só uma thumbnail e não precisam carregar a galeria
  // inteira).
  imagemUrl: string;
  imagensUrls: string[];
  descricao: string | null;
  qtdTotalLocacoes: number;
}

export interface ReservaAgenda {
  id: string;
  vestidoId: string;
  dataInicio: string;
  dataFim: string;
  statusReserva: ReservaStatus;
}

export interface Producao {
  id: string;
  tituloVestido: string;
  clienteNome: string;
  dataPrazo: string;
  dataProva: string;
  statusGeral: ProducaoStatus;
  refImagensUrls: string[];
  notasTecnicas: string;
}

export interface EtapaProducao {
  id: string;
  producaoId: string;
  nomeEtapa: string;
  isConcluido: boolean;
  // Data/hora do último clique (concluir ou reabrir) — prova de quando a
  // mudança de etapa aconteceu.
  updatedAt: string;
}

export const STATUS_LABELS: Record<VestidoStatus, string> = {
  disponivel: "Disponível",
  alugado: "Alugado",
  ajuste: "Em Ajuste",
  manutencao: "Em Manutenção",
  producao: "Em Produção",
  inativo: "Inativo",
};

export const STATUS_COLORS: Record<VestidoStatus, string> = {
  disponivel: "bg-primary text-primary-foreground",
  alugado: "bg-destructive/10 text-destructive border border-destructive/20",
  ajuste: "bg-amber-100 text-amber-800 border border-amber-200",
  manutencao: "bg-muted text-muted-foreground border border-border",
  producao: "bg-info/10 text-info border border-info/20",
  inativo: "bg-muted text-muted-foreground/60 border border-border",
};

export const CATEGORIA_LABELS: Record<CategoriaPeca, string> = {
  vestido: "Vestido",
  bolsa: "Bolsa",
  acessorio: "Acessório",
  sapato: "Sapato",
  conjunto: "Conjunto",
  outros: "Outros",
};

export const PRODUCAO_STATUS_LABELS: Record<ProducaoStatus, string> = {
  em_producao: "Em Produção",
  pausado: "Pausado",
  concluido: "Concluído",
};

// Jornada do Primeiro Aluguel (vestido feito do zero) — ordem fixa, usada
// tanto para gerar as etapas de uma produção nova (useAcervo.addProducao)
// quanto para escolher o ícone de cada etapa na linha do tempo visual
// (ProducaoJornada). A 6ª etapa (Segunda Prova) pode abrir um ciclo
// opcional de novo ajuste antes da Entrega Final — ver ProducaoJornada.
export const DEFAULT_ETAPAS = [
  "Aprovação de Amostra",
  "Compra de Material",
  "Modelista",
  "Bordadeira",
  "Primeira Prova",
  "Ajustes",
  "Segunda Prova",
  "Entrega Final",
];
