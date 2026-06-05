import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Testes de RLS — rodam contra o ambiente Supabase configurado por env:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - SUPABASE_PUBLISHABLE_KEY (ou VITE_SUPABASE_PUBLISHABLE_KEY)
 *
 * Cria usuários temporários (admin e vendedores), atribui papéis,
 * roda asserções via PostgREST e limpa tudo no final.
 *
 * Pulado automaticamente se as envs não estiverem presentes (dev local).
 */

const URL = process.env.SUPABASE_URL;
const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const hasEnv = !!(URL && SRV && ANON);
const d = hasEnv ? describe : describe.skip;

d("RLS — papéis Admin e Vendedor", () => {
  const stamp = Date.now();
  const pwd = "TestPass123!@#";
  const adminEmail = `rls_admin_${stamp}@test.local`;
  const vendEmail = `rls_vend_${stamp}@test.local`;
  const otherEmail = `rls_other_${stamp}@test.local`;

  let admin: SupabaseClient;
  let adminClient: SupabaseClient;
  let vendClient: SupabaseClient;
  let fAdmin: any, fVend: any, fOther: any;
  const createdUsers: string[] = [];
  const createdFuncs: string[] = [];

  beforeAll(async () => {
    admin = createClient(URL!, SRV!, { auth: { persistSession: false } });

    const mk = async (email: string) => {
      const { data, error } = await admin.auth.admin.createUser({
        email, password: pwd, email_confirm: true,
      });
      if (error) throw error;
      createdUsers.push(data.user!.id);
      return data.user!.id;
    };
    const adminId = await mk(adminEmail);
    const vendId = await mk(vendEmail);
    const otherId = await mk(otherEmail);

    await admin.from("user_roles").insert([
      { user_id: adminId, role: "admin" },
      { user_id: vendId, role: "vendedor" },
      { user_id: otherId, role: "vendedor" },
    ]);

    const ins = async (payload: any) => {
      const { data, error } = await admin.from("funcionarios").insert(payload).select().single();
      if (error) throw error;
      createdFuncs.push(data.id);
      return data;
    };
    fAdmin = await ins({ nome: "Admin T", email: adminEmail, cargo: "Gerente" });
    fVend = await ins({ nome: "Vend T", email: vendEmail, cargo: "Vendedora", percentual_comissao: 5 });
    fOther = await ins({ nome: "Outro", email: otherEmail, cargo: "Vendedora", percentual_comissao: 7 });

    const sign = async (email: string) => {
      const c = createClient(URL!, ANON!, { auth: { persistSession: false } });
      const { error } = await c.auth.signInWithPassword({ email, password: pwd });
      if (error) throw error;
      return c;
    };
    adminClient = await sign(adminEmail);
    vendClient = await sign(vendEmail);
  }, 60_000);

  afterAll(async () => {
    for (const id of createdFuncs) await admin?.from("funcionarios").delete().eq("id", id);
    for (const id of createdUsers) await admin?.auth.admin.deleteUser(id).catch(() => {});
  }, 60_000);

  it("Admin lê todos os funcionários", async () => {
    const { data, error } = await adminClient.from("funcionarios").select("id")
      .in("id", [fAdmin.id, fVend.id, fOther.id]);
    expect(error).toBeNull();
    expect(data?.length).toBe(3);
  });

  it("Vendedor lê APENAS o próprio registro (por email)", async () => {
    const { data, error } = await vendClient.from("funcionarios").select("id,email")
      .in("id", [fAdmin.id, fVend.id, fOther.id]);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect(data![0].id).toBe(fVend.id);
  });

  it("Vendedor NÃO consegue editar próprio registro", async () => {
    const { error, data } = await vendClient.from("funcionarios")
      .update({ telefone: "11999999999" }).eq("id", fVend.id).select();
    expect(error !== null || (data?.length ?? 0) === 0).toBe(true);
  });

  it("Vendedor NÃO consegue editar outro funcionário", async () => {
    const { error, data } = await vendClient.from("funcionarios")
      .update({ telefone: "11888888888" }).eq("id", fOther.id).select();
    expect(error !== null || (data?.length ?? 0) === 0).toBe(true);
  });

  it("Vendedor NÃO consegue inserir funcionário", async () => {
    const { error } = await vendClient.from("funcionarios")
      .insert({ nome: "Hack", cargo: "X" });
    expect(error).not.toBeNull();
  });

  it("Vendedor NÃO consegue deletar funcionário", async () => {
    const { error, data } = await vendClient.from("funcionarios")
      .delete().eq("id", fVend.id).select();
    expect(error !== null || (data?.length ?? 0) === 0).toBe(true);
  });

  it("Admin edita qualquer funcionário", async () => {
    const { error, data } = await adminClient.from("funcionarios")
      .update({ telefone: "11777777777" }).eq("id", fVend.id).select();
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("Admin insere e deleta funcionário", async () => {
    const { data, error } = await adminClient.from("funcionarios")
      .insert({ nome: "AI", cargo: "Costureira" }).select().single();
    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    const { error: delErr } = await adminClient.from("funcionarios").delete().eq("id", data!.id);
    expect(delErr).toBeNull();
  });

  it("Admin lê permissoes_config, Vendedor não lê", async () => {
    const a = await adminClient.from("permissoes_config").select("*");
    expect(a.error).toBeNull();
    const v = await vendClient.from("permissoes_config").select("*");
    expect(v.error).toBeNull();
    expect(v.data?.length).toBe(0);
  });

  it("Vendedor lê leads (CRM) mas NÃO lê transacoes_financeiras", async () => {
    const l = await vendClient.from("leads").select("id").limit(1);
    expect(l.error).toBeNull();
    const t = await vendClient.from("transacoes_financeiras").select("id").limit(1);
    expect(t.error).toBeNull();
    expect(t.data?.length).toBe(0);
  });
});
