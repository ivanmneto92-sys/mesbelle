import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/crm": "CRM",
  "/comercial": "Comercial",
  "/comercial/relatorio": "Relatório Comercial",
  "/comercial/relatorio-agendamento": "Relatório Agendamento",
  "/comercial/agendamento": "Agendamento",
  "/comercial/calendario": "Calendário",
  "/comercial/contratos": "Contratos",
  "/comercial/kanban": "Kanban",
  "/operacional/acervo": "Acervo",
  "/operacional/producao": "Produção",
  "/operacional/logistica": "Logística",
  "/operacional/relatorio": "Relatório Operacional",
  "/financeiro": "Financeiro",
  "/financeiro/dre": "DRE",
  "/financeiro/fluxo": "Entradas & Saídas",
  "/financeiro/relatorios": "Relatórios",
  "/financeiro/clientes": "Histórico do Cliente",
  "/equipe": "Time & Performance",
  "/socios": "Portal de Sócios",
  "/configuracoes": "Configurações",
  "/marketing": "Marketing",
  "/marketing/leads": "Leads",
  "/marketing/meta-ads": "Meta Ads",
  "/perfil": "Meu Perfil",
  "/admin/funcionarios": "Funcionários",
  "/meu-painel": "Meu Painel",
  "/meus-leads": "Meus Leads",
  "/meu-agendamento": "Agendamento",
  "/meu-contrato": "Gerar Contrato",
  "/minhas-metricas": "Minhas Métricas",
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
