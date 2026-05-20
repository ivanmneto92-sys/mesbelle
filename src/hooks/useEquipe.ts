import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Funcionario, AvaliacaoCliente, VendaFuncionario, TipoContrato } from "@/types/equipe";

const now = new Date();
const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const mesesRecentes = Array.from({ length: 4 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
});

type FuncRow = { id: string; nome: string; cargo: string; tipo_contrato: string; percentual_comissao: number; ativo: boolean; telefone: string | null; email: string | null };
type VendaRow = { funcionario_id: string; mes: string; quantidade: number; valor_total: number };
type AvalRow = { id: string; funcionario_id: string; data: string; nota: number; comentario: string | null };

const rowToFunc = (r: FuncRow): Funcionario => ({
  id: r.id, nome: r.nome, cargo: r.cargo, tipoContrato: r.tipo_contrato as TipoContrato,
  percentualComissao: Number(r.percentual_comissao), ativo: r.ativo,
  telefone: r.telefone ?? undefined, email: r.email ?? undefined,
});

export function useEquipe() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoCliente[]>([]);
  const [vendas, setVendas] = useState<VendaFuncionario[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [fRes, vRes, aRes] = await Promise.all([
        supabase.from("funcionarios").select("*").order("nome"),
        supabase.from("vendas_funcionarios").select("*"),
        supabase.from("avaliacoes_clientes").select("*"),
      ]);
      if (!active) return;
      if (fRes.data) setFuncionarios((fRes.data as FuncRow[]).map(rowToFunc));
      if (vRes.data) setVendas((vRes.data as VendaRow[]).map(r => ({
        funcionarioId: r.funcionario_id, mes: r.mes, quantidade: r.quantidade, valorTotal: Number(r.valor_total),
      })));
      if (aRes.data) setAvaliacoes((aRes.data as AvalRow[]).map(r => ({
        id: r.id, funcionarioId: r.funcionario_id, data: r.data, nota: r.nota, comentario: r.comentario ?? undefined,
      })));
    })();
    return () => { active = false; };
  }, []);

  const updateFuncionario = useCallback(async (id: string, updates: Partial<Funcionario>) => {
    setFuncionarios(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    const patch: Record<string, unknown> = {};
    if (updates.nome !== undefined) patch.nome = updates.nome;
    if (updates.cargo !== undefined) patch.cargo = updates.cargo;
    if (updates.tipoContrato !== undefined) patch.tipo_contrato = updates.tipoContrato;
    if (updates.percentualComissao !== undefined) patch.percentual_comissao = updates.percentualComissao;
    if (updates.ativo !== undefined) patch.ativo = updates.ativo;
    if (updates.telefone !== undefined) patch.telefone = updates.telefone;
    if (updates.email !== undefined) patch.email = updates.email;
    await supabase.from("funcionarios").update(patch).eq("id", id);
  }, []);

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
