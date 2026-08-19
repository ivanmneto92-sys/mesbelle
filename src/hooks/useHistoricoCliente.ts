import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLeads } from "@/hooks/useLeads";
import { rowToTransacao } from "@/hooks/useFinanceiro";

export function useHistoricoCliente(leadId: string | null) {
  const { leads, negocios, contratos } = useLeads();

  const lead = useMemo(() => leads.find((l) => l.id === leadId) ?? null, [leads, leadId]);
  const negociosCliente = useMemo(() => negocios.filter((n) => n.clienteId === leadId), [negocios, leadId]);
  const contratosCliente = useMemo(() => contratos.filter((c) => c.leadId === leadId), [contratos, leadId]);

  const { data: transacoes = [] } = useQuery({
    queryKey: ["transacoes_historico", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .eq("lead_id", leadId!)
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToTransacao);
    },
  });

  const totalPago = transacoes.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const qtdNegocios = negociosCliente.length;
  const qtdContratos = contratosCliente.length;
  const ticketMedio = qtdNegocios > 0 ? totalPago / qtdNegocios : 0;

  return {
    lead,
    negocios: negociosCliente,
    contratos: contratosCliente,
    transacoes,
    totalPago,
    qtdNegocios,
    qtdContratos,
    ticketMedio,
  };
}
