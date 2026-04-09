import {
  LayoutDashboard, Users, ShoppingBag, Truck, DollarSign,
  UserCog, Briefcase, Settings, LogOut, ChevronLeft, Handshake
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["admin", "vendedor", "socio"] as UserRole[] },
  { title: "CRM", url: "/crm", icon: Users, roles: ["admin", "vendedor"] as UserRole[] },
  { title: "Comercial", url: "/comercial", icon: Handshake, roles: ["admin", "vendedor"] as UserRole[] },
  { title: "Acervo & Produção", url: "/acervo", icon: ShoppingBag, roles: ["admin", "vendedor"] as UserRole[] },
  { title: "Logística", url: "/logistica", icon: Truck, roles: ["admin", "vendedor"] as UserRole[] },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign, roles: ["admin"] as UserRole[] },
  { title: "Time & Performance", url: "/equipe", icon: UserCog, roles: ["admin"] as UserRole[] },
  { title: "Portal de Sócios", url: "/socios", icon: Briefcase, roles: ["admin", "socio"] as UserRole[] },
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["admin"] as UserRole[] },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const filteredItems = navItems.filter((item) => user && item.roles.includes(user.role));

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
        <button onClick={toggleSidebar} className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && user && (
          <div className="mb-2 px-1">
            <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
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
