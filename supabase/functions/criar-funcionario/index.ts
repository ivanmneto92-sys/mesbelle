import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail, templateBase, botaoCTA } from "../_shared/resend.ts";

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
    if (!callerRole) return json({ error: "Apenas administradores podem criar funcionários" }, 403);

    const { nome, email } = await req.json();
    if (!nome || !email) return json({ error: "nome e email são obrigatórios" }, 400);

    const { data: existentes } = await adminClient.auth.admin.listUsers();
    const jaExiste = existentes?.users.find((u) => u.email === email);
    if (jaExiste) return json({ error: "Já existe um usuário com este e-mail" }, 409);

    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) return json({ error: "SITE_URL não configurado nos secrets da Edge Function" }, 500);

    // generateLink (em vez de inviteUserByEmail) cria o usuário e devolve o
    // link sem disparar o e-mail padrão do Supabase — o convite é enviado
    // logo abaixo via Resend, com o visual da MesBelle.
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        data: { nome },
        redirectTo: `${siteUrl}/redefinir-senha`,
      },
    });
    if (linkErr || !linkData?.user) return json({ error: linkErr?.message ?? "Falha ao gerar convite" }, 400);

    // O profile já é criado pelo trigger handle_new_user (usando o nome dos metadados acima).
    const { error: roleErr } = await adminClient.from("user_roles").insert({
      user_id: linkData.user.id,
      role: "vendedor",
    });
    if (roleErr) return json({ error: roleErr.message }, 400);

    // O e-mail é complementar: a conta e o papel já foram criados acima, então
    // uma falha aqui não derruba a requisição — o admin ainda pode reenviar o
    // convite depois pela tela de Funcionários.
    const primeiroNome = String(nome).split(" ")[0];
    let emailEnviado = true;
    try {
      await enviarEmail({
        para: email,
        assunto: `${primeiroNome}, você foi convidada para a MesBelle ✨`,
        html: templateBase(`
          <h2 style="color:#4a1535;font-size:22px;margin:0 0 16px;">
            Olá, ${primeiroNome}! 👗
          </h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;">
            Você foi adicionada à equipe da <strong>MesBelle Atelier</strong> como
            consultora de vendas.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Clique no botão abaixo para criar sua senha e começar a usar a plataforma:
          </p>
          ${botaoCTA("Aceitar convite e criar senha →", linkData.properties.action_link)}
          <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.6;">
            Este link expira em <strong>24 horas</strong>. Após criar sua senha, você
            poderá acessar normalmente sempre que precisar.<br><br>
            Se você não esperava este e-mail, pode ignorá-lo com segurança.
          </p>
        `),
      });
    } catch (emailErr) {
      console.error("[criar-funcionario] falha ao enviar e-mail via Resend:", emailErr);
      emailEnviado = false;
    }

    return json({
      success: true,
      userId: linkData.user.id,
      message: emailEnviado
        ? "Convite enviado para " + email
        : "Funcionário criado, mas o e-mail de convite falhou — use \"Reenviar convite\" na tela de Funcionários.",
      funcionario: {
        id: linkData.user.id,
        email: linkData.user.email,
        nome,
        criadoEm: linkData.user.created_at,
        ultimoLogin: null,
        confirmado: false,
        bloqueado: false,
      },
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
