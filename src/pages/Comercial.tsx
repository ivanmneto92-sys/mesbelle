import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, FileText } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { FunnelStatus, Lead } from "@/types/comercial";
import { KanbanBoard } from "@/components/comercial/KanbanBoard";
import { LeadDetailPanel } from "@/components/comercial/LeadDetailPanel";
import { NewLeadModal } from "@/components/comercial/NewLeadModal";
import { MetricasTab } from "@/components/comercial/MetricasTab";
import { ContratosTab } from "@/components/comercial/ContratosTab";
import { toast } from "sonner";

const Comercial = () => {
  const {
    leads, addLead, updateLeadStatus, updateLead,
    updateMedidas, getMedidas,
    contratos, addContrato, updateContratoStatus,
    getLeadsByStatus,
  } = useLeads();

  const [activeTab, setActiveTab] = useState("kanban");
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Derive selectedLead from current leads array to avoid stale data
  const selectedLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [selectedLeadId, leads]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setDetailOpen(true);
  };

  const handleStatusChange = (leadId: string, newStatus: FunnelStatus, extra?: Partial<Lead>) => {
    updateLeadStatus(leadId, newStatus, extra);
  };

  const handleSuggestContract = (lead: Lead) => {
    toast("Criar contrato?", {
      description: `${lead.nome} chegou em Fechamento. Deseja gerar um contrato?`,
      action: {
        label: "Gerar Contrato",
        onClick: () => setActiveTab("contratos"),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif">Comercial & CRM</h1>
          <p className="text-muted-foreground text-sm">Gestão de vendas e relacionamento</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setNewLeadOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Nova Lead
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("contratos")}>
            <FileText className="h-4 w-4 mr-1" /> Contratos
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kanban">Funil de Vendas</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard
            leads={leads}
            onStatusChange={handleStatusChange}
            onLeadClick={handleLeadClick}
            onSuggestContract={handleSuggestContract}
          />
        </TabsContent>

        <TabsContent value="metricas" className="mt-4">
          <MetricasTab leads={leads} contratos={contratos} />
        </TabsContent>

        <TabsContent value="contratos" className="mt-4">
          <ContratosTab
            contratos={contratos}
            leadsParaContrato={getLeadsByStatus("fechamento")}
            onGerarContrato={addContrato}
            onUpdateStatus={updateContratoStatus}
          />
        </TabsContent>
      </Tabs>

      <NewLeadModal open={newLeadOpen} onClose={() => setNewLeadOpen(false)} onSave={addLead} />
      <LeadDetailPanel
        lead={selectedLead}
        medidas={selectedLead ? getMedidas(selectedLead.id) : undefined}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdateLead={updateLead}
        onUpdateMedidas={updateMedidas}
      />
    </div>
  );
};

export default Comercial;
