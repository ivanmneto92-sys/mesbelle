import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DateRange } from "@/hooks/useDateRange";

export interface MetaMediaAsset {
  campaignId: string;
  campaignName?: string;
  adsetId: string;
  adsetName?: string;
  adId: string;
  adName?: string;
  assetKey: string;
  assetId?: string;
  assetName?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mediaType: "IMAGE" | "VIDEO" | "UNKNOWN";
  sourceBreakdown: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  resultadoTipo: string | null;
  resultadoQtd: number;
  custoPorResultado: number | null;
  purchases: number;
  purchaseValue: number;
  roas: number | null;
  dateStart: string;
  dateStop: string;
}

export interface MetaAdConsolidado {
  campaignId: string;
  campaignName?: string;
  adsetId: string;
  adsetName?: string;
  adId: string;
  adName?: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  resultadoTipo: string | null;
  resultadoQtd: number;
  custoPorResultado: number | null;
  purchases: number;
  purchaseValue: number;
  roas: number | null;
}

export type MetaMediaInsightsData =
  | {
      graphApiVersion: string;
      granularity: "MEDIA";
      individualAttributionAvailable: true;
      breakdownsTestados: string[];
      breakdownsUsados: string[];
      erros: Record<string, unknown>;
      assets: MetaMediaAsset[];
      periodo: { from: string; to: string };
    }
  | {
      graphApiVersion: string;
      granularity: "AD";
      individualAttributionAvailable: false;
      breakdownsTestados: string[];
      breakdownsUsados: string[];
      erros: Record<string, unknown>;
      ads: MetaAdConsolidado[];
      periodo: { from: string; to: string };
    };

async function extrairMensagemErro(error: unknown): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    const body = await context.clone().json().catch(() => null);
    if (body?.error) return body.error as string;
  }
  return error instanceof Error ? error.message : "Erro ao carregar performance por mídia";
}

export function useMetaMediaInsights(range: DateRange, filtros?: { campaignId?: string; adsetId?: string; adId?: string }) {
  return useQuery({
    queryKey: ["meta-media-insights", range.from, range.to, filtros?.campaignId, filtros?.adsetId, filtros?.adId],
    queryFn: async (): Promise<MetaMediaInsightsData> => {
      const { data, error } = await supabase.functions.invoke<MetaMediaInsightsData>("meta-media-insights", {
        body: { from: range.from, to: range.to, ...filtros },
      });
      if (error) throw new Error(await extrairMensagemErro(error));
      if (!data) throw new Error("Resposta vazia da performance por mídia");
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
