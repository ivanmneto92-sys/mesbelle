import { supabase } from "@/integrations/supabase/client";

type TipoNotificacao = "contrato_assinado" | "agendamento_confirmado" | "retirada_amanha" | "devolucao_hoje";

interface DadosContratoAssinado {
  emailsAdmin: string[];
  nomeCliente: string;
  nomePeca: string;
  dataEvento: string;
  valor: string;
  dataAssinatura?: string;
}

interface DadosAgendamento {
  emailsAdmin: string[];
  nomeCliente: string;
  tipoAgendamento: string;
  data: string;
  hora: string;
  nomeConsultora?: string;
}

interface DadosRetiradaAmanha {
  emailsAdmin: string[];
  nomeCliente: string;
  nomePeca: string;
  dataEvento: string;
}

interface DadosDevolucaoHoje {
  emailsAdmin: string[];
  nomeCliente: string;
  nomePeca: string;
}

type NotificacaoPayload =
  | { tipo: "contrato_assinado"; dados: DadosContratoAssinado }
  | { tipo: "agendamento_confirmado"; dados: DadosAgendamento }
  | { tipo: "retirada_amanha"; dados: DadosRetiradaAmanha }
  | { tipo: "devolucao_hoje"; dados: DadosDevolucaoHoje };

// Falha silenciosa — e-mail é complementar, não bloqueia o fluxo principal.
async function chamarNotificacao(payload: NotificacaoPayload): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.functions.invoke("enviar-notificacao", {
    body: payload,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) console.warn("[notificacao] falha ao enviar:", error.message);
}

export function useNotificacoes() {
  return {
    notificarContratoAssinado: (dados: DadosContratoAssinado) =>
      chamarNotificacao({ tipo: "contrato_assinado", dados }),
    notificarAgendamento: (dados: DadosAgendamento) =>
      chamarNotificacao({ tipo: "agendamento_confirmado", dados }),
    notificarRetiradaAmanha: (dados: DadosRetiradaAmanha) =>
      chamarNotificacao({ tipo: "retirada_amanha", dados }),
    notificarDevolucaoHoje: (dados: DadosDevolucaoHoje) =>
      chamarNotificacao({ tipo: "devolucao_hoje", dados }),
  };
}

export type { TipoNotificacao };
