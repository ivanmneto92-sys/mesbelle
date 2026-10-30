import "dotenv/config";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { createClient } from "@supabase/supabase-js";
import NodeCache from "node-cache";
import pino from "pino";
import qrcode from "qrcode-terminal";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.fatal(
    "Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY. Copie whatsapp-bot/.env.example para .env e preencha.",
  );
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Mantém a tela de WhatsApp do CRM (aba "WhatsApp") atualizada com o status
// da conexão e o QR code pra parear — é a única linha da tabela
// whatsapp_conexao (id fixo = 1).
async function atualizarStatus(dados: {
  status: "desconectado" | "aguardando_qr" | "conectado";
  qr?: string | null;
  numero_conectado?: string | null;
}) {
  const { error } = await supabase
    .from("whatsapp_conexao")
    .update({ ...dados, atualizado_em: new Date().toISOString() })
    .eq("id", 1);
  if (error) logger.error({ err: error }, "Falha ao atualizar status no Supabase");
}

// Fica fora de conectar() de propósito: se morasse dentro, cada reconexão
// zerava o cache e reinícios próximos voltavam a reenviar pro WhatsApp
// pedidos de descriptografia que ele já tinha resolvido.
const msgRetryCounterCache = new NodeCache();

const RECONEXAO_MIN_MS = 2_000;
const RECONEXAO_MAX_MS = 60_000;
let atrasoReconexao = RECONEXAO_MIN_MS;

async function conectar() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    msgRetryCounterCache,
    // Não marca "online" no WhatsApp ao conectar — mantém as notificações
    // normais no celular, como se o app estivesse fechado.
    markOnlineOnConnect: false,
    // Sem um histórico de mensagens de verdade ainda, não tem o que
    // devolver quando o WhatsApp pede reenvio (retry de descriptografia,
    // voto de enquete) — só evita que o Baileys quebre nessa hora. Se
    // precisar reenvio de verdade, trocar por uma consulta a um banco de
    // mensagens guardadas.
    getMessage: async () => undefined,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info("Escaneie o QR code no WhatsApp do celular (Aparelhos conectados → Conectar aparelho):");
      qrcode.generate(qr, { small: true });
      atualizarStatus({ status: "aguardando_qr", qr, numero_conectado: null });
    }

    if (connection === "open") {
      logger.info("Conectado ao WhatsApp.");
      atrasoReconexao = RECONEXAO_MIN_MS; // da próxima queda, tenta rápido de novo
      const numero = sock.user?.id?.split(":")[0]?.split("@")[0] ?? null;
      atualizarStatus({ status: "conectado", qr: null, numero_conectado: numero });
    }

    if (connection === "close") {
      const motivo = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const deslogado = motivo === DisconnectReason.loggedOut;

      if (deslogado) {
        logger.fatal(
          "Sessão encerrada pelo celular (logout). Apague a pasta auth_info_baileys e rode de novo para escanear um QR code novo.",
        );
        atualizarStatus({ status: "desconectado", qr: null, numero_conectado: null });
        return;
      }

      atualizarStatus({ status: "desconectado" });
      logger.warn({ motivo }, `Conexão caiu — tentando reconectar em ${atrasoReconexao / 1000}s...`);
      setTimeout(conectar, atrasoReconexao);
      atrasoReconexao = Math.min(atrasoReconexao * 2, RECONEXAO_MAX_MS);
    }
  });

  sock.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return; // ignora replay de histórico — só mensagem nova

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remetente = msg.key.remoteJid ?? "desconhecido";
      const texto =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        "(mensagem sem texto — imagem, áudio, figurinha, etc.)";

      logger.info({ remetente, texto }, "Mensagem recebida");

      // TODO: aqui entra a lógica de negócio — casar `remetente` (telefone)
      // com um lead existente em leads.telefone, ou criar um lead novo se
      // não encontrar nenhum. Ainda não implementado: falta fechar com o
      // Ivan a regra exata de quando um contato "converte" em lead.
    }
  });

  return sock;
}

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Promise rejeitada sem tratamento — processo continua rodando.");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Erro não tratado — processo continua rodando.");
});

conectar();
