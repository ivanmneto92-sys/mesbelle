import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SituacaoVestidoTipo = "disponivel" | "aluguel" | "primeiro_aluguel";

export interface SituacaoVestido {
  tipo: SituacaoVestidoTipo;
  clienteNome?: string;
  dataRetirada?: string;
  dataDevolucao?: string;
  // Etapa atual da jornada (Aluguel: "Na Lavanderia", "Ajustes"... /
  // Primeiro Aluguel: "Bordadeira", "Segunda Prova"...) — undefined quando
  // a jornada já foi concluída ou não existe (reserva antiga sem jornada).
  etapaAtual?: string;
  jornadaConcluida: boolean;
}

type ReservaRow = { id: string; data_inicio: string; data_fim: string; negocio_id: string | null };
type EtapaRow = { nome_etapa: string; is_concluido: boolean; ordem: number };

const DISPONIVEL: SituacaoVestido = { tipo: "disponivel", jornadaConcluida: true };

// Busca a "situação atual" de uma peça pra mostrar no Detalhes do Vestido:
// se está alugada agora (ou reservada pra breve), com quem, até quando, e em
// qual etapa da jornada ela está (costureira, ajustes, lavanderia etc) —
// junta reservas_agenda (período + cliente via negocio) com jornada_aluguel
// (Aluguel normal) ou producoes/etapas_producao (Primeiro Aluguel).
export function useVestidoSituacao(vestidoId: string | null) {
  const [situacao, setSituacao] = useState<SituacaoVestido | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vestidoId) {
      setSituacao(null);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const hoje = new Date().toISOString().slice(0, 10);

        const { data: reservas } = await supabase
          .from("reservas_agenda")
          .select("id, data_inicio, data_fim, negocio_id")
          .eq("vestido_id", vestidoId)
          .order("data_inicio", { ascending: true });
        const lista = (reservas ?? []) as ReservaRow[];

        const ativa = lista.find((r) => r.data_inicio <= hoje && r.data_fim >= hoje);
        const futura = lista.filter((r) => r.data_inicio > hoje)[0];
        const relevante = ativa ?? futura ?? null;

        if (!relevante) {
          if (active) setSituacao(DISPONIVEL);
          return;
        }

        let clienteNome: string | undefined;
        let tipoNegocio = "aluguel";
        if (relevante.negocio_id) {
          const { data: negocio } = await supabase
            .from("negocios")
            .select("cliente_nome, tipo_negocio")
            .eq("id", relevante.negocio_id)
            .maybeSingle();
          clienteNome = negocio?.cliente_nome ?? undefined;
          tipoNegocio = negocio?.tipo_negocio ?? "aluguel";
        }

        let etapaAtual: string | undefined;
        let jornadaConcluida = true;

        if (tipoNegocio === "primeiro_aluguel") {
          const { data: producao } = await supabase
            .from("producoes")
            .select("id")
            .eq("vestido_id", vestidoId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (producao) {
            const { data: etapas } = await supabase
              .from("etapas_producao")
              .select("nome_etapa, is_concluido, ordem")
              .eq("producao_id", producao.id)
              .order("ordem");
            const pendente = ((etapas ?? []) as EtapaRow[]).find((e) => !e.is_concluido);
            etapaAtual = pendente?.nome_etapa;
            jornadaConcluida = !pendente;
          }
        } else {
          const { data: etapas } = await supabase
            .from("jornada_aluguel")
            .select("nome_etapa, is_concluido, ordem")
            .eq("reserva_id", relevante.id)
            .order("ordem");
          const pendente = ((etapas ?? []) as EtapaRow[]).find((e) => !e.is_concluido);
          etapaAtual = pendente?.nome_etapa;
          jornadaConcluida = !pendente;
        }

        if (!active) return;
        setSituacao({
          tipo: tipoNegocio === "primeiro_aluguel" ? "primeiro_aluguel" : "aluguel",
          clienteNome,
          dataRetirada: relevante.data_inicio,
          dataDevolucao: relevante.data_fim,
          etapaAtual,
          jornadaConcluida,
        });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [vestidoId]);

  return { situacao, loading };
}
