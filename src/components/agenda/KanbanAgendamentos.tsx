import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Agendamento, StatusAgendamento,
  STATUS_KANBAN, COLUNAS_KANBAN, TIPO_CONFIG,
} from "@/types/agenda";
import { useMoverKanban } from "@/hooks/useAgenda";
import { cn } from "@/lib/utils";

interface Props {
  agendamentos: Agendamento[];
}

export function KanbanAgendamentos({ agendamentos }: Props) {
  const mover = useMoverKanban();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const porStatus = (status: StatusAgendamento) => agendamentos.filter((ag) => ag.status === status);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("agendamentoId", id);
    setDraggingId(id);
  };
  const handleDragEnd = () => setDraggingId(null);
  const handleDrop = (e: React.DragEvent, status: StatusAgendamento) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("agendamentoId");
    if (id) mover.mutate({ id, status });
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max px-1 pt-2">
        {COLUNAS_KANBAN.map((status) => {
          const cfg = STATUS_KANBAN[status];
          const cards = porStatus(status);
          return (
            <div key={status} className="w-64 shrink-0" onDrop={(e) => handleDrop(e, status)} onDragOver={handleDragOver}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: cfg.corBg, color: cfg.cor }}
                >
                  {cfg.label}
                </span>
                <span className="text-xs text-muted-foreground font-medium">{cards.length}</span>
              </div>

              <div
                className={cn(
                  "min-h-[120px] rounded-xl p-2 space-y-2 transition-colors",
                  "bg-muted/40 border-2 border-dashed border-transparent",
                  "hover:border-border",
                )}
              >
                {cards.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center pt-6">Arraste agendamentos aqui</p>
                ) : (
                  cards.map((ag) => (
                    <KanbanCard
                      key={ag.id}
                      agendamento={ag}
                      arrastando={draggingId === ag.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  agendamento,
  arrastando,
  onDragStart,
  onDragEnd,
}: {
  agendamento: Agendamento;
  arrastando: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}) {
  const tipoCfg = TIPO_CONFIG[agendamento.tipo];
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, agendamento.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "bg-background rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing",
        "hover:shadow-md transition-all select-none",
        arrastando && "opacity-40 scale-95",
      )}
    >
      <span
        className="inline-block text-[10px] font-bold rounded px-1.5 py-0.5 mb-2"
        style={{ backgroundColor: `${tipoCfg.cor}22`, color: tipoCfg.cor }}
      >
        {tipoCfg.label}
      </span>

      <p className="text-sm font-semibold text-foreground leading-tight">{agendamento.clienteNome}</p>

      <p className="text-xs text-muted-foreground mt-1 capitalize">
        {format(parseISO(agendamento.dataHora), "EEE d/MM 'às' HH:mm", { locale: ptBR })}
      </p>

      {agendamento.vestidoNome && (
        <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">🎀 {agendamento.vestidoNome}</p>
      )}
    </div>
  );
}
