import { useMemo, useCallback } from "react";
import { Lead, CrmFunnelStatus, AGENDAMENTO_KANBAN_COLUMNS } from "@/types/comercial";
import { useLeads } from "@/hooks/useLeads";

const AGENDAMENTO_STATUSES: CrmFunnelStatus[] = AGENDAMENTO_KANBAN_COLUMNS.map((c) => c.id);

export function useAgendamentos() {
  const leadsCtx = useLeads();
  const { leads, updateLeadStatus, updateLead } = leadsCtx;

  const agendamentos = useMemo(
    () => leads.filter((l) => AGENDAMENTO_STATUSES.includes(l.statusFunil)),
    [leads]
  );

  const updateStatus = useCallback(
    (leadId: string, status: CrmFunnelStatus, extra?: Partial<Lead>) => updateLeadStatus(leadId, status, extra),
    [updateLeadStatus]
  );

  const agendar = useCallback(
    (leadId: string, provaData: string, provaHora?: string) =>
      updateLeadStatus(leadId, "agendado", { provaData, provaHora }),
    [updateLeadStatus]
  );

  return { ...leadsCtx, agendamentos, updateStatus, updateLead, agendar };
}
