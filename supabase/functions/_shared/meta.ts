// Utilitários compartilhados para integração com a Meta Marketing API.
// Usado por meta-media-insights (e, futuramente, por meta-ads se quisermos
// consolidar — hoje meta-ads permanece intocado de propósito).

export const META_GRAPH_API_VERSION = "v26.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

// ── Tipos ────────────────────────────────────────────────────────────────

export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaErrorBody {
  error?: {
    message: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
}

export type AssetGranularity = "MEDIA" | "FORMAT" | "AD";

export interface MetaMediaAssetInsight {
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
  sourceBreakdown: "image_asset" | "video_asset" | "flexible_format_asset_type" | "unknown";
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

// ── Log estruturado (sem nunca logar token) ─────────────────────────────

export function logBreakdown(accountId: string, breakdown: string, status: "SUPPORTED" | "UNSUPPORTED", detail: unknown) {
  console.log(`[META_ASSET_INSIGHTS] account=${accountId} breakdown=${breakdown} status=${status}`, JSON.stringify(detail));
}

// ── Paginação ────────────────────────────────────────────────────────────

const MAX_PAGES = 20; // trava de segurança — evita loop infinito

export async function fetchAllMetaPages<T>(firstUrl: string): Promise<{ rows: T[]; error: MetaErrorBody["error"] | null }> {
  const rows: T[] = [];
  let url: string | null = firstUrl;
  let pages = 0;

  while (url && pages < MAX_PAGES) {
    pages++;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      return { rows, error: { message: `Falha de rede: ${String(err)}` } };
    }
    const body = await res.json();
    if (!res.ok) {
      return { rows, error: (body as MetaErrorBody)?.error ?? { message: `HTTP ${res.status}` } };
    }
    if (Array.isArray(body?.data)) rows.push(...(body.data as T[]));
    url = body?.paging?.next ?? null;
  }
  return { rows, error: null };
}

// ── Normalizadores de Purchase / Revenue / CPA / ROAS ───────────────────
// A conta MesBelle vende por WhatsApp, não checkout — não há action_type de
// "purchase" nas campanhas atuais. Mantemos a MESMA heurística de "resultado
// principal" já usada em meta-ads/index.ts, para consistência entre as duas
// telas. Se a conta um dia tiver Purchase de verdade, PURCHASE_ACTION_TYPES
// cobre isso automaticamente.

const PURCHASE_ACTION_TYPES = ["purchase", "omni_purchase", "onsite_web_purchase", "offsite_conversion.fb_pixel_purchase"];

const PRIORIDADE_RESULTADO = [
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.messaging_first_reply",
  "lead",
  "onsite_conversion.lead_grouped",
  "link_click",
];

export function getPurchases(actions?: MetaAction[]): number {
  if (!actions) return 0;
  // Soma só o primeiro action_type de purchase encontrado (nunca soma vários
  // tipos de purchase juntos — evita duplicidade, conforme Fase 8).
  for (const tipo of PURCHASE_ACTION_TYPES) {
    const encontrado = actions.find((a) => a.action_type === tipo);
    if (encontrado) return Number(encontrado.value) || 0;
  }
  return 0;
}

export function getPurchaseValue(actionValues?: MetaAction[]): number {
  if (!actionValues) return 0;
  for (const tipo of PURCHASE_ACTION_TYPES) {
    const encontrado = actionValues.find((a) => a.action_type === tipo);
    if (encontrado) return Number(encontrado.value) || 0;
  }
  return 0;
}

export function escolherResultado(actions?: MetaAction[]): MetaAction | null {
  if (!actions || actions.length === 0) return null;
  for (const tipo of PRIORIDADE_RESULTADO) {
    const encontrado = actions.find((a) => a.action_type === tipo);
    if (encontrado) return encontrado;
  }
  return actions[0];
}

export function calcularCPA(spend: number, resultados: number): number | null {
  if (!resultados || resultados <= 0) return null;
  const cpa = spend / resultados;
  return Number.isFinite(cpa) ? cpa : null;
}

export function calcularROAS(purchaseValue: number, spend: number): number | null {
  if (!spend || spend <= 0) return null;
  if (!purchaseValue || purchaseValue <= 0) return null;
  const roas = purchaseValue / spend;
  return Number.isFinite(roas) ? roas : null;
}

// ── Asset key (identificador estável, evita duplicação) ─────────────────
// Prioridade: id estável do asset > url > valor cru do breakdown > fallback ad+breakdown

export function buildAssetKey(opts: {
  adId: string;
  breakdown: string;
  assetId?: string | null;
  mediaUrl?: string | null;
  rawValue?: string | null;
}): string {
  if (opts.assetId) return `asset:${opts.assetId}`;
  if (opts.mediaUrl) return `url:${opts.mediaUrl}`;
  if (opts.rawValue) return `raw:${opts.breakdown}:${opts.rawValue}`;
  return `ad:${opts.adId}:${opts.breakdown}`;
}

// ── Deduplicação ─────────────────────────────────────────────────────────
// image_asset e video_asset nunca se sobrepõem (uma mídia é imagem OU vídeo),
// então não há duplicidade real entre elas nesta conta. Ainda assim,
// deduplicamos por assetKey para sermos robustos a qualquer sobreposição
// futura (ex: se media_asset_url um dia passar a ser suportado).
export function deduplicarAssets(rows: MetaMediaAssetInsight[]): MetaMediaAssetInsight[] {
  const porChave = new Map<string, MetaMediaAssetInsight>();
  for (const row of rows) {
    if (!porChave.has(row.assetKey)) porChave.set(row.assetKey, row);
  }
  return Array.from(porChave.values());
}
