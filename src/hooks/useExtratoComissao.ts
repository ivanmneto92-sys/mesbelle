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

type TxRow = {
  id: string;
  data: string;
  categoria: string;
  valor: number;
  observacoes: string | null;
  negocios: { vestido_nome: string | null; cliente_nome: string | null } | null;
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
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user?.id) {
      setLancamentos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("transacoes_financeiras")
      .select("id, data, categoria, valor, observacoes, negocios(vestido_nome, cliente_nome)")
      .in("categoria", ["comissao", "ajuste_comissao", "bonus_comissao"])
      .gte("data", range.from)
      .lte("data", range.to)
      .order("data", { ascending: false });

    setLancamentos(
      ((data ?? []) as unknown as TxRow[]).map((r) => ({
        id: r.id,
        data: r.data,
        categoria: r.categoria as CategoriaComissao,
        valor: Number(r.valor),
        descricaoPeca: r.negocios?.vestido_nome ?? null,
        clienteNome: r.negocios?.cliente_nome ?? null,
        observacoes: r.observacoes,
      })),
    );
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

  return { lancamentos, loading, totalComissao, totalAjuste, totalBonus, totalAReceber };
}
