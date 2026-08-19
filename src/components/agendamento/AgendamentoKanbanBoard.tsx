import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Phone, Calendar } from "lucide-react";
import { Lead, CrmFunnelStatus, AGENDAMENTO_KANBAN_COLUMNS } from "@/types/comercial";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface AgendamentoKanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: CrmFunnelStatus, extra?: Partial<Lead>) => void;
  onLeadClick: (lead: Lead) => void;
  onEnviarComercial: (leadId: string) => void;
}

export function AgendamentoKanbanBoard({ leads, onStatusChange, onLeadClick, onEnviarComercial }: AgendamentoKanbanBoardProps) {
  const [visitaDialog, setVisitaDialog] = useState<{ open: boolean; leadId: string }>({ open: false, leadId: "" });
  const [visitaData, setVisitaData] = useState("");
  const [visitaHora, setVisitaHora] = useState("");

  const getLeadsByStatus = (status: CrmFunnelStatus) => leads.filter((l) => l.statusFunil === status);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as CrmFunnelStatus;
    const leadId = result.draggableId;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.statusFunil === newStatus) return;

    if (newStatus === "agendado") {
      setVisitaDialog({ open: true, leadId });
      setVisitaData(lead.provaData ?? "");
      setVisitaHora(lead.provaHora ?? "");
      return;
    }

    onStatusChange(leadId, newStatus);

    if (newStatus === "compareceu_alugou") {
      onEnviarComercial(leadId);
      toast.success(`${lead.nome} enviada para o Comercial!`);
    }
  };

  const confirmVisita = () => {
    onStatusChange(visitaDialog.leadId, "agendado", {
      provaData: visitaData || undefined,
      provaHora: visitaHora || undefined,
    });
    setVisitaDialog({ open: false, leadId: "" });
  };

  const getBorderColor = (colorClass: string) => {
    if (colorClass.includes("info")) return "border-l-info";
    if (colorClass.includes("success")) return "border-l-success";
    if (colorClass.includes("warning")) return "border-l-warning";
    if (colorClass.includes("destructive")) return "border-l-destructive";
    return "border-l-accent-foreground";
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
          {AGENDAMENTO_KANBAN_COLUMNS.map((col) => {
            const items = getLeadsByStatus(col.id);
            return (
              <div key={col.id} className="min-w-[260px] w-[260px] shrink-0 flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Badge className={`${col.colorClass} border font-medium text-xs`}>{col.title}</Badge>
                  <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 rounded-xl p-2 transition-colors min-h-[100px] ${
                        snapshot.isDraggingOver ? "bg-accent/10 ring-2 ring-accent/30" : "bg-muted/30"
                      }`}
                    >
                      {items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={snapshot.isDragging ? "rotate-2 scale-105" : ""}
                            >
                              <Card
                                className={`shadow-sm cursor-pointer hover:shadow-md transition-all border-l-4 ${getBorderColor(col.colorClass)}`}
                                onClick={() => onLeadClick(item)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-2">
                                    <div {...provided.dragHandleProps} className="mt-0.5">
                                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold truncate">{item.nome}</p>
                                      <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        <span className="text-xs">{item.telefone}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                                          {item.tipoEvento}
                                        </Badge>
                                        {item.provaData && (
                                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                            <Calendar className="h-2.5 w-2.5" />
                                            {new Date(item.provaData + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                            {item.provaHora ? ` ${item.provaHora}` : ""}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-muted-foreground/50 text-center py-6">Arraste leads aqui</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <Dialog open={visitaDialog.open} onOpenChange={(open) => setVisitaDialog({ ...visitaDialog, open })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Agendar Visita</DialogTitle>
            <DialogDescription>Defina a data e horário da visita.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <div>
              <Label>Data da Visita</Label>
              <Input type="date" value={visitaData} onChange={(e) => setVisitaData(e.target.value)} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={visitaHora} onChange={(e) => setVisitaHora(e.target.value)} />
            </div>
            <Button onClick={confirmVisita}>Confirmar Agendamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
