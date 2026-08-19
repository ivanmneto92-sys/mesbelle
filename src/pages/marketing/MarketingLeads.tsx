import { useState, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users, Phone, Megaphone, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLeads } from "@/hooks/useLeads";
import { useDateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Lead, CrmFunnelStatus, CRM_KANBAN_COLUMNS } from "@/types/comercial";
import { NewLeadModal } from "@/components/crm/NewLeadModal";
import { ClienteDetailPanel } from "@/components/crm/ClienteDetailPanel";

const MARKETING_STATUSES: CrmFunnelStatus[] = ["novo_lead", "em_atendimento"];

const MarketingLeads = () => {
  const { leads, addLead, updateLead, updateMedidas, getMedidas } = useLeads();
  const { range, setRange } = useDateRange();

  const [statusFiltro, setStatusFiltro] = useState<CrmFunnelStatus | "todos">("todos");
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const leadsMarketing = useMemo(
    () => leads.filter((l) => MARKETING_STATUSES.includes(l.statusFunil)),
    [leads]
  );

  const leadsFiltrados = useMemo(() => {
    return leadsMarketing.filter((l) => {
      if (l.criadoEm < range.from || l.criadoEm > range.to) return false;
      if (statusFiltro !== "todos" && l.statusFunil !== statusFiltro) return false;
      return true;
    });
  }, [leadsMarketing, range, statusFiltro]);

  const selectedLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [selectedLeadId, leads]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setDetailOpen(true);
  };

  const statusMeta = (status: CrmFunnelStatus) => CRM_KANBAN_COLUMNS.find((c) => c.id === status);

  return (
    <>
      <SEO title="Marketing — Leads — Més Belle" description="Origem e primeiro contato dos leads captados." path="/marketing/leads" />
      <div className="space-y-6">
        <PageHeader
          icon={Users}
          title="Leads"
          description="Leads recém-captados, antes de entrarem no funil comercial"
          actions={
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <DateRangePicker value={range} onChange={setRange} />
              <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as CrmFunnelStatus | "todos")}>
                <SelectTrigger className="w-[180px] h-10 rounded-full bg-card border-border-subtle">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="novo_lead">Novo Lead</SelectItem>
                  <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setNewLeadOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> Novo Lead
              </Button>
            </div>
          }
        />

        <Card className="card-editorial border-dashed">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Integração Meta Ads</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Em breve: veja aqui de qual campanha cada lead veio, direto da API do Meta.
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 gap-1"><BarChart3 className="h-3 w-3" /> Em breve</Badge>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-border-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Data do evento</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                    Nenhum lead no período/filtro selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                leadsFiltrados.map((l) => {
                  const meta = statusMeta(l.statusFunil);
                  return (
                    <TableRow key={l.id} className="cursor-pointer" onClick={() => handleLeadClick(l)}>
                      <TableCell className="font-medium">{l.nome}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" /> {l.telefone}
                        </span>
                      </TableCell>
                      <TableCell>{l.tipoEvento || "—"}</TableCell>
                      <TableCell>{l.dataEvento ? new Date(l.dataEvento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell>{l.vendedorResponsavel || "—"}</TableCell>
                      <TableCell>
                        {meta && <Badge className={`${meta.colorClass} border font-medium text-xs`}>{meta.title}</Badge>}
                      </TableCell>
                      <TableCell>{new Date(l.criadoEm + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <NewLeadModal open={newLeadOpen} onClose={() => setNewLeadOpen(false)} onSave={addLead} />
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

export default MarketingLeads;
