import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// A tela "Time & Performance" (/equipe) mostrava a equipe a partir da tabela
// public.funcionarios — um cadastro paralelo, sem nenhum vínculo com as
// contas reais de login (auth.users/user_roles/profiles). Resultado: o
// próprio botão "Cadastrar Membro" daquela tela já criava contas reais (via
// create-team-member, que grava em profiles), mas a listagem/edição
// continuava lendo funcionarios — que ninguém populava. Esta função lista e
// atualiza os dados de equipe a partir de profiles (fonte real), igual ao
// que create-team-member já escreve.

interface ProfileRow {
  user_id: string;
  nome: string;
  cargo: string;
  tipo_contrato: string;
  percentual_comissao: number;
  ativo: boolean;
  telefone: string;
}

interface AtualizarPatch {
  nome?: string;
  cargo?: string;
  tipoContrato?: string;
  percentualComissao?: number;
  ativo?: boolean;
  telefone?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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
    if (!callerRole) return json({ error: "Apenas administradores podem acessar a equipe" }, 403);

    const body = await req.json();
    const action = body?.action;

    if (action === "listar") {
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["vendedor", "socio"]);
      const userIds = [...new Set((roles ?? []).map((r: { user_id: string }) => r.user_id))];
      if (userIds.length === 0) return json([]);

      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, nome, cargo, tipo_contrato, percentual_comissao, ativo, telefone")
        .in("user_id", userIds);
      const profileByUserId = new Map((profiles ?? []).map((p: ProfileRow) => [p.user_id, p]));

      const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();
      const emailByUserId = new Map(authUsers.map((u) => [u.id, u.email]));

      const result = userIds.map((id) => {
        const p = profileByUserId.get(id);
        return {
          id,
          nome: p?.nome ?? emailByUserId.get(id) ?? "",
          cargo: p?.cargo ?? "",
          tipoContrato: p?.tipo_contrato ?? "CLT",
          percentualComissao: Number(p?.percentual_comissao ?? 0),
          ativo: p?.ativo ?? true,
          telefone: p?.telefone ?? "",
          email: emailByUserId.get(id) ?? "",
        };
      });
      return json(result);
    }

    if (action === "atualizar") {
      const userId = body?.userId as string | undefined;
      const patch = body?.patch as AtualizarPatch | undefined;
      if (!userId || !patch) return json({ error: "userId e patch são obrigatórios" }, 400);

      const update: Record<string, unknown> = {};
      if (patch.nome !== undefined) update.nome = patch.nome;
      if (patch.cargo !== undefined) update.cargo = patch.cargo;
      if (patch.tipoContrato !== undefined) update.tipo_contrato = patch.tipoContrato;
      if (patch.percentualComissao !== undefined) update.percentual_comissao = patch.percentualComissao;
      if (patch.ativo !== undefined) update.ativo = patch.ativo;
      if (patch.telefone !== undefined) update.telefone = patch.telefone;

      const { error } = await adminClient.from("profiles").update(update).eq("user_id", userId);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: "action inválida" }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
