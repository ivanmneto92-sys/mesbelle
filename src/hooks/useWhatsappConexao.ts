import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WhatsappStatus = "desconectado" | "aguardando_qr" | "conectado";

export interface WhatsappConexao {
  status: WhatsappStatus;
  qr: string | null;
  numeroConectado: string | null;
  atualizadoEm: string | null;
}

const estadoInicial: WhatsappConexao = {
  status: "desconectado",
  qr: null,
  numeroConectado: null,
  atualizadoEm: null,
};

function rowParaEstado(row: {
  status: string;
  qr: string | null;
  numero_conectado: string | null;
  atualizado_em: string;
}): WhatsappConexao {
  return {
    status: row.status as WhatsappStatus,
    qr: row.qr,
    numeroConectado: row.numero_conectado,
    atualizadoEm: row.atualizado_em,
  };
}

// Lê (e acompanha em tempo real) a linha única que o bot de WhatsApp
// (whatsapp-bot/, rodando fora do app) mantém atualizada com o QR code
// pra parear e se já está conectado. O bot escreve com a service role key;
// aqui só leitura, restrita a admin pela RLS da tabela.
export function useWhatsappConexao() {
  const [estado, setEstado] = useState<WhatsappConexao>(estadoInicial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("whatsapp_conexao")
        .select("status, qr, numero_conectado, atualizado_em")
        .eq("id", 1)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        console.error("[WhatsApp] Falha ao carregar status:", error.message);
      } else if (data) {
        setEstado(rowParaEstado(data));
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel(`whatsapp_conexao_changes_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conexao" },
        (payload) => {
          const next = (payload.new ?? payload.old) as typeof payload.new;
          if (next) setEstado(rowParaEstado(next as Parameters<typeof rowParaEstado>[0]));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { ...estado, loading };
}
