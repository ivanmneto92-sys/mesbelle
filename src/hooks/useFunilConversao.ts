import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DateRange } from "@/hooks/useDateRange";

export interface FunilConversaoData {
  volumeAgendamento: number;
  totalClientes: number;
}

// Dados reais do site (fora do Meta Ads) para cruzar com o gasto/resultados
// de anúncios: volume de agendamentos marcados e clientes fechados no mesmo
// período. Não há hoje UTM/campanha vinculada a lead ou agendamento no schema
// — é uma leitura agregada do período, não atribuição por lead individual.
export function useFunilConversao(range: DateRange) {
  return useQuery({
    queryKey: ["funil-conversao", range.from, range.to],
    queryFn: async (): Promise<FunilConversaoData> => {
      const desde = `${range.from}T00:00:00`;
      const ate = `${range.to}T23:59:59`;

      const [agendamentosRes, negociosRes] = await Promise.all([
        supabase
          .from("agendamentos")
          .select("id", { count: "exact", head: true })
          .gte("data_hora", desde)
          .lte("data_hora", ate)
          .neq("status", "cancelada"),
        supabase
          .from("negocios")
          .select("id", { count: "exact", head: true })
          .eq("status_negociacao", "aprovado")
          .gte("criado_em", range.from)
          .lte("criado_em", range.to),
      ]);

      if (agendamentosRes.error) throw agendamentosRes.error;
      if (negociosRes.error) throw negociosRes.error;

      return {
        volumeAgendamento: agendamentosRes.count ?? 0,
        totalClientes: negociosRes.count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
