import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transacao, ConfigImpostos, TipoTransacao, CategoriaTransacao, StatusTransacao } from "@/types/financeiro";

const defaultImpostos: ConfigImpostos = {
  simplesNacional: 6, iss: 5, debito: 1.5, creditoVista: 3.2, creditoParcelado: 4.8,
};

type TxRow = { id: string; tipo: string; data: string; descricao: string; categoria: string; valor: number; status: string };
const rowToTx = (r: TxRow): Transacao => ({
  id: r.id, tipo: r.tipo as TipoTransacao, data: r.data, descricao: r.descricao,
  categoria: r.categoria as CategoriaTransacao, valor: Number(r.valor), status: r.status as StatusTransacao,
});

export function useFinanceiro() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [impostos, setImpostos] = useState<ConfigImpostos>(defaultImpostos);

  useEffect(() => {
    let active = true;
    (async () => {
      const [txRes, cfRes] = await Promise.all([
        supabase.from("transacoes_financeiras").select("*").order("data", { ascending: false }),
        supabase.from("config_financeiro").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (!active) return;
      if (txRes.data) setTransacoes((txRes.data as TxRow[]).map(rowToTx));
      if (cfRes.data) {
        const c = cfRes.data as { simples_nacional: number; iss: number; debito: number; credito_vista: number; credito_parcelado: number };
        setImpostos({
          simplesNacional: Number(c.simples_nacional), iss: Number(c.iss), debito: Number(c.debito),
          creditoVista: Number(c.credito_vista), creditoParcelado: Number(c.credito_parcelado),
        });
      }
    })();
    return () => { active = false; };
  }, []);

  const addTransacao = useCallback(async (t: Omit<Transacao, "id">) => {
    const insertRow = { tipo: t.tipo, data: t.data, descricao: t.descricao, categoria: t.categoria, valor: t.valor, status: t.status };
    const { data } = await supabase.from("transacoes_financeiras").insert(insertRow).select().single();
    if (data) setTransacoes(prev => [rowToTx(data as TxRow), ...prev].sort((a, b) => b.data.localeCompare(a.data)));
  }, []);

  const addMany = useCallback(async (items: Omit<Transacao, "id">[]) => {
    if (items.length === 0) return;
    const rows = items.map(t => ({ tipo: t.tipo, data: t.data, descricao: t.descricao, categoria: t.categoria, valor: t.valor, status: t.status }));
    const { data } = await supabase.from("transacoes_financeiras").insert(rows).select();
    if (data) setTransacoes(prev => [...(data as TxRow[]).map(rowToTx), ...prev].sort((a, b) => b.data.localeCompare(a.data)));
  }, []);

  const removeTransacao = useCallback(async (id: string) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
    await supabase.from("transacoes_financeiras").delete().eq("id", id);
  }, []);

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
        receita: v.receita, despesa: v.despesa, lucro: v.receita - v.despesa,
      }));
  }, [transacoes]);

  const updateImpostos = useCallback(async (cfg: ConfigImpostos) => {
    setImpostos(cfg);
    await supabase.from("config_financeiro").update({
      simples_nacional: cfg.simplesNacional, iss: cfg.iss, debito: cfg.debito,
      credito_vista: cfg.creditoVista, credito_parcelado: cfg.creditoParcelado,
    }).eq("id", 1);
  }, []);

  return { transacoes, addTransacao, addMany, removeTransacao, resumoMes, gastosPorCategoria, dreData, impostos, updateImpostos };
}
