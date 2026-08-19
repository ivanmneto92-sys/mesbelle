import { supabase } from "@/integrations/supabase/client";

interface UpsertProvaArgs {
  leadId: string;
  nome: string;
  data: string;         // YYYY-MM-DD
  hora?: string;        // HH:MM
  tipoEvento?: string;
}

interface UpsertEntregaArgs {
  aluguelId: string;
  vestido: string;
  cliente: string;
  tipo: "saida" | "retorno";
  data: string;         // YYYY-MM-DD
}

async function callGoogleCalendar(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("google-calendar", { body });
  if (error) console.error("[GoogleCalendar]", error.message);
  return data;
}

export const googleCalendar = {
  upsertProva: (args: UpsertProvaArgs) =>
    callGoogleCalendar({ action: "upsert_prova", ...args }),
  upsertEntrega: (args: UpsertEntregaArgs) =>
    callGoogleCalendar({ action: "upsert_entrega", ...args }),
  deleteProva: (leadId: string) =>
    callGoogleCalendar({ action: "delete", tipo: "prova", referenciaId: leadId }),
  deleteEntrega: (aluguelId: string, tipo: "saida" | "retorno") =>
    callGoogleCalendar({ action: "delete", tipo, referenciaId: aluguelId }),
};
