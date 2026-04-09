import { useState, useCallback } from "react";
import { Lead, MedidasCliente, Contrato, FunnelStatus, ContratoStatus } from "@/types/comercial";

const STORAGE_KEY_LEADS = "mesbelle_leads";
const STORAGE_KEY_MEDIDAS = "mesbelle_medidas";
const STORAGE_KEY_CONTRATOS = "mesbelle_contratos";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

const initialLeads: Lead[] = [
  { id: "1", nome: "Ana Beatriz", telefone: "(11) 99876-5432", email: "ana@email.com", cpf: "123.456.789-00", endereco: "Rua das Flores, 123", tipoEvento: "Casamento", dataEvento: "2026-06-15", statusFunil: "lead", notasInternas: "", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-04-01" },
  { id: "2", nome: "Fernanda Lima", telefone: "(21) 98765-4321", email: "fernanda@email.com", cpf: "987.654.321-00", endereco: "Av. Brasil, 456", tipoEvento: "Formatura", dataEvento: "2026-07-20", statusFunil: "lead", notasInternas: "", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-04-02" },
  { id: "3", nome: "Mariana Souza", telefone: "(11) 91234-5678", email: "mariana@email.com", cpf: "456.789.123-00", endereco: "Rua XV, 789", tipoEvento: "Gala", dataEvento: "2026-06-10", statusFunil: "contato", notasInternas: "Cliente interessada em vestido longo dourado", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-03-28" },
  { id: "4", nome: "Camila Rocha", telefone: "(31) 99999-1234", email: "camila@email.com", cpf: "321.654.987-00", endereco: "Rua da Paz, 321", tipoEvento: "Casamento", dataEvento: "2026-06-05", statusFunil: "prova", notasInternas: "Agendou prova para sábado", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-03-20", provaData: "2026-04-12", provaHora: "14:00" },
  { id: "5", nome: "Patrícia Nunes", telefone: "(41) 98888-7777", email: "patricia@email.com", cpf: "654.321.987-00", endereco: "Rua Central, 654", tipoEvento: "Debutante", dataEvento: "2026-08-12", statusFunil: "fechamento", notasInternas: "Fechou contrato, vestido rosa", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-03-15" },
  { id: "6", nome: "Luciana Alves", telefone: "(11) 97777-6666", email: "luciana@email.com", cpf: "789.123.456-00", endereco: "Av. Paulista, 1000", tipoEvento: "Casamento", dataEvento: "2026-09-20", statusFunil: "negociacao", notasInternas: "Aguardando retorno sobre valor", vendedorResponsavel: "Juliana Costa", criadoEm: "2026-03-25" },
];

const initialMedidas: MedidasCliente[] = [
  { leadId: "4", busto: "90", cintura: "68", quadril: "96", altura: "1.65", manequim: "40" },
  { leadId: "5", busto: "88", cintura: "66", quadril: "94", altura: "1.60", manequim: "38" },
];

const initialContratos: Contrato[] = [
  { id: "c1", numero: "0132", leadId: "5", nomeCliente: "Patrícia Nunes", cpfCliente: "654.321.987-00", dataEvento: "2026-08-12", dataCriacao: "2026-04-01", valorTotal: 4500, statusAssinatura: "assinado", termosTexto: "Contrato de aluguel de vestido de debutante..." },
];

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>(() => loadFromStorage(STORAGE_KEY_LEADS, initialLeads));
  const [medidas, setMedidas] = useState<MedidasCliente[]>(() => loadFromStorage(STORAGE_KEY_MEDIDAS, initialMedidas));
  const [contratos, setContratos] = useState<Contrato[]>(() => loadFromStorage(STORAGE_KEY_CONTRATOS, initialContratos));

  const persistLeads = useCallback((updated: Lead[]) => {
    setLeads(updated);
    saveToStorage(STORAGE_KEY_LEADS, updated);
  }, []);

  const persistContratos = useCallback((updated: Contrato[]) => {
    setContratos(updated);
    saveToStorage(STORAGE_KEY_CONTRATOS, updated);
  }, []);

  const addLead = useCallback((lead: Omit<Lead, "id" | "criadoEm" | "statusFunil">) => {
    const newLead: Lead = {
      ...lead,
      id: crypto.randomUUID(),
      statusFunil: "lead",
      criadoEm: new Date().toISOString().split("T")[0],
    };
    const updated = [...leads, newLead];
    persistLeads(updated);
    return newLead;
  }, [leads, persistLeads]);

  const updateLeadStatus = useCallback((leadId: string, newStatus: FunnelStatus) => {
    const updated = leads.map((l) => l.id === leadId ? { ...l, statusFunil: newStatus } : l);
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

  const getMedidas = useCallback((leadId: string) => {
    return medidas.find((m) => m.leadId === leadId);
  }, [medidas]);

  const getLeadsByStatus = useCallback((status: FunnelStatus) => {
    return leads.filter((l) => l.statusFunil === status);
  }, [leads]);

  const addContrato = useCallback((lead: Lead, valorTotal: number) => {
    const numero = String(contratos.length + 130).padStart(4, "0");
    const newContrato: Contrato = {
      id: crypto.randomUUID(),
      numero,
      leadId: lead.id,
      nomeCliente: lead.nome,
      cpfCliente: lead.cpf,
      dataEvento: lead.dataEvento,
      dataCriacao: new Date().toISOString().split("T")[0],
      valorTotal,
      statusAssinatura: "pendente",
      termosTexto: `CONTRATO DE LOCAÇÃO DE VESTIDO\n\nContratante: ${lead.nome}\nCPF: ${lead.cpf}\nEvento: ${lead.tipoEvento}\nData do Evento: ${lead.dataEvento}\nValor Total: R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\nTermos e condições de uso do vestido...`,
    };
    const updated = [...contratos, newContrato];
    persistContratos(updated);
    return newContrato;
  }, [contratos, persistContratos]);

  const updateContratoStatus = useCallback((contratoId: string, status: ContratoStatus) => {
    const updated = contratos.map((c) => c.id === contratoId ? { ...c, statusAssinatura: status } : c);
    persistContratos(updated);
  }, [contratos, persistContratos]);

  return {
    leads, addLead, updateLeadStatus, updateLead,
    medidas, updateMedidas, getMedidas,
    contratos, addContrato, updateContratoStatus,
    getLeadsByStatus,
  };
}
