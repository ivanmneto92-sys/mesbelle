import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AluguelLogistica, StatusLogistica } from "@/types/logistica";
import type { DateRange } from "@/hooks/useDateRange";
import { toast } from "sonner";

type Row = {
  id: string; vestido_nome: string; cliente_nome: string; cliente_telefone: string;
  endereco_entrega: string; data_saida: string; data_retorno: string;
  status_logistica: string;
  assinatura_base64: string | null; data_assinatura: string | null;
  ip_assinatura: string | null; user_agent_assinatura: string | null;
};
const rowTo = (r: Row): AluguelLogistica => ({
  id: r.id, vestidoNome: r.vestido_nome, clienteNome: r.cliente_nome,
  clienteTelefone: r.cliente_telefone, enderecoEntrega: r.endereco_entrega,
  dataSaida: r.data_saida, dataRetorno: r.data_retorno,
  statusLogistica: r.status_logistica as StatusLogistica,
  assinaturaBase64: r.assinatura_base64 ?? undefined,
  dataAssinatura: r.data_assinatura ?? undefined,
  ipAssinatura: r.ip_assinatura ?? undefined,
  userAgentAssinatura: r.user_agent_assinatura ?? undefined,
});

export function useLogistica(range?: DateRange) {
  const [items, setItems] = useState<AluguelLogistica[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      let query = supabase.from("alugueis_logistica").select("*").order("created_at", { ascending: false });
      if (range) query = query.gte("data_saida", range.from).lte("data_saida", range.to);
      const { data } = await query;
      if (!active || !data) return;
      const today = new Date().toISOString().split("T")[0];
      const mapped = (data as Row[]).map(rowTo);
      // auto atraso
      const atrasados: string[] = [];
      const updated = mapped.map((i) => {
        if (i.statusLogistica === "com_cliente" && i.dataRetorno < today) {
          atrasados.push(i.id);
          return { ...i, statusLogistica: "atrasado" as StatusLogistica };
        }
        return i;
      });
      setItems(updated);
      if (atrasados.length) {
        await supabase.from("alugueis_logistica").update({ status_logistica: "atrasado" }).in("id", atrasados);
      }
    })();
    return () => { active = false; };
  }, [range]);

  const updateStatus = useCallback(async (id: string, status: StatusLogistica) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, statusLogistica: status } : i));
    await supabase.from("alugueis_logistica").update({ status_logistica: status }).eq("id", id);
  }, []);

  // Assinatura digital do Termo de Retirada — mesmo padrão do contrato
  // (assinarContrato em useLeads.ts): base64 do traço + data + IP + user
  // agent, para servir de evidência.
  const assinarTermo = useCallback(async (id: string, assinaturaBase64: string) => {
    const dataAssinatura = new Date().toISOString();
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null;
    let ip: string | null = null;
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      if (r.ok) {
        const j = await r.json();
        if (typeof j?.ip === "string") ip = j.ip;
      }
    } catch { /* ignore */ }

    const anterior = items.find((i) => i.id === id);
    setItems((prev) => prev.map((i) =>
      i.id === id
        ? { ...i, assinaturaBase64, dataAssinatura, ipAssinatura: ip ?? undefined, userAgentAssinatura: userAgent ?? undefined }
        : i
    ));
    const { error } = await supabase.from("alugueis_logistica").update({
      assinatura_base64: assinaturaBase64,
      data_assinatura: dataAssinatura,
      ip_assinatura: ip,
      user_agent_assinatura: userAgent,
    }).eq("id", id);
    if (error) {
      if (anterior) setItems((prev) => prev.map((i) => i.id === id ? anterior : i));
      toast.error("Não foi possível registrar a assinatura: " + error.message);
      return false;
    }
    return true;
  }, [items]);

  return { items, updateStatus, assinarTermo };
}
