import { useState, useCallback, useEffect } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Lead, MedidasCliente, Contrato, CrmFunnelStatus, ContratoStatus, Negocio, StatusNegociacao } from "@/types/comercial";
import type { DateRange } from "@/hooks/useDateRange";
import { gerarTermosContrato } from "@/lib/contratoTemplate";
import { toast } from "sonner";

// ============= Legacy storage cleanup =============
// Kept for compatibility — clears any residual data from the old localStorage-based system.
const LEGACY_STORAGE_KEYS = [
  "mesbelle_leads",
  "mesbelle_medidas",
  "mesbelle_contratos",
  "mesbelle_negocios",
  "mesbelle_user",
  "mesbelle_vestidos",
  "mesbelle_reservas",
  "mesbelle_producoes",
  "mesbelle_etapas",
  "mesbelle_logistica",
];

export function clearAppStorage() {
  LEGACY_STORAGE_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });
}

// Autoria: usada para preencher criado_por/atendido_por (leads) e vendedor_id
// (negocios/contratos) — a RLS exige isso para que um vendedor consiga inserir
// e depois ler os próprios registros.
async function currentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ============= DB row → domain mappers =============
type LeadRow = {
  id: string; nome: string; telefone: string; email: string; cpf: string; endereco: string;
  tipo_evento: string; data_evento: string; status_funil: string; notas_internas: string;
  vendedor_responsavel: string; prova_data: string | null; prova_hora: string | null;
  enviado_comercial: boolean; criado_em: string;
  criado_por: string | null; atendido_por: string | null;
};
const rowToLead = (r: LeadRow): Lead => ({
  id: r.id, nome: r.nome, telefone: r.telefone, email: r.email, cpf: r.cpf, endereco: r.endereco,
  tipoEvento: r.tipo_evento, dataEvento: r.data_evento, statusFunil: r.status_funil as CrmFunnelStatus,
  notasInternas: r.notas_internas, vendedorResponsavel: r.vendedor_responsavel,
  criadoEm: r.criado_em, provaData: r.prova_data ?? undefined, provaHora: r.prova_hora ?? undefined,
  enviadoComercial: r.enviado_comercial,
  criadoPor: r.criado_por ?? null, atendidoPor: r.atendido_por ?? null,
});
const leadPatchToRow = (p: Partial<Lead>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (p.nome !== undefined) out.nome = p.nome;
  if (p.telefone !== undefined) out.telefone = p.telefone;
  if (p.email !== undefined) out.email = p.email;
  if (p.cpf !== undefined) out.cpf = p.cpf;
  if (p.endereco !== undefined) out.endereco = p.endereco;
  if (p.tipoEvento !== undefined) out.tipo_evento = p.tipoEvento;
  if (p.dataEvento !== undefined) out.data_evento = p.dataEvento;
  if (p.statusFunil !== undefined) out.status_funil = p.statusFunil;
  if (p.notasInternas !== undefined) out.notas_internas = p.notasInternas;
  if (p.vendedorResponsavel !== undefined) out.vendedor_responsavel = p.vendedorResponsavel;
  if (p.provaData !== undefined) out.prova_data = p.provaData;
  if (p.provaHora !== undefined) out.prova_hora = p.provaHora;
  if (p.enviadoComercial !== undefined) out.enviado_comercial = p.enviadoComercial;
  if (p.criadoPor !== undefined) out.criado_por = p.criadoPor;
  if (p.atendidoPor !== undefined) out.atendido_por = p.atendidoPor;
  return out;
};

type MedidaRow = { lead_id: string; busto: string; cintura: string; quadril: string; altura: string; salto: string | null; manequim: string };
const rowToMedida = (r: MedidaRow): MedidasCliente => ({
  leadId: r.lead_id, busto: r.busto, cintura: r.cintura, quadril: r.quadril,
  altura: r.altura, salto: r.salto ?? undefined, manequim: r.manequim,
});

type ContratoRow = {
  id: string; numero: string; lead_id: string; negocio_id: string | null; nome_cliente: string;
  cpf_cliente: string; data_evento: string; data_criacao: string; valor_total: number;
  status_assinatura: string; termos_texto: string; assinatura_base64: string | null;
  data_assinatura: string | null;
  ip_assinatura: string | null; user_agent_assinatura: string | null;
  signing_token: string | null; token_expires_at: string | null; email_cliente: string | null;
  vendedor_id: string | null;
};
const rowToContrato = (r: ContratoRow): Contrato => ({
  id: r.id, numero: r.numero, leadId: r.lead_id, negocioId: r.negocio_id ?? undefined,
  nomeCliente: r.nome_cliente, cpfCliente: r.cpf_cliente, dataEvento: r.data_evento,
  dataCriacao: r.data_criacao, valorTotal: Number(r.valor_total),
  statusAssinatura: r.status_assinatura as ContratoStatus, termosTexto: r.termos_texto,
  assinaturaBase64: r.assinatura_base64 ?? undefined, dataAssinatura: r.data_assinatura ?? undefined,
  ipAssinatura: r.ip_assinatura ?? undefined,
  userAgentAssinatura: r.user_agent_assinatura ?? undefined,
  signingToken: r.signing_token ?? undefined,
  tokenExpiresAt: r.token_expires_at ?? undefined,
  emailCliente: r.email_cliente ?? undefined,
  vendedorId: r.vendedor_id ?? null,
});

type NegocioRow = {
  id: string; cliente_id: string; cliente_nome: string; cliente_cpf: string; vestido_nome: string | null;
  cliente_telefone: string | null; cliente_email: string | null;
  valor_negociado: number; desconto: number; metodo_pagamento: string; status_negociacao: string;
  data_evento: string; criado_em: string; vendedor_id: string | null;
};
const rowToNegocio = (r: NegocioRow): Negocio => ({
  id: r.id, clienteId: r.cliente_id, clienteNome: r.cliente_nome, clienteCpf: r.cliente_cpf,
  clienteTelefone: r.cliente_telefone ?? null, clienteEmail: r.cliente_email ?? null,
  vestidoNome: r.vestido_nome ?? undefined, valorNegociado: Number(r.valor_negociado),
  desconto: Number(r.desconto), metodoPagamento: r.metodo_pagamento,
  statusNegociacao: r.status_negociacao as StatusNegociacao,
  dataEvento: r.data_evento, criadoEm: r.criado_em, vendedorId: r.vendedor_id ?? null,
});

export function useLeads(range?: DateRange) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [medidas, setMedidas] = useState<MedidasCliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);

  // Clear any old localStorage data on mount (one-shot housekeeping).
  useEffect(() => {
    clearAppStorage();
  }, []);

  // Initial load from Supabase.
  useEffect(() => {
    let active = true;
    (async () => {
      let leadsQuery = supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (range) leadsQuery = leadsQuery.gte("criado_em", range.from).lte("criado_em", range.to);
      const [leadsRes, medidasRes, contratosRes, negociosRes] = await Promise.all([
        leadsQuery,
        supabase.from("medidas").select("*"),
        supabase.from("contratos").select("*").order("created_at", { ascending: false }),
        supabase.from("negocios").select("*").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      if (leadsRes.data) setLeads((leadsRes.data as LeadRow[]).map(rowToLead));
      if (medidasRes.data) setMedidas((medidasRes.data as MedidaRow[]).map(rowToMedida));
      if (contratosRes.data) setContratos((contratosRes.data as ContratoRow[]).map(rowToContrato));
      if (negociosRes.data) setNegocios((negociosRes.data as NegocioRow[]).map(rowToNegocio));
    })();
    return () => { active = false; };
  }, [range]);

  // Realtime — sem isto, um lead/negócio/contrato criado por uma funcionária
  // só aparecia pra quem já tinha a tela de CRM aberta depois de recarregar a
  // página manualmente (o fetch acima só roda uma vez, ao montar ou trocar
  // o período).
  //
  // Os handlers aplicam o payload do próprio evento diretamente no estado
  // (upsert/remove por id) em vez de re-buscar a tabela inteira a cada
  // mudança. Antes, criar um contrato disparava 3-4 eventos em cascata
  // (lead, negócio, contrato) e cada um refazia um SELECT completo e
  // sobrescrevia o estado inteiro — o retorno mais lento de um desses
  // SELECTs concorrentes podia chegar depois do insert otimista local e
  // "apagar" o registro recém-criado da tela até o próximo evento ou um F5.
  // Aplicar o payload direto elimina essa corrida e também a latência extra
  // do round-trip de SELECT.
  useEffect(() => {
    const channel = supabase
      .channel(`leads_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (payload: RealtimePostgresChangesPayload<LeadRow>) => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as { id?: string }).id;
          if (oldId) setLeads((prev) => prev.filter((l) => l.id !== oldId));
          return;
        }
        const row = payload.new as LeadRow;
        const foraDoPeriodo = range && (row.criado_em < range.from || row.criado_em > range.to);
        setLeads((prev) => {
          if (foraDoPeriodo) return prev.filter((l) => l.id !== row.id);
          const mapped = rowToLead(row);
          const idx = prev.findIndex((l) => l.id === mapped.id);
          if (idx === -1) return [mapped, ...prev];
          const next = [...prev]; next[idx] = mapped; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "medidas" }, (payload: RealtimePostgresChangesPayload<MedidaRow>) => {
        if (payload.eventType === "DELETE") {
          const oldLeadId = (payload.old as { lead_id?: string }).lead_id;
          if (oldLeadId) setMedidas((prev) => prev.filter((m) => m.leadId !== oldLeadId));
          return;
        }
        const mapped = rowToMedida(payload.new as MedidaRow);
        setMedidas((prev) => {
          const idx = prev.findIndex((m) => m.leadId === mapped.leadId);
          if (idx === -1) return [...prev, mapped];
          const next = [...prev]; next[idx] = mapped; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contratos" }, (payload: RealtimePostgresChangesPayload<ContratoRow>) => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as { id?: string }).id;
          if (oldId) setContratos((prev) => prev.filter((c) => c.id !== oldId));
          return;
        }
        const mapped = rowToContrato(payload.new as ContratoRow);
        setContratos((prev) => {
          const idx = prev.findIndex((c) => c.id === mapped.id);
          if (idx === -1) return [mapped, ...prev];
          const next = [...prev]; next[idx] = mapped; return next;
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "negocios" }, (payload: RealtimePostgresChangesPayload<NegocioRow>) => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as { id?: string }).id;
          if (oldId) setNegocios((prev) => prev.filter((n) => n.id !== oldId));
          return;
        }
        const mapped = rowToNegocio(payload.new as NegocioRow);
        setNegocios((prev) => {
          const idx = prev.findIndex((n) => n.id === mapped.id);
          if (idx === -1) return [mapped, ...prev];
          const next = [...prev]; next[idx] = mapped; return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [range]);

  // === LEADS / CRM ===
  const addLead = useCallback(async (lead: Omit<Lead, "id" | "criadoEm" | "statusFunil">) => {
    const userId = await currentUserId();
    const insertRow = {
      nome: lead.nome,
      ...leadPatchToRow(lead as Partial<Lead>),
      status_funil: "novo_lead",
      criado_por: lead.criadoPor ?? userId,
      atendido_por: lead.atendidoPor ?? userId,
    } as { nome: string } & Record<string, unknown>;
    const { data, error } = await supabase.from("leads").insert(insertRow as never).select().single();
    if (error || !data) { toast.error("Não foi possível salvar a cliente: " + (error?.message ?? "erro desconhecido")); return null; }
    const newLead = rowToLead(data as LeadRow);
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  }, []);

  const updateLeadStatus = useCallback(async (leadId: string, newStatus: CrmFunnelStatus, extra?: Partial<Lead>) => {
    const patch = { ...leadPatchToRow(extra ?? {}), status_funil: newStatus };
    const anterior = leads.find((l) => l.id === leadId);
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, statusFunil: newStatus, ...(extra ?? {}) } : l));
    const { error } = await supabase.from("leads").update(patch as never).eq("id", leadId);
    if (error) {
      if (anterior) setLeads((prev) => prev.map((l) => l.id === leadId ? anterior : l));
      toast.error("Não foi possível atualizar a cliente: " + error.message);
    }
  }, [leads]);

  const updateLead = useCallback(async (leadId: string, data: Partial<Lead>) => {
    const anterior = leads.find((l) => l.id === leadId);
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, ...data } : l));
    const { error } = await supabase.from("leads").update(leadPatchToRow(data) as never).eq("id", leadId);
    if (error) {
      if (anterior) setLeads((prev) => prev.map((l) => l.id === leadId ? anterior : l));
      toast.error("Não foi possível salvar as alterações: " + error.message);
      return false;
    }
    return true;
  }, [leads]);

  const updateMedidas = useCallback(async (leadId: string, data: Omit<MedidasCliente, "leadId">) => {
    const anterior = medidas.find((m) => m.leadId === leadId);
    const payload = {
      lead_id: leadId,
      busto: data.busto, cintura: data.cintura, quadril: data.quadril,
      altura: data.altura, salto: data.salto ?? null, manequim: data.manequim,
    };
    setMedidas((prev) => {
      const exists = prev.find((m) => m.leadId === leadId);
      if (exists) return prev.map((m) => m.leadId === leadId ? { ...m, ...data } : m);
      return [...prev, { leadId, ...data }];
    });
    const { error } = await supabase.from("medidas").upsert(payload, { onConflict: "lead_id" });
    if (error) {
      setMedidas((prev) => anterior ? prev.map((m) => m.leadId === leadId ? anterior : m) : prev.filter((m) => m.leadId !== leadId));
      toast.error("Não foi possível salvar as medidas: " + error.message);
      return false;
    }
    return true;
  }, [medidas]);

  const getMedidas = useCallback((leadId: string) => medidas.find((m) => m.leadId === leadId), [medidas]);

  const getLeadsByStatus = useCallback((status: CrmFunnelStatus) => leads.filter((l) => l.statusFunil === status), [leads]);

  // === NEGÓCIOS (Comercial) ===
  const enviarParaComercial = useCallback(async (leadId: string, vestidoNome?: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, enviadoComercial: true } : l));
    await supabase.from("leads").update({ enviado_comercial: true }).eq("id", leadId);

    const existing = negocios.find((n) => n.clienteId === leadId && n.statusNegociacao !== "cancelado");
    if (existing) return existing;

    const vendedorId = await currentUserId();
    const insertRow = {
      cliente_id: lead.id, cliente_nome: lead.nome, cliente_cpf: lead.cpf,
      vestido_nome: vestidoNome || null, valor_negociado: 0, desconto: 0,
      metodo_pagamento: "", status_negociacao: "aberto", data_evento: lead.dataEvento,
      vendedor_id: vendedorId,
    };
    const { data, error } = await supabase.from("negocios").insert(insertRow).select().single();
    if (error || !data) return;
    const negocio = rowToNegocio(data as NegocioRow);
    setNegocios((prev) => [negocio, ...prev]);
    return negocio;
  }, [leads, negocios]);

  const updateNegocio = useCallback(async (negocioId: string, data: Partial<Negocio>) => {
    const patch: Record<string, unknown> = {};
    if (data.vestidoNome !== undefined) patch.vestido_nome = data.vestidoNome;
    if (data.valorNegociado !== undefined) patch.valor_negociado = data.valorNegociado;
    if (data.desconto !== undefined) patch.desconto = data.desconto;
    if (data.metodoPagamento !== undefined) patch.metodo_pagamento = data.metodoPagamento;
    if (data.statusNegociacao !== undefined) patch.status_negociacao = data.statusNegociacao;
    if (data.dataEvento !== undefined) patch.data_evento = data.dataEvento;
    const anterior = negocios.find((n) => n.id === negocioId);
    setNegocios((prev) => prev.map((n) => n.id === negocioId ? { ...n, ...data } : n));
    const { error } = await supabase.from("negocios").update(patch as never).eq("id", negocioId);
    if (error) {
      if (anterior) setNegocios((prev) => prev.map((n) => n.id === negocioId ? anterior : n));
      toast.error("Não foi possível atualizar o negócio: " + error.message);
      return false;
    }
    return true;
  }, [negocios]);

  // === CONTRATOS ===
  // Generates a human-readable contract number like MB-YYMM-### based on existing rows in the current month.
  const gerarNumeroContrato = useCallback(async (): Promise<string> => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count } = await supabase
      .from("contratos")
      .select("id", { count: "exact", head: true })
      .gte("created_at", start);
    const seq = String((count ?? 0) + 1).padStart(3, "0");
    return `MB-${yy}${mm}-${seq}`;
  }, []);

  const addContrato = useCallback(async (lead: Lead, valorTotal: number) => {
    const existing = contratos.find((c) => c.leadId === lead.id && c.statusAssinatura !== "cancelado");
    if (existing) return existing;
    const numero = await gerarNumeroContrato();
    const vendedorId = await currentUserId();
    const insertRow = {
      numero, lead_id: lead.id, nome_cliente: lead.nome, cpf_cliente: lead.cpf,
      email_cliente: lead.email ?? "",
      data_evento: lead.dataEvento, valor_total: valorTotal, status_assinatura: "pendente",
      termos_texto: gerarTermosContrato({
        nomeLocataria: lead.nome, cpf: lead.cpf, celular: lead.telefone, email: lead.email,
        produtoDescricao: lead.tipoEvento || "—", valorLocacao: valorTotal,
        formaPagamento: "—", dataEvento: lead.dataEvento,
      }),
      vendedor_id: vendedorId,
    };
    const { data, error } = await supabase.from("contratos").insert(insertRow).select().single();
    if (error || !data) return null;
    const newContrato = rowToContrato(data as ContratoRow);
    setContratos((prev) => [newContrato, ...prev]);
    return newContrato;
  }, [contratos, gerarNumeroContrato]);

  const addContratoFromNegocio = useCallback(async (negocio: Negocio) => {
    const lead = leads.find((l) => l.id === negocio.clienteId);
    if (!lead) {
      toast.error("Não foi possível gerar o contrato: cliente não encontrado.");
      return null;
    }
    const existing = contratos.find((c) => c.leadId === negocio.clienteId && c.statusAssinatura !== "cancelado");
    if (existing) return existing;
    // Validação mínima — evita contratos incompletos
    if (!negocio.clienteCpf?.trim() || !negocio.dataEvento || negocio.valorNegociado <= 0) {
      toast.error("Não foi possível gerar o contrato: falta CPF, data do evento ou valor da negociação.");
      return null;
    }
    const valorFinal = negocio.valorNegociado - negocio.desconto;
    const numero = await gerarNumeroContrato();
    const vendedorId = negocio.vendedorId ?? (await currentUserId());
    const insertRow = {
      numero, lead_id: negocio.clienteId, negocio_id: negocio.id,
      nome_cliente: negocio.clienteNome, cpf_cliente: negocio.clienteCpf,
      email_cliente: negocio.clienteEmail || lead.email || "",
      data_evento: negocio.dataEvento, valor_total: valorFinal, status_assinatura: "pendente",
      termos_texto: gerarTermosContrato({
        nomeLocataria: negocio.clienteNome, cpf: negocio.clienteCpf,
        celular: negocio.clienteTelefone || lead.telefone, email: negocio.clienteEmail || lead.email,
        produtoDescricao: negocio.vestidoNome || "—", valorLocacao: valorFinal,
        formaPagamento: negocio.metodoPagamento || "—",
        observacoesPagamento: negocio.desconto > 0 ? `Desconto aplicado: ${negocio.desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : undefined,
        dataEvento: negocio.dataEvento,
      }),
      vendedor_id: vendedorId,
    };
    const { data, error } = await supabase.from("contratos").insert(insertRow).select().single();
    if (error || !data) {
      toast.error("Não foi possível gravar o contrato: " + (error?.message ?? "erro desconhecido"));
      return null;
    }
    const newContrato = rowToContrato(data as ContratoRow);
    setContratos((prev) => [newContrato, ...prev]);
    return newContrato;
  }, [leads, contratos, gerarNumeroContrato]);

  // Gera o contrato direto de um lead: escolhe o produto do Acervo e o valor
  // na hora, completa CPF/celular/e-mail se estiverem faltando no lead, cria
  // (ou reaproveita) o negócio já aprovado — o que já dispara o financeiro
  // automático (comissão/taxa/imposto) — e por fim o contrato.
  const gerarContratoDireto = useCallback(async (params: {
    leadId: string;
    produtoDescricao: string;
    valor: number;
    metodoPagamento: string;
    dadosComplementares?: { nome?: string; cpf?: string; telefone?: string; email?: string };
  }): Promise<Contrato | null> => {
    const lead = leads.find((l) => l.id === params.leadId);
    if (!lead) return null;
    if (params.valor <= 0) return null;

    const extra = params.dadosComplementares ?? {};
    const nome = extra.nome?.trim() || lead.nome;
    const cpf = extra.cpf?.trim() || lead.cpf;
    const telefone = extra.telefone?.trim() || lead.telefone;
    const email = extra.email?.trim() || lead.email;
    if (!nome || !cpf?.trim() || !telefone?.trim() || !email?.trim()) return null;

    const leadPatch: Partial<Lead> = {};
    if (extra.nome && extra.nome.trim() !== lead.nome) leadPatch.nome = nome;
    if (extra.cpf && extra.cpf.trim() !== lead.cpf) leadPatch.cpf = cpf;
    if (extra.telefone && extra.telefone.trim() !== lead.telefone) leadPatch.telefone = telefone;
    if (extra.email && extra.email.trim() !== lead.email) leadPatch.email = email;
    if (Object.keys(leadPatch).length > 0) await updateLead(lead.id, leadPatch);

    const vendedorId = await currentUserId();
    let negocio = negocios.find((n) => n.clienteId === lead.id && n.statusNegociacao !== "cancelado");
    if (negocio) {
      await supabase.from("negocios").update({
        cliente_nome: nome, cliente_cpf: cpf, vestido_nome: params.produtoDescricao,
        valor_negociado: params.valor, metodo_pagamento: params.metodoPagamento,
        status_negociacao: "aprovado",
      }).eq("id", negocio.id);
      negocio = { ...negocio, clienteNome: nome, clienteCpf: cpf, vestidoNome: params.produtoDescricao, valorNegociado: params.valor, metodoPagamento: params.metodoPagamento, statusNegociacao: "aprovado" };
      setNegocios((prev) => prev.map((n) => n.id === negocio!.id ? negocio! : n));
    } else {
      const insertRow = {
        cliente_id: lead.id, cliente_nome: nome, cliente_cpf: cpf,
        vestido_nome: params.produtoDescricao, valor_negociado: params.valor, desconto: 0,
        metodo_pagamento: params.metodoPagamento, status_negociacao: "aprovado", data_evento: lead.dataEvento,
        vendedor_id: vendedorId,
      };
      const { data, error } = await supabase.from("negocios").insert(insertRow).select().single();
      if (error || !data) return null;
      negocio = rowToNegocio(data as NegocioRow);
      setNegocios((prev) => [negocio!, ...prev]);
    }

    if (!lead.enviadoComercial) {
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, enviadoComercial: true } : l));
      await supabase.from("leads").update({ enviado_comercial: true }).eq("id", lead.id);
    }

    const numero = await gerarNumeroContrato();
    const insertContrato = {
      numero, lead_id: lead.id, negocio_id: negocio.id,
      nome_cliente: nome, cpf_cliente: cpf, email_cliente: email,
      data_evento: lead.dataEvento, valor_total: params.valor, status_assinatura: "pendente",
      termos_texto: gerarTermosContrato({
        nomeLocataria: nome, cpf, celular: telefone, email,
        produtoDescricao: params.produtoDescricao, valorLocacao: params.valor,
        formaPagamento: params.metodoPagamento, dataEvento: lead.dataEvento,
      }),
      vendedor_id: vendedorId,
    };
    const { data, error } = await supabase.from("contratos").insert(insertContrato).select().single();
    if (error || !data) return null;
    const newContrato = rowToContrato(data as ContratoRow);
    setContratos((prev) => [newContrato, ...prev]);
    return newContrato;
  }, [leads, negocios, updateLead, gerarNumeroContrato]);

  const aprovarFechamento = useCallback(async (negocioId: string): Promise<{ contrato?: Contrato | null }> => {
    setNegocios((prev) => prev.map((n) => n.id === negocioId ? { ...n, statusNegociacao: "aprovado" as StatusNegociacao } : n));
    await supabase.from("negocios").update({ status_negociacao: "aprovado" }).eq("id", negocioId);
    const negocio = negocios.find((n) => n.id === negocioId);
    if (!negocio) return { contrato: null };
    const contrato = await addContratoFromNegocio({ ...negocio, statusNegociacao: "aprovado" });
    return { contrato };
  }, [negocios, addContratoFromNegocio]);

  const updateContratoStatus = useCallback(async (contratoId: string, status: ContratoStatus) => {
    const anterior = contratos.find((c) => c.id === contratoId);
    setContratos((prev) => prev.map((c) => c.id === contratoId ? { ...c, statusAssinatura: status } : c));
    const { error } = await supabase.from("contratos").update({ status_assinatura: status }).eq("id", contratoId);
    if (error) {
      if (anterior) setContratos((prev) => prev.map((c) => c.id === contratoId ? anterior : c));
      toast.error("Não foi possível atualizar o contrato: " + error.message);
    }
  }, [contratos]);

  const assinarContrato = useCallback(async (contratoId: string, assinaturaBase64: string) => {
    const dataAssinatura = new Date().toISOString();
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null;
    // Captura IP de forma best-effort. Se falhar (rede/bloqueio), grava null e segue.
    let ip: string | null = null;
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      if (r.ok) {
        const j = await r.json();
        if (typeof j?.ip === "string") ip = j.ip;
      }
    } catch { /* ignore */ }

    const anterior = contratos.find((c) => c.id === contratoId);
    setContratos((prev) => prev.map((c) =>
      c.id === contratoId
        ? {
            ...c,
            statusAssinatura: "assinado" as ContratoStatus,
            assinaturaBase64,
            dataAssinatura,
            ipAssinatura: ip ?? undefined,
            userAgentAssinatura: userAgent ?? undefined,
          }
        : c
    ));
    const { error } = await supabase.from("contratos").update({
      status_assinatura: "assinado",
      assinatura_base64: assinaturaBase64,
      data_assinatura: dataAssinatura,
      ip_assinatura: ip,
      user_agent_assinatura: userAgent,
    }).eq("id", contratoId);
    if (error) {
      if (anterior) setContratos((prev) => prev.map((c) => c.id === contratoId ? anterior : c));
      toast.error("Não foi possível registrar a assinatura: " + error.message);
      return false;
    }
    return true;
  }, [contratos]);

  const gerarLinkAssinatura = useCallback(async (contratoId: string, validadeHoras: number): Promise<string | null> => {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + validadeHoras * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("contratos")
      .update({ signing_token: token, token_expires_at: expiresAt })
      .eq("id", contratoId);
    if (error) return null;
    setContratos((prev) => prev.map((c) => c.id === contratoId ? { ...c } : c));
    return `${window.location.origin}/assinar/${token}`;
  }, []);

  return {
    leads, addLead, updateLeadStatus, updateLead,
    medidas, updateMedidas, getMedidas,
    contratos, addContrato, addContratoFromNegocio, gerarContratoDireto, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
    negocios, enviarParaComercial, updateNegocio, aprovarFechamento,
    getLeadsByStatus,
  };
}
