// === CRM Funnel ===
export type CrmFunnelStatus = "novo_lead" | "em_atendimento" | "prova_agendada" | "no_show";

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
