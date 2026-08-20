import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
  ultimoLogin: string | null;
  confirmado: boolean;
  bloqueado: boolean;
}

export type FuncionarioAction = "desativar" | "reativar" | "reenviar_convite";

async function invocarFuncao<T>(nome: string, body: object): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke<T>(nome, {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  return data as T;
}

export function useFuncionarios() {
  const qc = useQueryClient();

  const { data: funcionarios = [], isLoading } = useQuery<Funcionario[]>({
    queryKey: ["funcionarios"],
    queryFn: () => invocarFuncao<Funcionario[]>("listar-funcionarios", {}),
  });

  const criar = useMutation({
    mutationFn: ({ nome, email }: { nome: string; email: string }) =>
      invocarFuncao("criar-funcionario", { nome, email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Convite enviado! O funcionário receberá um e-mail para definir a senha.");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao criar funcionário"),
  });

  const gerir = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: FuncionarioAction }) =>
      invocarFuncao("gerir-funcionario", { userId, action }),
    onSuccess: (_data, { action }) => {
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
      const msgs: Record<FuncionarioAction, string> = {
        desativar: "Funcionário desativado.",
        reativar: "Funcionário reativado.",
        reenviar_convite: "Convite reenviado com sucesso!",
      };
      toast.success(msgs[action]);
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao atualizar funcionário"),
  });

  return { funcionarios, isLoading, criar, gerir };
}
