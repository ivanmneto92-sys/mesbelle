import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail, templateBase, botaoCTA } from "../_shared/resend.ts";

type Action = "desativar" | "reativar" | "reenviar_convite" | "excluir";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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
    if (!callerRole) return json({ error: "Apenas admin" }, 403);

    const { userId, action } = (await req.json()) as { userId?: string; action?: Action };
    if (!userId || !action) return json({ error: "userId e action são obrigatórios" }, 400);

    if (action === "desativar") {
      const { error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: "876600h" });
      if (error) return json({ error: error.message }, 400);
    } else if (action === "reativar") {
      const { error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: "none" });
      if (error) return json({ error: error.message }, 400);
    } else if (action === "excluir") {
      if (userId === caller.id) return json({ error: "Você não pode excluir a si mesmo" }, 400);
      // Leads/negócios/contratos referenciados por este funcionário viram
      // ON DELETE SET NULL (migração funcionario_delete_fk_set_null) — a
      // exclusão nunca falha por FK, os registros só ficam sem dono.
      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteErr) return json({ error: deleteErr.message }, 400);
      await adminClient.from("user_roles").delete().eq("user_id", userId);
    } else if (action === "reenviar_convite") {
      const { data: userData, error: getErr } = await adminClient.auth.admin.getUserById(userId);
      if (getErr || !userData?.user?.email) return json({ error: getErr?.message ?? "Usuário não encontrado" }, 400);
      const siteUrl = Deno.env.get("SITE_URL");
      if (!siteUrl) return json({ error: "SITE_URL não configurado nos secrets da Edge Function" }, 500);

      const targetUser = userData.user;
      const email = targetUser.email!;
      const nome = String(targetUser.user_metadata?.nome ?? email.split("@")[0]);
      const primeiroNome = nome.split(" ")[0];
      const isConfirmed = !!targetUser.confirmed_at;

      // generateLink nunca envia e-mail por conta própria — o envio abaixo é
      // sempre feito via Resend, nunca pelo mailer nativo do Supabase.
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: isConfirmed ? "recovery" : "invite",
        email,
        options: { redirectTo: `${siteUrl}/redefinir-senha` },
      });
      if (linkErr || !linkData?.properties?.action_link) {
        return json({ error: linkErr?.message ?? "Falha ao gerar link" }, 400);
      }

      const html = isConfirmed
        ? templateBase(`
            <h2 style="color:#4a1535;font-size:22px;margin:0 0 16px;">
              Olá, ${primeiroNome}!
            </h2>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
              Recebemos uma solicitação para redefinir a sua senha de acesso à MesBelle.
              Clique no botão abaixo para criar uma nova senha:
            </p>
            ${botaoCTA("Redefinir senha →", linkData.properties.action_link)}
            <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.6;">
              Este link expira em <strong>1 hora</strong>. Se você não solicitou isso, pode ignorar este e-mail com segurança.
            </p>
          `)
        : templateBase(`
            <h2 style="color:#4a1535;font-size:22px;margin:0 0 16px;">
              Olá, ${primeiroNome}! 👗
            </h2>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
              Este é um lembrete do seu convite para a equipe da <strong>MesBelle Atelier</strong>.
              Clique no botão abaixo para criar sua senha e acessar:
            </p>
            ${botaoCTA("Aceitar convite e criar senha →", linkData.properties.action_link)}
            <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.6;">
              Este link expira em <strong>24 horas</strong>. Se você não esperava este e-mail, pode ignorá-lo com segurança.
            </p>
          `);

      await enviarEmail({
        para: email,
        assunto: isConfirmed ? "Redefinir sua senha — MesBelle" : `${primeiroNome}, seu convite para a MesBelle`,
        html,
      });
    } else {
      return json({ error: "Ação inválida" }, 400);
    }

    return json({ success: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
