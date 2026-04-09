import { useState, useCallback, useMemo } from "react";
import { Transacao, TipoTransacao, CategoriaTransacao, StatusTransacao, ConfigImpostos } from "@/types/financeiro";

const STORAGE_KEY = "mesbelle_financeiro";
const IMPOSTOS_KEY = "mesbelle_impostos";

const defaultImpostos: ConfigImpostos = {
  simplesNacional: 6,
  iss: 5,
  debito: 1.5,
  creditoVista: 3.2,
  creditoParcelado: 4.8,
};

const initialData: Transacao[] = [
  { id: "1", tipo: "entrada", data: "2026-04-08", descricao: "Aluguel — Ana Beatriz", categoria: "Aluguel", valor: 1200, status: "pago" },
  { id: "2", tipo: "saida", data: "2026-04-07", descricao: "Tecido fornecedor", categoria: "Material", valor: 850, status: "pago" },
  { id: "3", tipo: "entrada", data: "2026-04-07", descricao: "Aluguel — Camila Rocha", categoria: "Aluguel", valor: 980, status: "pago" },
  { id: "4", tipo: "saida", data: "2026-04-06", descricao: "Energia elétrica", categoria: "Fixo", valor: 420, status: "pago" },
  { id: "5", tipo: "entrada", data: "2026-04-06", descricao: "Venda — Patrícia Nunes", categoria: "Venda", valor: 4800, status: "pago" },
  { id: "6", tipo: "saida", data: "2026-04-05", descricao: "Comissão vendedora", categoria: "Pessoal", valor: 480, status: "pago" },
  { id: "7", tipo: "saida", data: "2026-04-05", descricao: "Aluguel loja", categoria: "Fixo", valor: 3500, status: "pago" },
  { id: "8", tipo: "saida", data: "2026-04-04", descricao: "Instagram Ads", categoria: "Marketing", valor: 600, status: "pago" },
  { id: "9", tipo: "entrada", data: "2026-04-03", descricao: "Aluguel — Mariana Souza", categoria: "Aluguel", valor: 1500, status: "pago" },
  { id: "10", tipo: "saida", data: "2026-04-02", descricao: "Simples Nacional", categoria: "Imposto", valor: 1740, status: "pago" },
];

function load(): Transacao[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialData;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialData;
  } catch { return initialData; }
}

function save(data: Transacao[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function loadImpostos(): ConfigImpostos {
  try {
    const raw = localStorage.getItem(IMPOSTOS_KEY);
    if (!raw) return defaultImpostos;
    return { ...defaultImpostos, ...JSON.parse(raw) };
  } catch { return defaultImpostos; }
}

function saveImpostos(cfg: ConfigImpostos) {
  try { localStorage.setItem(IMPOSTOS_KEY, JSON.stringify(cfg)); } catch {}
}

export function useFinanceiro() {
  const [transacoes, setTransacoes] = useState<Transacao[]>(load);
  const [impostos, setImpostos] = useState<ConfigImpostos>(loadImpostos);

  const persist = useCallback((updated: Transacao[]) => {
    const sorted = [...updated].sort((a, b) => b.data.localeCompare(a.data));
    setTransacoes(sorted);
    save(sorted);
  }, []);

  const addTransacao = useCallback((t: Omit<Transacao, "id">) => {
    const newT: Transacao = { ...t, id: crypto.randomUUID() };
    persist([...transacoes, newT]);
  }, [transacoes, persist]);

  const addMany = useCallback((items: Omit<Transacao, "id">[]) => {
    const newItems = items.map(t => ({ ...t, id: crypto.randomUUID() }));
    persist([...transacoes, ...newItems]);
  }, [transacoes, persist]);

  const removeTransacao = useCallback((id: string) => {
    persist(transacoes.filter(t => t.id !== id));
  }, [transacoes, persist]);

  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const resumoMes = useMemo(() => {
    const doMes = transacoes.filter(t => t.data.startsWith(mesAtual));
    const receitas = doMes.filter(t => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
    const despesas = doMes.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
    return { receitas, despesas, lucro: receitas - despesas };
  }, [transacoes, mesAtual]);

  const gastosPorCategoria = useMemo(() => {
    const doMes = transacoes.filter(t => t.data.startsWith(mesAtual) && t.tipo === "saida");
    const map: Record<string, number> = {};
    doMes.forEach(t => { map[t.categoria] = (map[t.categoria] || 0) + t.valor; });
    return Object.entries(map).map(([cat, valor]) => ({ cat, valor })).sort((a, b) => b.valor - a.valor);
  }, [transacoes, mesAtual]);

  const dreData = useMemo(() => {
    const months: Record<string, { receita: number; despesa: number }> = {};
    transacoes.forEach(t => {
      const m = t.data.slice(0, 7);
      if (!months[m]) months[m] = { receita: 0, despesa: 0 };
      if (t.tipo === "entrada") months[m].receita += t.valor;
      else months[m].despesa += t.valor;
    });
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, v]) => ({
        mes: meses[parseInt(key.split("-")[1]) - 1],
        receita: v.receita,
        despesa: v.despesa,
        lucro: v.receita - v.despesa,
      }));
  }, [transacoes]);

  const updateImpostos = useCallback((cfg: ConfigImpostos) => {
    setImpostos(cfg);
    saveImpostos(cfg);
  }, []);

  return { transacoes, addTransacao, addMany, removeTransacao, resumoMes, gastosPorCategoria, dreData, impostos, updateImpostos };
}
