export type FunnelStatus = "lead" | "contato" | "prova" | "negociacao" | "fechamento" | "perdido";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  endereco: string;
  tipoEvento: string;
  dataEvento: string;
  statusFunil: FunnelStatus;
  notasInternas: string;
  vendedorResponsavel: string;
  criadoEm: string;
  provaData?: string;
  provaHora?: string;
}

export interface MedidasCliente {
  leadId: string;
  busto: string;
  cintura: string;
  quadril: string;
  altura: string;
  manequim: string;
}

export type ContratoStatus = "pendente" | "assinado" | "cancelado";

export interface Contrato {
  id: string;
  numero: string;
  leadId: string;
  nomeCliente: string;
  cpfCliente: string;
  dataEvento: string;
  dataCriacao: string;
  valorTotal: number;
  statusAssinatura: ContratoStatus;
  termosTexto: string;
}

export interface KanbanColumn {
  id: FunnelStatus;
  title: string;
  colorClass: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: "lead", title: "Leads", colorClass: "bg-info/20 text-info border-info/30" },
  { id: "contato", title: "Contato", colorClass: "bg-accent/20 text-accent-foreground border-accent-foreground/30" },
  { id: "prova", title: "Prova Agendada", colorClass: "bg-primary/20 text-primary border-primary/30" },
  { id: "negociacao", title: "Negociação", colorClass: "bg-warning/20 text-warning border-warning/30" },
  { id: "fechamento", title: "Fechamento", colorClass: "bg-success/20 text-success border-success/30" },
  { id: "perdido", title: "Perdido / No-Show", colorClass: "bg-destructive/20 text-destructive border-destructive/30" },
];
