import { useState, useCallback, useMemo } from "react";
import { UserRole } from "@/contexts/AuthContext";

export interface RolePermissoes {
  dashboard: boolean;
  crm: boolean;
  comercial: boolean;
  acervo: boolean;
  logistica: boolean;
  financeiro: boolean;
  equipe: boolean;
  socios: boolean;
  comissoes: boolean;
  rankingEquipe: boolean;
  distribuicaoLucros: boolean;
}

export interface PermissoesConfig {
  vendedor: RolePermissoes;
  socio: RolePermissoes;
}

const STORAGE_KEY = "mesbelle_permissoes";

const defaultPermissoes: PermissoesConfig = {
  vendedor: {
    dashboard: true,
    crm: true,
    comercial: true,
    acervo: true,
    logistica: true,
    financeiro: false,
    equipe: false,
    socios: false,
    comissoes: true,
    rankingEquipe: false,
    distribuicaoLucros: false,
  },
  socio: {
    dashboard: true,
    crm: false,
    comercial: false,
    acervo: false,
    logistica: false,
    financeiro: true,
    equipe: false,
    socios: true,
    comissoes: false,
    rankingEquipe: false,
    distribuicaoLucros: true,
  },
};

function loadPermissoes(): PermissoesConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        vendedor: { ...defaultPermissoes.vendedor, ...parsed.vendedor },
        socio: { ...defaultPermissoes.socio, ...parsed.socio },
      };
    }
  } catch {}
  return defaultPermissoes;
}

export function usePermissoes() {
  const [permissoes, setPermissoes] = useState<PermissoesConfig>(loadPermissoes);

  const updatePermissao = useCallback(
    (role: "vendedor" | "socio", key: keyof RolePermissoes, value: boolean) => {
      setPermissoes((prev) => {
        const next = {
          ...prev,
          [role]: { ...prev[role], [key]: value },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const temPermissao = useCallback(
    (role: UserRole | undefined, modulo: keyof RolePermissoes): boolean => {
      if (!role || role === "admin") return true;
      if (role === "vendedor") return permissoes.vendedor[modulo];
      if (role === "socio") return permissoes.socio[modulo];
      return false;
    },
    [permissoes]
  );

  return { permissoes, updatePermissao, temPermissao };
}

// Mapping from route paths to permission keys
export const routePermissionMap: Record<string, keyof RolePermissoes> = {
  "/": "dashboard",
  "/crm": "crm",
  "/comercial": "comercial",
  "/acervo": "acervo",
  "/logistica": "logistica",
  "/financeiro": "financeiro",
  "/equipe": "equipe",
  "/socios": "socios",
};

// Labels for the admin UI
export const permissaoLabels: Record<keyof RolePermissoes, string> = {
  dashboard: "Dashboard",
  crm: "CRM",
  comercial: "Comercial & Vendas",
  acervo: "Acervo & Produção",
  logistica: "Logística",
  financeiro: "Financeiro",
  equipe: "Time & Performance",
  socios: "Portal de Sócios",
  comissoes: "Ver comissões próprias",
  rankingEquipe: "Ver ranking da equipe",
  distribuicaoLucros: "Ver distribuição de lucros",
};

export const vendedorPermKeys: (keyof RolePermissoes)[] = [
  "dashboard", "crm", "comercial", "acervo", "logistica", "comissoes", "rankingEquipe",
];

export const socioPermKeys: (keyof RolePermissoes)[] = [
  "dashboard", "socios", "financeiro", "equipe", "distribuicaoLucros",
];
