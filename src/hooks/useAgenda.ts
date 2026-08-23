import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Agendamento, NovoAgendamento, TipoAgendamento, StatusAgendamento } from "@/types/agenda";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface AgendamentoRow {
  id: string;
  tipo: string;
  data_hora: string;
  duracao_minutos: number;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_telefone: string | null;
  negocio_id: string | null;
  lead_id: string | null;
  reserva_id: string | null;
  vestido_id: string | null;
  funcionaria_id: string | null;
  observacoes: string | null;
  status: string;
  criado_em: string;
  vestidos: { nome: string } | null;
}

function mapRow(row: AgendamentoRow): Agendamento {
  return {
    id: row.id,
    tipo: row.tipo as TipoAgendamento,
    dataHora: row.data_hora,
    duracaoMinutos: row.duracao_minutos,
    clienteNome: row.cliente_nome,
    clienteEmail: row.cliente_email,
    clienteTelefone: row.cliente_telefone,
    negocioId: row.negocio_id,
    leadId: row.lead_id,
    reservaId: row.reserva_id,
    vestidoId: row.vestido_id,
    funcionariaId: row.funcionaria_id,
    observacoes: row.observacoes,
    status: (row.status as StatusAgendamento) ?? "agendado",
    criadoEm: row.criado_em,
    vestidoNome: row.vestidos?.nome ?? null,
  };
}

// ─── Query base ──────────────────────────────────────────────────────────────
// Não existe embed de funcionaria_id via PostgREST (a FK aponta para
// auth.users, que não é exposto pela API) — o nome da funcionária é
// resolvido no componente a partir da lista de useFuncionarios (admin-only).

export function useAgenda(dataInicio: Date, dataFim: Date, funcionariaId?: string | null) {
  return useQuery({
    queryKey: ["agenda", dataInicio.toISOString(), dataFim.toISOString(), funcionariaId ?? null],
    queryFn: async () => {
      let query = supabase
        .from("agendamentos")
        .select("*, vestidos (nome)")
        .gte("data_hora", dataInicio.toISOString())
        .lte("data_hora", dataFim.toISOString())
        .order("data_hora", { ascending: true });

      if (funcionariaId) {
        query = query.eq("funcionaria_id", funcionariaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row) => mapRow(row as AgendamentoRow));
    },
    // Mantém a agenda sincronizada entre abas/usuários diferentes (ex: admin
    // cria um evento enquanto a funcionária está com a dela aberta) sem
    // precisar de WebSockets — só re-busca quando a aba está em foco.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 20_000,
  });
}

export function useAgendaDia(data: Date, funcionariaId?: string | null) {
  return useAgenda(startOfDay(data), endOfDay(data), funcionariaId);
}

export function useAgendaSemana(data: Date, funcionariaId?: string | null) {
  return useAgenda(
    startOfWeek(data, { weekStartsOn: 0 }),
    endOfWeek(data, { weekStartsOn: 0 }),
    funcionariaId,
  );
}

export function useAgendaMes(data: Date, funcionariaId?: string | null) {
  return useAgenda(startOfMonth(data), endOfMonth(data), funcionariaId);
}

/**
 * Para o Kanban — busca TODOS os agendamentos acessíveis ao usuário no
 * intervalo de 90 dias atrás até 90 dias à frente, sem filtro de
 * funcionária: a RLS do banco já garante que cada papel vê apenas o que
 * lhe é permitido (funcionário vê tudo para poder colaborar; um card sem
 * funcionaria_id atribuída não deve ficar invisível).
 */
export function useAgendaKanban() {
  // Ancorado no início do dia de hoje — se recalculássemos com `new Date()`
  // diretamente, a queryKey (que inclui os limites em ISO) mudaria a cada
  // render, e a query nunca "assentaria": toda vez que os dados chegassem, o
  // componente re-renderizaria, geraria uma chave nova (agora com milissegundos
  // diferentes) e a tela voltaria a mostrar vazia enquanto a nova busca corria.
  const inicioDeHoje = startOfDay(new Date()).getTime();
  const { dataInicio, dataFim } = useMemo(() => {
    const hoje = new Date(inicioDeHoje);
    return { dataInicio: subDays(hoje, 90), dataFim: addDays(hoje, 90) };
  }, [inicioDeHoje]);
  return useAgenda(dataInicio, dataFim);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCriarAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NovoAgendamento) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("agendamentos")
        .insert({
          tipo: payload.tipo,
          data_hora: payload.dataHora,
          duracao_minutos: payload.duracaoMinutos,
          cliente_nome: payload.clienteNome,
          cliente_email: payload.clienteEmail ?? null,
          cliente_telefone: payload.clienteTelefone ?? null,
          negocio_id: payload.negocioId ?? null,
          lead_id: payload.leadId ?? null,
          reserva_id: payload.reservaId ?? null,
          vestido_id: payload.vestidoId ?? null,
          funcionaria_id: payload.funcionariaId ?? null,
          observacoes: payload.observacoes ?? null,
          criado_por: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Agendamento criado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao criar agendamento"),
  });
}

export function useEditarAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<NovoAgendamento> & { id: string }) => {
      const update: Record<string, unknown> = {};
      if (payload.tipo) update.tipo = payload.tipo;
      if (payload.dataHora) update.data_hora = payload.dataHora;
      if (payload.duracaoMinutos) update.duracao_minutos = payload.duracaoMinutos;
      if (payload.clienteNome) update.cliente_nome = payload.clienteNome;
      if (payload.clienteEmail !== undefined) update.cliente_email = payload.clienteEmail || null;
      if (payload.clienteTelefone !== undefined) update.cliente_telefone = payload.clienteTelefone || null;
      if (payload.leadId !== undefined) update.lead_id = payload.leadId || null;
      if (payload.funcionariaId !== undefined) update.funcionaria_id = payload.funcionariaId || null;
      if (payload.observacoes !== undefined) update.observacoes = payload.observacoes || null;

      const { error } = await supabase.from("agendamentos").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Agendamento atualizado!");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao atualizar"),
  });
}

export function useMoverKanban() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusAgendamento }) => {
      const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    // Atualização otimista — o card se move imediatamente, sem esperar o servidor.
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["agenda"] });
      const snapshot = qc.getQueriesData<Agendamento[]>({ queryKey: ["agenda"] });
      qc.setQueriesData<Agendamento[]>({ queryKey: ["agenda"] }, (old) =>
        (old ?? []).map((ag) => (ag.id === id ? { ...ag, status } : ag)),
      );
      return { snapshot };
    },
    onError: (e: Error, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(e.message || "Erro ao mover card. Tente novamente.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["agenda"] });
    },
  });
}

export function useExcluirAgendamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agendamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Agendamento excluído.");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao excluir"),
  });
}
