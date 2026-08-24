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
  Megaphone,
  BarChart3,
  FileBarChart,
  CalendarDays,
  ScrollText,
  TrendingUp,
  ArrowLeftRight,
  PieChart,
  UserSearch,
  Scissors,
  UserCircle,
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
  { label: "Dashboard", icon: LayoutDashboard, url: "/", roles: ["admin", "socio"], group: "Navegar" },
  { label: "CRM — Funil de Leads", icon: Handshake, url: "/crm", roles: ["admin"], group: "Navegar" },

  { label: "Relatório Comercial", icon: FileBarChart, url: "/comercial/relatorio", roles: ["admin"], group: "Navegar" },
  { label: "Relatório Agendamento", icon: BarChart3, url: "/comercial/relatorio-agendamento", roles: ["admin"], group: "Navegar" },
  { label: "Calendário", icon: CalendarDays, url: "/comercial/calendario", roles: ["admin"], group: "Navegar" },
  { label: "Contratos (Comercial)", icon: ScrollText, url: "/comercial/contratos", roles: ["admin"], group: "Navegar" },

  { label: "Leads (Marketing)", icon: Users, url: "/marketing/leads", roles: ["admin"], group: "Navegar" },
  { label: "Meta Ads", icon: Megaphone, url: "/marketing/meta-ads", roles: ["admin"], group: "Navegar" },

  { label: "Acervo", icon: ShoppingBag, url: "/operacional/acervo", roles: ["admin"], group: "Navegar" },
  { label: "Produção", icon: Scissors, url: "/operacional/producao", roles: ["admin"], group: "Navegar" },
  { label: "Logística", icon: Truck, url: "/operacional/logistica", roles: ["admin"], group: "Navegar" },
  { label: "Relatório Operacional", icon: BarChart3, url: "/operacional/relatorio", roles: ["admin"], group: "Navegar" },

  { label: "DRE", icon: TrendingUp, url: "/financeiro/dre", roles: ["admin"], group: "Navegar" },
  { label: "Entradas & Saídas", icon: ArrowLeftRight, url: "/financeiro/fluxo", roles: ["admin"], group: "Navegar" },
  { label: "Relatórios Financeiros", icon: PieChart, url: "/financeiro/relatorios", roles: ["admin"], group: "Navegar" },
  { label: "Histórico do Cliente", icon: UserSearch, url: "/financeiro/clientes", roles: ["admin"], group: "Navegar" },

  { label: "Time & Performance", icon: UserCog, url: "/equipe", roles: ["admin"], group: "Navegar" },
  { label: "Portal de Sócios", icon: Briefcase, url: "/socios", roles: ["admin", "socio"], group: "Navegar" },
  { label: "Funcionários", icon: Users, url: "/admin/funcionarios", roles: ["admin"], group: "Navegar" },
  { label: "Configurações", icon: Settings, url: "/configuracoes", roles: ["admin"], group: "Navegar" },
  { label: "Meu Perfil", icon: UserCircle, url: "/perfil", roles: ["admin", "vendedor", "socio"], group: "Navegar" },

  { label: "Meu Painel", icon: LayoutDashboard, url: "/meu-painel", roles: ["vendedor"], group: "Navegar" },
  { label: "Meus Leads", icon: Users, url: "/meus-leads", roles: ["vendedor"], group: "Navegar" },
  { label: "Nova Venda", icon: ShoppingBag, url: "/minha-venda", roles: ["vendedor"], group: "Navegar" },
  { label: "Minha Agenda", icon: CalendarDays, url: "/minha-agenda", roles: ["vendedor"], group: "Navegar" },
  { label: "Contratos", icon: FileSignature, url: "/meu-contrato", roles: ["vendedor"], group: "Navegar" },
  { label: "Minhas Métricas", icon: DollarSign, url: "/minhas-metricas", roles: ["vendedor"], group: "Navegar" },

  { label: "Novo lead", hint: "Cadastrar cliente", icon: UserPlus, url: "/crm?new=lead", roles: ["admin"], group: "Ações rápidas" },
  { label: "Funil de negociações", hint: "CRM", icon: Handshake, url: "/crm", roles: ["admin"], group: "Ações rápidas" },
  { label: "Gerar contrato", hint: "Para assinatura", icon: FileSignature, url: "/comercial/contratos", roles: ["admin"], group: "Ações rápidas" },
  { label: "Registrar retirada", hint: "Logística", icon: Package, url: "/operacional/logistica", roles: ["admin"], group: "Ações rápidas" },

  { label: "Novo lead", hint: "Cadastrar cliente", icon: UserPlus, url: "/meus-leads", roles: ["vendedor"], group: "Ações rápidas" },
  { label: "Gerar contrato", hint: "Para assinatura", icon: FileSignature, url: "/meu-contrato", roles: ["vendedor"], group: "Ações rápidas" },
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
