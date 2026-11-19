// Confirmação do contrato assinado — para a cliente e para a mesbelle
// (admins + vendedora da venda).
//
// Chamada de dois lugares:
//  * página pública /assinar/:token, logo depois de assinar_contrato_publico
//    → body { token }. Não há sessão de usuário; a autorização é o próprio
//    token, validado aqui com service role;
//  * assinatura presencial (iPad na loja) → body { contrato_id }, com o JWT
//    de quem coletou a assinatura (precisa poder escrever no CRM).
//
// Antes: a assinatura no iPad não mandava e-mail nenhum, e os admins só eram
// avisados se o e-mail da cliente existisse e saísse sem erro.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  enviarEmail, templateBase, botaoCTA, escapeHtml, formatBRL, emailsDosAdmins, emailDoUsuario,
} from "../_shared/resend.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { token, contrato_id } = (await req.json()) as { token?: string; contrato_id?: string };
    if (!token && !contrato_id) return json({ error: "token ou contrato_id é obrigatório" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (!token) {
      // Assinatura presencial: exige usuário logado com acesso ao CRM.
      const authHeader = req.headers.get("Authorization") ?? "";
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) return json({ error: "não autenticado" }, 401);
      const { data: pode } = await supabase.rpc("can_write_crm", { _user_id: userData.user.id });
      if (!pode) return json({ error: "sem permissão" }, 403);
    }

    const query = supabase
      .from("contratos")
      .select("id, numero, nome_cliente, email_cliente, valor_total, data_evento, status_assinatura, email_enviado_em, signing_token, vendedor_id");
    const { data: contrato, error } = token
      ? await query.eq("signing_token", token).maybeSingle()
      : await query.eq("id", contrato_id!).maybeSingle();

    if (error || !contrato) return json({ error: "contrato não encontrado" }, 404);
    if (contrato.status_assinatura !== "assinado") return json({ error: "contrato ainda não assinado" }, 400);
    if (contrato.email_enviado_em) return json({ ok: true, skipped: "ja_enviado" });

    // Contrato assinado na loja sem link: cria um link permanente só para a
    // cliente ver o contrato e baixar o PDF.
    let linkToken = contrato.signing_token as string | null;
    if (!linkToken) {
      linkToken = crypto.randomUUID();
      await supabase.from("contratos").update({ signing_token: linkToken, token_expires_at: null }).eq("id", contrato.id);
    }

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://mesbelle.com.br";
    const linkContrato = `${siteUrl}/assinar/${linkToken}`;
    const valorFmt = formatBRL(Number(contrato.valor_total));
    const dataEventoFmt = /^\d{4}-\d{2}-\d{2}$/.test(contrato.data_evento ?? "")
      ? new Date(`${contrato.data_evento}T12:00:00`).toLocaleDateString("pt-BR")
      : "—";

    const tabela = `
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
      </table>`;

    const resultado: Record<string, unknown> = {};

    // 1. Cliente (se tiver e-mail). Uma falha aqui não impede o aviso à loja.
    if (contrato.email_cliente?.trim()) {
      try {
        await enviarEmail({
          para: contrato.email_cliente.trim(),
          assunto: `Contrato assinado — Més Belle #${contrato.numero}`,
          html: templateBase(`
            <h2 style="color:#4a1535;font-size:20px;margin:0 0 16px;">✅ Seu contrato foi assinado com sucesso!</h2>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
              Olá, <strong>${escapeHtml(contrato.nome_cliente)}</strong>. Segue a confirmação do seu contrato de locação
              <strong>#${escapeHtml(contrato.numero)}</strong> com a Més Belle.
            </p>
            ${tabela}
            ${botaoCTA("Ver contrato e baixar o PDF", linkContrato)}
            <p style="color:#9ca3af;font-size:13px;margin:16px 0 0;">
              Guarde este e-mail — o link acima leva você de volta ao contrato assinado, de onde é possível baixar o PDF a qualquer momento.
            </p>`),
        });
        resultado.cliente = "enviado";
      } catch (err) {
        console.error("[enviar-contrato-cliente] falha ao enviar para a cliente:", err);
        resultado.cliente = "erro";
      }
    } else {
      resultado.cliente = "sem_email";
    }

    // 2. Mesbelle: admins + vendedora da venda — sempre.
    const destinatarios = new Set(await emailsDosAdmins(supabase));
    const emailVendedora = await emailDoUsuario(supabase, contrato.vendedor_id);
    if (emailVendedora) destinatarios.add(emailVendedora);
    const avisoSemEmail = resultado.cliente === "sem_email"
      ? `<p style="color:#b45309;font-size:14px;margin:0 0 12px;">A cliente não tem e-mail cadastrado — envie o contrato por WhatsApp.</p>`
      : resultado.cliente === "erro"
        ? `<p style="color:#b91c1c;font-size:14px;margin:0 0 12px;">Não foi possível enviar a confirmação para a cliente (${escapeHtml(contrato.email_cliente)}). Confira o e-mail e envie o link por WhatsApp.</p>`
        : "";
    const htmlLoja = templateBase(`
      <h2 style="color:#4a1535;font-size:20px;margin:0 0 16px;">✅ Contrato assinado — venda fechada</h2>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        <strong>${escapeHtml(contrato.nome_cliente)}</strong> assinou o contrato de locação
        <strong>#${escapeHtml(contrato.numero)}</strong>. A venda já entrou no financeiro.
      </p>
      ${avisoSemEmail}
      ${tabela}
      ${botaoCTA("Ver contrato", linkContrato)}`);
    let enviadosLoja = 0;
    for (const para of destinatarios) {
      try {
        await enviarEmail({ para, assunto: `Contrato assinado — ${contrato.nome_cliente} #${contrato.numero}`, html: htmlLoja });
        enviadosLoja++;
      } catch (err) {
        console.error(`[enviar-contrato-cliente] falha ao avisar ${para}:`, err);
      }
    }
    resultado.loja = enviadosLoja;

    await supabase.from("contratos").update({ email_enviado_em: new Date().toISOString() }).eq("id", contrato.id);
    return json({ ok: true, ...resultado });
  } catch (err) {
    console.error("[enviar-contrato-cliente]", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
