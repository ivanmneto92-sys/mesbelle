import { useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import { CalendarClock, Plus, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { AGENDAMENTO_KANBAN_COLUMNS } from "@/types/comercial";
import { toast } from "sonner";

const ComercialAgendamento = () => {
  const { leads, agendamentos, agendar, updateLead } = useAgendamentos();

  const [novoOpen, setNovoOpen] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [editData, setEditData] = useState("");
  const [editHora, setEditHora] = useState("");

  const candidatos = useMemo(
    () => leads.filter((l) => !agendamentos.some((a) => a.id === l.id)),
    [leads, agendamentos]
  );

  const proximos = useMemo(
    () => [...agendamentos].sort((a, b) => (a.provaData || "9999").localeCompare(b.provaData || "9999")),
    [agendamentos]
  );

  const statusMeta = (status: string) => AGENDAMENTO_KANBAN_COLUMNS.find((c) => c.id === status);

  const handleAgendar = () => {
    if (!leadId || !data) {
      toast.error("Selecione a cliente e a data.");
      return;
    }
    agendar(leadId, data, hora || undefined);
    setNovoOpen(false);
    setLeadId(""); setData(""); setHora("");
    toast.success("Agendamento criado!");
  };

  const openEdit = (id: string, currentData?: string, currentHora?: string) => {
    setEditLeadId(id);
    setEditData(currentData || "");
    setEditHora(currentHora || "");
  };

  const handleSalvarEdicao = () => {
    if (!editLeadId) return;
    updateLead(editLeadId, { provaData: editData || undefined, provaHora: editHora || undefined });
    setEditLeadId(null);
    toast.success("Agendamento atualizado!");
  };

  return (
    <>
      <SEO title="Agendamento — Comercial — Més Belle" description="Agende e acompanhe visitas e provas comerciais." path="/comercial/agendamento" />
      <div className="space-y-6">
        <PageHeader
          icon={CalendarClock}
          title="Agendamento"
          description="Agende visitas e acompanhe os próximos compromissos"
          actions={
            <Button size="sm" onClick={() => setNovoOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Novo Agendamento
            </Button>
          }
        />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {proximos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento no momento.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proximos.map((l) => {
                    const meta = statusMeta(l.statusFunil);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.nome}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" /> {l.telefone}
                          </span>
                        </TableCell>
                        <TableCell>
                          {l.provaData ? new Date(l.provaData + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                          {l.provaHora ? ` às ${l.provaHora}` : ""}
                        </TableCell>
                        <TableCell>
                          {meta && <Badge className={`${meta.colorClass} border font-medium text-xs`}>{meta.title}</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openEdit(l.id, l.provaData, l.provaHora)}>
                            Reagendar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-serif">Novo Agendamento</DialogTitle>
              <DialogDescription>Selecione a cliente e defina a data da visita.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 mt-2">
              <div>
                <Label>Cliente</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a cliente" /></SelectTrigger>
                  <SelectContent>
                    {candidatos.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div>
                <Label>Horário</Label>
                <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              </div>
              <Button onClick={handleAgendar}>Confirmar Agendamento</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editLeadId} onOpenChange={(open) => !open && setEditLeadId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-serif">Reagendar</DialogTitle>
              <DialogDescription>Atualize a data e horário do compromisso.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 mt-2">
              <div>
                <Label>Data</Label>
                <Input type="date" value={editData} onChange={(e) => setEditData(e.target.value)} />
              </div>
              <div>
                <Label>Horário</Label>
                <Input type="time" value={editHora} onChange={(e) => setEditHora(e.target.value)} />
              </div>
              <Button onClick={handleSalvarEdicao}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ComercialAgendamento;
