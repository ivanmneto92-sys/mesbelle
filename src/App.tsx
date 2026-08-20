import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, UserRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import PortalLogin from "./pages/PortalLogin";
import RedefinirSenha from "./pages/RedefinirSenha";
import Dashboard from "./pages/Dashboard";
import CRM from "./pages/CRM";
import ComercialRelatorio from "./pages/comercial/ComercialRelatorio";
import ComercialRelatorioAgendamento from "./pages/comercial/ComercialRelatorioAgendamento";
import ComercialAgendamento from "./pages/comercial/ComercialAgendamento";
import ComercialCalendario from "./pages/comercial/ComercialCalendario";
import ComercialContratos from "./pages/comercial/ComercialContratos";
import ComercialKanban from "./pages/comercial/ComercialKanban";
import OperacionalAcervo from "./pages/operacional/OperacionalAcervo";
import OperacionalProducao from "./pages/operacional/OperacionalProducao";
import OperacionalLogistica from "./pages/operacional/OperacionalLogistica";
import OperacionalRelatorio from "./pages/operacional/OperacionalRelatorio";
import FinanceiroDRE from "./pages/financeiro/FinanceiroDRE";
import FinanceiroFluxo from "./pages/financeiro/FinanceiroFluxo";
import FinanceiroRelatorios from "./pages/financeiro/FinanceiroRelatorios";
import FinanceiroHistorico from "./pages/financeiro/FinanceiroHistorico";
import Equipe from "./pages/Equipe";
import Socios from "./pages/Socios";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import MarketingLeads from "./pages/marketing/MarketingLeads";
import MetaAds from "./pages/marketing/MetaAds";
import GestaoFuncionarios from "./pages/admin/GestaoFuncionarios";
import MeuPainel from "./pages/funcionario/MeuPainel";
import MeusLeads from "./pages/funcionario/MeusLeads";
import MeuAgendamento from "./pages/funcionario/MeuAgendamento";
import MeuContrato from "./pages/funcionario/MeuContrato";
import MinhasMetricas from "./pages/funcionario/MinhasMetricas";
import NotFound from "./pages/NotFound";
import AssinaturaPublica from "./pages/AssinaturaPublica";
import AvaliacaoPublica from "./pages/AvaliacaoPublica";

const queryClient = new QueryClient();

const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/": ["admin", "socio"],
  "/crm": ["admin"],
  "/comercial/relatorio": ["admin", "socio"],
  "/comercial/relatorio-agendamento": ["admin"],
  "/comercial/agendamento": ["admin"],
  "/comercial/calendario": ["admin"],
  "/comercial/contratos": ["admin"],
  "/comercial/kanban": ["admin"],
  "/operacional/acervo": ["admin", "vendedor"],
  "/operacional/producao": ["admin"],
  "/operacional/logistica": ["admin"],
  "/operacional/relatorio": ["admin", "socio"],
  "/financeiro/dre": ["admin", "socio"],
  "/financeiro/fluxo": ["admin"],
  "/financeiro/relatorios": ["admin", "socio"],
  "/financeiro/clientes": ["admin", "socio"],
  "/equipe": ["admin"],
  "/socios": ["admin", "socio"],
  "/configuracoes": ["admin"],
  "/perfil": ["admin", "vendedor", "socio"],
  "/marketing/leads": ["admin"],
  "/marketing/meta-ads": ["admin"],
  // Gestão de funcionários — somente admin
  "/admin/funcionarios": ["admin"],
  // Portal isolado do funcionário — somente vendedor
  "/meu-painel": ["vendedor"],
  "/meus-leads": ["vendedor"],
  "/meu-agendamento": ["vendedor"],
  "/meu-contrato": ["vendedor"],
  "/minhas-metricas": ["vendedor"],
};

// Rotas do portal isolado do funcionário (além de /perfil, comum a todos os roles).
const ROTAS_FUNCIONARIO = ["/meu-painel", "/meus-leads", "/meu-agendamento", "/meu-contrato", "/minhas-metricas"];

const ProtectedRoute = ({ children, path }: { children: React.ReactNode; path?: string }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(340, 83%, 6%)" }}>
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const isRotaFuncionario = ROTAS_FUNCIONARIO.some((r) => location.pathname.startsWith(r));
    return <Navigate to={isRotaFuncionario ? "/portal" : "/login"} replace />;
  }

  if (path && ROUTE_ROLES[path] && !ROUTE_ROLES[path].includes(user.role)) {
    return <Navigate to="/inicio" replace />;
  }

  // Isolamento adicional: um vendedor nunca deve renderizar rotas de admin
  // (mesmo que ROUTE_ROLES não cubra o path) e vice-versa — o portal do
  // funcionário é um ambiente totalmente separado. Rotas que ROUTE_ROLES já
  // libera explicitamente para vendedor (ex: /perfil, /operacional/acervo)
  // são a exceção — o portal do funcionário pode incluir páginas do admin
  // reaproveitadas, não só as rotas exclusivas em ROTAS_FUNCIONARIO.
  const emRotaFuncionario = ROTAS_FUNCIONARIO.some((r) => location.pathname.startsWith(r));
  const rotaCompartilhadaComVendedor = path ? (ROUTE_ROLES[path]?.includes("vendedor") ?? false) : false;
  if (user.role === "vendedor" && !rotaCompartilhadaComVendedor && !emRotaFuncionario) {
    return <Navigate to="/meu-painel" replace />;
  }
  if (user.role !== "vendedor" && emRotaFuncionario) {
    return <Navigate to="/inicio" replace />;
  }

  return (
    <AppLayout>
      <ErrorBoundary fallbackTitle="Erro nesta página">
        {children}
      </ErrorBoundary>
    </AppLayout>
  );
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "vendedor") return <Navigate to="/meu-painel" replace />;
  if (user.role === "socio") return <Navigate to="/socios" replace />;
  return <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={loading ? null : (isAuthenticated ? <Navigate to="/inicio" replace /> : <Login />)} />
      <Route path="/portal" element={loading ? null : (isAuthenticated ? <Navigate to="/inicio" replace /> : <PortalLogin />)} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/assinar/:token" element={<AssinaturaPublica />} />
      <Route path="/avaliacao" element={<AvaliacaoPublica />} />
      <Route path="/inicio" element={<RoleRedirect />} />
      <Route path="/" element={<ProtectedRoute path="/"><Dashboard /></ProtectedRoute>} />
      <Route path="/crm" element={<ProtectedRoute path="/crm"><CRM /></ProtectedRoute>} />
      <Route path="/comercial" element={<Navigate to="/comercial/relatorio" replace />} />
      <Route path="/comercial/relatorio" element={<ProtectedRoute path="/comercial/relatorio"><ComercialRelatorio /></ProtectedRoute>} />
      <Route path="/comercial/relatorio-agendamento" element={<ProtectedRoute path="/comercial/relatorio-agendamento"><ComercialRelatorioAgendamento /></ProtectedRoute>} />
      <Route path="/comercial/agendamento" element={<ProtectedRoute path="/comercial/agendamento"><ComercialAgendamento /></ProtectedRoute>} />
      <Route path="/comercial/calendario" element={<ProtectedRoute path="/comercial/calendario"><ComercialCalendario /></ProtectedRoute>} />
      <Route path="/comercial/contratos" element={<ProtectedRoute path="/comercial/contratos"><ComercialContratos /></ProtectedRoute>} />
      <Route path="/comercial/kanban" element={<ProtectedRoute path="/comercial/kanban"><ComercialKanban /></ProtectedRoute>} />
      <Route path="/acervo" element={<Navigate to="/operacional/acervo" replace />} />
      <Route path="/logistica" element={<Navigate to="/operacional/logistica" replace />} />
      <Route path="/operacional/acervo" element={<ProtectedRoute path="/operacional/acervo"><OperacionalAcervo /></ProtectedRoute>} />
      <Route path="/operacional/producao" element={<ProtectedRoute path="/operacional/producao"><OperacionalProducao /></ProtectedRoute>} />
      <Route path="/operacional/logistica" element={<ProtectedRoute path="/operacional/logistica"><OperacionalLogistica /></ProtectedRoute>} />
      <Route path="/operacional/relatorio" element={<ProtectedRoute path="/operacional/relatorio"><OperacionalRelatorio /></ProtectedRoute>} />
      <Route path="/financeiro" element={<Navigate to="/financeiro/dre" replace />} />
      <Route path="/financeiro/dre" element={<ProtectedRoute path="/financeiro/dre"><FinanceiroDRE /></ProtectedRoute>} />
      <Route path="/financeiro/fluxo" element={<ProtectedRoute path="/financeiro/fluxo"><FinanceiroFluxo /></ProtectedRoute>} />
      <Route path="/financeiro/relatorios" element={<ProtectedRoute path="/financeiro/relatorios"><FinanceiroRelatorios /></ProtectedRoute>} />
      <Route path="/financeiro/clientes" element={<ProtectedRoute path="/financeiro/clientes"><FinanceiroHistorico /></ProtectedRoute>} />
      <Route path="/equipe" element={<ProtectedRoute path="/equipe"><Equipe /></ProtectedRoute>} />
      <Route path="/socios" element={<ProtectedRoute path="/socios"><Socios /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute path="/configuracoes"><Configuracoes /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute path="/perfil"><Perfil /></ProtectedRoute>} />
      <Route path="/marketing/leads" element={<ProtectedRoute path="/marketing/leads"><MarketingLeads /></ProtectedRoute>} />
      <Route path="/marketing/meta-ads" element={<ProtectedRoute path="/marketing/meta-ads"><MetaAds /></ProtectedRoute>} />
      <Route path="/admin/funcionarios" element={<ProtectedRoute path="/admin/funcionarios"><GestaoFuncionarios /></ProtectedRoute>} />
      <Route path="/meu-painel" element={<ProtectedRoute path="/meu-painel"><MeuPainel /></ProtectedRoute>} />
      <Route path="/meus-leads" element={<ProtectedRoute path="/meus-leads"><MeusLeads /></ProtectedRoute>} />
      <Route path="/meu-agendamento" element={<ProtectedRoute path="/meu-agendamento"><MeuAgendamento /></ProtectedRoute>} />
      <Route path="/meu-contrato" element={<ProtectedRoute path="/meu-contrato"><MeuContrato /></ProtectedRoute>} />
      <Route path="/minhas-metricas" element={<ProtectedRoute path="/minhas-metricas"><MinhasMetricas /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={0}>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
