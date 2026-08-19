import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/crm": "CRM",
  "/comercial": "Comercial",
  "/acervo": "Acervo & Produção",
  "/logistica": "Logística",
  "/financeiro": "Financeiro",
  "/equipe": "Time & Performance",
  "/socios": "Portal de Sócios",
  "/configuracoes": "Configurações",
  "/marketing": "Marketing",
  "/marketing/leads": "Leads",
  "/marketing/meta-ads": "Meta Ads",
  "/agendamento": "Agendamento",
  "/agendamento/comercial": "Comercial",
  "/agendamento/visitas": "Calendário de Visitas",
  "/agendamento/agenda": "Prova & Entregas",
  "/perfil": "Meu Perfil",
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const label = ROUTE_LABELS[pathname];

  if (!label || pathname === "/") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Home className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground/80">Dashboard</span>
      </div>
    );
  }

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Início</span>
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="font-medium text-foreground/80 truncate">{label}</span>
    </nav>
  );
}
