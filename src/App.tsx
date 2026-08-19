import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, UserRole } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import RedefinirSenha from "./pages/RedefinirSenha";
import Dashboard from "./pages/Dashboard";
import CRM from "./pages/CRM";
import ComercialRelatorio from "./pages/comercial/ComercialRelatorio";
import ComercialRelatorioAgendamento from "./pages/comercial/ComercialRelatorioAgendamento";
import ComercialAgendamento from "./pages/comercial/ComercialAgendamento";
import ComercialCalendario from "./pages/comercial/ComercialCalendario";
import ComercialContratos from "./pages/comercial/ComercialContratos";
import ComercialKanban from "./pages/comercial/ComercialKanban";
import Acervo from "./pages/Acervo";
import Logistica from "./pages/Logistica";
import Financeiro from "./pages/Financeiro";
import Equipe from "./pages/Equipe";
import Socios from "./pages/Socios";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import MarketingLeads from "./pages/marketing/MarketingLeads";
import MetaAds from "./pages/marketing/MetaAds";
import AgendamentoComercial from "./pages/agendamento/AgendamentoComercial";
import CalendarioVisitas from "./pages/agendamento/CalendarioVisitas";
import CalendarioAgenda from "./pages/agendamento/CalendarioAgenda";
import NotFound from "./pages/NotFound";
import AssinaturaPublica from "./pages/AssinaturaPublica";
import AvaliacaoPublica from "./pages/AvaliacaoPublica";

const queryClient = new QueryClient();

const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/": ["admin", "vendedor", "socio"],
  "/crm": ["admin", "vendedor"],
  "/comercial/relatorio": ["admin", "vendedor", "socio"],
  "/comercial/relatorio-agendamento": ["admin", "vendedor"],
  "/comercial/agendamento": ["admin", "vendedor"],
  "/comercial/calendario": ["admin", "vendedor"],
  "/comercial/contratos": ["admin", "vendedor"],
  "/comercial/kanban": ["admin", "vendedor"],
  "/acervo": ["admin", "vendedor"],
  "/logistica": ["admin", "vendedor"],
  "/financeiro": ["admin"],
  "/equipe": ["admin"],
  "/socios": ["admin", "socio"],
  "/configuracoes": ["admin"],
  "/perfil": ["admin", "vendedor", "socio"],
  "/marketing/leads": ["admin", "vendedor"],
  "/marketing/meta-ads": ["admin"],
  "/agendamento/comercial": ["admin", "vendedor"],
  "/agendamento/visitas": ["admin", "vendedor"],
  "/agendamento/agenda": ["admin", "vendedor"],
};

const ProtectedRoute = ({ children, path }: { children: React.ReactNode; path?: string }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(340, 83%, 6%)" }}>
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (path && ROUTE_ROLES[path] && !ROUTE_ROLES[path].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <ErrorBoundary fallbackTitle="Erro nesta página">
        {children}
      </ErrorBoundary>
    </AppLayout>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={loading ? null : (isAuthenticated ? <Navigate to="/" replace /> : <Login />)} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/assinar/:token" element={<AssinaturaPublica />} />
      <Route path="/avaliacao" element={<AvaliacaoPublica />} />
      <Route path="/" element={<ProtectedRoute path="/"><Dashboard /></ProtectedRoute>} />
      <Route path="/crm" element={<ProtectedRoute path="/crm"><CRM /></ProtectedRoute>} />
      <Route path="/comercial" element={<Navigate to="/comercial/relatorio" replace />} />
      <Route path="/comercial/relatorio" element={<ProtectedRoute path="/comercial/relatorio"><ComercialRelatorio /></ProtectedRoute>} />
      <Route path="/comercial/relatorio-agendamento" element={<ProtectedRoute path="/comercial/relatorio-agendamento"><ComercialRelatorioAgendamento /></ProtectedRoute>} />
      <Route path="/comercial/agendamento" element={<ProtectedRoute path="/comercial/agendamento"><ComercialAgendamento /></ProtectedRoute>} />
      <Route path="/comercial/calendario" element={<ProtectedRoute path="/comercial/calendario"><ComercialCalendario /></ProtectedRoute>} />
      <Route path="/comercial/contratos" element={<ProtectedRoute path="/comercial/contratos"><ComercialContratos /></ProtectedRoute>} />
      <Route path="/comercial/kanban" element={<ProtectedRoute path="/comercial/kanban"><ComercialKanban /></ProtectedRoute>} />
      <Route path="/acervo" element={<ProtectedRoute path="/acervo"><Acervo /></ProtectedRoute>} />
      <Route path="/logistica" element={<ProtectedRoute path="/logistica"><Logistica /></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute path="/financeiro"><Financeiro /></ProtectedRoute>} />
      <Route path="/equipe" element={<ProtectedRoute path="/equipe"><Equipe /></ProtectedRoute>} />
      <Route path="/socios" element={<ProtectedRoute path="/socios"><Socios /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute path="/configuracoes"><Configuracoes /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute path="/perfil"><Perfil /></ProtectedRoute>} />
      <Route path="/marketing/leads" element={<ProtectedRoute path="/marketing/leads"><MarketingLeads /></ProtectedRoute>} />
      <Route path="/marketing/meta-ads" element={<ProtectedRoute path="/marketing/meta-ads"><MetaAds /></ProtectedRoute>} />
      <Route path="/agendamento/comercial" element={<ProtectedRoute path="/agendamento/comercial"><AgendamentoComercial /></ProtectedRoute>} />
      <Route path="/agendamento/visitas" element={<ProtectedRoute path="/agendamento/visitas"><CalendarioVisitas /></ProtectedRoute>} />
      <Route path="/agendamento/agenda" element={<ProtectedRoute path="/agendamento/agenda"><CalendarioAgenda /></ProtectedRoute>} />
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
