import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AtivoPatrimonio, SocioEmpresa, CategoriaAtivo } from "@/types/socios";

type AtivoRow = { id: string; nome: string; categoria: string; data_compra: string; valor_original: number; percentual_desagio: number };
const rowToAtivo = (r: AtivoRow): AtivoPatrimonio => ({
  id: r.id, nome: r.nome, categoria: r.categoria as CategoriaAtivo,
  dataCompra: r.data_compra, valorOriginal: Number(r.valor_original),
  percentualDesagio: Number(r.percentual_desagio),
});

type SocioRow = { id: string; nome: string; percentual_participacao: number; ativo: boolean; data_expiracao: string | null };
const rowToSocio = (r: SocioRow): SocioEmpresa => ({
  id: r.id, nome: r.nome, percentualParticipacao: Number(r.percentual_participacao),
  ativo: r.ativo, dataExpiracao: r.data_expiracao ?? undefined,
});

type TxRow = { tipo: string; data: string; valor: number };

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

export function useSocios() {
  const [ativos, setAtivos] = useState<AtivoPatrimonio[]>([]);
  const [socios, setSocios] = useState<SocioEmpresa[]>([]);
  const [multiplicador, setMultiplicador] = useState<number>(3.5);
  const [transacoes, setTransacoes] = useState<TxRow[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [aRes, sRes, cRes, tRes] = await Promise.all([
        supabase.from("ativos_patrimonio").select("*"),
        supabase.from("socios_empresa").select("*").order("nome"),
        supabase.from("config_socios").select("multiplicador").eq("id", 1).maybeSingle(),
        supabase.from("transacoes_financeiras").select("tipo, data, valor"),
      ]);
      if (!active) return;
      if (aRes.data) setAtivos((aRes.data as AtivoRow[]).map(rowToAtivo));
      if (sRes.data) setSocios((sRes.data as SocioRow[]).map(rowToSocio));
      if (cRes.data) setMultiplicador(Number((cRes.data as { multiplicador: number }).multiplicador) || 3.5);
      if (tRes.data) setTransacoes(tRes.data as TxRow[]);
    })();
    return () => { active = false; };
  }, []);

  const updateMultiplicador = useCallback(async (val: number) => {
    setMultiplicador(val);
    await supabase.from("config_socios").update({ multiplicador: val }).eq("id", 1);
  }, []);

  const addAtivo = useCallback(async (a: Omit<AtivoPatrimonio, "id">) => {
    const { data } = await supabase.from("ativos_patrimonio").insert({
      nome: a.nome, categoria: a.categoria, data_compra: a.dataCompra,
      valor_original: a.valorOriginal, percentual_desagio: a.percentualDesagio,
    }).select().single();
    if (data) setAtivos(prev => [...prev, rowToAtivo(data as AtivoRow)]);
  }, []);

  const removeAtivo = useCallback(async (id: string) => {
    setAtivos(prev => prev.filter(a => a.id !== id));
    await supabase.from("ativos_patrimonio").delete().eq("id", id);
  }, []);

  const toggleSocioAtivo = useCallback(async (id: string) => {
    const cur = socios.find(s => s.id === id);
    if (!cur) return;
    const next = !cur.ativo;
    setSocios(prev => prev.map(s => s.id === id ? { ...s, ativo: next } : s));
    await supabase.from("socios_empresa").update({ ativo: next }).eq("id", id);
  }, [socios]);

  const updateSocioExpiracao = useCallback(async (id: string, data: string) => {
    setSocios(prev => prev.map(s => s.id === id ? { ...s, dataExpiracao: data } : s));
    await supabase.from("socios_empresa").update({ data_expiracao: data || null }).eq("id", id);
  }, []);

  const finData = useMemo(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const doMes = transacoes.filter(t => t.data.startsWith(mesAtual));
    const receitaMes = doMes.filter(t => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0);
    const despesaMes = doMes.filter(t => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0);
    const lucroMes = receitaMes - despesaMes;

    let ebitda = 0;
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthTx = transacoes.filter(t => t.data.startsWith(key));
      const rec = monthTx.filter(t => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0);
      const desp = monthTx.filter(t => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0);
      ebitda += rec - desp;
    }
    return { receitaMes, lucroMes, ebitda };
  }, [transacoes]);

  const ativosComCalculo = useMemo(() => ativos.map(a => ({
    ...a,
    valorAtual: a.valorOriginal - (a.valorOriginal * a.percentualDesagio / 100),
    idade: getIdade(a.dataCompra),
  })), [ativos]);

  const totalPatrimonio = useMemo(() => ativosComCalculo.reduce((s, a) => s + a.valorAtual, 0), [ativosComCalculo]);
  const valuation = useMemo(() => finData.ebitda * multiplicador, [finData.ebitda, multiplicador]);

  const distribuicao = useMemo(() =>
    socios.filter(s => s.ativo).map(s => ({
      ...s,
      lucroMensal: finData.lucroMes * (s.percentualParticipacao / 100),
    })), [socios, finData.lucroMes]);

  return {
    ativos: ativosComCalculo, socios, distribuicao, multiplicador, updateMultiplicador,
    addAtivo, removeAtivo, toggleSocioAtivo, updateSocioExpiracao,
    totalPatrimonio, valuation,
    receitaMes: finData.receitaMes, ebitda: finData.ebitda, lucroMes: finData.lucroMes,
  };
}
