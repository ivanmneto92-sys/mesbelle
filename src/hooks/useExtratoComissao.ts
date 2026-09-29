import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DateRange } from "@/hooks/useDateRange";

export type CategoriaComissao = "comissao" | "ajuste_comissao" | "bonus_comissao";

export interface LancamentoComissao {
  id: string;
  data: string;
  categoria: CategoriaComissao;
  valor: number;
  descricaoPeca: string | null;
  clienteNome: string | null;
  observacoes: string | null;
}

// Um "grupo" = todos os lançamentos de comissão gerados pela mesma venda
// (negocio_id) — a comissão normal, e quando ela fez a faixa do mês subir,
// também o ajuste retroativo e/ou o bônus de R$40k, todos com o mesmo
// negocio_id (ver fn_negocio_aprovado_gera_transacao). Agrupar assim é o
// que deixa claro que "isso tudo veio da mesma venda", em vez de linhas
// soltas com a mesma descrição repetida.
export interface GrupoComissao {
  negocioId: string;
  data: string;
  clienteNome: string | null;
  vestidoNome: string | null;
  valorVenda: number | null;
  itens: LancamentoComissao[];
  total: number;
}

type TxRow = {
  id: string;
  data: string;
  categoria: string;
  valor: number;
  observacoes: string | null;
  negocio_id: string | null;
  negocios: { vestido_nome: string | null; cliente_nome: string | null; valor_negociado: number | null; desconto: number | null } | null;
};

/**
 * Extrato de comissão do vendedor logado — só lê o que a RLS
 * "Transacoes read propria comissao vendedor" libera: linhas de
 * transacoes_financeiras nas categorias comissao/ajuste_comissao/
 * bonus_comissao, ligadas a negócios do próprio vendedor.
 */
export function useExtratoComissao(range: DateRange) {
  const { user } = useAuth();
  const [lancamentos, setLancamentos] = useState<LancamentoComissao[]>([]);
  const [grupos, setGrupos] = useState<GrupoComissao[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user?.id) {
      setLancamentos([]);
      setGrupos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("transacoes_financeiras")
      .select("id, data, categoria, valor, observacoes, negocio_id, negocios(vestido_nome, cliente_nome, valor_negociado, desconto)")
      .in("categoria", ["comissao", "ajuste_comissao", "bonus_comissao"])
      .gte("data", range.from)
      .lte("data", range.to)
      .order("data", { ascending: false });

    const rows = (data ?? []) as unknown as TxRow[];
    const mapeados: LancamentoComissao[] = rows.map((r) => ({
      id: r.id,
      data: r.data,
      categoria: r.categoria as CategoriaComissao,
      valor: Number(r.valor),
      descricaoPeca: r.negocios?.vestido_nome ?? null,
      clienteNome: r.negocios?.cliente_nome ?? null,
      observacoes: r.observacoes,
    }));
    setLancamentos(mapeados);

    // Agrupa por negocio_id, preservando a ordem (já vem por data desc).
    const gruposMap = new Map<string, GrupoComissao>();
    const semNegocio: GrupoComissao[] = [];
    rows.forEach((r) => {
      const item: LancamentoComissao = {
        id: r.id, data: r.data, categoria: r.categoria as CategoriaComissao, valor: Number(r.valor),
        descricaoPeca: r.negocios?.vestido_nome ?? null, clienteNome: r.negocios?.cliente_nome ?? null,
        observacoes: r.observacoes,
      };
      if (!r.negocio_id) {
        semNegocio.push({
          negocioId: r.id, data: r.data, clienteNome: item.clienteNome, vestidoNome: item.descricaoPeca,
          valorVenda: null, itens: [item], total: item.valor,
        });
        return;
      }
      const existente = gruposMap.get(r.negocio_id);
      if (existente) {
        existente.itens.push(item);
        existente.total += item.valor;
      } else {
        const valorVenda = r.negocios ? Math.max((Number(r.negocios.valor_negociado) || 0) - (Number(r.negocios.desconto) || 0), 0) : null;
        gruposMap.set(r.negocio_id, {
          negocioId: r.negocio_id, data: r.data, clienteNome: item.clienteNome, vestidoNome: item.descricaoPeca,
          valorVenda, itens: [item], total: item.valor,
        });
      }
    });
    setGrupos([...gruposMap.values(), ...semNegocio].sort((a, b) => b.data.localeCompare(a.data)));

    setLoading(false);
  }, [user?.id, range.from, range.to]);

  useEffect(() => { carregar(); }, [carregar]);

  // Realtime — mesma justificativa de useLeads.ts/useEquipe.ts: sem isto o
  // extrato só atualizava depois de um F5 manual quando uma venda nova era
  // aprovada durante a sessão.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`extrato_comissao_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transacoes_financeiras" }, carregar)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, carregar]);

  const totalComissao = lancamentos.filter((l) => l.categoria === "comissao").reduce((s, l) => s + l.valor, 0);
  const totalAjuste = lancamentos.filter((l) => l.categoria === "ajuste_comissao").reduce((s, l) => s + l.valor, 0);
  const totalBonus = lancamentos.filter((l) => l.categoria === "bonus_comissao").reduce((s, l) => s + l.valor, 0);
  const totalAReceber = totalComissao + totalAjuste + totalBonus;

  return { lancamentos, grupos, loading, totalComissao, totalAjuste, totalBonus, totalAReceber };
}
