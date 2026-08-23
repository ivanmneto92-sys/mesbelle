import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Funcionario, AvaliacaoCliente, VendaFuncionario, TipoContrato } from "@/types/equipe";
import type { DateRange } from "@/hooks/useDateRange";

const now = new Date();
const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const mesesRecentes = Array.from({ length: 4 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
});

type AvalRow = { id: string; funcionario_id: string; data: string; nota: number; comentario: string | null };
type NegocioRow = { vendedor_id: string | null; valor_negociado: number; desconto: number; criado_em: string };

interface EquipeApiRow {
  id: string; nome: string; cargo: string; tipoContrato: TipoContrato;
  percentualComissao: number; ativo: boolean; telefone: string; email: string;
}

async function invocarEquipeAdmin<T>(body: object): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke<T>("equipe-admin", {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      const errBody = await context.clone().json().catch(() => null);
      if (errBody?.error) throw new Error(errBody.error);
    }
    throw error;
  }
  return data as T;
}

export function useEquipe(range?: DateRange) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoCliente[]>([]);
  const [vendas, setVendas] = useState<VendaFuncionario[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      let avaliacoesQuery = supabase.from("avaliacoes_clientes").select("*");
      if (range) avaliacoesQuery = avaliacoesQuery.gte("data", range.from).lte("data", range.to);

      const [equipeRes, negRes, aRes] = await Promise.all([
        invocarEquipeAdmin<EquipeApiRow[]>({ action: "listar" }).catch(() => [] as EquipeApiRow[]),
        // negocios.status_negociacao = "aprovado" é a venda de fato fechada —
        // reservas_agenda/vestidos não carregam vendedor_id, só negocios.
        supabase.from("negocios").select("vendedor_id, valor_negociado, desconto, criado_em").eq("status_negociacao", "aprovado"),
        avaliacoesQuery,
      ]);
      if (!active) return;

      setFuncionarios(equipeRes.map((r) => ({
        id: r.id, nome: r.nome, cargo: r.cargo, tipoContrato: r.tipoContrato,
        percentualComissao: Number(r.percentualComissao), ativo: r.ativo,
        telefone: r.telefone || undefined, email: r.email || undefined,
      })));

      // Agrega negócios aprovados por vendedor + mês, no mesmo formato que a
      // UI espera (quantidade de vendas e valor líquido = valor_negociado -
      // desconto, mesma convenção usada em useMeusKpis/useRelatorioOperacional).
      const negocios = (negRes.data ?? []) as NegocioRow[];
      const vendasMap = new Map<string, { quantidade: number; valorTotal: number }>();
      negocios.forEach((n) => {
        if (!n.vendedor_id || !n.criado_em) return;
        const mes = n.criado_em.slice(0, 7);
        const key = `${n.vendedor_id}|${mes}`;
        const atual = vendasMap.get(key) ?? { quantidade: 0, valorTotal: 0 };
        atual.quantidade += 1;
        atual.valorTotal += Number(n.valor_negociado) - Number(n.desconto);
        vendasMap.set(key, atual);
      });
      setVendas([...vendasMap.entries()].map(([key, v]) => {
        const [funcionarioId, mes] = key.split("|");
        return { funcionarioId, mes, quantidade: v.quantidade, valorTotal: v.valorTotal };
      }));

      if (aRes.data) setAvaliacoes((aRes.data as AvalRow[]).map(r => ({
        id: r.id, funcionarioId: r.funcionario_id, data: r.data, nota: r.nota, comentario: r.comentario ?? undefined,
      })));
    })();
    return () => { active = false; };
  }, [range]);

  // Realtime — sem isto, um negócio fechado ou uma avaliação recebida por um
  // funcionário só refletia nas "vendas do mês"/score aqui depois de um F5
  // manual (mesma causa raiz já corrigida em useLeads.ts).
  useEffect(() => {
    const recarregarVendas = async () => {
      const { data } = await supabase.from("negocios").select("vendedor_id, valor_negociado, desconto, criado_em").eq("status_negociacao", "aprovado");
      const negocios = (data ?? []) as NegocioRow[];
      const vendasMap = new Map<string, { quantidade: number; valorTotal: number }>();
      negocios.forEach((n) => {
        if (!n.vendedor_id || !n.criado_em) return;
        const mes = n.criado_em.slice(0, 7);
        const key = `${n.vendedor_id}|${mes}`;
        const atual = vendasMap.get(key) ?? { quantidade: 0, valorTotal: 0 };
        atual.quantidade += 1;
        atual.valorTotal += Number(n.valor_negociado) - Number(n.desconto);
        vendasMap.set(key, atual);
      });
      setVendas([...vendasMap.entries()].map(([key, v]) => {
        const [funcionarioId, mes] = key.split("|");
        return { funcionarioId, mes, quantidade: v.quantidade, valorTotal: v.valorTotal };
      }));
    };

    const channel = supabase
      .channel(`equipe_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "negocios" }, recarregarVendas)
      .on("postgres_changes", { event: "*", schema: "public", table: "avaliacoes_clientes" }, async () => {
        let avaliacoesQuery = supabase.from("avaliacoes_clientes").select("*");
        if (range) avaliacoesQuery = avaliacoesQuery.gte("data", range.from).lte("data", range.to);
        const { data } = await avaliacoesQuery;
        if (data) setAvaliacoes((data as AvalRow[]).map(r => ({
          id: r.id, funcionarioId: r.funcionario_id, data: r.data, nota: r.nota, comentario: r.comentario ?? undefined,
        })));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [range]);

  const updateFuncionario = useCallback(async (id: string, updates: Partial<Funcionario>) => {
    setFuncionarios(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    const patch: Record<string, unknown> = {};
    if (updates.nome !== undefined) patch.nome = updates.nome;
    if (updates.cargo !== undefined) patch.cargo = updates.cargo;
    if (updates.tipoContrato !== undefined) patch.tipoContrato = updates.tipoContrato;
    if (updates.percentualComissao !== undefined) patch.percentualComissao = updates.percentualComissao;
    if (updates.ativo !== undefined) patch.ativo = updates.ativo;
    if (updates.telefone !== undefined) patch.telefone = updates.telefone;
    await invocarEquipeAdmin({ action: "atualizar", userId: id, patch });
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
