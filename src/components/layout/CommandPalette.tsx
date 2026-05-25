import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  Handshake,
  ShoppingBag,
  Truck,
  DollarSign,
  UserCog,
  Briefcase,
  Settings,
  UserPlus,
  FileSignature,
  Package,
} from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { usePermissoes, routePermissionMap } from "@/hooks/usePermissoes";

type CmdItem = {
  label: string;
  hint?: string;
  icon: typeof LayoutDashboard;
  url: string;
  roles: UserRole[];
  group: "Navegar" | "Ações rápidas";
};

const items: CmdItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, url: "/", roles: ["admin", "vendedor", "socio"], group: "Navegar" },
  { label: "CRM — Leads", icon: Users, url: "/crm", roles: ["admin", "vendedor"], group: "Navegar" },
  { label: "Comercial", icon: Handshake, url: "/comercial", roles: ["admin", "vendedor"], group: "Navegar" },
  { label: "Acervo & Produção", icon: ShoppingBag, url: "/acervo", roles: ["admin", "vendedor"], group: "Navegar" },
  { label: "Logística", icon: Truck, url: "/logistica", roles: ["admin", "vendedor"], group: "Navegar" },
  { label: "Financeiro", icon: DollarSign, url: "/financeiro", roles: ["admin"], group: "Navegar" },
  { label: "Time & Performance", icon: UserCog, url: "/equipe", roles: ["admin"], group: "Navegar" },
  { label: "Portal de Sócios", icon: Briefcase, url: "/socios", roles: ["admin", "socio"], group: "Navegar" },
  { label: "Configurações", icon: Settings, url: "/configuracoes", roles: ["admin"], group: "Navegar" },

  { label: "Novo lead", hint: "Cadastrar cliente", icon: UserPlus, url: "/crm?new=lead", roles: ["admin", "vendedor"], group: "Ações rápidas" },
  { label: "Nova negociação", hint: "Iniciar venda", icon: Handshake, url: "/comercial?tab=negociacoes", roles: ["admin", "vendedor"], group: "Ações rápidas" },
  { label: "Gerar contrato", hint: "Para assinatura", icon: FileSignature, url: "/comercial?tab=contratos", roles: ["admin", "vendedor"], group: "Ações rápidas" },
  { label: "Registrar retirada", hint: "Logística", icon: Package, url: "/logistica", roles: ["admin", "vendedor"], group: "Ações rápidas" },
];

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { temPermissao } = usePermissoes();

  const allowed = items.filter((i) => {
    if (!user || !i.roles.includes(user.role)) return false;
    const baseUrl = i.url.split("?")[0];
    const perm = routePermissionMap[baseUrl];
    if (perm && !temPermissao(user.role, perm)) return false;
    return true;
  });

  const groups = ["Ações rápidas", "Navegar"] as const;

  const go = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar ou ir para…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        {groups.map((g, gi) => {
          const groupItems = allowed.filter((i) => i.group === g);
          if (!groupItems.length) return null;
          return (
            <div key={g}>
              {gi > 0 && <CommandSeparator />}
              <CommandGroup heading={g}>
                {groupItems.map((it) => (
                  <CommandItem key={it.label + it.url} onSelect={() => go(it.url)} className="gap-3">
                    <it.icon className="h-4 w-4 text-primary" />
                    <span>{it.label}</span>
                    {it.hint && <span className="ml-auto text-xs text-muted-foreground">{it.hint}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
