import { useState, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Kanban, List, Phone } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useDateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Lead, CrmFunnelStatus, AGENDAMENTO_KANBAN_COLUMNS } from "@/types/comercial";
import { AgendamentoKanbanBoard } from "@/components/agendamento/AgendamentoKanbanBoard";
import { ClienteDetailPanel } from "@/components/crm/ClienteDetailPanel";
import { PageHeader } from "@/components/layout/PageHeader";

const AGENDAMENTO_STATUSES: CrmFunnelStatus[] = [
  "agendado", "compareceu_alugou", "compareceu_nao_alugou", "reagendada", "cancelada",
];

const AgendamentoComercial = () => {
  const {
    leads, updateLeadStatus, updateLead,
    updateMedidas, getMedidas, enviarParaComercial,
  } = useLeads();
  const { range, setRange } = useDateRange();

  const [activeTab, setActiveTab] = useState("kanban");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const leadsAgendamento = useMemo(
    () => leads.filter((l) => AGENDAMENTO_STATUSES.includes(l.statusFunil)),
    [leads]
  );

  const leadsNoPeriodo = useMemo(
    () => leadsAgendamento.filter((l) => l.criadoEm >= range.from && l.criadoEm <= range.to),
    [leadsAgendamento, range]
  );

  const selectedLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [selectedLeadId, leads]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setDetailOpen(true);
  };

  const handleStatusChange = (leadId: string, newStatus: CrmFunnelStatus, extra?: Partial<Lead>) => {
    updateLeadStatus(leadId, newStatus, extra);
  };

  const statusMeta = (status: CrmFunnelStatus) =>
    AGENDAMENTO_KANBAN_COLUMNS.find((c) => c.id === status);

  return (
    <>
      <SEO title="Agendamento Comercial — Més Belle" description="Kanban de visitas agendadas e conversão em aluguel." path="/agendamento/comercial" />
      <div className="space-y-6">
        <PageHeader
          icon={Kanban}
          title="Agendamento Comercial"
          description="Visitas agendadas, comparecimento e conversão em aluguel"
          actions={<DateRangePicker value={range} onChange={setRange} />}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="kanban"><Kanban className="h-4 w-4 mr-1.5" />Kanban</TabsTrigger>
            <TabsTrigger value="lista"><List className="h-4 w-4 mr-1.5" />Lista</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-4">
            <AgendamentoKanbanBoard
              leads={leadsAgendamento}
              onStatusChange={handleStatusChange}
              onLeadClick={handleLeadClick}
              onEnviarComercial={enviarParaComercial}
            />
          </TabsContent>

          <TabsContent value="lista" className="mt-4">
            <div className="rounded-2xl border border-border-subtle overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Visita</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsNoPeriodo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                        Nenhum cliente agendado no período selecionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leadsNoPeriodo.map((l) => {
                      const meta = statusMeta(l.statusFunil);
                      return (
                        <TableRow key={l.id} className="cursor-pointer" onClick={() => handleLeadClick(l)}>
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
                          <TableCell>{l.vendedorResponsavel || "—"}</TableCell>
                          <TableCell>
                            {meta && <Badge className={`${meta.colorClass} border font-medium text-xs`}>{meta.title}</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <ClienteDetailPanel
          lead={selectedLead}
          medidas={selectedLead ? getMedidas(selectedLead.id) : undefined}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onUpdateLead={updateLead}
          onUpdateMedidas={updateMedidas}
        />
      </div>
    </>
  );
};

export default AgendamentoComercial;
