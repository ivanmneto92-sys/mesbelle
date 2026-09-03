// Envia por e-mail, automaticamente, a confirmação do contrato assinado para
// a cliente — chamada pela página pública de assinatura (/assinar/:token)
// logo após "assinar_contrato_publico" ter sucesso. Não há sessão de usuário
// nessa página (é pública, sem login), então a autorização aqui é feita pelo
// mesmo signing_token usado para assinar, validado com service role — nunca
// confiando em nenhum dado enviado pelo client além do token.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail, templateBase, botaoCTA } from "../_shared/resend.ts";

function escapeHtml(valor: unknown): string {
  return String(valor ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token) return json({ error: "token é obrigatório" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: contrato, error } = await supabase
      .from("contratos")
      .select("id, numero, nome_cliente, email_cliente, valor_total, data_evento, status_assinatura, email_enviado_em")
      .eq("signing_token", token)
      .maybeSingle();

    if (error || !contrato) return json({ error: "contrato não encontrado" }, 404);
    if (contrato.status_assinatura !== "assinado") return json({ error: "contrato ainda não assinado" }, 400);
    if (contrato.email_enviado_em) return json({ ok: true, skipped: "ja_enviado" });
    if (!contrato.email_cliente?.trim()) return json({ ok: true, skipped: "sem_email" });

    const valorFmt = Number(contrato.valor_total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const dataEventoFmt = contrato.data_evento
      ? new Date(`${contrato.data_evento}T00:00:00`).toLocaleDateString("pt-BR")
      : "—";
    const linkContrato = `${Deno.env.get("SITE_URL") ?? "https://mesbelle.com.br"}/assinar/${token}`;

    const html = templateBase(`
      <h2 style="color:#4a1535;font-size:20px;margin:0 0 16px;">
        ✅ Seu contrato foi assinado com sucesso!
      </h2>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Olá, <strong>${escapeHtml(contrato.nome_cliente)}</strong>. Segue a confirmação do seu contrato de locação
        <strong>#${escapeHtml(contrato.numero)}</strong> com a Més Belle.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
        <tr style="background:#f9f5f1;">
          <td style="padding:10px 12px;color:#6b7280;">Contrato</td>
          <td style="padding:10px 12px;font-weight:600;color:#111827;">#${escapeHtml(contrato.numero)}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#6b7280;">Data do evento</td>
          <td style="padding:10px 12px;font-weight:600;color:#111827;">${escapeHtml(dataEventoFmt)}</td>
        </tr>
        <tr style="background:#f9f5f1;">
          <td style="padding:10px 12px;color:#6b7280;">Valor</td>
          <td style="padding:10px 12px;font-weight:600;color:#4a1535;">${escapeHtml(valorFmt)}</td>
        </tr>
      </table>
      ${botaoCTA("Ver contrato e baixar o PDF", linkContrato)}
      <p style="color:#9ca3af;font-size:13px;margin:16px 0 0;">
        Guarde este e-mail — o link acima leva você de volta ao contrato assinado, de onde é possível baixar o PDF a qualquer momento.
      </p>
    `);

    await enviarEmail({
      para: contrato.email_cliente,
      assunto: `Contrato assinado — Més Belle #${contrato.numero}`,
      html,
    });

    await supabase.from("contratos").update({ email_enviado_em: new Date().toISOString() }).eq("id", contrato.id);

    return json({ ok: true });
  } catch (err) {
    console.error("[enviar-contrato-cliente]", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
