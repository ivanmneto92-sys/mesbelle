export type TipoAgendamento = "visita" | "prova" | "retirada" | "ajuste" | "devolucao";

export type StatusAgendamento =
  | "agendado"
  | "compareceu_alugou"
  | "compareceu_nao_alugou"
  | "reagendada"
  | "cancelada";

export const STATUS_KANBAN: Record<StatusAgendamento, { label: string; cor: string; corBg: string }> = {
  agendado: { label: "Agendado", cor: "#3B82F6", corBg: "#EFF6FF" },
  compareceu_alugou: { label: "Compareceu e Alugou", cor: "#10B981", corBg: "#ECFDF5" },
  compareceu_nao_alugou: { label: "Compareceu e Não Alugou", cor: "#F59E0B", corBg: "#FFFBEB" },
  reagendada: { label: "Reagendada", cor: "#8B5CF6", corBg: "#F5F3FF" },
  cancelada: { label: "Cancelada", cor: "#EF4444", corBg: "#FEF2F2" },
};

export const COLUNAS_KANBAN: StatusAgendamento[] = [
  "agendado",
  "compareceu_alugou",
  "compareceu_nao_alugou",
  "reagendada",
  "cancelada",
];

export interface Agendamento {
  id: string;
  tipo: TipoAgendamento;
  dataHora: string; // ISO 8601
  duracaoMinutos: number;
  clienteNome: string;
  clienteEmail: string | null;
  clienteTelefone: string | null;
  negocioId: string | null;
  leadId: string | null;
  reservaId: string | null;
  vestidoId: string | null;
  funcionariaId: string | null;
  observacoes: string | null;
  status: StatusAgendamento;
  criadoEm: string;
  // Dados desnormalizados para exibição
  funcionariaNome?: string | null;
  vestidoNome?: string | null;
}

export interface NovoAgendamento {
  tipo: TipoAgendamento;
  dataHora: string;
  duracaoMinutos: number;
  clienteNome: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  negocioId?: string;
  leadId?: string;
  reservaId?: string;
  vestidoId?: string;
  funcionariaId?: string;
  observacoes?: string;
}

export const TIPO_CONFIG: Record<
  TipoAgendamento,
  { label: string; cor: string; corBg: string; corTexto: string }
> = {
  visita: { label: "Visita", cor: "#3B82F6", corBg: "bg-blue-100", corTexto: "text-blue-800" },
  prova: { label: "Prova", cor: "#8B5CF6", corBg: "bg-purple-100", corTexto: "text-purple-800" },
  retirada: { label: "Retirada", cor: "#10B981", corBg: "bg-green-100", corTexto: "text-green-800" },
  ajuste: { label: "Ajuste", cor: "#F59E0B", corBg: "bg-amber-100", corTexto: "text-amber-800" },
  devolucao: { label: "Devolução", cor: "#EF4444", corBg: "bg-red-100", corTexto: "text-red-800" },
};
