import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Action = "desativar" | "reativar" | "reenviar_convite";

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
    } else if (action === "reenviar_convite") {
      const { data: userData, error: getErr } = await adminClient.auth.admin.getUserById(userId);
      if (getErr || !userData?.user?.email) return json({ error: getErr?.message ?? "Usuário não encontrado" }, 400);
      const siteUrl = Deno.env.get("SITE_URL");
      if (!siteUrl) return json({ error: "SITE_URL não configurado nos secrets da Edge Function" }, 500);

      const targetUser = userData.user;
      const isConfirmed = !!targetUser.confirmed_at;
      if (!isConfirmed) {
        // Usuário ainda não aceitou o convite original — reenviar convite.
        const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(targetUser.email!, {
          redirectTo: `${siteUrl}/redefinir-senha`,
        });
        if (inviteErr) {
          // inviteUserByEmail falha para e-mails já existentes no sistema (comum
          // ao reenviar) — usa generateLink como fallback, que não tem essa restrição.
          const { error: linkErr } = await adminClient.auth.admin.generateLink({
            type: "magiclink",
            email: targetUser.email!,
            options: { redirectTo: `${siteUrl}/redefinir-senha` },
          });
          if (linkErr) return json({ error: linkErr.message }, 400);
        }
      } else {
        // Usuário já confirmou — envia link de redefinição de senha no lugar,
        // permitindo acesso mesmo sem lembrar a senha original.
        const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(targetUser.email!, {
          redirectTo: `${siteUrl}/redefinir-senha`,
        });
        if (resetErr) return json({ error: resetErr.message }, 400);
      }
    } else {
      return json({ error: "Ação inválida" }, 400);
    }

    return json({ success: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
