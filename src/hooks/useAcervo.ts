import { useState, useCallback } from "react";
import {
  Vestido, ReservaAgenda, Producao, EtapaProducao, DEFAULT_ETAPAS,
} from "@/types/acervo";

const SK_VESTIDOS = "mesbelle_vestidos";
const SK_RESERVAS = "mesbelle_reservas";
const SK_PRODUCOES = "mesbelle_producoes";
const SK_ETAPAS = "mesbelle_etapas";

export const ACERVO_STORAGE_KEYS = [SK_VESTIDOS, SK_RESERVAS, SK_PRODUCOES, SK_ETAPAS];

// --- seed data ---
const SEED_VESTIDOS: Vestido[] = [
  { id: "v1", nome: "Sereia Bordado Pedraria", cor: "Marsala", tamanho: "M", comprimento: "Longo", precoAluguel: 1200, precoVenda: 4800, status: "disponivel", isConsignado: false, imagemUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300&h=400&fit=crop" },
  { id: "v2", nome: "Princesa Tule Rosa", cor: "Rosa", tamanho: "P", comprimento: "Longo", precoAluguel: 980, precoVenda: 3500, status: "alugado", isConsignado: false, imagemUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop" },
  { id: "v3", nome: "Midi Crepe Dourado", cor: "Dourado", tamanho: "G", comprimento: "Midi", precoAluguel: 650, precoVenda: 2200, status: "disponivel", isConsignado: true, imagemUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=400&fit=crop" },
  { id: "v4", nome: "Longo Renda Preto", cor: "Preto", tamanho: "M", comprimento: "Longo", precoAluguel: 890, precoVenda: 3200, status: "ajuste", isConsignado: false, imagemUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop" },
  { id: "v5", nome: "Tomara que Caia Azul", cor: "Azul Royal", tamanho: "P", comprimento: "Longo", precoAluguel: 1100, precoVenda: 4200, status: "disponivel", isConsignado: false, imagemUrl: "https://images.unsplash.com/photo-1562137369-1a1a0bc66744?w=300&h=400&fit=crop" },
  { id: "v6", nome: "A-line Verde Esmeralda", cor: "Verde", tamanho: "GG", comprimento: "Longo", precoAluguel: 780, precoVenda: 2800, status: "disponivel", isConsignado: true, imagemUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop" },
];

const SEED_PRODUCOES: Producao[] = [
  { id: "p1", tituloVestido: "Vestido Sereia Pedraria", clienteNome: "Maria Silva", dataPrazo: "2026-07-20", dataProva: "2026-07-10", statusGeral: "em_producao", refImagensUrls: [], notasTecnicas: "Renda francesa na barra. Decote profundo nas costas. Medidas: busto 90cm, cintura 68cm, quadril 98cm." },
];

const SEED_ETAPAS: EtapaProducao[] = DEFAULT_ETAPAS.map((nome, i) => ({
  id: `e1-${i}`,
  producaoId: "p1",
  nomeEtapa: nome,
  isConcluido: i < 3,
}));

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch { return fallback; }
}

function saveJson<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function genId() { return crypto.randomUUID(); }

export function useAcervo() {
  const [vestidos, setVestidos] = useState<Vestido[]>(() => loadJson(SK_VESTIDOS, SEED_VESTIDOS));
  const [reservas, setReservas] = useState<ReservaAgenda[]>(() => loadJson(SK_RESERVAS, []));
  const [producoes, setProducoes] = useState<Producao[]>(() => loadJson(SK_PRODUCOES, SEED_PRODUCOES));
  const [etapas, setEtapas] = useState<EtapaProducao[]>(() => loadJson(SK_ETAPAS, SEED_ETAPAS));

  // --- Vestidos ---
  const addVestido = useCallback((v: Omit<Vestido, "id">) => {
    setVestidos(prev => { const next = [...prev, { ...v, id: genId() }]; saveJson(SK_VESTIDOS, next); return next; });
  }, []);

  const updateVestido = useCallback((id: string, patch: Partial<Vestido>) => {
    setVestidos(prev => { const next = prev.map(v => v.id === id ? { ...v, ...patch } : v); saveJson(SK_VESTIDOS, next); return next; });
  }, []);

  const deleteVestido = useCallback((id: string) => {
    setVestidos(prev => { const next = prev.filter(v => v.id !== id); saveJson(SK_VESTIDOS, next); return next; });
  }, []);

  // --- Reservas ---
  const addReserva = useCallback((r: Omit<ReservaAgenda, "id">) => {
    setReservas(prev => { const next = [...prev, { ...r, id: genId() }]; saveJson(SK_RESERVAS, next); return next; });
  }, []);

  const getReservasForVestido = useCallback((vestidoId: string) => {
    return reservas.filter(r => r.vestidoId === vestidoId);
  }, [reservas]);

  // --- Producoes ---
  const addProducao = useCallback((p: Omit<Producao, "id">) => {
    const id = genId();
    setProducoes(prev => { const next = [...prev, { ...p, id }]; saveJson(SK_PRODUCOES, next); return next; });
    const newEtapas = DEFAULT_ETAPAS.map(nome => ({ id: genId(), producaoId: id, nomeEtapa: nome, isConcluido: false }));
    setEtapas(prev => { const next = [...prev, ...newEtapas]; saveJson(SK_ETAPAS, next); return next; });
  }, []);

  const updateProducao = useCallback((id: string, patch: Partial<Producao>) => {
    setProducoes(prev => { const next = prev.map(p => p.id === id ? { ...p, ...patch } : p); saveJson(SK_PRODUCOES, next); return next; });
  }, []);

  // --- Etapas ---
  const toggleEtapa = useCallback((etapaId: string) => {
    setEtapas(prev => {
      const next = prev.map(e => e.id === etapaId ? { ...e, isConcluido: !e.isConcluido } : e);
      saveJson(SK_ETAPAS, next);
      return next;
    });
  }, []);

  const getEtapasForProducao = useCallback((producaoId: string) => {
    return etapas.filter(e => e.producaoId === producaoId);
  }, [etapas]);

  return {
    vestidos, addVestido, updateVestido, deleteVestido,
    reservas, addReserva, getReservasForVestido,
    producoes, addProducao, updateProducao,
    etapas, toggleEtapa, getEtapasForProducao,
  };
}
