import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  META_GRAPH_BASE,
  META_GRAPH_API_VERSION,
  fetchAllMetaPages,
  escolherResultado,
  getPurchases,
  getPurchaseValue,
  calcularCPA,
  calcularROAS,
  buildAssetKey,
  deduplicarAssets,
  logBreakdown,
  type MetaMediaAssetInsight,
  type MetaAction,
} from "../_shared/meta.ts";

// Performance por mídia/asset individual dentro de anúncios Advantage+/
// Flexible Media. Endpoint dedicado, separado de meta-ads (que continua
// intocado) — consulta level=ad com breakdowns de asset, testados
// individualmente contra a Graph API real (nunca presumidos).
//
// Validado empiricamente em 2026-08-24 contra a conta da MesBelle:
//   image_asset                 -> suportado (sintaxe), 0 linhas no período testado (sem imagens ativas)
//   video_asset                 -> suportado, retorna vídeo individual (inclusive múltiplos vídeos por ad_id)
//   media_asset_url             -> NÃO suportado: "(#100) Current combination of data
//                                   breakdown columns (action_type, media_asset_url) is invalid"
//   media_type                  -> NÃO suportado, mesmo erro
//   flexible_format_asset_type  -> suportado, mas valor sempre "unknown" nesta conta —
//                                   não é usado como identificador de mídia (só metadado de formato)

const INSIGHTS_FIELDS =
  "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,frequency,clicks,inline_link_clicks,outbound_clicks,ctr,cpc,cpm,actions,action_values";

const BREAKDOWNS_ASSET = ["image_asset", "video_asset"] as const;
const CAPABILITIES_TTL_MS = 24 * 60 * 60 * 1000;

interface CampoAsset {
  hash?: string;
  id?: string;
  video_id?: string;
  url?: string;
  thumbnail_url?: string;
  video_name?: string;
  name?: string;
}

interface MetaInsightRow {
  campaign_id: string;
  campaign_name?: string;
  adset_id: string;
  adset_name?: string;
  ad_id: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
  date_start: string;
  date_stop: string;
  image_asset?: CampoAsset;
  video_asset?: CampoAsset;
}

function normalizarLinha(
  row: MetaInsightRow,
  breakdown: "image_asset" | "video_asset",
): MetaMediaAssetInsight {
  const campo = row[breakdown];
  const mediaType = breakdown === "image_asset" ? "IMAGE" : "VIDEO";
  const assetId = campo?.video_id ?? campo?.hash ?? campo?.id ?? null;
  const mediaUrl = campo?.url ?? null;
  const assetName = campo?.video_name ?? campo?.name ?? null;

  const spend = Number(row.spend ?? 0);
  const resultado = escolherResultado(row.actions);
  const resultadoQtd = resultado ? Number(resultado.value) || 0 : 0;
  const purchases = getPurchases(row.actions);
  const purchaseValue = getPurchaseValue(row.action_values);

  return {
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    adsetId: row.adset_id,
    adsetName: row.adset_name,
    adId: row.ad_id,
    adName: row.ad_name,
    assetKey: buildAssetKey({ adId: row.ad_id, breakdown, assetId, mediaUrl, rawValue: assetId ?? mediaUrl }),
    assetId: assetId ?? undefined,
    assetName: assetName ?? undefined,
    mediaUrl: mediaUrl ?? undefined,
    thumbnailUrl: campo?.thumbnail_url ?? undefined,
    mediaType,
    sourceBreakdown: breakdown,
    spend,
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    ctr: Number(row.ctr ?? 0),
    cpc: Number(row.cpc ?? 0),
    cpm: Number(row.cpm ?? 0),
    resultadoTipo: resultado?.action_type ?? null,
    resultadoQtd,
    custoPorResultado: calcularCPA(spend, resultadoQtd),
    purchases,
    purchaseValue,
    roas: calcularROAS(purchaseValue, spend),
    dateStart: row.date_start,
    dateStop: row.date_stop,
  };
}

function buildFiltering(campaignId?: string, adsetId?: string, adId?: string): string | null {
  const filtros: Record<string, unknown>[] = [];
  if (adId) filtros.push({ field: "ad.id", operator: "IN", value: [adId] });
  else if (adsetId) filtros.push({ field: "adset.id", operator: "IN", value: [adsetId] });
  else if (campaignId) filtros.push({ field: "campaign.id", operator: "IN", value: [campaignId] });
  return filtros.length > 0 ? JSON.stringify(filtros) : null;
}

function buildInsightsUrl(opts: {
  adAccountId: string;
  token: string;
  breakdown?: string;
  from: string;
  to: string;
  filtering?: string | null;
  limit?: number;
}): string {
  const params = new URLSearchParams({
    level: "ad",
    fields: INSIGHTS_FIELDS,
    time_range: JSON.stringify({ since: opts.from, until: opts.to }),
    limit: String(opts.limit ?? 200),
    access_token: opts.token,
  });
  if (opts.breakdown) params.set("breakdowns", opts.breakdown);
  if (opts.filtering) params.set("filtering", opts.filtering);
  return `${META_GRAPH_BASE}/${opts.adAccountId}/insights?${params.toString()}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !caller) return json({ error: "Token inválido" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!callerRole) return json({ error: "Apenas administradores podem ver o Meta Ads" }, 403);

    const { data: creds, error: credsErr } = await adminClient.rpc("_get_meta_credentials").single();
    if (credsErr || !creds?.access_token || !creds?.ad_account_id) {
      return json({ error: "Meta Ads não configurado (faltam credenciais nos secrets)" }, 500);
    }
    const { access_token: token, ad_account_id: adAccountId } = creds as { access_token: string; ad_account_id: string };

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const from = body?.from as string | undefined;
    const to = body?.to as string | undefined;
    if (!from || !to) return json({ error: "from e to são obrigatórios" }, 400);
    const campaignId = body?.campaignId as string | undefined;
    const adsetId = body?.adsetId as string | undefined;
    const adId = body?.adId as string | undefined;
    const debug = body?.debug === true;
    const filtering = buildFiltering(campaignId, adsetId, adId);

    // ── Modo debug: testa os 5 breakdowns individualmente e reporta suporte,
    //    sem misturar com o fluxo normal (Fase 23/39). Não escreve no cache.
    if (debug) {
      const breakdownsTeste = ["image_asset", "video_asset", "media_asset_url", "flexible_format_asset_type", "media_type"];
      const resultado: Record<string, unknown> = {};
      for (const bd of breakdownsTeste) {
        const url = buildInsightsUrl({ adAccountId, token, breakdown: bd, from, to, filtering, limit: 5 });
        const res = await fetch(url);
        const respBody = await res.json();
        const supported = res.ok;
        logBreakdown(adAccountId, bd, supported ? "SUPPORTED" : "UNSUPPORTED", {
          status: res.status,
          error: respBody?.error ?? null,
        });
        resultado[bd] = {
          supported,
          rowCount: Array.isArray(respBody?.data) ? respBody.data.length : 0,
          error: respBody?.error ?? null,
        };
      }
      return json({ graphApiVersion: META_GRAPH_API_VERSION, adAccountId, from, to, adId: adId ?? null, breakdowns: resultado });
    }

    // ── Capabilities cache (Fase 19) ──────────────────────────────────────
    const { data: cacheRow } = await adminClient
      .from("meta_breakdown_capabilities")
      .select("*")
      .eq("ad_account_id", adAccountId)
      .maybeSingle();

    let capabilities = cacheRow;
    const cacheExpirado = !cacheRow || Date.now() - new Date(cacheRow.tested_at).getTime() > CAPABILITIES_TTL_MS;

    if (cacheExpirado) {
      const detalhes: Record<string, unknown> = {};
      const novasCapabilities: Record<string, boolean> = {};
      for (const bd of ["image_asset", "video_asset", "media_asset_url", "flexible_format_asset_type", "media_type"]) {
        const url = buildInsightsUrl({ adAccountId, token, breakdown: bd, from, to, limit: 1 });
        const res = await fetch(url);
        const respBody = await res.json();
        const supported = res.ok;
        novasCapabilities[bd] = supported;
        detalhes[bd] = { status: res.status, error: respBody?.error ?? null };
        logBreakdown(adAccountId, bd, supported ? "SUPPORTED" : "UNSUPPORTED", detalhes[bd]);
      }
      const { data: upserted } = await adminClient
        .from("meta_breakdown_capabilities")
        .upsert({ ad_account_id: adAccountId, ...novasCapabilities, detalhes, tested_at: new Date().toISOString() })
        .select()
        .single();
      capabilities = upserted;
    }

    // ── Busca real: image_asset + video_asset (não se sobrepõem, ambos usados
    //    quando suportados). media_asset_url/media_type/flexible_format_asset_type
    //    ficam de fora — não suportados ou não identificam mídia individual
    //    nesta conta, conforme validado.
    const breakdownsParaUsar = BREAKDOWNS_ASSET.filter((bd) => capabilities?.[bd] !== false);

    let assets: MetaMediaAssetInsight[] = [];
    const breakdownsUsados: string[] = [];
    const errosBreakdown: Record<string, unknown> = {};

    for (const bd of breakdownsParaUsar) {
      const url = buildInsightsUrl({ adAccountId, token, breakdown: bd, from, to, filtering });
      const { rows, error } = await fetchAllMetaPages<MetaInsightRow>(url);
      if (error) {
        errosBreakdown[bd] = error;
        logBreakdown(adAccountId, bd, "UNSUPPORTED", error);
        continue;
      }
      breakdownsUsados.push(bd);
      assets.push(...rows.map((r) => normalizarLinha(r, bd)));
    }

    assets = deduplicarAssets(assets);

    // ── Fallback: nenhuma granularidade de mídia disponível para o escopo
    //    pedido -> devolve consolidado no nível de anúncio (Fase 14/15).
    if (assets.length === 0) {
      const urlConsolidado = buildInsightsUrl({ adAccountId, token, from, to, filtering });
      const { rows: consolidado, error } = await fetchAllMetaPages<MetaInsightRow>(urlConsolidado);
      if (error) return json({ error: error.message }, 502);

      const adsConsolidados = consolidado.map((row) => {
        const spend = Number(row.spend ?? 0);
        const resultado = escolherResultado(row.actions);
        const resultadoQtd = resultado ? Number(resultado.value) || 0 : 0;
        return {
          campaignId: row.campaign_id,
          campaignName: row.campaign_name,
          adsetId: row.adset_id,
          adsetName: row.adset_name,
          adId: row.ad_id,
          adName: row.ad_name,
          spend,
          impressions: Number(row.impressions ?? 0),
          clicks: Number(row.clicks ?? 0),
          resultadoTipo: resultado?.action_type ?? null,
          resultadoQtd,
          custoPorResultado: calcularCPA(spend, resultadoQtd),
          purchases: getPurchases(row.actions),
          purchaseValue: getPurchaseValue(row.action_values),
        };
      });

      return json({
        graphApiVersion: META_GRAPH_API_VERSION,
        granularity: "AD",
        individualAttributionAvailable: false,
        breakdownsTestados: Object.keys(capabilities ?? {}).filter((k) => k !== "ad_account_id" && k !== "tested_at" && k !== "detalhes"),
        breakdownsUsados: [],
        erros: errosBreakdown,
        ads: adsConsolidados,
        periodo: { from, to },
      });
    }

    return json({
      graphApiVersion: META_GRAPH_API_VERSION,
      granularity: "MEDIA",
      individualAttributionAvailable: true,
      breakdownsTestados: Object.keys(capabilities ?? {}).filter((k) => k !== "ad_account_id" && k !== "tested_at" && k !== "detalhes"),
      breakdownsUsados,
      erros: errosBreakdown,
      assets,
      periodo: { from, to },
    });
  } catch (err) {
    console.error("[meta-media-insights]", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
