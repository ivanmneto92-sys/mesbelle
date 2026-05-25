import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, AlertTriangle, Send, LogOut, User, Search, UserPlus, Handshake } from "lucide-react";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CommandPalette, useCommandPalette } from "./CommandPalette";

type LogisticaAlert = { icon: typeof AlertTriangle; text: string; color: string; href: string };

function useLogisticaAlerts() {
  const [alerts, setAlerts] = useState<LogisticaAlert[]>([]);

  useEffect(() => {
    let mounted = true;
    const today = new Date().toISOString().split("T")[0];

    (async () => {
      const { data, error } = await supabase
        .from("alugueis_logistica")
        .select("vestido_nome, status_logistica, data_saida, data_retorno")
        .or(`status_logistica.eq.atrasado,and(status_logistica.eq.para_enviar,data_saida.eq.${today})`);

      if (!mounted || error || !data) return;

      const next: LogisticaAlert[] = [];
      data.forEach((item: any) => {
        if (item.status_logistica === "atrasado") {
          const days = Math.floor((Date.now() - new Date(item.data_retorno).getTime()) / 86400000);
          next.push({
            icon: AlertTriangle,
            text: `${item.vestido_nome} — ${days} dia(s) de atraso`,
            color: "text-destructive",
            href: "/logistica",
          });
        } else if (item.status_logistica === "para_enviar" && item.data_saida === today) {
          next.push({
            icon: Send,
            text: `${item.vestido_nome} — envio agendado para hoje`,
            color: "text-info",
            href: "/logistica",
          });
        }
      });
      setAlerts(next);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return alerts;
}

const getInitials = (name?: string) =>
  !name ? "?" : name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

export function GlobalHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  const alerts = useMemo(() => getLogisticaAlerts(), []);
  const alertCount = alerts.length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

  const quickActions = [
    { label: "Lead", icon: UserPlus, to: "/crm", roles: ["admin", "vendedor"] as const },
    { label: "Venda", icon: Handshake, to: "/comercial", roles: ["admin", "vendedor"] as const },
  ].filter((a) => user && (a.roles as readonly string[]).includes(user.role));

  return (
    <>
      <header className="h-16 sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-surface-cream/85 backdrop-blur-xl px-3 sm:px-5 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <SidebarTrigger className="text-muted-foreground shrink-0 h-9 w-9" />
          <div className="h-6 w-px bg-border-subtle hidden sm:block" />
          <Breadcrumbs />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Busca global */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 h-9 px-3 rounded-full border border-border-subtle bg-card/60 hover:bg-card hover:border-primary/20 transition-all text-sm text-muted-foreground min-w-[220px]"
            aria-label="Buscar (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Buscar ou navegar…</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
              {isMac ? "⌘K" : "Ctrl K"}
            </kbd>
          </button>
          <Button
            onClick={() => setCmdOpen(true)}
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Quick actions */}
          {quickActions.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 ml-1">
              {quickActions.map((a) => (
                <Button key={a.to} asChild variant="ghost" size="sm" className="h-9 rounded-full gap-1.5 text-foreground hover:bg-primary/10 hover:text-primary">
                  <Link to={a.to}>
                    <a.icon className="h-3.5 w-3.5" /> {a.label}
                  </Link>
                </Button>
              ))}
            </div>
          )}

          <div className="h-6 w-px bg-border-subtle mx-1 hidden sm:block" />

          {/* Notificações */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notificações">
                <Bell className="h-4 w-4" />
                {alertCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-surface-cream" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-editorial-lg border-border-subtle">
              <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                <p className="font-display text-base">Notificações</p>
                {alertCount > 0 && <Badge variant="secondary" className="text-xs">{alertCount}</Badge>}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Tudo em ordem por aqui ✨</p>
                ) : (
                  alerts.map((alert, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(alert.href)}
                      className="w-full flex items-start gap-3 px-4 py-3 border-b border-border-subtle last:border-0 hover:bg-muted/50 text-left transition-colors"
                    >
                      <alert.icon className={`h-4 w-4 mt-0.5 shrink-0 ${alert.color}`} />
                      <p className="text-sm leading-snug">{alert.text}</p>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full hover:bg-card transition-colors"
                aria-label="Menu do usuário"
              >
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold ring-2 ring-card">
                  {getInitials(user?.name)}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium leading-tight truncate max-w-[160px]">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize tracking-wider uppercase leading-tight">{user?.role}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-editorial-lg border-border-subtle">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{user?.role}</p>
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

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
