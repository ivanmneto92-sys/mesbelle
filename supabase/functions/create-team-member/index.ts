import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail, templateBase, botaoCTA } from "../_shared/resend.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub as string;

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .single();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Apenas admins podem cadastrar membros" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const { nome, email, role, cargo, tipo_contrato, percentual_comissao, telefone } = await req.json();

    if (!nome || !email || !role) {
      return new Response(JSON.stringify({ error: "nome, email e role são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user in auth
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true, // Confirm email so they can use the reset link
      user_metadata: { nome },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // Update profile (trigger already created it)
    await adminClient.from("profiles").update({
      nome,
      cargo: cargo || "",
      tipo_contrato: tipo_contrato || "CLT",
      percentual_comissao: percentual_comissao || 0,
      telefone: telefone || "",
    }).eq("user_id", userId);

    // Insert role
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role,
    });

    // Generate password reset link so user can set their password
    const siteUrl = Deno.env.get("SITE_URL");
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: siteUrl ? { redirectTo: `${siteUrl}/redefinir-senha` } : undefined,
    });

    // O e-mail é complementar: a conta e o papel já foram criados acima, então
    // uma falha aqui não derruba a requisição — mas sem isso o convite nunca
    // chegava ao destinatário (bug: essa function só devolvia o link na
    // resposta HTTP, que o frontend não usava pra nada).
    let emailEnviado = false;
    if (linkData?.properties?.action_link) {
      const primeiroNome = String(nome).split(" ")[0];
      try {
        await enviarEmail({
          para: email,
          assunto: `${primeiroNome}, você foi convidada para a MesBelle ✨`,
          html: templateBase(`
            <h2 style="color:#4a1535;font-size:22px;margin:0 0 16px;">
              Olá, ${primeiroNome}! 👗
            </h2>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;">
              Você foi adicionada à equipe da <strong>MesBelle Atelier</strong>.
            </p>
            <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
              Clique no botão abaixo para criar sua senha e começar a usar a plataforma:
            </p>
            ${botaoCTA("Criar minha senha →", linkData.properties.action_link)}
            <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;line-height:1.6;">
              Este link expira em <strong>1 hora</strong>. Se você não esperava este e-mail, pode ignorá-lo com segurança.
            </p>
          `),
        });
        emailEnviado = true;
      } catch (emailErr) {
        console.error("[create-team-member] falha ao enviar e-mail via Resend:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        recovery_link: linkData?.properties?.action_link || null,
        message: emailEnviado
          ? `Usuário criado com sucesso. Um e-mail foi enviado para ${email} com instruções para definir a senha.`
          : "Usuário criado, mas não foi possível enviar o e-mail de convite — peça para um admin reenviar o link de redefinição de senha.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
