import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Checa disponibilidade de uma peça consultando reservas_agenda — a mesma
 * tabela usada pela agenda do Acervo (/operacional/acervo), em vez de uma
 * tabela de "alugueis" dedicada (que não existe no schema). Qualquer reserva
 * sobreposta (aluguel, lavanderia ou ajuste) bloqueia a peça, já que em
 * todos os casos ela não está disponível fisicamente no ateliê.
 */
export function useDisponibilidade() {
  const verificar = useCallback(
    async (
      vestidoId: string,
      dataRetirada: string, // YYYY-MM-DD
      dataDevolucao: string, // YYYY-MM-DD
      reservaIdIgnorar?: string,
    ): Promise<boolean> => {
      let query = supabase
        .from("reservas_agenda")
        .select("id, data_inicio, data_fim")
        .eq("vestido_id", vestidoId)
        // Sobreposição de datas: NOT (fim < retirada_nova OR inicio > devolucao_nova)
        .lt("data_inicio", dataDevolucao)
        .gt("data_fim", dataRetirada);

      if (reservaIdIgnorar) {
        query = query.neq("id", reservaIdIgnorar);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).length === 0;
    },
    [],
  );

  return { verificar };
}
