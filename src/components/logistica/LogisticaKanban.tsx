import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, AlertTriangle } from "lucide-react";
import { AluguelLogistica, StatusLogistica } from "@/types/logistica";

const COLUNAS: { id: StatusLogistica; title: string; colorClass: string }[] = [
  { id: "para_enviar", title: "Para Enviar", colorClass: "bg-info/20 text-info border-info/30" },
  { id: "em_transito", title: "Em Trânsito", colorClass: "bg-warning/20 text-warning border-warning/30" },
  { id: "com_cliente", title: "Entregue ao Cliente", colorClass: "bg-success/20 text-success border-success/30" },
  { id: "atrasado", title: "Atrasado", colorClass: "bg-destructive/20 text-destructive border-destructive/30" },
  { id: "devolvido", title: "Devolução", colorClass: "bg-muted text-muted-foreground border-border" },
];

function getDiasAtraso(dataRetorno: string): number {
  const today = new Date();
  const retorno = new Date(dataRetorno);
  const diff = Math.floor((today.getTime() - retorno.getTime()) / 86400000);
  return Math.max(0, diff);
}

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

interface Props {
  items: AluguelLogistica[];
  canManage: boolean;
  onStatusChange: (id: string, status: StatusLogistica) => void;
  onItemClick: (item: AluguelLogistica) => void;
}

export function LogisticaKanban({ items, canManage, onStatusChange, onItemClick }: Props) {
  const getItemsByStatus = (status: StatusLogistica) => items.filter((i) => i.statusLogistica === status);

  const handleDragEnd = (result: DropResult) => {
    if (!canManage || !result.destination) return;
    const newStatus = result.destination.droppableId as StatusLogistica;
    const itemId = result.draggableId;
    const item = items.find((i) => i.id === itemId);
    if (!item || item.statusLogistica === newStatus) return;
    onStatusChange(itemId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[50vh]">
        {COLUNAS.map((col) => {
          const colItems = getItemsByStatus(col.id);
          return (
            <div key={col.id} className="min-w-[260px] w-[260px] shrink-0 flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Badge className={`${col.colorClass} border font-medium text-xs`}>{col.title}</Badge>
                <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {colItems.length}
                </span>
              </div>
              <Droppable droppableId={col.id} isDropDisabled={!canManage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2 rounded-xl p-2 transition-colors min-h-[100px] ${
                      snapshot.isDraggingOver ? "bg-accent/10 ring-2 ring-accent/30" : "bg-muted/30"
                    }`}
                  >
                    {colItems.map((item, index) => {
                      const diasAtraso = col.id === "atrasado" ? getDiasAtraso(item.dataRetorno) : 0;
                      return (
                        <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!canManage}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={snapshot.isDragging ? "rotate-2 scale-105" : ""}
                            >
                              <Card
                                className="shadow-sm cursor-pointer hover:shadow-md transition-all"
                                onClick={() => onItemClick(item)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-2">
                                    {canManage && (
                                      <div {...provided.dragHandleProps} className="mt-0.5">
                                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold truncate">{item.vestidoNome}</p>
                                      <p className="text-xs text-muted-foreground truncate">{item.clienteNome}</p>
                                      <p className="text-[11px] text-muted-foreground mt-1">
                                        {formatDate(item.dataSaida)} → {formatDate(item.dataRetorno)}
                                      </p>
                                      {col.id === "atrasado" && diasAtraso > 0 && (
                                        <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                                          <AlertTriangle className="h-3 w-3" /> {diasAtraso} dia{diasAtraso > 1 ? "s" : ""} de atraso
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {colItems.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-xs text-muted-foreground/50 text-center py-6">Nenhum item</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
