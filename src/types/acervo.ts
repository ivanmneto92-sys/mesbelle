export type VestidoStatus = "disponivel" | "alugado" | "ajuste" | "manutencao" | "producao" | "inativo";
export type ReservaStatus = "aluguel" | "lavanderia" | "ajuste";
export type ProducaoStatus = "em_producao" | "pausado" | "concluido";
export type CategoriaPeca = "vestido" | "acessorio" | "sapato" | "conjunto" | "outros";

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
  imagemUrl: string;
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

export const DEFAULT_ETAPAS = [
  "Tecido Comprado",
  "Modelista",
  "Costura Base",
  "Bordadeira",
  "Provas",
  "Acabamento Final",
  "Entrega",
];
