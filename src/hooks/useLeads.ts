import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lead, MedidasCliente, Contrato, CrmFunnelStatus, ContratoStatus, Negocio, StatusNegociacao } from "@/types/comercial";

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

// ============= DB row → domain mappers =============
type LeadRow = {
  id: string; nome: string; telefone: string; email: string; cpf: string; endereco: string;
  tipo_evento: string; data_evento: string; status_funil: string; notas_internas: string;
  vendedor_responsavel: string; prova_data: string | null; prova_hora: string | null;
  enviado_comercial: boolean; criado_em: string;
};
const rowToLead = (r: LeadRow): Lead => ({
  id: r.id, nome: r.nome, telefone: r.telefone, email: r.email, cpf: r.cpf, endereco: r.endereco,
  tipoEvento: r.tipo_evento, dataEvento: r.data_evento, statusFunil: r.status_funil as CrmFunnelStatus,
  notasInternas: r.notas_internas, vendedorResponsavel: r.vendedor_responsavel,
  criadoEm: r.criado_em, provaData: r.prova_data ?? undefined, provaHora: r.prova_hora ?? undefined,
  enviadoComercial: r.enviado_comercial,
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
});

type NegocioRow = {
  id: string; cliente_id: string; cliente_nome: string; cliente_cpf: string; vestido_nome: string | null;
  valor_negociado: number; desconto: number; metodo_pagamento: string; status_negociacao: string;
  data_evento: string; criado_em: string;
};
const rowToNegocio = (r: NegocioRow): Negocio => ({
  id: r.id, clienteId: r.cliente_id, clienteNome: r.cliente_nome, clienteCpf: r.cliente_cpf,
  vestidoNome: r.vestido_nome ?? undefined, valorNegociado: Number(r.valor_negociado),
  desconto: Number(r.desconto), metodoPagamento: r.metodo_pagamento,
  statusNegociacao: r.status_negociacao as StatusNegociacao,
  dataEvento: r.data_evento, criadoEm: r.criado_em,
});

export function useLeads() {
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
      const [leadsRes, medidasRes, contratosRes, negociosRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
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
  }, []);

  // === LEADS / CRM ===
  const addLead = useCallback(async (lead: Omit<Lead, "id" | "criadoEm" | "statusFunil">) => {
    const insertRow = {
      nome: lead.nome,
      ...leadPatchToRow(lead as Partial<Lead>),
      status_funil: "novo_lead",
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
  }, []);

  const updateLead = useCallback(async (leadId: string, data: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, ...data } : l));
    await supabase.from("leads").update(leadPatchToRow(data) as never).eq("id", leadId);
  }, []);

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

    const insertRow = {
      cliente_id: lead.id, cliente_nome: lead.nome, cliente_cpf: lead.cpf,
      vestido_nome: vestidoNome || null, valor_negociado: 0, desconto: 0,
      metodo_pagamento: "", status_negociacao: "aberto", data_evento: lead.dataEvento,
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

  const aprovarFechamento = useCallback(async (negocioId: string) => {
    setNegocios((prev) => prev.map((n) => n.id === negocioId ? { ...n, statusNegociacao: "aprovado" as StatusNegociacao } : n));
    await supabase.from("negocios").update({ status_negociacao: "aprovado" }).eq("id", negocioId);
  }, []);

  // === CONTRATOS ===
  const addContrato = useCallback(async (lead: Lead, valorTotal: number) => {
    const existing = contratos.find((c) => c.leadId === lead.id && c.statusAssinatura !== "cancelado");
    if (existing) return existing;
    const numero = String(Date.now()).slice(-6);
    const insertRow = {
      numero, lead_id: lead.id, nome_cliente: lead.nome, cpf_cliente: lead.cpf,
      data_evento: lead.dataEvento, valor_total: valorTotal, status_assinatura: "pendente",
      termos_texto: `CONTRATO DE LOCAÇÃO DE VESTIDO\n\nContratante: ${lead.nome}\nCPF: ${lead.cpf}\nEvento: ${lead.tipoEvento}\nData do Evento: ${lead.dataEvento}\nValor Total: R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\nTermos e condições de uso do vestido...`,
    };
    const { data, error } = await supabase.from("contratos").insert(insertRow).select().single();
    if (error || !data) return null;
    const newContrato = rowToContrato(data as ContratoRow);
    setContratos((prev) => [newContrato, ...prev]);
    return newContrato;
  }, [contratos]);

  const addContratoFromNegocio = useCallback(async (negocio: Negocio) => {
    const lead = leads.find((l) => l.id === negocio.clienteId);
    if (!lead) return;
    const existing = contratos.find((c) => c.leadId === negocio.clienteId && c.statusAssinatura !== "cancelado");
    if (existing) return existing;
    const valorFinal = negocio.valorNegociado - negocio.desconto;
    const numero = String(Date.now()).slice(-6);
    const insertRow = {
      numero, lead_id: negocio.clienteId, negocio_id: negocio.id,
      nome_cliente: negocio.clienteNome, cpf_cliente: negocio.clienteCpf,
      data_evento: negocio.dataEvento, valor_total: valorFinal, status_assinatura: "pendente",
      termos_texto: `CONTRATO DE LOCAÇÃO DE VESTIDO\n\nContratante: ${negocio.clienteNome}\nCPF: ${negocio.clienteCpf}\nVestido: ${negocio.vestidoNome || "—"}\nData do Evento: ${negocio.dataEvento}\nValor: R$ ${valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nDesconto: R$ ${negocio.desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nPagamento: ${negocio.metodoPagamento}\n\nTermos e condições de uso do vestido...`,
    };
    const { data, error } = await supabase.from("contratos").insert(insertRow).select().single();
    if (error || !data) return null;
    const newContrato = rowToContrato(data as ContratoRow);
    setContratos((prev) => [newContrato, ...prev]);
    return newContrato;
  }, [leads, contratos]);

  const updateContratoStatus = useCallback(async (contratoId: string, status: ContratoStatus) => {
    setContratos((prev) => prev.map((c) => c.id === contratoId ? { ...c, statusAssinatura: status } : c));
    await supabase.from("contratos").update({ status_assinatura: status }).eq("id", contratoId);
  }, []);

  const assinarContrato = useCallback(async (contratoId: string, assinaturaBase64: string) => {
    const dataAssinatura = new Date().toISOString();
    setContratos((prev) => prev.map((c) =>
      c.id === contratoId
        ? { ...c, statusAssinatura: "assinado" as ContratoStatus, assinaturaBase64, dataAssinatura }
        : c
    ));
    await supabase.from("contratos").update({
      status_assinatura: "assinado",
      assinatura_base64: assinaturaBase64,
      data_assinatura: dataAssinatura,
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
    contratos, addContrato, addContratoFromNegocio, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
    negocios, enviarParaComercial, updateNegocio, aprovarFechamento,
    getLeadsByStatus,
  };
}
