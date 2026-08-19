import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transacao, TipoTransacao, StatusTransacao, TipoCusto } from "@/types/financeiro";
import type { DateRange } from "@/hooks/useDateRange";

type TxRow = {
  id: string;
  tipo: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  status: string;
  tipo_custo: string | null;
  lead_id: string | null;
  observacoes: string | null;
};

export const rowToTransacao = (r: TxRow): Transacao => ({
  id: r.id,
  tipo: r.tipo as TipoTransacao,
  data: r.data,
  descricao: r.descricao,
  categoria: r.categoria,
  valor: Number(r.valor),
  status: r.status as StatusTransacao,
  tipoCusto: (r.tipo_custo as TipoCusto | null) ?? null,
  leadId: r.lead_id ?? null,
  observacoes: r.observacoes ?? null,
});

const transacaoToRow = (t: Partial<Omit<Transacao, "id">>) => {
  const row: Record<string, unknown> = {};
  if (t.tipo !== undefined) row.tipo = t.tipo;
  if (t.data !== undefined) row.data = t.data;
  if (t.descricao !== undefined) row.descricao = t.descricao;
  if (t.categoria !== undefined) row.categoria = t.categoria;
  if (t.valor !== undefined) row.valor = t.valor;
  if (t.status !== undefined) row.status = t.status;
  if (t.tipoCusto !== undefined) row.tipo_custo = t.tipoCusto;
  if (t.leadId !== undefined) row.lead_id = t.leadId;
  if (t.observacoes !== undefined) row.observacoes = t.observacoes;
  return row;
};

export function useFinanceiro(range?: DateRange) {
  const qc = useQueryClient();

  const { data: transacoes = [], isLoading } = useQuery({
    queryKey: ["transacoes", range?.from, range?.to],
    queryFn: async () => {
      let q = supabase.from("transacoes_financeiras").select("*").order("data", { ascending: false });
      if (range?.from) q = q.gte("data", range.from);
      if (range?.to) q = q.lte("data", range.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(rowToTransacao);
    },
  });

  const criar = useMutation({
    mutationFn: async (nova: Omit<Transacao, "id">) => {
      const { error } = await supabase.from("transacoes_financeiras").insert(transacaoToRow(nova) as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transacoes"] }),
  });

  const criarMuitas = useMutation({
    mutationFn: async (itens: Omit<Transacao, "id">[]) => {
      if (itens.length === 0) return;
      const rows = itens.map((t) => transacaoToRow(t));
      const { error } = await supabase.from("transacoes_financeiras").insert(rows as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transacoes"] }),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Omit<Transacao, "id">> & { id: string }) => {
      const { error } = await supabase.from("transacoes_financeiras").update(transacaoToRow(updates) as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transacoes"] }),
  });

  const deletar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transacoes_financeiras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transacoes"] }),
  });

  return { transacoes, isLoading, criar, criarMuitas, atualizar, deletar };
}
