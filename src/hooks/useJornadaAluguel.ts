import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EtapaJornadaAluguel, JornadaAluguelItem } from "@/types/logistica";
import { toast } from "sonner";

type EtapaRow = { id: string; reserva_id: string; nome_etapa: string; is_concluido: boolean; ordem: number; updated_at: string };
const rowToEtapa = (r: EtapaRow): EtapaJornadaAluguel => ({
  id: r.id, reservaId: r.reserva_id, nomeEtapa: r.nome_etapa, isConcluido: r.is_concluido, updatedAt: r.updated_at,
});

// reservas_agenda não tem vestido_nome/cliente_nome (só vestido_id/negocio_id)
// nem FK declarada pra embedding do PostgREST — busca e junta manualmente,
// mesmo padrão já usado em useAcervo/useLogistica.
async function buscarItens(reservaIds: string[]): Promise<JornadaAluguelItem[]> {
  if (reservaIds.length === 0) return [];

  const { data: reservas } = await supabase
    .from("reservas_agenda")
    .select("id, vestido_id, data_inicio, data_fim, negocio_id")
    .in("id", reservaIds);
  if (!reservas || reservas.length === 0) return [];

  const vestidoIds = [...new Set(reservas.map((r) => r.vestido_id))];
  const negocioIds = [...new Set(reservas.map((r) => r.negocio_id).filter((id): id is string => !!id))];

  const [vestidosRes, negociosRes] = await Promise.all([
    vestidoIds.length > 0 ? supabase.from("vestidos").select("id, nome").in("id", vestidoIds) : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    negocioIds.length > 0 ? supabase.from("negocios").select("id, cliente_nome").in("id", negocioIds) : Promise.resolve({ data: [] as { id: string; cliente_nome: string }[] }),
  ]);
  const vestidoNomes = new Map((vestidosRes.data ?? []).map((v) => [v.id, v.nome]));
  const clienteNomes = new Map((negociosRes.data ?? []).map((n) => [n.id, n.cliente_nome]));

  return reservas.map((r) => ({
    reservaId: r.id,
    vestidoNome: vestidoNomes.get(r.vestido_id) ?? "Vestido",
    clienteNome: (r.negocio_id && clienteNomes.get(r.negocio_id)) ?? "Cliente",
    dataRetirada: r.data_inicio,
    dataDevolucao: r.data_fim,
  }));
}

export function useJornadaAluguel() {
  const [etapas, setEtapas] = useState<EtapaJornadaAluguel[]>([]);
  const [itens, setItens] = useState<JornadaAluguelItem[]>([]);

  const recarregar = useCallback(async () => {
    const { data: eData } = await supabase.from("jornada_aluguel").select("*").order("ordem");
    const etapasMapeadas = ((eData as EtapaRow[]) ?? []).map(rowToEtapa);
    setEtapas(etapasMapeadas);
    const reservaIds = [...new Set(etapasMapeadas.map((e) => e.reservaId))];
    setItens(await buscarItens(reservaIds));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: eData } = await supabase.from("jornada_aluguel").select("*").order("ordem");
      if (!active) return;
      const etapasMapeadas = ((eData as EtapaRow[]) ?? []).map(rowToEtapa);
      setEtapas(etapasMapeadas);
      const reservaIds = [...new Set(etapasMapeadas.map((e) => e.reservaId))];
      const itensCarregados = await buscarItens(reservaIds);
      if (active) setItens(itensCarregados);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`jornada_aluguel_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jornada_aluguel" }, () => { recarregar(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "reservas_agenda" }, () => { recarregar(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [recarregar]);

  const toggleEtapa = useCallback(async (etapaId: string) => {
    const current = etapas.find((e) => e.id === etapaId);
    if (!current) return;
    const next = !current.isConcluido;
    setEtapas((prev) => prev.map((e) => (e.id === etapaId ? { ...e, isConcluido: next } : e)));
    const { error } = await supabase.from("jornada_aluguel").update({ is_concluido: next }).eq("id", etapaId);
    if (error) {
      setEtapas((prev) => prev.map((e) => (e.id === etapaId ? { ...e, isConcluido: current.isConcluido } : e)));
      toast.error("Não foi possível atualizar a etapa: " + error.message);
    }
  }, [etapas]);

  const getEtapasForReserva = useCallback((reservaId: string) =>
    etapas.filter((e) => e.reservaId === reservaId), [etapas]);

  return { itens, etapas, toggleEtapa, getEtapasForReserva };
}
