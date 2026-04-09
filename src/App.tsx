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
import ComercialVendas from "./pages/ComercialVendas";
import Acervo from "./pages/Acervo";
import Logistica from "./pages/Logistica";
import Financeiro from "./pages/Financeiro";
import Equipe from "./pages/Equipe";
import Socios from "./pages/Socios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/": ["admin", "vendedor", "socio"],
  "/crm": ["admin", "vendedor"],
  "/comercial": ["admin", "vendedor"],
  "/acervo": ["admin", "vendedor"],
  "/logistica": ["admin", "vendedor"],
  "/financeiro": ["admin"],
  "/equipe": ["admin"],
  "/socios": ["admin", "socio"],
  "/configuracoes": ["admin"],
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
      <Route path="/" element={<ProtectedRoute path="/"><Dashboard /></ProtectedRoute>} />
      <Route path="/crm" element={<ProtectedRoute path="/crm"><CRM /></ProtectedRoute>} />
      <Route path="/comercial" element={<ProtectedRoute path="/comercial"><ComercialVendas /></ProtectedRoute>} />
      <Route path="/acervo" element={<ProtectedRoute path="/acervo"><Acervo /></ProtectedRoute>} />
      <Route path="/logistica" element={<ProtectedRoute path="/logistica"><Logistica /></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute path="/financeiro"><Financeiro /></ProtectedRoute>} />
      <Route path="/equipe" element={<ProtectedRoute path="/equipe"><Equipe /></ProtectedRoute>} />
      <Route path="/socios" element={<ProtectedRoute path="/socios"><Socios /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute path="/configuracoes"><Configuracoes /></ProtectedRoute>} />
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
