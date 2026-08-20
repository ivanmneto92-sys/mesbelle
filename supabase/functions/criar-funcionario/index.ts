import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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

    const siteUrl = Deno.env.get("SITE_URL") ?? "https://mesbelle.vercel.app";
    const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { nome },
      redirectTo: `${siteUrl}/redefinir-senha`,
    });
    if (inviteErr || !invited?.user) return json({ error: inviteErr?.message ?? "Falha ao enviar convite" }, 400);

    // O profile já é criado pelo trigger handle_new_user (usando o nome dos metadados acima).
    const { error: roleErr } = await adminClient.from("user_roles").insert({
      user_id: invited.user.id,
      role: "vendedor",
    });
    if (roleErr) return json({ error: roleErr.message }, 400);

    return json({ success: true, userId: invited.user.id, message: "Convite enviado para " + email });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
