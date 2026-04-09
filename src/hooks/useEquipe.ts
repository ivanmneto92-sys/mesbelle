import { useState, useCallback, useMemo } from "react";
import { Funcionario, AvaliacaoCliente, VendaFuncionario } from "@/types/equipe";

const FUNC_KEY = "mesbelle_equipe";
const AVAL_KEY = "mesbelle_avaliacoes";
const VENDAS_KEY = "mesbelle_vendas_func";

const initialFuncionarios: Funcionario[] = [
  { id: "f1", nome: "Juliana Costa", cargo: "Vendedora", tipoContrato: "CLT", percentualComissao: 0.05, ativo: true, telefone: "(11) 97777-6666", email: "juliana@mesbelle.com" },
  { id: "f2", nome: "Mariana Silva", cargo: "Vendedora", tipoContrato: "CLT", percentualComissao: 0.04, ativo: true, telefone: "(11) 98888-5555", email: "mariana@mesbelle.com" },
  { id: "f3", nome: "Beatriz Oliveira", cargo: "Costureira", tipoContrato: "PJ", percentualComissao: 0.03, ativo: true, telefone: "(11) 96666-4444" },
  { id: "f4", nome: "Renata Dias", cargo: "Atendente", tipoContrato: "CLT", percentualComissao: 0.03, ativo: true, telefone: "(11) 95555-3333" },
];

const now = new Date();
const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const mesesRecentes = Array.from({ length: 4 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
});

const initialVendas: VendaFuncionario[] = [
  // Juliana
  { funcionarioId: "f1", mes: mesesRecentes[0], quantidade: 10, valorTotal: 45000 },
  { funcionarioId: "f1", mes: mesesRecentes[1], quantidade: 12, valorTotal: 52000 },
  { funcionarioId: "f1", mes: mesesRecentes[2], quantidade: 14, valorTotal: 61000 },
  { funcionarioId: "f1", mes: mesesRecentes[3], quantidade: 12, valorTotal: 54000 },
  // Mariana
  { funcionarioId: "f2", mes: mesesRecentes[0], quantidade: 8, valorTotal: 36000 },
  { funcionarioId: "f2", mes: mesesRecentes[1], quantidade: 7, valorTotal: 30000 },
  { funcionarioId: "f2", mes: mesesRecentes[2], quantidade: 10, valorTotal: 44000 },
  { funcionarioId: "f2", mes: mesesRecentes[3], quantidade: 9, valorTotal: 41000 },
  // Renata
  { funcionarioId: "f4", mes: mesesRecentes[0], quantidade: 4, valorTotal: 16000 },
  { funcionarioId: "f4", mes: mesesRecentes[1], quantidade: 5, valorTotal: 22000 },
  { funcionarioId: "f4", mes: mesesRecentes[2], quantidade: 6, valorTotal: 26000 },
  { funcionarioId: "f4", mes: mesesRecentes[3], quantidade: 5, valorTotal: 21000 },
];

const initialAvaliacoes: AvaliacaoCliente[] = [
  { id: "a1", funcionarioId: "f1", data: mesesRecentes[3] + "-05", nota: 5, comentario: "Atendimento excelente!" },
  { id: "a2", funcionarioId: "f1", data: mesesRecentes[3] + "-08", nota: 5 },
  { id: "a3", funcionarioId: "f1", data: mesesRecentes[3] + "-12", nota: 4 },
  { id: "a4", funcionarioId: "f2", data: mesesRecentes[3] + "-03", nota: 5 },
  { id: "a5", funcionarioId: "f2", data: mesesRecentes[3] + "-07", nota: 4 },
  { id: "a6", funcionarioId: "f3", data: mesesRecentes[3] + "-02", nota: 5 },
  { id: "a7", funcionarioId: "f3", data: mesesRecentes[3] + "-09", nota: 5 },
  { id: "a8", funcionarioId: "f4", data: mesesRecentes[3] + "-04", nota: 4 },
  { id: "a9", funcionarioId: "f4", data: mesesRecentes[3] + "-10", nota: 4 },
  { id: "a10", funcionarioId: "f4", data: mesesRecentes[3] + "-11", nota: 5 },
  // older months
  { id: "a11", funcionarioId: "f1", data: mesesRecentes[2] + "-05", nota: 5 },
  { id: "a12", funcionarioId: "f1", data: mesesRecentes[2] + "-15", nota: 5 },
  { id: "a13", funcionarioId: "f2", data: mesesRecentes[2] + "-06", nota: 4 },
  { id: "a14", funcionarioId: "f2", data: mesesRecentes[2] + "-12", nota: 5 },
  { id: "a15", funcionarioId: "f4", data: mesesRecentes[2] + "-08", nota: 4 },
  { id: "a16", funcionarioId: "f1", data: mesesRecentes[1] + "-03", nota: 4 },
  { id: "a17", funcionarioId: "f2", data: mesesRecentes[1] + "-07", nota: 4 },
  { id: "a18", funcionarioId: "f1", data: mesesRecentes[0] + "-10", nota: 5 },
  { id: "a19", funcionarioId: "f2", data: mesesRecentes[0] + "-12", nota: 5 },
];

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch { return fallback; }
}

function saveJSON(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function useEquipe() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(() => loadJSON(FUNC_KEY, initialFuncionarios));
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoCliente[]>(() => loadJSON(AVAL_KEY, initialAvaliacoes));
  const [vendas, setVendas] = useState<VendaFuncionario[]>(() => loadJSON(VENDAS_KEY, initialVendas));

  const persistFunc = useCallback((data: Funcionario[]) => { setFuncionarios(data); saveJSON(FUNC_KEY, data); }, []);
  const persistAval = useCallback((data: AvaliacaoCliente[]) => { setAvaliacoes(data); saveJSON(AVAL_KEY, data); }, []);

  const updateFuncionario = useCallback((id: string, updates: Partial<Funcionario>) => {
    persistFunc(funcionarios.map(f => f.id === id ? { ...f, ...updates } : f));
  }, [funcionarios, persistFunc]);

  const getScoreMes = useCallback((funcId: string, mes: string) => {
    const avs = avaliacoes.filter(a => a.funcionarioId === funcId && a.data.startsWith(mes));
    if (avs.length === 0) return 0;
    return avs.reduce((s, a) => s + a.nota, 0) / avs.length;
  }, [avaliacoes]);

  const getScoreGlobalMes = useCallback((mes: string) => {
    const avs = avaliacoes.filter(a => a.data.startsWith(mes));
    if (avs.length === 0) return 0;
    return avs.reduce((s, a) => s + a.nota, 0) / avs.length;
  }, [avaliacoes]);

  const getVendasMes = useCallback((funcId: string, mes: string) => {
    return vendas.find(v => v.funcionarioId === funcId && v.mes === mes) || { quantidade: 0, valorTotal: 0 };
  }, [vendas]);

  const resumoEquipe = useMemo(() => {
    return funcionarios.filter(f => f.ativo).map(f => {
      const v = getVendasMes(f.id, mesAtual);
      const score = getScoreMes(f.id, mesAtual);
      const comissao = v.valorTotal * f.percentualComissao;
      return { ...f, vendasMes: v.quantidade, valorVendas: v.valorTotal, comissao, score };
    });
  }, [funcionarios, getVendasMes, getScoreMes]);

  const chartData = useMemo(() => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return mesesRecentes.map(mes => {
      const entry: Record<string, unknown> = { mes: meses[parseInt(mes.split("-")[1]) - 1] };
      funcionarios.filter(f => f.ativo && (f.cargo === "Vendedora" || f.cargo === "Atendente")).forEach(f => {
        const v = getVendasMes(f.id, mes);
        entry[f.nome] = v.quantidade;
        entry[`score_${f.id}`] = getScoreMes(f.id, mes);
      });
      entry["scoreGlobal"] = getScoreGlobalMes(mes);
      return entry;
    });
  }, [funcionarios, getVendasMes, getScoreMes, getScoreGlobalMes]);

  const vendedores = useMemo(() => funcionarios.filter(f => f.ativo && (f.cargo === "Vendedora" || f.cargo === "Atendente")), [funcionarios]);

  const historicoVendas = useCallback((funcId: string) => {
    return vendas.filter(v => v.funcionarioId === funcId).sort((a, b) => b.mes.localeCompare(a.mes));
  }, [vendas]);

  return { funcionarios: resumoEquipe, updateFuncionario, chartData, vendedores, historicoVendas, getScoreMes, mesesRecentes };
}
