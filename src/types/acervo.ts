export type VestidoStatus = "disponivel" | "alugado" | "ajuste" | "manutencao";
export type ReservaStatus = "aluguel" | "lavanderia" | "ajuste";
export type ProducaoStatus = "em_producao" | "pausado" | "concluido";

export interface Vestido {
  id: string;
  nome: string;
  cor: string;
  tamanho: string;
  comprimento: string;
  precoAluguel: number;
  precoVenda: number;
  status: VestidoStatus;
  isConsignado: boolean;
  imagemUrl: string;
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
};

export const STATUS_COLORS: Record<VestidoStatus, string> = {
  disponivel: "bg-primary text-primary-foreground",
  alugado: "bg-destructive/10 text-destructive border border-destructive/20",
  ajuste: "bg-amber-100 text-amber-800 border border-amber-200",
  manutencao: "bg-muted text-muted-foreground border border-border",
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
