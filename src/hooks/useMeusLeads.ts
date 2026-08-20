import { useLeads } from "./useLeads";
import { useAuth } from "@/contexts/AuthContext";
import type { Lead } from "@/types/comercial";

/**
 * Versão do useLeads para o portal do funcionário. A RLS já restringe as
 * linhas retornadas pelo banco (vendedor só recebe leads que criou ou
 * atende); este hook só garante que um novo lead nasça com criado_por/
 * atendido_por = usuário logado, para que a política de INSERT o aceite.
 */
export function useMeusLeads() {
  const { user } = useAuth();
  const leadsCtx = useLeads();

  const addLead = async (dados: Parameters<typeof leadsCtx.addLead>[0]) => {
    const withOwner: Omit<Lead, "id" | "criadoEm" | "statusFunil"> = {
      ...dados,
      criadoPor: dados.criadoPor ?? user?.id ?? undefined,
      atendidoPor: dados.atendidoPor ?? user?.id ?? undefined,
    };
    return leadsCtx.addLead(withOwner);
  };

  return {
    ...leadsCtx,
    addLead,
  };
}
