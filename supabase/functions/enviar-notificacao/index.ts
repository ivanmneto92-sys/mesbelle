import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { enviarEmail, templateBase, botaoCTA } from "../_shared/resend.ts";

// Tipos de notificação disponíveis.
type TipoNotificacao =
  | "contrato_assinado"
  | "agendamento_confirmado"
  | "retirada_amanha"
  | "devolucao_hoje";

interface DadosContratoAssinado {
  nomeCliente: string;
  nomePeca: string;
  dataEvento: string;
  valor: string;
  dataAssinatura?: string;
  emailsAdmin: string | string[];
}

interface DadosAgendamentoConfirmado {
  nomeCliente: string;
  tipoAgendamento: string;
  data: string;
  hora: string;
  nomeConsultora?: string;
  emailsAdmin: string | string[];
}

interface DadosRetiradaAmanha {
  nomeCliente: string;
  nomePeca: string;
  dataEvento: string;
  emailsAdmin: string | string[];
}

interface DadosDevolucaoHoje {
  nomeCliente: string;
  nomePeca: string;
  emailsAdmin: string | string[];
}

type NotificacaoBody =
  | { tipo: "contrato_assinado"; dados: DadosContratoAssinado }
  | { tipo: "agendamento_confirmado"; dados: DadosAgendamentoConfirmado }
  | { tipo: "retirada_amanha"; dados: DadosRetiradaAmanha }
  | { tipo: "devolucao_hoje"; dados: DadosDevolucaoHoje };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

    const { tipo, dados } = (await req.json()) as NotificacaoBody;
    if (!tipo || !dados) return json({ error: "tipo e dados são obrigatórios" }, 400);

    let html = "";
    let assunto = "";

    switch (tipo) {
      case "contrato_assinado":
        assunto = `Contrato assinado — ${dados.nomeCliente}`;
        html = templateBase(`
          <h2 style="color:#4a1535;font-size:20px;margin:0 0 16px;">
            ✅ Contrato assinado com sucesso!
          </h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
            O contrato de locação de <strong>${dados.nomePeca}</strong> foi assinado por
            <strong>${dados.nomeCliente}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
            <tr style="background:#f9f5f1;">
              <td style="padding:10px 12px;color:#6b7280;">Cliente</td>
              <td style="padding:10px 12px;font-weight:600;color:#111827;">${dados.nomeCliente}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;color:#6b7280;">Peça</td>
              <td style="padding:10px 12px;font-weight:600;color:#111827;">${dados.nomePeca}</td>
            </tr>
            <tr style="background:#f9f5f1;">
              <td style="padding:10px 12px;color:#6b7280;">Data do evento</td>
              <td style="padding:10px 12px;font-weight:600;color:#111827;">${dados.dataEvento}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;color:#6b7280;">Valor</td>
              <td style="padding:10px 12px;font-weight:600;color:#4a1535;">${dados.valor}</td>
            </tr>
          </table>
          <p style="color:#9ca3af;font-size:13px;margin:16px 0 0;">
            Assinado em: ${dados.dataAssinatura ?? new Date().toLocaleDateString("pt-BR")}
          </p>
        `);
        break;

      case "agendamento_confirmado":
        assunto = `Agendamento confirmado — ${dados.nomeCliente}`;
        html = templateBase(`
          <h2 style="color:#4a1535;font-size:20px;margin:0 0 16px;">
            📅 Agendamento confirmado!
          </h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
            Um novo agendamento foi registrado para <strong>${dados.nomeCliente}</strong>.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
            <tr style="background:#f9f5f1;">
              <td style="padding:10px 12px;color:#6b7280;">Tipo</td>
              <td style="padding:10px 12px;font-weight:600;color:#111827;">${dados.tipoAgendamento}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;color:#6b7280;">Data</td>
              <td style="padding:10px 12px;font-weight:600;color:#111827;">${dados.data}</td>
            </tr>
            <tr style="background:#f9f5f1;">
              <td style="padding:10px 12px;color:#6b7280;">Horário</td>
              <td style="padding:10px 12px;font-weight:600;color:#111827;">${dados.hora}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;color:#6b7280;">Consultora</td>
              <td style="padding:10px 12px;font-weight:600;color:#111827;">${dados.nomeConsultora ?? "—"}</td>
            </tr>
          </table>
        `);
        break;

      case "retirada_amanha":
        assunto = `Lembrete: retirada amanhã — ${dados.nomeCliente}`;
        html = templateBase(`
          <h2 style="color:#4a1535;font-size:20px;margin:0 0 16px;">
            👗 Lembrete: retirada amanhã
          </h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
            A cliente <strong>${dados.nomeCliente}</strong> tem retirada agendada para amanhã.
          </p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
            <tr style="background:#f9f5f1;">
              <td style="padding:10px 12px;color:#6b7280;">Peça</td>
              <td style="padding:10px 12px;font-weight:600;color:#111827;">${dados.nomePeca}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;color:#6b7280;">Data do evento</td>
              <td style="padding:10px 12px;font-weight:600;color:#111827;">${dados.dataEvento}</td>
            </tr>
          </table>
        `);
        break;

      case "devolucao_hoje":
        assunto = `Devolução hoje — ${dados.nomeCliente}`;
        html = templateBase(`
          <h2 style="color:#4a1535;font-size:20px;margin:0 0 16px;">
            📦 Devolução prevista para hoje
          </h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
            A cliente <strong>${dados.nomeCliente}</strong> deve devolver
            <strong>${dados.nomePeca}</strong> hoje.
          </p>
          <p style="color:#ef4444;font-size:14px;background:#fef2f2;
                    padding:12px 16px;border-radius:8px;margin:0;">
            ⚠️ Caso não haja devolução, entre em contato com a cliente.
          </p>
        `);
        break;

      default: {
        const tipoRecebido: string = tipo;
        return json({ error: `Tipo desconhecido: ${tipoRecebido}` }, 400);
      }
    }

    const destinatarios = dados.emailsAdmin
      ? (Array.isArray(dados.emailsAdmin) ? dados.emailsAdmin : [dados.emailsAdmin])
      : [];
    if (destinatarios.length === 0) return json({ error: "emailsAdmin não informado" }, 400);

    await enviarEmail({ para: destinatarios, assunto, html });

    return json({ success: true, tipo, enviado_para: destinatarios });
  } catch (err) {
    console.error("[enviar-notificacao]", err);
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
