import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AluguelLogistica, StatusLogistica } from "@/types/logistica";

type Row = {
  id: string; vestido_nome: string; cliente_nome: string; cliente_telefone: string;
  endereco_entrega: string; data_saida: string; data_retorno: string;
  status_logistica: string; codigo_rastreio: string | null;
};
const rowTo = (r: Row): AluguelLogistica => ({
  id: r.id, vestidoNome: r.vestido_nome, clienteNome: r.cliente_nome,
  clienteTelefone: r.cliente_telefone, enderecoEntrega: r.endereco_entrega,
  dataSaida: r.data_saida, dataRetorno: r.data_retorno,
  statusLogistica: r.status_logistica as StatusLogistica,
  codigoRastreio: r.codigo_rastreio ?? undefined,
});

export function useLogistica() {
  const [items, setItems] = useState<AluguelLogistica[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("alugueis_logistica").select("*").order("created_at", { ascending: false });
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
  }, []);

  const updateStatus = useCallback(async (id: string, status: StatusLogistica) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, statusLogistica: status } : i));
    await supabase.from("alugueis_logistica").update({ status_logistica: status }).eq("id", id);
  }, []);

  const updateRastreio = useCallback(async (id: string, codigo: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, codigoRastreio: codigo } : i));
    await supabase.from("alugueis_logistica").update({ codigo_rastreio: codigo }).eq("id", id);
  }, []);

  const getByStatus = useCallback((status: StatusLogistica) => items.filter(i => i.statusLogistica === status), [items]);

  const activeItems = items.filter(i => i.statusLogistica !== "devolvido");

  return { items: activeItems, updateStatus, updateRastreio, getByStatus };
}
