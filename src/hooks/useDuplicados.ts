import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ParDuplicado {
  leadA: string;
  leadB: string;
  motivo: string;
}

export interface VinculosLead {
  agendamentos: number;
  vendas: number;
  contratos: number;
}

/**
 * Possíveis cadastros duplicados que as travas do banco não pegam (mesmo
 * nome, mesmo número com DDD diferente) — para o admin revisar e mesclar.
 * Telefone, e-mail e CPF iguais já são impedidos pelo banco.
 */
export function useDuplicados(habilitado = true) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["leads-duplicados"],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("listar_possiveis_duplicados");
      if (error) throw error;
      const pares: ParDuplicado[] = (data ?? []).map((r) => ({ leadA: r.lead_a, leadB: r.lead_b, motivo: r.motivo }));

      // Quantos agendamentos/vendas/contratos cada cadastro tem — ajuda a
      // escolher qual manter.
      const ids = [...new Set(pares.flatMap((p) => [p.leadA, p.leadB]))];
      const vinculos: Record<string, VinculosLead> = {};
      for (const id of ids) vinculos[id] = { agendamentos: 0, vendas: 0, contratos: 0 };
      if (ids.length > 0) {
        const [ag, ng, ct] = await Promise.all([
          supabase.from("agendamentos").select("lead_id").in("lead_id", ids),
          supabase.from("negocios").select("cliente_id").in("cliente_id", ids),
          supabase.from("contratos").select("lead_id").in("lead_id", ids),
        ]);
        for (const r of ag.data ?? []) if (r.lead_id) vinculos[r.lead_id].agendamentos++;
        for (const r of ng.data ?? []) vinculos[r.cliente_id].vendas++;
        for (const r of ct.data ?? []) vinculos[r.lead_id].contratos++;
      }
      return { pares, vinculos };
    },
  });

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["leads-duplicados"] });
    qc.invalidateQueries({ queryKey: ["leads-busca"] });
  };

  const mesclar = async (manterId: string, removerId: string, dados: Record<string, string>) => {
    const { error } = await supabase.rpc("mesclar_leads", { p_manter: manterId, p_remover: removerId, p_dados: dados });
    if (error) {
      toast.error("Não foi possível mesclar: " + error.message);
      return false;
    }
    toast.success("Cadastros mesclados — agendamentos, vendas e contratos foram para o cadastro mantido.");
    recarregar();
    return true;
  };

  const marcarNaoDuplicado = async (a: string, b: string) => {
    const [leadA, leadB] = a < b ? [a, b] : [b, a];
    const { error } = await supabase.from("leads_nao_duplicados").insert({ lead_a: leadA, lead_b: leadB });
    if (error) {
      toast.error("Não foi possível marcar: " + error.message);
      return false;
    }
    recarregar();
    return true;
  };

  return {
    pares: query.data?.pares ?? [],
    vinculos: query.data?.vinculos ?? {},
    carregando: query.isLoading,
    mesclar,
    marcarNaoDuplicado,
  };
}
