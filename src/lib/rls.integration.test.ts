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

d("RLS — Contratos e fluxo público de assinatura por token", () => {
  const stamp = Date.now();
  const pwd = "TestPass123!@#";
  const adminEmail = `rls_c_admin_${stamp}@test.local`;
  const vendEmail = `rls_c_vend_${stamp}@test.local`;

  // base64 válido (>=100 chars, regex aceita): "data:image/png;base64," + 96 A's
  const sigValida = "data:image/png;base64," + "A".repeat(96);
  const sigInvalida = "nao-e-base64";

  let admin: SupabaseClient;
  let adminClient: SupabaseClient;
  let vendClient: SupabaseClient;
  let anonClient: SupabaseClient;

  let leadId: string;
  let contratoId: string;
  let contratoToSignId: string;
  let signingToken: string;
  let signingTokenExpired: string;
  let contratoExpiredId: string;

  const createdUsers: string[] = [];
  const createdContratos: string[] = [];

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

    await admin.from("user_roles").insert([
      { user_id: adminId, role: "admin" },
      { user_id: vendId, role: "vendedor" },
    ]);

    const { data: lead, error: leadErr } = await admin.from("leads").insert({
      nome: "Cliente Teste RLS", telefone: "11999990000",
    }).select().single();
    if (leadErr) throw leadErr;
    leadId = lead.id;

    const mkContrato = async (overrides: any = {}) => {
      const { data, error } = await admin.from("contratos").insert({
        numero: `T-${stamp}-${Math.random().toString(36).slice(2, 7)}`,
        lead_id: leadId,
        nome_cliente: "Cliente Teste",
        valor_total: 1000,
        signing_token: crypto.randomUUID(),
        token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        termos_texto: "Termos de teste",
        ...overrides,
      }).select().single();
      if (error) throw error;
      createdContratos.push(data.id);
      return data;
    };

    const c1 = await mkContrato();
    contratoId = c1.id;

    const c2 = await mkContrato();
    contratoToSignId = c2.id;
    signingToken = c2.signing_token;

    const c3 = await mkContrato({
      token_expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
    });
    contratoExpiredId = c3.id;
    signingTokenExpired = c3.signing_token;

    const sign = async (email: string) => {
      const c = createClient(URL!, ANON!, { auth: { persistSession: false } });
      const { error } = await c.auth.signInWithPassword({ email, password: pwd });
      if (error) throw error;
      return c;
    };
    adminClient = await sign(adminEmail);
    vendClient = await sign(vendEmail);
    anonClient = createClient(URL!, ANON!, { auth: { persistSession: false } });
  }, 60_000);

  afterAll(async () => {
    for (const id of createdContratos) await admin?.from("contratos").delete().eq("id", id);
    if (leadId) await admin?.from("leads").delete().eq("id", leadId);
    for (const id of createdUsers) await admin?.auth.admin.deleteUser(id).catch(() => {});
  }, 60_000);

  // === Leitura direta da tabela ===

  it("Admin lê contratos", async () => {
    const { data, error } = await adminClient.from("contratos").select("id").in("id", createdContratos);
    expect(error).toBeNull();
    expect(data?.length).toBe(createdContratos.length);
  });

  it("Vendedor lê contratos (CRM)", async () => {
    const { data, error } = await vendClient.from("contratos").select("id").in("id", createdContratos);
    expect(error).toBeNull();
    expect(data?.length).toBe(createdContratos.length);
  });

  it("Anônimo NÃO lê contratos direto da tabela", async () => {
    const { data, error } = await anonClient.from("contratos").select("id").in("id", createdContratos);
    // RLS: pode retornar erro OU array vazio (PostgREST não vaza linhas)
    expect(error !== null || (data?.length ?? 0) === 0).toBe(true);
  });

  // === Escrita ===

  it("Vendedor insere contrato", async () => {
    const { data, error } = await vendClient.from("contratos").insert({
      numero: `V-${stamp}`, lead_id: leadId, nome_cliente: "Inserido por vend",
      valor_total: 500, termos_texto: "t",
    }).select().single();
    expect(error).toBeNull();
    if (data?.id) createdContratos.push(data.id);
  });

  it("Vendedor atualiza contrato", async () => {
    const { data, error } = await vendClient.from("contratos")
      .update({ nome_cliente: "Atualizado" }).eq("id", contratoId).select();
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });

  it("Vendedor NÃO consegue deletar contrato", async () => {
    const { error, data } = await vendClient.from("contratos")
      .delete().eq("id", contratoId).select();
    expect(error !== null || (data?.length ?? 0) === 0).toBe(true);
  });

  // === Fluxo público de assinatura por token ===

  it("Anônimo recupera contrato via get_contrato_by_token (token válido)", async () => {
    const { data, error } = await anonClient.rpc("get_contrato_by_token", { _token: signingToken });
    expect(error).toBeNull();
    expect(Array.isArray(data) ? data.length : 0).toBeGreaterThan(0);
    const row = (data as any[])[0];
    expect(row.id).toBe(contratoToSignId);
    expect(row.status_assinatura).toBe("pendente");
  });

  it("Anônimo NÃO recupera contrato com token expirado", async () => {
    const { data, error } = await anonClient.rpc("get_contrato_by_token", { _token: signingTokenExpired });
    expect(error).toBeNull();
    expect(Array.isArray(data) ? data.length : 0).toBe(0);
  });

  it("Anônimo NÃO recupera contrato com token inexistente", async () => {
    const { data, error } = await anonClient.rpc("get_contrato_by_token", {
      _token: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).toBeNull();
    expect(Array.isArray(data) ? data.length : 0).toBe(0);
  });

  it("assinar_contrato_publico rejeita token inválido", async () => {
    const { data, error } = await anonClient.rpc("assinar_contrato_publico", {
      _token: "00000000-0000-0000-0000-000000000000",
      _assinatura: sigValida, _ip: "1.1.1.1", _user_agent: "test",
    });
    expect(error).toBeNull();
    expect((data as any)?.ok).toBe(false);
    expect((data as any)?.error).toBe("token_invalido_ou_expirado");
  });

  it("assinar_contrato_publico rejeita assinatura em formato inválido", async () => {
    const { data, error } = await anonClient.rpc("assinar_contrato_publico", {
      _token: signingToken, _assinatura: sigInvalida, _ip: "1.1.1.1", _user_agent: "test",
    });
    expect(error).toBeNull();
    expect((data as any)?.ok).toBe(false);
    expect((data as any)?.error).toBe("assinatura_invalida");
  });

  it("assinar_contrato_publico assina com sucesso (token + base64 válidos)", async () => {
    const { data, error } = await anonClient.rpc("assinar_contrato_publico", {
      _token: signingToken, _assinatura: sigValida, _ip: "1.1.1.1", _user_agent: "vitest",
    });
    expect(error).toBeNull();
    expect((data as any)?.ok).toBe(true);
    expect((data as any)?.contrato_id).toBe(contratoToSignId);

    // valida persistência via service role
    const { data: row } = await admin.from("contratos")
      .select("status_assinatura, data_assinatura, ip_assinatura")
      .eq("id", contratoToSignId).single();
    expect(row?.status_assinatura).toBe("assinado");
    expect(row?.data_assinatura).toBeTruthy();
    // ip_assinatura vem do header real da requisição (cf-connecting-ip), não
    // do parâmetro _ip enviado acima — que é ignorado de propósito, já que
    // um client malicioso poderia forjar qualquer valor ali.
    expect(row?.ip_assinatura).toBeTruthy();
    expect(row?.ip_assinatura).not.toBe("1.1.1.1");
  });

  it("assinar_contrato_publico recusa segunda assinatura (ja_assinado)", async () => {
    const { data, error } = await anonClient.rpc("assinar_contrato_publico", {
      _token: signingToken, _assinatura: sigValida, _ip: "1.1.1.1", _user_agent: "test",
    });
    expect(error).toBeNull();
    expect((data as any)?.ok).toBe(false);
    expect((data as any)?.error).toBe("ja_assinado");
  });

  it("Admin consegue deletar contrato", async () => {
    const idDel = createdContratos[createdContratos.length - 1];
    const { error } = await adminClient.from("contratos").delete().eq("id", idDel);
    expect(error).toBeNull();
    createdContratos.pop();
  });
});
