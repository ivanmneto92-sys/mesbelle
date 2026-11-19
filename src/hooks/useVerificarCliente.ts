import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizarTelefone } from "@/lib/telefone";

export interface ClienteExistente {
  leadId: string;
  nome: string;
  campo: "telefone" | "email" | "cpf" | "telefone_parecido";
  valor: string;
  /** Quem está logado consegue abrir esse cadastro (vendedora só vê os próprios). */
  visivel: boolean;
}

function useDebounce<T>(valor: T, ms = 400): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}

const emailCompleto = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim());
const cpfCompleto = (c: string) => c.replace(/\D/g, "").length === 11;

/**
 * Enquanto a pessoa digita telefone/e-mail/CPF, pergunta ao banco se algum
 * já pertence a outra cliente (verificar_cliente_existente). Consulta a loja
 * inteira, não só os leads que a vendedora enxerga — o cadastro é único na
 * loja. Só pergunta quando o dado já está completo o bastante.
 */
export function useVerificarCliente(params: { telefone?: string; email?: string; cpf?: string; ignorarId?: string | null }) {
  const telefone = useDebounce(params.telefone ?? "");
  const email = useDebounce(params.email ?? "");
  const cpf = useDebounce(params.cpf ?? "");

  const tel = normalizarTelefone(telefone).length >= 10 ? telefone : "";
  const em = emailCompleto(email) ? email : "";
  const cp = cpfCompleto(cpf) ? cpf : "";
  const ativo = !!(tel || em || cp);

  const query = useQuery({
    queryKey: ["verificar-cliente", tel, em.trim().toLowerCase(), cp.replace(/\D/g, ""), params.ignorarId ?? null],
    enabled: ativo,
    staleTime: 15_000,
    queryFn: async (): Promise<ClienteExistente[]> => {
      const { data, error } = await supabase.rpc("verificar_cliente_existente", {
        p_telefone: tel, p_email: em, p_cpf: cp, p_ignorar_id: params.ignorarId ?? undefined,
      });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        leadId: r.lead_id, nome: r.nome, campo: r.campo as ClienteExistente["campo"], valor: r.valor, visivel: r.visivel,
      }));
    },
  });

  const existentes = ativo ? query.data ?? [] : [];
  return {
    existentes,
    /** Telefone/e-mail/CPF iguais: impedem salvar. */
    bloqueantes: existentes.filter((e) => e.campo !== "telefone_parecido"),
    /** Mesmo número com DDD diferente: só aviso. */
    parecidos: existentes.filter((e) => e.campo === "telefone_parecido"),
    verificando: query.isFetching,
  };
}
