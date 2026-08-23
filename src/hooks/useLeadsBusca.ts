import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeadResumo {
  id: string;
  nome: string;
  telefone: string;
  email: string;
}

// Lista enxuta de leads para o seletor "Cliente (Lead)" do dialog de
// agendamento — ao contrário de useLeads() (usado nas telas de CRM), não
// busca medidas/contratos/negócios, só o necessário pra buscar e
// pré-preencher os dados do cliente. A RLS de "leads" já escopa o retorno
// (vendedor só vê os próprios leads; admin vê todos).
export function useLeadsBusca() {
  return useQuery({
    queryKey: ["leads-busca"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, telefone, email")
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LeadResumo[];
    },
    staleTime: 60_000,
  });
}
