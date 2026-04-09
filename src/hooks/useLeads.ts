import { useState, useCallback } from "react";
import { Lead, MedidasCliente, Contrato, CrmFunnelStatus, ContratoStatus, Negocio, StatusNegociacao } from "@/types/comercial";

const STORAGE_KEY_LEADS = "mesbelle_leads";
const STORAGE_KEY_MEDIDAS = "mesbelle_medidas";
const STORAGE_KEY_CONTRATOS = "mesbelle_contratos";
const STORAGE_KEY_NEGOCIOS = "mesbelle_negocios";

const APP_STORAGE_KEYS = [STORAGE_KEY_LEADS, STORAGE_KEY_MEDIDAS, STORAGE_KEY_CONTRATOS, STORAGE_KEY_NEGOCIOS, "mesbelle_user", "mesbelle_vestidos", "mesbelle_reservas", "mesbelle_producoes", "mesbelle_etapas", "mesbelle_logistica"];

export function clearAppStorage() {
  APP_STORAGE_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
  });
}

function isValidLead(obj: unknown): obj is Lead {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.nome === "string" && typeof o.statusFunil === "string";
}

function isValidMedida(obj: unknown): obj is MedidasCliente {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return typeof o.leadId === "string";
}

function isValidContrato(obj: unknown): obj is Contrato {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.leadId === "string" && typeof o.valorTotal === "number";
}

function isValidNegocio(obj: unknown): obj is Negocio {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.clienteId === "string" && typeof o.statusNegociacao === "string";
}

function loadValidated<T>(key: string, fallback: T[], validator: (item: unknown) => item is T): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(key);
      return fallback;
    }
    const valid = parsed.filter(validator);
    if (valid.length !== parsed.length) {
      localStorage.setItem(key, JSON.stringify(valid));
    }
    return valid.length > 0 ? valid : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function saveToStorage(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

const initialLeads: Lead[] = [
  { id: "1", nome: "Ana Beatriz", telefone: "(11) 99876-5432", email: "ana@email.com", cpf: "123.456.789-00", endereco: "Rua das Flores, 123", tipoEvento: "Casamento", dataEvento: "2026-06-15", statusFunil: "novo_lead", notasInternas: "", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-04-01" },
  { id: "2", nome: "Fernanda Lima", telefone: "(21) 98765-4321", email: "fernanda@email.com", cpf: "987.654.321-00", endereco: "Av. Brasil, 456", tipoEvento: "Formatura", dataEvento: "2026-07-20", statusFunil: "novo_lead", notasInternas: "", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-04-02" },
  { id: "3", nome: "Mariana Souza", telefone: "(11) 91234-5678", email: "mariana@email.com", cpf: "456.789.123-00", endereco: "Rua XV, 789", tipoEvento: "Gala", dataEvento: "2026-06-10", statusFunil: "em_atendimento", notasInternas: "Cliente interessada em vestido longo dourado", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-03-28" },
  { id: "4", nome: "Camila Rocha", telefone: "(31) 99999-1234", email: "camila@email.com", cpf: "321.654.987-00", endereco: "Rua da Paz, 321", tipoEvento: "Casamento", dataEvento: "2026-06-05", statusFunil: "prova_agendada", notasInternas: "Agendou prova para sábado", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-03-20", provaData: "2026-04-12", provaHora: "14:00" },
  { id: "5", nome: "Patrícia Nunes", telefone: "(41) 98888-7777", email: "patricia@email.com", cpf: "654.321.987-00", endereco: "Rua Central, 654", tipoEvento: "Debutante", dataEvento: "2026-08-12", statusFunil: "em_atendimento", notasInternas: "Interessada em vestido rosa", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-03-15", enviadoComercial: true },
  { id: "6", nome: "Luciana Alves", telefone: "(11) 97777-6666", email: "luciana@email.com", cpf: "789.123.456-00", endereco: "Av. Paulista, 1000", tipoEvento: "Casamento", dataEvento: "2026-09-20", statusFunil: "em_atendimento", notasInternas: "Aguardando retorno sobre valor", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-03-25" },
];

const initialMedidas: MedidasCliente[] = [
  { leadId: "4", busto: "90", cintura: "68", quadril: "96", altura: "1.65", manequim: "40" },
  { leadId: "5", busto: "88", cintura: "66", quadril: "94", altura: "1.60", manequim: "38" },
];

const initialContratos: Contrato[] = [
  { id: "c1", numero: "0132", leadId: "5", nomeCliente: "Patrícia Nunes", cpfCliente: "654.321.987-00", dataEvento: "2026-08-12", dataCriacao: "2026-04-01", valorTotal: 4500, statusAssinatura: "assinado", termosTexto: "Contrato de aluguel de vestido de debutante..." },
];

const initialNegocios: Negocio[] = [
  { id: "n1", clienteId: "5", clienteNome: "Patrícia Nunes", clienteCpf: "654.321.987-00", vestidoNome: "Vestido Rosa Debutante", valorNegociado: 4500, desconto: 0, metodoPagamento: "Cartão 3x", statusNegociacao: "aprovado", dataEvento: "2026-08-12", criadoEm: "2026-03-30" },
];

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>(() => loadValidated(STORAGE_KEY_LEADS, initialLeads, isValidLead));
  const [medidas, setMedidas] = useState<MedidasCliente[]>(() => loadValidated(STORAGE_KEY_MEDIDAS, initialMedidas, isValidMedida));
  const [contratos, setContratos] = useState<Contrato[]>(() => loadValidated(STORAGE_KEY_CONTRATOS, initialContratos, isValidContrato));
  const [negocios, setNegocios] = useState<Negocio[]>(() => loadValidated(STORAGE_KEY_NEGOCIOS, initialNegocios, isValidNegocio));

  const persistLeads = useCallback((updated: Lead[]) => { setLeads(updated); saveToStorage(STORAGE_KEY_LEADS, updated); }, []);
  const persistContratos = useCallback((updated: Contrato[]) => { setContratos(updated); saveToStorage(STORAGE_KEY_CONTRATOS, updated); }, []);
  const persistNegocios = useCallback((updated: Negocio[]) => { setNegocios(updated); saveToStorage(STORAGE_KEY_NEGOCIOS, updated); }, []);

  // === LEADS / CRM ===
  const addLead = useCallback((lead: Omit<Lead, "id" | "criadoEm" | "statusFunil">) => {
    const newLead: Lead = { ...lead, id: crypto.randomUUID(), statusFunil: "novo_lead", criadoEm: new Date().toISOString().split("T")[0] };
    const updated = [...leads, newLead];
    persistLeads(updated);
    return newLead;
  }, [leads, persistLeads]);

  const updateLeadStatus = useCallback((leadId: string, newStatus: CrmFunnelStatus, extra?: Partial<Lead>) => {
    const updated = leads.map((l) => l.id === leadId ? { ...l, statusFunil: newStatus, ...extra } : l);
    persistLeads(updated);
  }, [leads, persistLeads]);

  const updateLead = useCallback((leadId: string, data: Partial<Lead>) => {
    const updated = leads.map((l) => l.id === leadId ? { ...l, ...data } : l);
    persistLeads(updated);
  }, [leads, persistLeads]);

  const updateMedidas = useCallback((leadId: string, data: Omit<MedidasCliente, "leadId">) => {
    const existing = medidas.find((m) => m.leadId === leadId);
    let updated: MedidasCliente[];
    if (existing) {
      updated = medidas.map((m) => m.leadId === leadId ? { ...m, ...data } : m);
    } else {
      updated = [...medidas, { leadId, ...data }];
    }
    setMedidas(updated);
    saveToStorage(STORAGE_KEY_MEDIDAS, updated);
  }, [medidas]);

  const getMedidas = useCallback((leadId: string) => medidas.find((m) => m.leadId === leadId), [medidas]);

  const getLeadsByStatus = useCallback((status: CrmFunnelStatus) => leads.filter((l) => l.statusFunil === status), [leads]);

  // === NEGÓCIOS (Comercial) ===
  const enviarParaComercial = useCallback((leadId: string, vestidoNome?: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    // Mark lead
    const updatedLeads = leads.map((l) => l.id === leadId ? { ...l, enviadoComercial: true } : l);
    persistLeads(updatedLeads);
    // Check for existing open negocio
    const existing = negocios.find((n) => n.clienteId === leadId && n.statusNegociacao !== "cancelado");
    if (existing) return existing;
    // Create negocio
    const negocio: Negocio = {
      id: crypto.randomUUID(),
      clienteId: lead.id,
      clienteNome: lead.nome,
      clienteCpf: lead.cpf,
      vestidoNome: vestidoNome || "",
      valorNegociado: 0,
      desconto: 0,
      metodoPagamento: "",
      statusNegociacao: "aberto",
      dataEvento: lead.dataEvento,
      criadoEm: new Date().toISOString().split("T")[0],
    };
    const updatedNegocios = [...negocios, negocio];
    persistNegocios(updatedNegocios);
    return negocio;
  }, [leads, negocios, persistLeads, persistNegocios]);

  const updateNegocio = useCallback((negocioId: string, data: Partial<Negocio>) => {
    const updated = negocios.map((n) => n.id === negocioId ? { ...n, ...data } : n);
    persistNegocios(updated);
  }, [negocios, persistNegocios]);

  const aprovarFechamento = useCallback((negocioId: string) => {
    const updated = negocios.map((n) => n.id === negocioId ? { ...n, statusNegociacao: "aprovado" as StatusNegociacao } : n);
    persistNegocios(updated);
  }, [negocios, persistNegocios]);

  // === CONTRATOS ===
  const addContrato = useCallback((lead: Lead, valorTotal: number) => {
    const existing = contratos.find((c) => c.leadId === lead.id && c.statusAssinatura !== "cancelado");
    if (existing) return existing;
    const numero = String(Date.now()).slice(-6);
    const newContrato: Contrato = {
      id: crypto.randomUUID(), numero, leadId: lead.id,
      nomeCliente: lead.nome, cpfCliente: lead.cpf, dataEvento: lead.dataEvento,
      dataCriacao: new Date().toISOString().split("T")[0], valorTotal,
      statusAssinatura: "pendente",
      termosTexto: `CONTRATO DE LOCAÇÃO DE VESTIDO\n\nContratante: ${lead.nome}\nCPF: ${lead.cpf}\nEvento: ${lead.tipoEvento}\nData do Evento: ${lead.dataEvento}\nValor Total: R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\nTermos e condições de uso do vestido...`,
    };
    const updated = [...contratos, newContrato];
    persistContratos(updated);
    return newContrato;
  }, [contratos, persistContratos]);

  const addContratoFromNegocio = useCallback((negocio: Negocio) => {
    const lead = leads.find((l) => l.id === negocio.clienteId);
    if (!lead) return;
    const existing = contratos.find((c) => c.leadId === negocio.clienteId && c.statusAssinatura !== "cancelado");
    if (existing) return existing;
    const valorFinal = negocio.valorNegociado - negocio.desconto;
    const numero = String(Date.now()).slice(-6);
    const newContrato: Contrato = {
      id: crypto.randomUUID(), numero, leadId: negocio.clienteId, negocioId: negocio.id,
      nomeCliente: negocio.clienteNome, cpfCliente: negocio.clienteCpf, dataEvento: negocio.dataEvento,
      dataCriacao: new Date().toISOString().split("T")[0], valorTotal: valorFinal,
      statusAssinatura: "pendente",
      termosTexto: `CONTRATO DE LOCAÇÃO DE VESTIDO\n\nContratante: ${negocio.clienteNome}\nCPF: ${negocio.clienteCpf}\nVestido: ${negocio.vestidoNome || "—"}\nData do Evento: ${negocio.dataEvento}\nValor: R$ ${valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nDesconto: R$ ${negocio.desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nPagamento: ${negocio.metodoPagamento}\n\nTermos e condições de uso do vestido...`,
    };
    const updated = [...contratos, newContrato];
    persistContratos(updated);
    return newContrato;
  }, [leads, contratos, persistContratos]);

  const updateContratoStatus = useCallback((contratoId: string, status: ContratoStatus) => {
    const updated = contratos.map((c) => c.id === contratoId ? { ...c, statusAssinatura: status } : c);
    persistContratos(updated);
  }, [contratos, persistContratos]);

  return {
    leads, addLead, updateLeadStatus, updateLead,
    medidas, updateMedidas, getMedidas,
    contratos, addContrato, addContratoFromNegocio, updateContratoStatus,
    negocios, enviarParaComercial, updateNegocio, aprovarFechamento,
    getLeadsByStatus,
  };
}
