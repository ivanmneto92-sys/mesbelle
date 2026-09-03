import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lead, MedidasCliente, Contrato, CrmFunnelStatus, ContratoStatus, Negocio, StatusNegociacao } from "@/types/comercial";
import type { DateRange } from "@/hooks/useDateRange";
import { googleCalendar } from "@/hooks/useGoogleCalendar";
import { gerarTermosContrato } from "@/lib/contratoTemplate";

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
  valor_negociado: number; desconto: number; metodo_pagamento: string; status_negociacao: string;
  data_evento: string; criado_em: string; vendedor_id: string | null;
};
const rowToNegocio = (r: NegocioRow): Negocio => ({
  id: r.id, clienteId: r.cliente_id, clienteNome: r.cliente_nome, clienteCpf: r.cliente_cpf,
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

  // Realtime — sem isto, um lead/negócio criado por uma funcionária só
  // aparecia pra quem já tinha a tela de CRM aberta depois de recarregar a
  // página manualmente (o fetch acima só roda uma vez, ao montar ou trocar
  // o período). Reaplica o mesmo filtro de período do fetch inicial.
  useEffect(() => {
    const channel = supabase
      .channel(`leads_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, async () => {
        let leadsQuery = supabase.from("leads").select("*").order("created_at", { ascending: false });
        if (range) leadsQuery = leadsQuery.gte("criado_em", range.from).lte("criado_em", range.to);
        const { data } = await leadsQuery;
        if (data) setLeads((data as LeadRow[]).map(rowToLead));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "medidas" }, async () => {
        const { data } = await supabase.from("medidas").select("*");
        if (data) setMedidas((data as MedidaRow[]).map(rowToMedida));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contratos" }, async () => {
        const { data } = await supabase.from("contratos").select("*").order("created_at", { ascending: false });
        if (data) setContratos((data as ContratoRow[]).map(rowToContrato));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "negocios" }, async () => {
        const { data } = await supabase.from("negocios").select("*").order("created_at", { ascending: false });
        if (data) setNegocios((data as NegocioRow[]).map(rowToNegocio));
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
    if (error || !data) return null;
    const newLead = rowToLead(data as LeadRow);
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  }, []);

  const updateLeadStatus = useCallback(async (leadId: string, newStatus: CrmFunnelStatus, extra?: Partial<Lead>) => {
    const patch = { ...leadPatchToRow(extra ?? {}), status_funil: newStatus };
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, statusFunil: newStatus, ...(extra ?? {}) } : l));
    await supabase.from("leads").update(patch as never).eq("id", leadId);

    if (extra && "provaData" in extra) {
      const lead = leads.find((l) => l.id === leadId);
      if (extra.provaData) {
        // Sincronizar com Google Calendar (fire-and-forget — não bloquear a UI)
        googleCalendar.upsertProva({
          leadId,
          nome: extra.nome ?? lead?.nome ?? "",
          data: extra.provaData,
          hora: extra.provaHora ?? lead?.provaHora,
          tipoEvento: lead?.tipoEvento,
        }).catch(console.error);
      } else {
        googleCalendar.deleteProva(leadId).catch(console.error);
      }
    }
  }, [leads]);

  const updateLead = useCallback(async (leadId: string, data: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, ...data } : l));
    await supabase.from("leads").update(leadPatchToRow(data) as never).eq("id", leadId);

    if (data.provaData !== undefined) {
      const lead = leads.find((l) => l.id === leadId);
      if (data.provaData && lead) {
        // Sincronizar com Google Calendar (fire-and-forget — não bloquear a UI)
        googleCalendar.upsertProva({
          leadId,
          nome: data.nome ?? lead.nome,
          data: data.provaData,
          hora: data.provaHora ?? lead.provaHora,
          tipoEvento: lead.tipoEvento,
        }).catch(console.error);
      } else if (!data.provaData) {
        googleCalendar.deleteProva(leadId).catch(console.error);
      }
    }
  }, [leads]);

  const updateMedidas = useCallback(async (leadId: string, data: Omit<MedidasCliente, "leadId">) => {
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
    await supabase.from("medidas").upsert(payload, { onConflict: "lead_id" });
  }, []);

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
    setNegocios((prev) => prev.map((n) => n.id === negocioId ? { ...n, ...data } : n));
    await supabase.from("negocios").update(patch as never).eq("id", negocioId);
  }, []);

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
    if (!lead) return null;
    const existing = contratos.find((c) => c.leadId === negocio.clienteId && c.statusAssinatura !== "cancelado");
    if (existing) return existing;
    // Validação mínima — evita contratos incompletos
    if (!lead.cpf?.trim() || !negocio.dataEvento || negocio.valorNegociado <= 0) {
      return null;
    }
    const valorFinal = negocio.valorNegociado - negocio.desconto;
    const numero = await gerarNumeroContrato();
    const vendedorId = negocio.vendedorId ?? (await currentUserId());
    const insertRow = {
      numero, lead_id: negocio.clienteId, negocio_id: negocio.id,
      nome_cliente: negocio.clienteNome, cpf_cliente: negocio.clienteCpf,
      email_cliente: lead.email ?? "",
      data_evento: negocio.dataEvento, valor_total: valorFinal, status_assinatura: "pendente",
      termos_texto: gerarTermosContrato({
        nomeLocataria: negocio.clienteNome, cpf: negocio.clienteCpf, celular: lead.telefone, email: lead.email,
        produtoDescricao: negocio.vestidoNome || "—", valorLocacao: valorFinal,
        formaPagamento: negocio.metodoPagamento || "—",
        observacoesPagamento: negocio.desconto > 0 ? `Desconto aplicado: ${negocio.desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : undefined,
        dataEvento: negocio.dataEvento,
      }),
      vendedor_id: vendedorId,
    };
    const { data, error } = await supabase.from("contratos").insert(insertRow).select().single();
    if (error || !data) return null;
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
    setContratos((prev) => prev.map((c) => c.id === contratoId ? { ...c, statusAssinatura: status } : c));
    await supabase.from("contratos").update({ status_assinatura: status }).eq("id", contratoId);
  }, []);

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
    await supabase.from("contratos").update({
      status_assinatura: "assinado",
      assinatura_base64: assinaturaBase64,
      data_assinatura: dataAssinatura,
      ip_assinatura: ip,
      user_agent_assinatura: userAgent,
    }).eq("id", contratoId);
  }, []);

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
