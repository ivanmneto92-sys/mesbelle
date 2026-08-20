import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface ProfileRow {
  user_id: string;
  nome: string;
}

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

    const { data: vendedores } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "vendedor");
    const vendedorIds = new Set((vendedores ?? []).map((v: { user_id: string }) => v.user_id));

    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, nome")
      .in("user_id", [...vendedorIds]);
    const profileByUserId = new Map((profiles ?? []).map((p: ProfileRow) => [p.user_id, p.nome]));

    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();

    const result = authUsers
      .filter((u) => vendedorIds.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email,
        nome: profileByUserId.get(u.id) ?? (u.user_metadata?.nome as string | undefined) ?? u.email,
        criadoEm: u.created_at,
        ultimoLogin: u.last_sign_in_at ?? null,
        confirmado: !!u.confirmed_at,
        bloqueado: u.banned_until ? new Date(u.banned_until) > new Date() : false,
      }));

    return json(result);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
