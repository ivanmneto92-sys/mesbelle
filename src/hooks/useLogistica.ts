import { useState, useCallback, useEffect } from "react";
import { AluguelLogistica, StatusLogistica } from "@/types/logistica";

const STORAGE_KEY = "mesbelle_logistica";

function isValid(obj: unknown): obj is AluguelLogistica {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.vestidoNome === "string" && typeof o.statusLogistica === "string";
}

function load(fallback: AluguelLogistica[]): AluguelLogistica[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { localStorage.removeItem(STORAGE_KEY); return fallback; }
    const valid = parsed.filter(isValid);
    if (valid.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    return valid.length > 0 ? valid : fallback;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return fallback;
  }
}

function save(data: AluguelLogistica[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const initialData: AluguelLogistica[] = [
  { id: "1", vestidoNome: "Sereia Bordado Pedraria", clienteNome: "Ana Beatriz", clienteTelefone: "(11) 99876-5432", enderecoEntrega: "Rua das Flores, 123 - São Paulo/SP", dataSaida: "2026-04-08", dataRetorno: "2026-04-15", statusLogistica: "para_enviar" },
  { id: "2", vestidoNome: "Midi Crepe Dourado", clienteNome: "Fernanda Lima", clienteTelefone: "(21) 98765-4321", enderecoEntrega: "Av. Brasil, 456 - Rio de Janeiro/RJ", dataSaida: "2026-04-08", dataRetorno: "2026-04-14", statusLogistica: "para_enviar" },
  { id: "3", vestidoNome: "Princesa Tule Rosa", clienteNome: "Camila Rocha", clienteTelefone: "(31) 99999-1234", enderecoEntrega: "Rua da Paz, 321 - Belo Horizonte/MG", dataSaida: "2026-04-07", dataRetorno: "2026-04-13", statusLogistica: "em_transito", codigoRastreio: "BR123456789" },
  { id: "4", vestidoNome: "Longo Renda Preto", clienteNome: "Mariana Souza", clienteTelefone: "(11) 91234-5678", enderecoEntrega: "Rua XV, 789 - São Paulo/SP", dataSaida: "2026-04-05", dataRetorno: "2026-04-12", statusLogistica: "com_cliente" },
  { id: "5", vestidoNome: "A-line Verde Esmeralda", clienteNome: "Patrícia Nunes", clienteTelefone: "(41) 98888-7777", enderecoEntrega: "Rua Central, 654 - Curitiba/PR", dataSaida: "2026-04-06", dataRetorno: "2026-04-11", statusLogistica: "com_cliente" },
  { id: "6", vestidoNome: "Tomara que Caia Azul", clienteNome: "Juliana Costa", clienteTelefone: "(11) 97777-6666", enderecoEntrega: "Av. Paulista, 1000 - São Paulo/SP", dataSaida: "2026-04-02", dataRetorno: "2026-04-06", statusLogistica: "com_cliente" },
];

export function useLogistica() {
  const [items, setItems] = useState<AluguelLogistica[]>(() => load(initialData));

  // Auto-atraso: com_cliente + dataRetorno < hoje → atrasado
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    let changed = false;
    const updated = items.map((item) => {
      if (item.statusLogistica === "com_cliente" && item.dataRetorno < today) {
        changed = true;
        return { ...item, statusLogistica: "atrasado" as StatusLogistica };
      }
      return item;
    });
    if (changed) {
      setItems(updated);
      save(updated);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((updated: AluguelLogistica[]) => {
    setItems(updated);
    save(updated);
  }, []);

  const updateStatus = useCallback((id: string, status: StatusLogistica) => {
    const updated = items.map((i) => i.id === id ? { ...i, statusLogistica: status } : i);
    persist(updated);
  }, [items, persist]);

  const updateRastreio = useCallback((id: string, codigo: string) => {
    const updated = items.map((i) => i.id === id ? { ...i, codigoRastreio: codigo } : i);
    persist(updated);
  }, [items, persist]);

  const getByStatus = useCallback((status: StatusLogistica) => {
    return items.filter((i) => i.statusLogistica === status);
  }, [items]);

  const activeItems = items.filter((i) => i.statusLogistica !== "devolvido");

  return { items: activeItems, updateStatus, updateRastreio, getByStatus };
}
