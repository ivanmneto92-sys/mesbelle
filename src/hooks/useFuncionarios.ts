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

interface CriarFuncionarioResult {
  success: true;
  userId: string;
  message: string;
  funcionario: Funcionario;
}

async function invocarFuncao<T>(nome: string, body: object): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke<T>(nome, {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) {
    // FunctionsHttpError só expõe uma mensagem genérica em .message — o erro real
    // (ex: "Já existe um usuário com este e-mail") está no corpo JSON da resposta.
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      const body = await context.clone().json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw error;
  }
  return data as T;
}

function mensagemErroFuncionario(msg: string | undefined): string {
  const texto = msg ?? "";
  if (/já existe|already|exists|409/i.test(texto)) {
    return "Já existe um funcionário cadastrado com este e-mail.";
  }
  if (/site_url/i.test(texto)) {
    return "Configuração do servidor incompleta. Contate o suporte técnico.";
  }
  if (/email.*invalid|invalid.*email/i.test(texto)) {
    return "E-mail inválido. Verifique o endereço informado.";
  }
  return texto || "Erro ao processar a solicitação. Tente novamente.";
}

export function useFuncionarios() {
  const qc = useQueryClient();

  const { data: funcionarios = [], isLoading } = useQuery<Funcionario[]>({
    queryKey: ["funcionarios"],
    queryFn: () => invocarFuncao<Funcionario[]>("listar-funcionarios", {}),
  });

  const criar = useMutation({
    mutationFn: ({ nome, email }: { nome: string; email: string }) =>
      invocarFuncao<CriarFuncionarioResult>("criar-funcionario", { nome, email }),
    onMutate: async ({ nome, email }) => {
      await qc.cancelQueries({ queryKey: ["funcionarios"] });
      const anterior = qc.getQueryData<Funcionario[]>(["funcionarios"]);
      const temp: Funcionario = {
        id: `temp-${Date.now()}`,
        nome,
        email,
        criadoEm: new Date().toISOString(),
        ultimoLogin: null,
        confirmado: false,
        bloqueado: false,
      };
      qc.setQueryData<Funcionario[]>(["funcionarios"], (old) => [temp, ...(old ?? [])]);
      return { anterior };
    },
    onSuccess: (data) => {
      if (data?.funcionario) {
        qc.setQueryData<Funcionario[]>(["funcionarios"], (old) =>
          (old ?? []).map((f) => (f.id.startsWith("temp-") ? data.funcionario : f))
        );
      }
      qc.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Convite enviado! O funcionário receberá um e-mail para definir a senha.");
    },
    onError: (e: Error, _vars, context) => {
      if (context?.anterior !== undefined) qc.setQueryData(["funcionarios"], context.anterior);
      toast.error(mensagemErroFuncionario(e.message));
    },
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
    onError: (e: Error) => toast.error(mensagemErroFuncionario(e.message)),
  });

  return { funcionarios, isLoading, criar, gerir };
}
