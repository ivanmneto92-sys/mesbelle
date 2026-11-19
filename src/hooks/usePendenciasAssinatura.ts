import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PendenciaAssinatura {
  negocioId: string;
  contratoId: string | null;
  clienteNome: string;
  vestidoNome: string | null;
  valor: number;
  reservaExpiraEm: string | null;
  vendedorId: string | null;
  // "aguardando": pré-venda esperando a cliente assinar (peça reservada).
  // "legado": venda fechada antes da regra nova, contrato ainda sem assinatura.
  tipo: "aguardando" | "legado";
}

/**
 * Vendas que dependem da assinatura da cliente — alimenta o contador do
 * menu, o card do Dashboard e o Meu Painel. A RLS já limita o que cada um vê
 * (vendedora: as próprias vendas; admin: todas).
 */
export function usePendenciasAssinatura() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["pendencias-assinatura"],
    queryFn: async (): Promise<PendenciaAssinatura[]> => {
      const [negRes, ctrRes] = await Promise.all([
        supabase
          .from("negocios")
          .select("id, cliente_nome, vestido_nome, valor_negociado, desconto, reserva_expira_em, vendedor_id, status_negociacao, aprovado_sem_assinatura_motivo")
          .in("status_negociacao", ["aguardando_assinatura", "aprovado"]),
        supabase.from("contratos").select("id, negocio_id, status_assinatura").not("negocio_id", "is", null),
      ]);
      if (negRes.error) throw negRes.error;
      if (ctrRes.error) throw ctrRes.error;

      const contratosPorNegocio = new Map<string, { id: string; status: string }[]>();
      for (const c of ctrRes.data ?? []) {
        const lista = contratosPorNegocio.get(c.negocio_id as string) ?? [];
        lista.push({ id: c.id, status: c.status_assinatura });
        contratosPorNegocio.set(c.negocio_id as string, lista);
      }

      const pendencias: PendenciaAssinatura[] = [];
      for (const n of negRes.data ?? []) {
        const contratos = contratosPorNegocio.get(n.id) ?? [];
        const assinado = contratos.some((c) => c.status === "assinado");
        const pendente = contratos.find((c) => c.status === "pendente");
        const base = {
          negocioId: n.id,
          contratoId: pendente?.id ?? null,
          clienteNome: n.cliente_nome,
          vestidoNome: n.vestido_nome,
          valor: Math.max(Number(n.valor_negociado) - Number(n.desconto ?? 0), 0),
          reservaExpiraEm: n.reserva_expira_em,
          vendedorId: n.vendedor_id,
        };
        if (n.status_negociacao === "aguardando_assinatura") {
          pendencias.push({ ...base, tipo: "aguardando" });
        } else if (!assinado && !n.aprovado_sem_assinatura_motivo) {
          pendencias.push({ ...base, tipo: "legado" });
        }
      }
      return pendencias.sort((a, b) => (a.reservaExpiraEm ?? "9").localeCompare(b.reservaExpiraEm ?? "9"));
    },
    refetchInterval: 60_000,
  });

  // Atualiza na hora quando um contrato é assinado ou uma venda muda.
  useEffect(() => {
    const channel = supabase
      .channel(`pendencias_assinatura_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "negocios" }, () => qc.invalidateQueries({ queryKey: ["pendencias-assinatura"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "contratos" }, () => qc.invalidateQueries({ queryKey: ["pendencias-assinatura"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const pendencias = query.data ?? [];
  return {
    pendencias,
    total: pendencias.length,
    valorTotal: pendencias.reduce((s, p) => s + p.valor, 0),
    isLoading: query.isLoading,
  };
}
