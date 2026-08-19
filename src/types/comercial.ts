// === CRM Funnel (funil de captação — página /crm) ===
export type CaptacaoStatus = "novo_lead" | "em_atendimento" | "prova_agendada" | "no_show";

// === Funil de Agendamento Comercial (página /comercial/kanban) ===
export type AgendamentoStatus =
  | "agendado"
  | "compareceu_alugou"
  | "compareceu_nao_alugou"
  | "reagendada"
  | "cancelada";

// CrmFunnelStatus engloba os dois funis, para retrocompatibilidade com leads já
// gravados no banco em qualquer um dos status.
export type CrmFunnelStatus = CaptacaoStatus | AgendamentoStatus;

export interface CrmKanbanColumn {
  id: CrmFunnelStatus;
  title: string;
  colorClass: string;
}

export const CRM_KANBAN_COLUMNS: CrmKanbanColumn[] = [
  { id: "novo_lead", title: "Novo Lead", colorClass: "bg-info/20 text-info border-info/30" },
  { id: "em_atendimento", title: "Em Atendimento", colorClass: "bg-accent/20 text-accent-foreground border-accent-foreground/30" },
  { id: "prova_agendada", title: "Prova Agendada", colorClass: "bg-primary/20 text-primary border-primary/30" },
  { id: "no_show", title: "No-Show", colorClass: "bg-destructive/20 text-destructive border-destructive/30" },
];

export const AGENDAMENTO_KANBAN_COLUMNS: CrmKanbanColumn[] = [
  { id: "agendado", title: "Agendado", colorClass: "bg-info/20 text-info border-info/30" },
  { id: "compareceu_alugou", title: "Compareceu e Alugou", colorClass: "bg-success/20 text-success border-success/30" },
  { id: "compareceu_nao_alugou", title: "Compareceu e Não Alugou", colorClass: "bg-warning/20 text-warning border-warning/30" },
  { id: "reagendada", title: "Reagendada", colorClass: "bg-accent/20 text-accent-foreground border-accent-foreground/30" },
  { id: "cancelada", title: "Cancelada", colorClass: "bg-destructive/20 text-destructive border-destructive/30" },
];

// === Lead / Cliente ===
export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  endereco: string;
  tipoEvento: string;
  dataEvento: string;
  statusFunil: CrmFunnelStatus;
  notasInternas: string;
  vendedorResponsavel: string;
  criadoEm: string;
  provaData?: string;
  provaHora?: string;
  enviadoComercial?: boolean;
}

export interface MedidasCliente {
  leadId: string;
  busto: string;
  cintura: string;
  quadril: string;
  altura: string;
  salto?: string;
  manequim: string;
}

// === Negócio (Comercial) ===
export type StatusNegociacao = "aberto" | "aprovado" | "cancelado";

export interface Negocio {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCpf: string;
  vestidoNome?: string;
  valorNegociado: number;
  desconto: number;
  metodoPagamento: string;
  statusNegociacao: StatusNegociacao;
  dataEvento: string;
  criadoEm: string;
}

// === Contrato ===
export type ContratoStatus = "pendente" | "assinado" | "cancelado";

export interface Contrato {
  id: string;
  numero: string;
  leadId: string;
  negocioId?: string;
  nomeCliente: string;
  cpfCliente: string;
  dataEvento: string;
  dataCriacao: string;
  valorTotal: number;
  statusAssinatura: ContratoStatus;
  termosTexto: string;
  assinaturaBase64?: string;
  dataAssinatura?: string;
  ipAssinatura?: string;
  userAgentAssinatura?: string;
  signingToken?: string;
  tokenExpiresAt?: string;
  emailCliente?: string;
}

// Legacy compat — kept for old kanban (removed)
export type FunnelStatus = CrmFunnelStatus;
export const KANBAN_COLUMNS = CRM_KANBAN_COLUMNS;

export interface KanbanColumn {
  id: CrmFunnelStatus;
  title: string;
  colorClass: string;
}
