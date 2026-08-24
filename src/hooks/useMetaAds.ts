import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DateRange } from "@/hooks/useDateRange";

export interface MetaCampanha {
  id: string;
  nome: string;
  status: string;
  objetivo: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  cpc: number;
  cpm: number;
  alcance: number;
  frequencia: number;
  resultadoTipo: string | null;
  resultadoQtd: number;
  custoPorResultado: number | null;
}

export interface MetaAdsData {
  conta: {
    nome: string;
    status: number;
    moeda: string;
    timezone: string;
    gastoTotalHistorico: number;
  };
  periodo: { from: string; to: string } | { preset: string };
  totais: {
    gasto: number;
    impressoes: number;
    cliques: number;
    resultados: number;
    ctrMedio: number;
    custoPorResultadoMedio: number | null;
  };
  campanhas: MetaCampanha[];
  atualizadoEm: string;
}

async function extrairMensagemErro(error: unknown): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    const body = await context.clone().json().catch(() => null);
    if (body?.error) return body.error as string;
  }
  return error instanceof Error ? error.message : "Erro ao carregar Meta Ads";
}

export function useMetaAds(range: DateRange) {
  return useQuery({
    queryKey: ["meta-ads", range.from, range.to],
    queryFn: async (): Promise<MetaAdsData> => {
      const { data, error } = await supabase.functions.invoke<MetaAdsData>("meta-ads", {
        body: { from: range.from, to: range.to },
      });
      if (error) throw new Error(await extrairMensagemErro(error));
      if (!data) throw new Error("Resposta vazia do Meta Ads");
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
