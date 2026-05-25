import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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

function mergeConfig(raw: any): PermissoesConfig {
  if (!raw) return defaultPermissoes;
  return {
    vendedor: { ...defaultPermissoes.vendedor, ...(raw.vendedor || {}) },
    socio: { ...defaultPermissoes.socio, ...(raw.socio || {}) },
  };
}

export function usePermissoes() {
  const [permissoes, setPermissoes] = useState<PermissoesConfig>(defaultPermissoes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("permissoes_config")
        .select("vendedor, socio")
        .eq("id", 1)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        console.error("[Permissoes] Falha ao carregar:", error.message);
      } else if (data) {
        setPermissoes(mergeConfig(data));
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel(`permissoes_config_changes_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "permissoes_config" },
        (payload) => {
          const next = (payload.new ?? payload.old) as any;
          if (next) setPermissoes(mergeConfig(next));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const updatePermissao = useCallback(
    async (role: "vendedor" | "socio", key: keyof RolePermissoes, value: boolean) => {
      const previous = permissoes;
      const next: PermissoesConfig = {
        ...previous,
        [role]: { ...previous[role], [key]: value },
      };
      setPermissoes(next);

      const update: any = { [role]: next[role] };
      const { error } = await (supabase as any)
        .from("permissoes_config")
        .update(update)
        .eq("id", 1);



      if (error) {
        console.error("[Permissoes] Falha ao salvar:", error.message);
        setPermissoes(previous);
      }
    },
    [permissoes]
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

  return { permissoes, updatePermissao, temPermissao, loading };
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
