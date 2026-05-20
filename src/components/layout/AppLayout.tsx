import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, AlertTriangle, Send, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { AluguelLogistica } from "@/types/logistica";

interface AppLayoutProps {
  children: React.ReactNode;
}

function getLogisticaAlerts(): { icon: React.ElementType; text: string; color: string }[] {
  const alerts: { icon: React.ElementType; text: string; color: string }[] = [];
  try {
    const raw = localStorage.getItem("mesbelle_logistica");
    if (!raw) return alerts;
    const items: AluguelLogistica[] = JSON.parse(raw);
    if (!Array.isArray(items)) return alerts;

    const today = new Date().toISOString().split("T")[0];

    items.forEach((item) => {
      if (item.statusLogistica === "atrasado") {
        const days = Math.floor(
          (new Date().getTime() - new Date(item.dataRetorno).getTime()) / 86400000
        );
        alerts.push({
          icon: AlertTriangle,
          text: `${item.vestidoNome} — ${days} dia(s) de atraso`,
          color: "text-destructive",
        });
      }
      if (item.statusLogistica === "para_enviar" && item.dataSaida === today) {
        alerts.push({
          icon: Send,
          text: `${item.vestidoNome} — envio agendado para hoje`,
          color: "text-info",
        });
      }
    });
  } catch {}
  return alerts;
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const alerts = useMemo(() => getLogisticaAlerts(), []);
  const alertCount = alerts.length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 backdrop-blur px-3 sm:px-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="text-muted-foreground shrink-0" />
              <div className="h-6 w-px bg-border hidden sm:block" />
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-2">
              {/* Notificações */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
                    <Bell className="h-4 w-4" />
                    {alertCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                        {alertCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="p-3 border-b">
                    <p className="text-sm font-semibold">Notificações</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">Nenhuma notificação</p>
                    ) : (
                      alerts.map((alert, i) => (
                        <button
                          key={i}
                          onClick={() => navigate("/logistica")}
                          className="w-full flex items-start gap-3 px-3 py-2.5 border-b last:border-0 hover:bg-muted/50 text-left"
                        >
                          <alert.icon className={`h-4 w-4 mt-0.5 shrink-0 ${alert.color}`} />
                          <p className="text-sm">{alert.text}</p>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Menu do Usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
                    aria-label="Menu do usuário"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {getInitials(user?.name)}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium leading-tight">{user?.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize leading-tight">{user?.role}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize font-normal">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                      <User className="h-4 w-4 mr-2" /> Minha Conta
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
