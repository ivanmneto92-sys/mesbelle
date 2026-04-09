import { useState, useCallback, useMemo } from "react";
import { AtivoPatrimonio, SocioEmpresa, CategoriaAtivo } from "@/types/socios";
import { Transacao } from "@/types/financeiro";

const ATIVOS_KEY = "mesbelle_ativos";
const SOCIOS_KEY = "mesbelle_socios";
const MULT_KEY = "mesbelle_multiplicador";
const FIN_KEY = "mesbelle_financeiro";

const initialAtivos: AtivoPatrimonio[] = [
  { id: "at1", nome: "Vestido Sereia Bordado", categoria: "Vestido", dataCompra: "2025-10-08", valorOriginal: 4800, percentualDesagio: 20 },
  { id: "at2", nome: "Vestido Princesa Tule", categoria: "Vestido", dataCompra: "2025-04-08", valorOriginal: 3500, percentualDesagio: 30 },
  { id: "at3", nome: "Vestido Midi Crepe", categoria: "Vestido", dataCompra: "2026-01-08", valorOriginal: 2200, percentualDesagio: 15 },
  { id: "at4", nome: "Móveis da Loja", categoria: "Imobilizado", dataCompra: "2024-04-08", valorOriginal: 25000, percentualDesagio: 40 },
  { id: "at5", nome: "Máquina de Costura Industrial", categoria: "Equipamento", dataCompra: "2025-04-08", valorOriginal: 8000, percentualDesagio: 25 },
  { id: "at6", nome: "Vestido Longo Renda Preto", categoria: "Vestido", dataCompra: "2025-07-15", valorOriginal: 3800, percentualDesagio: 18 },
];

const initialSocios: SocioEmpresa[] = [
  { id: "s1", nome: "Ricardo Almeida", percentualParticipacao: 50, ativo: true },
  { id: "s2", nome: "Carolina Mendes", percentualParticipacao: 30, ativo: true },
  { id: "s3", nome: "André Pereira", percentualParticipacao: 20, ativo: true },
];

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T) : fallback;
  } catch { return fallback; }
}

function saveJSON(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function getIdade(dataCompra: string): string {
  const compra = new Date(dataCompra);
  const now = new Date();
  const meses = (now.getFullYear() - compra.getFullYear()) * 12 + (now.getMonth() - compra.getMonth());
  if (meses < 1) return "< 1 mês";
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  const rest = meses % 12;
  return rest > 0 ? `${anos} ano${anos > 1 ? "s" : ""} e ${rest} mês${rest > 1 ? "es" : ""}` : `${anos} ano${anos > 1 ? "s" : ""}`;
}

function loadFinanceiroData() {
  try {
    const raw = localStorage.getItem(FIN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Transacao[]) : [];
  } catch { return []; }
}

export function useSocios() {
  const [ativos, setAtivos] = useState<AtivoPatrimonio[]>(() => loadJSON(ATIVOS_KEY, initialAtivos));
  const [socios, setSocios] = useState<SocioEmpresa[]>(() => loadJSON(SOCIOS_KEY, initialSocios));
  const [multiplicador, setMultiplicador] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(MULT_KEY);
      return raw ? parseFloat(raw) || 3.5 : 3.5;
    } catch { return 3.5; }
  });

  const persistAtivos = useCallback((data: AtivoPatrimonio[]) => { setAtivos(data); saveJSON(ATIVOS_KEY, data); }, []);
  const persistSocios = useCallback((data: SocioEmpresa[]) => { setSocios(data); saveJSON(SOCIOS_KEY, data); }, []);

  const updateMultiplicador = useCallback((val: number) => {
    setMultiplicador(val);
    try { localStorage.setItem(MULT_KEY, String(val)); } catch {}
  }, []);

  const addAtivo = useCallback((a: Omit<AtivoPatrimonio, "id">) => {
    persistAtivos([...ativos, { ...a, id: crypto.randomUUID() }]);
  }, [ativos, persistAtivos]);

  const removeAtivo = useCallback((id: string) => {
    persistAtivos(ativos.filter(a => a.id !== id));
  }, [ativos, persistAtivos]);

  const toggleSocioAtivo = useCallback((id: string) => {
    persistSocios(socios.map(s => s.id === id ? { ...s, ativo: !s.ativo } : s));
  }, [socios, persistSocios]);

  const updateSocioExpiracao = useCallback((id: string, data: string) => {
    persistSocios(socios.map(s => s.id === id ? { ...s, dataExpiracao: data } : s));
  }, [socios, persistSocios]);

  // Financial data from Financeiro module
  const finData = useMemo(() => {
    const transacoes = loadFinanceiroData();
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const doMes = transacoes.filter((t: Transacao) => t.data.startsWith(mesAtual));
    const receitaMes = doMes.filter((t: Transacao) => t.tipo === "entrada").reduce((s: number, t: Transacao) => s + t.valor, 0);
    const despesaMes = doMes.filter((t: Transacao) => t.tipo === "saida").reduce((s: number, t: Transacao) => s + t.valor, 0);
    const lucroMes = receitaMes - despesaMes;

    // EBITDA: últimos 12 meses
    let ebitda = 0;
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthTx = transacoes.filter((t: Transacao) => t.data.startsWith(key));
      const rec = monthTx.filter((t: Transacao) => t.tipo === "entrada").reduce((s: number, t: Transacao) => s + t.valor, 0);
      const desp = monthTx.filter((t: Transacao) => t.tipo === "saida").reduce((s: number, t: Transacao) => s + t.valor, 0);
      ebitda += rec - desp;
    }

    return { receitaMes, lucroMes, ebitda };
  }, []);

  // Patrimônio calculations
  const ativosComCalculo = useMemo(() => {
    return ativos.map(a => ({
      ...a,
      valorAtual: a.valorOriginal - (a.valorOriginal * a.percentualDesagio / 100),
      idade: getIdade(a.dataCompra),
    }));
  }, [ativos]);

  const totalPatrimonio = useMemo(() => ativosComCalculo.reduce((s, a) => s + a.valorAtual, 0), [ativosComCalculo]);

  const valuation = useMemo(() => finData.ebitda * multiplicador, [finData.ebitda, multiplicador]);

  // Distribuição de lucros
  const distribuicao = useMemo(() => {
    return socios.filter(s => s.ativo).map(s => ({
      ...s,
      lucroMensal: finData.lucroMes * (s.percentualParticipacao / 100),
    }));
  }, [socios, finData.lucroMes]);

  return {
    ativos: ativosComCalculo,
    socios,
    distribuicao,
    multiplicador,
    updateMultiplicador,
    addAtivo,
    removeAtivo,
    toggleSocioAtivo,
    updateSocioExpiracao,
    totalPatrimonio,
    valuation,
    receitaMes: finData.receitaMes,
    ebitda: finData.ebitda,
    lucroMes: finData.lucroMes,
  };
}
