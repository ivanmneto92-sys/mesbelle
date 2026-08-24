import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Busca campanhas + insights (gasto, resultados, custo por resultado) da
// conta de anúncios Meta Ads configurada nos secrets do projeto (Vault:
// META_ACCESS_TOKEN, META_AD_ACCOUNT_ID — token de usuário do sistema,
// nunca expira). Só admin pode chamar. Versão da Graph API confirmada ao
// vivo em 2026-08-24: v26.0.
const GRAPH_VERSION = "v26.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaInsight {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  reach?: string;
  frequency?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  insights?: { data: MetaInsight[] };
}

// Heurística de "resultado principal": prioriza conversas iniciadas no
// WhatsApp/Messenger (o objetivo real das campanhas da MesBelle), depois
// leads, depois qualquer outra ação disponível.
const PRIORIDADE_ACAO = [
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.messaging_first_reply",
  "lead",
  "onsite_conversion.lead_grouped",
  "link_click",
];

function escolherResultado(actions?: MetaAction[]): MetaAction | null {
  if (!actions || actions.length === 0) return null;
  for (const tipo of PRIORIDADE_ACAO) {
    const encontrado = actions.find((a) => a.action_type === tipo);
    if (encontrado) return encontrado;
  }
  return actions[0];
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

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
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

    const reqBody = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const from = reqBody?.from as string | undefined;
    const to = reqBody?.to as string | undefined;
    const insightsScope = from && to
      ? `insights.time_range(${JSON.stringify({ since: from, until: to })})`
      : `insights.date_preset(last_30d)`;

    const contaRes = await fetch(
      `${GRAPH_BASE}/${adAccountId}?fields=name,account_status,currency,timezone_name,amount_spent&access_token=${encodeURIComponent(token)}`,
    );
    const contaBody = await contaRes.json();
    if (!contaRes.ok) {
      return json({ error: contaBody?.error?.message ?? "Erro ao consultar conta Meta Ads" }, 502);
    }

    const insightsFields = "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type";
    const campanhasRes = await fetch(
      `${GRAPH_BASE}/${adAccountId}/campaigns` +
        `?fields=${encodeURIComponent(`id,name,status,objective,${insightsScope}{${insightsFields}}`)}` +
        `&limit=100&access_token=${encodeURIComponent(token)}`,
    );
    const campanhasBody = await campanhasRes.json();
    if (!campanhasRes.ok) {
      return json({ error: campanhasBody?.error?.message ?? "Erro ao consultar campanhas" }, 502);
    }

    const campanhas = ((campanhasBody.data ?? []) as MetaCampaign[]).map((c) => {
      const insight = c.insights?.data?.[0];
      const resultado = escolherResultado(insight?.actions);
      const resultadoValor = resultado ? Number(resultado.value) : 0;
      const spend = Number(insight?.spend ?? 0);
      const custoPorResultadoMeta = insight?.cost_per_action_type?.find(
        (a) => a.action_type === resultado?.action_type,
      );
      return {
        id: c.id,
        nome: c.name,
        status: c.status,
        objetivo: c.objective,
        gasto: spend,
        impressoes: Number(insight?.impressions ?? 0),
        cliques: Number(insight?.clicks ?? 0),
        ctr: Number(insight?.ctr ?? 0),
        cpc: Number(insight?.cpc ?? 0),
        cpm: Number(insight?.cpm ?? 0),
        alcance: Number(insight?.reach ?? 0),
        frequencia: Number(insight?.frequency ?? 0),
        resultadoTipo: resultado?.action_type ?? null,
        resultadoQtd: resultadoValor,
        custoPorResultado: custoPorResultadoMeta
          ? Number(custoPorResultadoMeta.value)
          : resultadoValor > 0
            ? spend / resultadoValor
            : null,
      };
    });

    const totais = campanhas.reduce(
      (acc, c) => {
        acc.gasto += c.gasto;
        acc.impressoes += c.impressoes;
        acc.cliques += c.cliques;
        acc.resultados += c.resultadoQtd;
        return acc;
      },
      { gasto: 0, impressoes: 0, cliques: 0, resultados: 0 },
    );

    return json({
      conta: {
        nome: contaBody.name,
        status: contaBody.account_status,
        moeda: contaBody.currency,
        timezone: contaBody.timezone_name,
        gastoTotalHistorico: Number(contaBody.amount_spent ?? 0),
      },
      periodo: from && to ? { from, to } : { preset: "last_30d" },
      totais: {
        ...totais,
        ctrMedio: totais.impressoes > 0 ? (totais.cliques / totais.impressoes) * 100 : 0,
        custoPorResultadoMedio: totais.resultados > 0 ? totais.gasto / totais.resultados : null,
      },
      campanhas,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[meta-ads]", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
