import {
  LayoutDashboard, Users, ShoppingBag, Truck, DollarSign,
  UserCog, Briefcase, Settings, LogOut, ChevronLeft, Handshake, Sparkles,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { usePermissoes, routePermissionMap } from "@/hooks/usePermissoes";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Operação",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "vendedor", "socio"] },
      { title: "CRM", url: "/crm", icon: Users, roles: ["admin", "vendedor"] },
      { title: "Comercial", url: "/comercial", icon: Handshake, roles: ["admin", "vendedor"] },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { title: "Acervo & Produção", url: "/acervo", icon: ShoppingBag, roles: ["admin", "vendedor"] },
      { title: "Logística", url: "/logistica", icon: Truck, roles: ["admin", "vendedor"] },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ["admin"] },
      { title: "Time & Performance", url: "/equipe", icon: UserCog, roles: ["admin"] },
      { title: "Portal de Sócios", url: "/socios", icon: Briefcase, roles: ["admin", "socio"] },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["admin"] },
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

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (!user) return false;
      if (!item.roles.includes(user.role)) return false;
      const permKey = routePermissionMap[item.url];
      if (permKey && !temPermissao(user.role, permKey)) return false;
      return true;
    });

  const handleLogout = () => {
    logout();
    navigate("/login");
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
                    const isActive = item.url === "/"
                      ? location.pathname === "/"
                      : location.pathname === item.url || location.pathname.startsWith(item.url + "/");
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
