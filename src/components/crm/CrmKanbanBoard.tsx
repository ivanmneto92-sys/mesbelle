import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Phone, Calendar, ArrowRight } from "lucide-react";
import { Lead, CrmFunnelStatus, CRM_KANBAN_COLUMNS } from "@/types/comercial";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

interface CrmKanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: CrmFunnelStatus, extra?: Partial<Lead>) => void;
  onLeadClick: (lead: Lead) => void;
  onEnviarComercial: (leadId: string) => void;
}

export function CrmKanbanBoard({ leads, onStatusChange, onLeadClick, onEnviarComercial }: CrmKanbanBoardProps) {
  const [provaDialog, setProvaDialog] = useState<{ open: boolean; leadId: string }>({ open: false, leadId: "" });
  const [provaData, setProvaData] = useState("");
  const [provaHora, setProvaHora] = useState("");

  const getLeadsByStatus = (status: CrmFunnelStatus) =>
    leads.filter((l) => l.statusFunil === status && !l.enviadoComercial);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as CrmFunnelStatus;
    const leadId = result.draggableId;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.statusFunil === newStatus) return;

    if (newStatus === "prova_agendada") {
      setProvaDialog({ open: true, leadId });
      setProvaData("");
      setProvaHora("");
      return;
    }

    onStatusChange(leadId, newStatus);
  };

  const confirmProva = () => {
    onStatusChange(provaDialog.leadId, "prova_agendada", {
      provaData: provaData || undefined,
      provaHora: provaHora || undefined,
    });
    setProvaDialog({ open: false, leadId: "" });
  };

  const handleEnviar = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    onEnviarComercial(lead.id);
    toast.success(`${lead.nome} enviada para o Comercial!`);
  };

  const getBorderColor = (colorClass: string) => {
    if (colorClass.includes("info")) return "border-l-info";
    if (colorClass.includes("primary")) return "border-l-primary";
    if (colorClass.includes("destructive")) return "border-l-destructive";
    return "border-l-accent-foreground";
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[60vh]">
          {CRM_KANBAN_COLUMNS.map((col) => {
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
                                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                          <Calendar className="h-2.5 w-2.5" />
                                          {item.dataEvento ? new Date(item.dataEvento + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                                        </span>
                                      </div>
                                      {(col.id === "em_atendimento" || col.id === "prova_agendada") && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="mt-2 w-full text-xs h-7 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                                          onClick={(e) => handleEnviar(e, item)}
                                        >
                                          <ArrowRight className="h-3 w-3 mr-1" />
                                          Enviar para Comercial
                                        </Button>
                                      )}
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

      <Dialog open={provaDialog.open} onOpenChange={(open) => setProvaDialog({ ...provaDialog, open })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Agendar Prova</DialogTitle>
            <DialogDescription>Defina a data e horário da prova.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <div>
              <Label>Data da Prova</Label>
              <Input type="date" value={provaData} onChange={(e) => setProvaData(e.target.value)} />
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={provaHora} onChange={(e) => setProvaHora(e.target.value)} />
            </div>
            <Button onClick={confirmProva}>Confirmar Agendamento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
