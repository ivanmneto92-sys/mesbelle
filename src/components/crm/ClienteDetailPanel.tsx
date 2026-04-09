import { useState, useEffect } from "react";
import { Lead, MedidasCliente } from "@/types/comercial";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Save, User, Ruler, FileText, History } from "lucide-react";
import { toast } from "sonner";

interface ClienteDetailPanelProps {
  lead: Lead | null;
  medidas?: MedidasCliente;
  open: boolean;
  onClose: () => void;
  onUpdateLead: (leadId: string, data: Partial<Lead>) => void;
  onUpdateMedidas: (leadId: string, data: Omit<MedidasCliente, "leadId">) => void;
}

export function ClienteDetailPanel({ lead, medidas, open, onClose, onUpdateLead, onUpdateMedidas }: ClienteDetailPanelProps) {
  const [activeSection, setActiveSection] = useState<"dados" | "medidas" | "notas" | "historico">("dados");
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [editMedidas, setEditMedidas] = useState<Omit<MedidasCliente, "leadId">>({
    busto: "", cintura: "", quadril: "", altura: "", salto: "", manequim: "",
  });
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (lead) {
      setEditData({ nome: lead.nome, telefone: lead.telefone, email: lead.email, endereco: lead.endereco });
      setNotas(lead.notasInternas || "");
      if (medidas) {
        setEditMedidas({ busto: medidas.busto, cintura: medidas.cintura, quadril: medidas.quadril, altura: medidas.altura, salto: medidas.salto || "", manequim: medidas.manequim });
      } else {
        setEditMedidas({ busto: "", cintura: "", quadril: "", altura: "", salto: "", manequim: "" });
      }
    }
  }, [lead, medidas]);

  if (!lead) return null;

  const whatsappLink = `https://wa.me/55${lead.telefone.replace(/\D/g, "")}`;

  const handleSaveDados = () => {
    onUpdateLead(lead.id, editData);
    toast.success("Dados atualizados");
  };

  const handleSaveMedidas = () => {
    onUpdateMedidas(lead.id, editMedidas);
    toast.success("Medidas salvas");
  };

  const handleSaveNotas = () => {
    onUpdateLead(lead.id, { notasInternas: notas });
    toast.success("Notas salvas");
  };

  const sections = [
    { key: "dados" as const, icon: User, label: "Dados" },
    { key: "medidas" as const, icon: Ruler, label: "Medidas" },
    { key: "notas" as const, icon: FileText, label: "Notas" },
    { key: "historico" as const, icon: History, label: "Histórico" },
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-xl">{lead.nome}</SheetTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{lead.tipoEvento}</Badge>
            {lead.enviadoComercial && <Badge className="text-xs bg-primary/20 text-primary">No Comercial</Badge>}
          </div>
        </SheetHeader>

        <div className="flex gap-1 mt-4 mb-4">
          {sections.map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={activeSection === s.key ? "default" : "ghost"}
              onClick={() => setActiveSection(s.key)}
              className="text-xs gap-1"
            >
              <s.icon className="h-3 w-3" />
              {s.label}
            </Button>
          ))}
        </div>

        <Separator className="mb-4" />

        {activeSection === "dados" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={editData.nome || ""} onChange={(e) => setEditData({ ...editData, nome: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <div className="flex gap-2">
                <Input value={editData.telefone || ""} onChange={(e) => setEditData({ ...editData, telefone: e.target.value })} className="flex-1" />
                <Button size="icon" variant="outline" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </a>
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Endereço</Label>
              <Input value={editData.endereco || ""} onChange={(e) => setEditData({ ...editData, endereco: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">CPF</Label>
                <Input value={lead.cpf} disabled className="bg-muted" />
              </div>
              <div>
                <Label className="text-xs">Data do Evento</Label>
                <Input value={lead.dataEvento} disabled className="bg-muted" />
              </div>
            </div>
            <Button onClick={handleSaveDados} className="w-full">
              <Save className="h-4 w-4 mr-2" /> Salvar Dados
            </Button>
          </div>
        )}

        {activeSection === "medidas" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {(["busto", "cintura", "quadril", "altura", "salto", "manequim"] as const).map((field) => (
                <div key={field}>
                  <Label className="text-xs capitalize">{field}</Label>
                  <Input
                    value={(editMedidas as Record<string, string>)[field] || ""}
                    onChange={(e) => setEditMedidas({ ...editMedidas, [field]: e.target.value })}
                    placeholder={field === "altura" ? "ex: 1.65" : field === "salto" ? "ex: 10cm" : "cm"}
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleSaveMedidas} className="w-full">
              <Save className="h-4 w-4 mr-2" /> Salvar Medidas
            </Button>
          </div>
        )}

        {activeSection === "notas" && (
          <div className="space-y-3">
            <Textarea
              rows={10}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Anotações sobre o atendimento..."
              className="resize-none"
            />
            <Button onClick={handleSaveNotas} className="w-full">
              <Save className="h-4 w-4 mr-2" /> Salvar Notas
            </Button>
          </div>
        )}

        {activeSection === "historico" && (
          <div className="space-y-3">
            <div className="relative pl-6 border-l-2 border-muted space-y-4">
              <div className="relative">
                <div className="absolute -left-[25px] top-0.5 w-3 h-3 rounded-full bg-primary" />
                <p className="text-sm font-medium">Lead criado</p>
                <p className="text-xs text-muted-foreground">{lead.criadoEm}</p>
              </div>
              {lead.provaData && (
                <div className="relative">
                  <div className="absolute -left-[25px] top-0.5 w-3 h-3 rounded-full bg-info" />
                  <p className="text-sm font-medium">Prova agendada</p>
                  <p className="text-xs text-muted-foreground">{lead.provaData} às {lead.provaHora || "—"}</p>
                </div>
              )}
              {lead.enviadoComercial && (
                <div className="relative">
                  <div className="absolute -left-[25px] top-0.5 w-3 h-3 rounded-full bg-success" />
                  <p className="text-sm font-medium">Enviado para Comercial</p>
                  <p className="text-xs text-muted-foreground">Cliente em negociação</p>
                </div>
              )}
            </div>
            {!lead.provaData && !lead.enviadoComercial && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
