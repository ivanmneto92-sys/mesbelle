import { useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import { Kanban } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { Lead } from "@/types/comercial";
import { AgendamentoKanbanBoard } from "@/components/agendamento/AgendamentoKanbanBoard";
import { ClienteDetailPanel } from "@/components/crm/ClienteDetailPanel";

const ComercialKanban = () => {
  const {
    agendamentos, updateStatus, updateLead,
    updateMedidas, getMedidas, enviarParaComercial,
  } = useAgendamentos();

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const selectedLead = useMemo(
    () => agendamentos.find((l) => l.id === selectedLeadId) ?? null,
    [selectedLeadId, agendamentos]
  );

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setDetailOpen(true);
  };

  return (
    <>
      <SEO title="Kanban Comercial — Més Belle" description="Quadro de agendamentos, comparecimento e conversão." path="/comercial/kanban" />
      <div className="space-y-6">
        <PageHeader icon={Kanban} title="Kanban" description="Arraste os cards para atualizar o status do agendamento" />

        <AgendamentoKanbanBoard
          leads={agendamentos}
          onStatusChange={updateStatus}
          onLeadClick={handleLeadClick}
          onEnviarComercial={enviarParaComercial}
        />

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

export default ComercialKanban;
