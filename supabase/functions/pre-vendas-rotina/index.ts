// Rotina de hora em hora (pg_cron) das vendas aguardando assinatura:
//  1. expira as pré-vendas com mais de 48h sem assinatura (libera a peça,
//     cancela o contrato) e avisa admins + vendedora;
//  2. manda à cliente um lembrete do link de assinatura quando a venda está
//     parada há 24h (uma vez só por contrato).
// Como o relatório diário, só aceita a service role key no Authorization.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  enviarEmail, templateBase, botaoCTA, escapeHtml, formatBRL, formatDataHoraBR, emailsDosAdmins, emailDoUsuario,
} from "../_shared/resend.ts";

interface Expirada {
  negocio_id: string;
  cliente_nome: string;
  vestido_nome: string | null;
  vendedor_id: string | null;
  valor: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "Não autorizado" }, 401);
  }

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://mesbelle.com.br";
    const erros: string[] = [];

    // ── 1. Expiração ─────────────────────────────────────────────────────────
    const { data: expiradasRaw, error: expErr } = await admin.rpc("expirar_pre_vendas");
    if (expErr) throw expErr;
    const expiradas = (expiradasRaw ?? []) as Expirada[];

    if (expiradas.length > 0) {
      const admins = await emailsDosAdmins(admin);
      const porDestinatario = new Map<string, Expirada[]>();
      for (const e of expiradas) {
        const destinos = new Set(admins);
        const vend = await emailDoUsuario(admin, e.vendedor_id);
        if (vend) destinos.add(vend);
        for (const d of destinos) porDestinatario.set(d, [...(porDestinatario.get(d) ?? []), e]);
      }
      for (const [para, lista] of porDestinatario) {
        const linhas = lista.map((e) => `
          <tr><td style="padding:8px 0;border-bottom:1px solid #f0e6f0;font-size:14px;">
            <strong>${escapeHtml(e.cliente_nome)}</strong>${e.vestido_nome ? ` · ${escapeHtml(e.vestido_nome)}` : ""}
            <span style="color:#6b7280;"> · ${escapeHtml(formatBRL(e.valor))}</span>
          </td></tr>`).join("");
        try {
          await enviarEmail({
            para,
            assunto: `⏰ ${lista.length} venda(s) expirada(s) sem assinatura do contrato`,
            html: templateBase(`
              <h2 style="color:#4a1535;font-size:20px;margin:0 0 12px;">Venda expirada sem assinatura</h2>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
                O contrato não foi assinado em 48h. A reserva da peça foi liberada e o contrato cancelado.
                Se a cliente ainda quiser alugar, registre a venda de novo.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">${linhas}</table>
              ${botaoCTA("Abrir contratos", `${siteUrl}/comercial/contratos`)}`),
          });
        } catch (err) {
          erros.push(`expiração → ${para}: ${err instanceof Error ? err.message : err}`);
        }
      }
    }

    // ── 2. Lembrete de 24h para a cliente ───────────────────────────────────
    const limite24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: aguardando } = await admin
      .from("negocios")
      .select("id, reserva_expira_em")
      .eq("status_negociacao", "aguardando_assinatura")
      .lte("created_at", limite24h);
    const negocioIds = (aguardando ?? []).map((n) => n.id);
    const expiraPorNegocio = new Map((aguardando ?? []).map((n) => [n.id, n.reserva_expira_em as string | null]));

    let lembretes = 0;
    if (negocioIds.length > 0) {
      const { data: contratos } = await admin
        .from("contratos")
        .select("id, numero, nome_cliente, email_cliente, signing_token, token_expires_at, negocio_id")
        .in("negocio_id", negocioIds)
        .eq("status_assinatura", "pendente")
        .is("lembrete_enviado_em", null);
      for (const c of contratos ?? []) {
        if (!c.email_cliente?.trim() || !c.signing_token) continue;
        if (c.token_expires_at && new Date(c.token_expires_at) <= new Date()) continue;
        try {
          await enviarEmail({
            para: c.email_cliente.trim(),
            assunto: `Lembrete: falta assinar seu contrato — Més Belle #${c.numero}`,
            html: templateBase(`
              <h2 style="color:#4a1535;font-size:20px;margin:0 0 16px;">Falta só a sua assinatura 💖</h2>
              <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Olá, <strong>${escapeHtml(c.nome_cliente)}</strong>! Seu contrato <strong>#${escapeHtml(c.numero)}</strong>
                ainda está aguardando assinatura. A reserva da sua peça está garantida até
                <strong>${escapeHtml(formatDataHoraBR(expiraPorNegocio.get(c.negocio_id) ?? c.token_expires_at))}</strong> —
                depois disso ela é liberada.
              </p>
              ${botaoCTA("Ler e assinar o contrato", `${siteUrl}/assinar/${c.signing_token}`)}`),
          });
          await admin.from("contratos").update({ lembrete_enviado_em: new Date().toISOString() }).eq("id", c.id);
          lembretes++;
        } catch (err) {
          erros.push(`lembrete #${c.numero}: ${err instanceof Error ? err.message : err}`);
        }
      }
    }

    console.log(`[pre-vendas-rotina] expiradas=${expiradas.length} lembretes=${lembretes} erros=${erros.length}`);
    return json({ ok: erros.length === 0, expiradas: expiradas.length, lembretes, erros: erros.length ? erros : undefined });
  } catch (err) {
    console.error("[pre-vendas-rotina] erro:", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
