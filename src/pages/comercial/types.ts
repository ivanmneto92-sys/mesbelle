import type { Lead, Contrato, Negocio, ContratoStatus } from "@/types/comercial";
import type { DateRange } from "@/hooks/useDateRange";

export interface ComercialOutletContext {
  leads: Lead[];
  negocios: Negocio[];
  contratos: Contrato[];
  negociosNoPeriodo: Negocio[];
  contratosNoPeriodo: Contrato[];
  negociosAprovados: Negocio[];
  range: DateRange;
  updateNegocio: (negocioId: string, data: Partial<Negocio>) => void;
  aprovarFechamento: (negocioId: string) => Promise<{ contrato?: Contrato | null }>;
  addContratoFromNegocio: (negocio: Negocio) => Promise<Contrato | null>;
  updateContratoStatus: (contratoId: string, status: ContratoStatus) => void;
  assinarContrato: (contratoId: string, assinaturaBase64: string) => void;
  gerarLinkAssinatura: (contratoId: string, validadeHoras: number) => Promise<string | null>;
  handleSwitchToContratos: (contratoId?: string) => void;
}
