import { useState } from "react";
import {
  LayoutDashboard, Users, ShoppingBag, Truck,
  UserCog, Briefcase, Settings, LogOut, ChevronLeft, ChevronRight, Handshake, Sparkles,
  Megaphone, BarChart3, CalendarDays, Kanban, CalendarClock, UserCircle, ScrollText,
  FileBarChart, Wallet, TrendingUp, ArrowLeftRight, PieChart, UserSearch,
  Package2, LayoutGrid, Scissors, FileSignature,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePermissoes, routePermissionMap } from "@/hooks/usePermissoes";

type LeafItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
};

type ParentItem = {
  title: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
  children: LeafItem[];
};

type NavEntry = LeafItem | ParentItem;

const isParent = (item: NavEntry): item is ParentItem => "children" in item;

const navGroupsAdmin: { label: string; items: NavEntry[] }[] = [
  {
    label: "Operação",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "vendedor", "socio"] },
    ],
  },
  {
    label: "Comercial",
    items: [
      {
        title: "Comercial",
        icon: ShoppingBag,
        roles: ["admin", "vendedor", "socio"],
        children: [
          { title: "Relatório Comercial", url: "/comercial/relatorio", icon: FileBarChart, roles: ["admin", "vendedor", "socio"] },
          { title: "Relatório Agendamento", url: "/comercial/relatorio-agendamento", icon: BarChart3, roles: ["admin", "vendedor"] },
          { title: "Agendamento", url: "/comercial/agendamento", icon: CalendarClock, roles: ["admin", "vendedor"] },
          { title: "Calendário", url: "/comercial/calendario", icon: CalendarDays, roles: ["admin", "vendedor"] },
          { title: "Contratos", url: "/comercial/contratos", icon: ScrollText, roles: ["admin", "vendedor"] },
          { title: "Kanban", url: "/comercial/kanban", icon: Kanban, roles: ["admin", "vendedor"] },
        ],
      },
      {
        title: "Marketing",
        icon: Megaphone,
        roles: ["admin", "vendedor"],
        children: [
          { title: "Leads", url: "/marketing/leads", icon: Users, roles: ["admin", "vendedor"] },
          { title: "Meta Ads", url: "/marketing/meta-ads", icon: BarChart3, roles: ["admin"] },
        ],
      },
    ],
  },
  {
    label: "Operacional",
    items: [
      {
        title: "Operacional",
        icon: Package2,
        roles: ["admin", "vendedor", "socio"],
        children: [
          { title: "Acervo", url: "/operacional/acervo", icon: LayoutGrid, roles: ["admin", "vendedor"] },
          { title: "Produção", url: "/operacional/producao", icon: Scissors, roles: ["admin"] },
          { title: "Logística", url: "/operacional/logistica", icon: Truck, roles: ["admin", "vendedor"] },
          { title: "Relatório", url: "/operacional/relatorio", icon: BarChart3, roles: ["admin", "socio"] },
        ],
      },
    ],
  },
  {
    label: "Financeiro",
    items: [
      {
        title: "Financeiro",
        icon: Wallet,
        roles: ["admin", "socio", "vendedor"],
        children: [
          { title: "DRE", url: "/financeiro/dre", icon: TrendingUp, roles: ["admin", "socio"] },
          { title: "Entradas & Saídas", url: "/financeiro/fluxo", icon: ArrowLeftRight, roles: ["admin"] },
          { title: "Relatórios", url: "/financeiro/relatorios", icon: PieChart, roles: ["admin", "socio"] },
          { title: "Histórico do Cliente", url: "/financeiro/clientes", icon: UserSearch, roles: ["admin", "vendedor", "socio"] },
        ],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Perfil", url: "/perfil", icon: UserCircle, roles: ["admin", "vendedor", "socio"] },
      {
        title: "Configurações",
        icon: Settings,
        roles: ["admin"],
        children: [
          { title: "Geral", url: "/configuracoes", icon: Settings, roles: ["admin"] },
          { title: "Time & Performance", url: "/equipe", icon: UserCog, roles: ["admin"] },
          { title: "Portal de Sócios", url: "/socios", icon: Briefcase, roles: ["admin", "socio"] },
          { title: "Funcionários", url: "/admin/funcionarios", icon: Users, roles: ["admin"] },
        ],
      },
    ],
  },
];

// Portal isolado do funcionário (role "vendedor") — conjunto de itens
// totalmente separado do menu admin, sem acesso a nenhuma rota de gestão.
const navGroupsFuncionario: { label: string; items: NavEntry[] }[] = [
  {
    label: "Minha Área",
    items: [
      { title: "Meu Painel", url: "/meu-painel", icon: LayoutDashboard, roles: ["vendedor"] },
    ],
  },
  {
    label: "Atendimento",
    items: [
      { title: "Meus Leads", url: "/meus-leads", icon: Users, roles: ["vendedor"] },
      { title: "Agendamento", url: "/meu-agendamento", icon: CalendarClock, roles: ["vendedor"] },
      { title: "Contratos", url: "/meu-contrato", icon: FileSignature, roles: ["vendedor"] },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Minhas Métricas", url: "/minhas-metricas", icon: BarChart3, roles: ["vendedor"] },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Perfil", url: "/perfil", icon: UserCircle, roles: ["vendedor"] },
    ],
  },
];

const getInitials = (name?: string) =>
  !name ? "?" : name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { temPermissao } = usePermissoes();

  const navGroups = user?.role === "vendedor" ? navGroupsFuncionario : navGroupsAdmin;

  const canSeeLeaf = (item: LeafItem) => {
    if (!user) return false;
    if (!item.roles.includes(user.role)) return false;
    const permKey = routePermissionMap[item.url];
    if (permKey && !temPermissao(user.role, permKey)) return false;
    return true;
  };

  const filterItems = (items: NavEntry[]): NavEntry[] =>
    items.reduce<NavEntry[]>((acc, item) => {
      if (isParent(item)) {
        const children = item.children.filter(canSeeLeaf);
        if (children.length > 0) acc.push({ ...item, children });
        return acc;
      }
      if (canSeeLeaf(item)) acc.push(item);
      return acc;
    }, []);

  const isChildActive = (item: LeafItem) =>
    item.url === "/" ? location.pathname === "/" : location.pathname === item.url || location.pathname.startsWith(item.url + "/");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => g.items.forEach((item) => {
      if (isParent(item)) {
        initial[item.title] = item.children.some(isChildActive);
      }
    }));
    return initial;
  });

  const handleLogout = () => {
    const destino = user?.role === "vendedor" ? "/portal" : "/login";
    logout();
    navigate(destino);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-4 py-5`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary-foreground/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base text-sidebar-foreground leading-none">Més Belle</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/50 mt-1">Ateliê</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <SidebarContent className="px-2 pb-2">
        {navGroups.map((group) => {
          const items = filterItems(group.items);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label} className="mb-1">
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/40 font-semibold px-3 mb-1">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {items.map((item) => {
                    if (isParent(item)) {
                      const parentActive = item.children.some(isChildActive);
                      const open = collapsed ? true : (openGroups[item.title] ?? parentActive);
                      return (
                        <Collapsible
                          key={item.title}
                          open={collapsed ? undefined : open}
                          onOpenChange={(next) => setOpenGroups((prev) => ({ ...prev, [item.title]: next }))}
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                isActive={parentActive}
                                tooltip={item.title}
                                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent/70 data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium"
                              >
                                <item.icon className="h-[18px] w-[18px] shrink-0" />
                                {!collapsed && (
                                  <>
                                    <span className="text-sm flex-1 text-left">{item.title}</span>
                                    <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
                                  </>
                                )}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            {!collapsed && (
                              <CollapsibleContent>
                                <div className="ml-[18px] mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border/50 pl-3">
                                  {item.children.map((child) => {
                                    const active = isChildActive(child);
                                    return (
                                      <NavLink
                                        key={child.url}
                                        to={child.url}
                                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors ${
                                          active ? "bg-sidebar-accent/60 text-sidebar-foreground font-medium" : ""
                                        }`}
                                      >
                                        <child.icon className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{child.title}</span>
                                      </NavLink>
                                    );
                                  })}
                                </div>
                              </CollapsibleContent>
                            )}
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    const isActive = isChildActive(item);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="data-[active=true]:bg-transparent">
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors ${
                              isActive
                                ? "bg-sidebar-accent/70 text-sidebar-foreground font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-primary-foreground"
                                : ""
                            }`}
                          >
                            <item.icon className={`h-[18px] w-[18px] shrink-0 transition-transform ${isActive ? "scale-110" : ""}`} />
                            {!collapsed && <span className="text-sm">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        {!collapsed && user ? (
          <div className="flex items-center gap-2.5 mb-2 px-2 py-2 rounded-xl bg-sidebar-accent/40">
            <div className="h-9 w-9 rounded-full bg-primary-foreground/15 text-sidebar-foreground flex items-center justify-center text-xs font-semibold shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name || user.email}</p>
              <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">{user.role}</p>
            </div>
          </div>
        ) : null}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors text-sm"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
