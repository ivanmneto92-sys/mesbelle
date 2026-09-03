import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail, templateBase, botaoCTA } from "../_shared/resend.ts";

// Fluxo público de "esqueci minha senha" — chamado sem sessão (o usuário
// ainda não está logado). Sempre responde com sucesso, exista ou não a
// conta, para não permitir enumerar e-mails cadastrados.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const respostaGenerica = () => json({ success: true, message: "Se o e-mail existir, um link de redefinição foi enviado." });

  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) return json({ error: "email é obrigatório" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) return json({ error: "SITE_URL não configurado nos secrets da Edge Function" }, 500);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Rate limit: no máximo 3 pedidos por e-mail por hora, para não virar
    // um jeito de floodar a caixa de entrada de alguém ou esgotar a cota do Resend.
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: tentativas } = await adminClient
      .from("password_reset_attempts")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("criado_em", umaHoraAtras);
    if ((tentativas ?? 0) >= 3) return respostaGenerica();

    await adminClient.from("password_reset_attempts").insert({ email });

    const { data: existentes } = await adminClient.auth.admin.listUsers();
    const usuario = existentes?.users.find((u) => u.email === email);
    if (!usuario) return respostaGenerica();

    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${siteUrl}/redefinir-senha` },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      console.error("[solicitar-redefinicao-senha] falha ao gerar link:", linkErr);
      return respostaGenerica();
    }

    try {
      await enviarEmail({
        para: email,
        assunto: "Redefinir sua senha — MesBelle",
        html: templateBase(`
          <h2 style="color:#4a1535;font-size:22px;margin:0 0 16px;">
            Olá, tudo bem?
          </h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Recebemos uma solicitação para redefinir a sua senha de acesso à MesBelle.
            Clique no botão abaixo para criar uma nova senha:
          </p>
          ${botaoCTA("Redefinir senha →", linkData.properties.action_link)}
          <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.6;">
            Este link expira em <strong>1 hora</strong>. Se você não solicitou isso, pode ignorar este e-mail com segurança.
          </p>
        `),
      });
    } catch (emailErr) {
      console.error("[solicitar-redefinicao-senha] falha ao enviar e-mail via Resend:", emailErr);
    }

    return respostaGenerica();
  } catch (err) {
    console.error("[solicitar-redefinicao-senha]", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
