import { useState, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Filter, CalendarCheck, ContactRound } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useDateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Lead, CrmFunnelStatus } from "@/types/comercial";
import { CrmKanbanBoard } from "@/components/crm/CrmKanbanBoard";
import { BaseClientesTab } from "@/components/crm/BaseClientesTab";
import { AgendaProvasTab } from "@/components/crm/AgendaProvasTab";
import { ClienteDetailPanel } from "@/components/crm/ClienteDetailPanel";
import { NewLeadModal } from "@/components/crm/NewLeadModal";
import { PageHeader } from "@/components/layout/PageHeader";

const CRM = () => {
  // O Kanban precisa de todos os leads — o filtro de data não é passado ao hook,
  // só é aplicado localmente nas abas Base de Clientes e Agenda de Provas.
  const {
    leads, addLead, updateLeadStatus, updateLead,
    updateMedidas, getMedidas, enviarParaComercial,
  } = useLeads();
  const { range, setRange } = useDateRange();

  const leadsNoPeriodo = useMemo(
    () => leads.filter((l) => l.criadoEm >= range.from && l.criadoEm <= range.to),
    [leads, range]
  );
  const leadsComProvaNoPeriodo = useMemo(
    () => leads.filter((l) => !!l.provaData && l.provaData >= range.from && l.provaData <= range.to),
    [leads, range]
  );

  const [activeTab, setActiveTab] = useState("funil");
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const handleEnviarComercial = (leadId: string) => {
    enviarParaComercial(leadId);
  };

  return (
    <>
    <SEO title="CRM — Més Belle" description="Gestão de leads, clientes e agenda de provas do ateliê Més Belle." path="/crm" />
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="CRM"
        description="Relacionamento, leads e agenda de provas"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <DateRangePicker value={range} onChange={setRange} />
            <Button size="sm" onClick={() => setNewLeadOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" /> Novo Lead / Cliente
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="funil"><Filter className="h-4 w-4 mr-1.5" />Funil de Captação</TabsTrigger>
          <TabsTrigger value="clientes"><ContactRound className="h-4 w-4 mr-1.5" />Base de Clientes</TabsTrigger>
          <TabsTrigger value="agenda"><CalendarCheck className="h-4 w-4 mr-1.5" />Agenda de Provas</TabsTrigger>
        </TabsList>

        <TabsContent value="funil" className="mt-4">
          <CrmKanbanBoard
            leads={leads}
            onStatusChange={handleStatusChange}
            onLeadClick={handleLeadClick}
            onEnviarComercial={handleEnviarComercial}
          />
        </TabsContent>

        <TabsContent value="clientes" className="mt-4">
          <BaseClientesTab
            leads={leadsNoPeriodo}
            onClienteClick={handleLeadClick}
            getMedidas={getMedidas}
          />
        </TabsContent>

        <TabsContent value="agenda" className="mt-4">
          <AgendaProvasTab leads={leadsComProvaNoPeriodo} onLeadClick={handleLeadClick} />
        </TabsContent>
      </Tabs>

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

export default CRM;
