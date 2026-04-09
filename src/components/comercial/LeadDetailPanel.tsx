import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, User, Ruler, FileText, Save } from "lucide-react";
import { Lead, MedidasCliente, KANBAN_COLUMNS } from "@/types/comercial";
import { useState, useEffect } from "react";

interface LeadDetailPanelProps {
  lead: Lead | null;
  medidas: MedidasCliente | undefined;
  open: boolean;
  onClose: () => void;
  onUpdateLead: (leadId: string, data: Partial<Lead>) => void;
  onUpdateMedidas: (leadId: string, data: Omit<MedidasCliente, "leadId">) => void;
}

export function LeadDetailPanel({ lead, medidas, open, onClose, onUpdateLead, onUpdateMedidas }: LeadDetailPanelProps) {
  const [notas, setNotas] = useState("");
  const [med, setMed] = useState({ busto: "", cintura: "", quadril: "", altura: "", manequim: "" });

  useEffect(() => {
    if (lead) {
      setNotas(lead.notasInternas || "");
    }
    if (medidas) {
      setMed({ busto: medidas.busto, cintura: medidas.cintura, quadril: medidas.quadril, altura: medidas.altura, manequim: medidas.manequim });
    } else {
      setMed({ busto: "", cintura: "", quadril: "", altura: "", manequim: "" });
    }
  }, [lead, medidas]);

  if (!lead) return null;

  const colInfo = KANBAN_COLUMNS.find((c) => c.id === lead.statusFunil);
  const whatsappLink = `https://wa.me/55${lead.telefone.replace(/\D/g, "")}`;

  const handleSaveNotas = () => {
    onUpdateLead(lead.id, { notasInternas: notas });
  };

  const handleSaveMedidas = () => {
    onUpdateMedidas(lead.id, med);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="font-serif text-xl">{lead.nome}</SheetTitle>
              {colInfo && (
                <Badge className={`${colInfo.colorClass} border text-xs mt-1`}>{colInfo.title}</Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex gap-2 mb-4">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
            </Button>
          </a>
        </div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1 text-xs">
              <User className="h-3 w-3 mr-1" /> Dados
            </TabsTrigger>
            <TabsTrigger value="medidas" className="flex-1 text-xs">
              <Ruler className="h-3 w-3 mr-1" /> Medidas
            </TabsTrigger>
            <TabsTrigger value="notas" className="flex-1 text-xs">
              <FileText className="h-3 w-3 mr-1" /> Notas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <p className="text-sm font-medium">{lead.telefone}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">E-mail</Label>
                <p className="text-sm font-medium">{lead.email || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">CPF</Label>
                <p className="text-sm font-medium">{lead.cpf || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tipo de Evento</Label>
                <p className="text-sm font-medium">{lead.tipoEvento}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data do Evento</Label>
                <p className="text-sm font-medium">
                  {lead.dataEvento ? new Date(lead.dataEvento).toLocaleDateString("pt-BR") : "—"}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Vendedora</Label>
                <p className="text-sm font-medium">{lead.vendedorResponsavel}</p>
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Endereço</Label>
              <p className="text-sm">{lead.endereco || "—"}</p>
            </div>
            {lead.provaData && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Data da Prova</Label>
                    <p className="text-sm font-medium">{new Date(lead.provaData).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Horário</Label>
                    <p className="text-sm font-medium">{lead.provaHora || "—"}</p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="medidas" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="busto">Busto (cm)</Label>
                <Input id="busto" value={med.busto} onChange={(e) => setMed({ ...med, busto: e.target.value })} placeholder="Ex: 90" />
              </div>
              <div>
                <Label htmlFor="cintura">Cintura (cm)</Label>
                <Input id="cintura" value={med.cintura} onChange={(e) => setMed({ ...med, cintura: e.target.value })} placeholder="Ex: 68" />
              </div>
              <div>
                <Label htmlFor="quadril">Quadril (cm)</Label>
                <Input id="quadril" value={med.quadril} onChange={(e) => setMed({ ...med, quadril: e.target.value })} placeholder="Ex: 96" />
              </div>
              <div>
                <Label htmlFor="altura">Altura (m)</Label>
                <Input id="altura" value={med.altura} onChange={(e) => setMed({ ...med, altura: e.target.value })} placeholder="Ex: 1.65" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="manequim">Manequim</Label>
                <Input id="manequim" value={med.manequim} onChange={(e) => setMed({ ...med, manequim: e.target.value })} placeholder="Ex: 40" />
              </div>
            </div>
            <Button onClick={handleSaveMedidas} className="w-full">
              <Save className="h-4 w-4 mr-1" /> Salvar Medidas
            </Button>
          </TabsContent>

          <TabsContent value="notas" className="mt-4 space-y-3">
            <div>
              <Label>Histórico / Notas Internas</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Registre aqui o resumo das conversas e observações..."
                className="min-h-[200px] mt-1"
              />
            </div>
            <Button onClick={handleSaveNotas} className="w-full">
              <Save className="h-4 w-4 mr-1" /> Salvar Notas
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
