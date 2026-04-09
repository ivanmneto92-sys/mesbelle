export type CategoriaAtivo = "Vestido" | "Imobilizado" | "Equipamento";

export interface AtivoPatrimonio {
  id: string;
  nome: string;
  categoria: CategoriaAtivo;
  dataCompra: string; // YYYY-MM-DD
  valorOriginal: number;
  percentualDesagio: number; // ex: 20 = 20%
}

export interface SocioEmpresa {
  id: string;
  nome: string;
  percentualParticipacao: number; // ex: 50 = 50%
  ativo: boolean;
  dataExpiracao?: string; // YYYY-MM-DD, optional
}
