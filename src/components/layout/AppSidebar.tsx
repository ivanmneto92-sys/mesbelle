import {
  LayoutDashboard, Users, ShoppingBag, Truck, DollarSign,
  UserCog, Briefcase, Settings, LogOut, ChevronLeft, Handshake
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
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <img src="/logo-mesbelle.svg" alt="Més Belle" className="h-10 object-contain brightness-0 invert" />
        )}
        <button
          onClick={toggleSidebar}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <SidebarContent className="py-2">
        {navGroups.map((group) => {
          const items = filterItems(group.items);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold px-3">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                            activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-primary-foreground"
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
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

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && user && (
          <div className="mb-2 px-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
