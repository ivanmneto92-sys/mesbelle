import { useState, useCallback, useEffect } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Lead, MedidasCliente, Contrato, CrmFunnelStatus, ContratoStatus, Negocio, StatusNegociacao } from "@/types/comercial";
import type { DateRange } from "@/hooks/useDateRange";
import { gerarTermosContrato, gerarNumeroContrato } from "@/lib/contratoTemplate";
import { toast } from "sonner";
import { campoDuplicado, mensagemDuplicado } from "@/lib/telefone";

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
  tipo_negocio?: string | null; aprovado_em?: string | null; reserva_expira_em?: string | null;
  aprovado_sem_assinatura_motivo?: string | null;
};
const rowToNegocio = (r: NegocioRow): Negocio => ({
  id: r.id, clienteId: r.cliente_id, clienteNome: r.cliente_nome, clienteCpf: r.cliente_cpf,
  clienteTelefone: r.cliente_telefone ?? null, clienteEmail: r.cliente_email ?? null,
  vestidoNome: r.vestido_nome ?? undefined, valorNegociado: Number(r.valor_negociado),
  desconto: Number(r.desconto), metodoPagamento: r.metodo_pagamento,
  statusNegociacao: r.status_negociacao as StatusNegociacao,
  dataEvento: r.data_evento, criadoEm: r.criado_em, vendedorId: r.vendedor_id ?? null,
  tipoNegocio: r.tipo_negocio ?? undefined, aprovadoEm: r.aprovado_em ?? null,
  reservaExpiraEm: r.reserva_expira_em ?? null,
  aprovadoSemAssinaturaMotivo: r.aprovado_sem_assinatura_motivo ?? null,
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
    if (error || !data) {
      const campo = campoDuplicado(error);
      if (campo) {
        toast.error(mensagemDuplicado(campo));
      } else {
        toast.error("Não foi possível salvar a cliente: " + (error?.message ?? "erro desconhecido"));
      }
      return null;
    }
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
      const campo = campoDuplicado(error);
      toast.error(campo ? mensagemDuplicado(campo) : "Não foi possível salvar as alterações: " + error.message);
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
  }, [contratos]);

  const addContratoFromNegocio = useCallback(async (negocio: Negocio) => {
    const lead = leads.find((l) => l.id === negocio.clienteId);
    if (!lead) {
      toast.error("Não foi possível gerar o contrato: cliente não encontrado.");
      return null;
    }
    // Um contrato por venda (antes era um por cliente: quem voltava para um
    // segundo aluguel recebia o contrato antigo).
    const existing = contratos.find((c) => c.negocioId === negocio.id && c.statusAssinatura !== "cancelado");
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
      signing_token: crypto.randomUUID(),
      token_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    };
    const { data, error } = await supabase.from("contratos").insert(insertRow).select().single();
    if (error || !data) {
      toast.error("Não foi possível gravar o contrato: " + (error?.message ?? "erro desconhecido"));
      return null;
    }
    const newContrato = rowToContrato(data as ContratoRow);
    setContratos((prev) => [newContrato, ...prev]);
    return newContrato;
  }, [leads, contratos]);

  // Gera o contrato direto de um lead: escolhe o produto do Acervo e o valor
  // na hora e completa CPF/celular/e-mail se estiverem faltando no lead. Passa
  // pela mesma pré-venda do "Confirmar aluguel" (criar_pre_venda): a venda
  // fica aguardando assinatura e só fecha — e só aí entra no financeiro —
  // quando a cliente assina.
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

    const { data, error } = await supabase.rpc("criar_pre_venda", {
      p_dados: {
        lead_id: lead.id,
        tipo_negocio: "aluguel",
        confirmar_duplicidade: true,
        locataria: { nome, cpf, telefone, email },
        pagamento: { metodo: params.metodoPagamento, parcelas: 1 },
        negocios: [{
          vestido_nome: params.produtoDescricao,
          valor_negociado: params.valor,
          desconto: 0,
          data_evento: lead.dataEvento,
          valor_contrato: params.valor,
          termos_texto: gerarTermosContrato({
            nomeLocataria: nome, cpf, celular: telefone, email,
            produtoDescricao: params.produtoDescricao, valorLocacao: params.valor,
            formaPagamento: params.metodoPagamento, dataEvento: lead.dataEvento,
          }),
          reservas: [],
        }],
      },
    });
    if (error || !data) {
      toast.error("Não foi possível gerar o contrato: " + (error?.message ?? "erro desconhecido"));
      return null;
    }
    const contratoId = (data as { vendas: Array<{ contrato_id: string }> }).vendas[0]?.contrato_id;
    const { data: row } = await supabase.from("contratos").select("*").eq("id", contratoId).single();
    if (!row) return null;
    const newContrato = rowToContrato(row as ContratoRow);
    setContratos((prev) => (prev.some((c) => c.id === newContrato.id) ? prev : [newContrato, ...prev]));
    return newContrato;
  }, [leads, updateLead]);

  // "Aprovar" uma negociação não fecha mais a venda: gera o contrato e deixa
  // a venda aguardando a assinatura da cliente (48h). Ela só vira "aprovado"
  // quando o contrato é assinado.
  const aprovarFechamento = useCallback(async (negocioId: string): Promise<{ contrato?: Contrato | null }> => {
    const negocio = negocios.find((n) => n.id === negocioId);
    if (!negocio) return { contrato: null };
    const contrato = await addContratoFromNegocio(negocio);
    if (!contrato) return { contrato: null };
    const reservaExpiraEm = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("negocios")
      .update({ status_negociacao: "aguardando_assinatura", reserva_expira_em: reservaExpiraEm })
      .eq("id", negocioId);
    if (error) {
      toast.error("Contrato gerado, mas não consegui marcar a venda como aguardando assinatura: " + error.message);
    } else {
      setNegocios((prev) => prev.map((n) => n.id === negocioId
        ? { ...n, statusNegociacao: "aguardando_assinatura" as StatusNegociacao, reservaExpiraEm }
        : n));
    }
    return { contrato };
  }, [negocios, addContratoFromNegocio]);

  // Vendedora (a própria venda) ou admin desiste da venda antes da
  // assinatura: libera a peça e cancela o contrato.
  const cancelarPreVenda = useCallback(async (negocioId: string, motivo: string) => {
    const { error } = await supabase.rpc("cancelar_pre_venda", { p_negocio_id: negocioId, p_motivo: motivo });
    if (error) { toast.error(error.message); return false; }
    toast.success("Venda cancelada — a peça foi liberada.");
    return true;
  }, []);

  // Exceção: só admin, com motivo registrado (fica no negócio e na auditoria).
  const aprovarSemAssinatura = useCallback(async (negocioId: string, motivo: string) => {
    const { error } = await supabase.rpc("aprovar_venda_sem_assinatura", { p_negocio_id: negocioId, p_motivo: motivo });
    if (error) { toast.error(error.message); return false; }
    toast.success("Venda fechada sem assinatura (motivo registrado).");
    return true;
  }, []);

  const updateContratoStatus = useCallback(async (contratoId: string, status: ContratoStatus) => {
    const anterior = contratos.find((c) => c.id === contratoId);
    setContratos((prev) => prev.map((c) => c.id === contratoId ? { ...c, statusAssinatura: status } : c));
    const { error } = await supabase.from("contratos").update({ status_assinatura: status }).eq("id", contratoId);
    if (error) {
      if (anterior) setContratos((prev) => prev.map((c) => c.id === contratoId ? anterior : c));
      toast.error("Não foi possível atualizar o contrato: " + error.message);
    }
  }, [contratos]);

  // Assinatura presencial (iPad na loja). Vai pelo banco
  // (assinar_contrato_presencial): é a assinatura que fecha a venda —
  // financeiro, comissão, Produção, Logística — numa única transação.
  const assinarContrato = useCallback(async (contratoId: string, assinaturaBase64: string) => {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "";
    const { data, error } = await supabase.rpc("assinar_contrato_presencial", {
      p_contrato_id: contratoId, p_assinatura: assinaturaBase64, p_user_agent: userAgent,
    });
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    if (error || !res.ok) {
      const msg: Record<string, string> = {
        ja_assinado: "Este contrato já foi assinado.",
        cancelado: "Este contrato foi cancelado (a venda expirou ou foi cancelada). Registre a venda de novo.",
        assinatura_invalida: "Assinatura inválida — peça para a cliente assinar de novo.",
        sem_permissao: "Você não tem permissão para coletar assinaturas.",
        nao_encontrado: "Contrato não encontrado.",
      };
      toast.error(error?.message ?? msg[res.error ?? ""] ?? "Não foi possível registrar a assinatura.");
      return false;
    }
    const dataAssinatura = new Date().toISOString();
    setContratos((prev) => prev.map((c) =>
      c.id === contratoId ? { ...c, statusAssinatura: "assinado" as ContratoStatus, assinaturaBase64, dataAssinatura } : c
    ));
    // Confirmação por e-mail para a cliente e para os admins (best-effort).
    supabase.functions.invoke("enviar-contrato-cliente", { body: { contrato_id: contratoId } }).catch(console.error);
    return true;
  }, []);

  const gerarLinkAssinatura = useCallback(async (contratoId: string, validadeHoras: number): Promise<string | null> => {
    // Contrato de pré-venda já nasce com link (válido enquanto a peça está
    // reservada) — reaproveita em vez de gerar outro.
    const atual = contratos.find((c) => c.id === contratoId);
    if (atual?.signingToken && atual.tokenExpiresAt && new Date(atual.tokenExpiresAt) > new Date()) {
      return `${window.location.origin}/assinar/${atual.signingToken}`;
    }
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + validadeHoras * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("contratos")
      .update({ signing_token: token, token_expires_at: expiresAt })
      .eq("id", contratoId);
    if (error) return null;
    setContratos((prev) => prev.map((c) => c.id === contratoId ? { ...c, signingToken: token, tokenExpiresAt: expiresAt } : c));
    return `${window.location.origin}/assinar/${token}`;
  }, [contratos]);

  return {
    leads, addLead, updateLeadStatus, updateLead,
    medidas, updateMedidas, getMedidas,
    contratos, addContrato, addContratoFromNegocio, gerarContratoDireto, updateContratoStatus, assinarContrato, gerarLinkAssinatura,
    negocios, enviarParaComercial, updateNegocio, aprovarFechamento, cancelarPreVenda, aprovarSemAssinatura,
    getLeadsByStatus,
  };
}
