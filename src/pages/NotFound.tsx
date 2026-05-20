import { Link, useLocation } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO title="Página não encontrada — Més Belle" description="A página que você procura não existe." />
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <p className="text-[100px] leading-none font-serif font-bold text-primary/20">404</p>
          <h1 className="text-2xl font-serif font-bold mt-2">Página não encontrada</h1>
          <p className="text-sm text-muted-foreground mt-2">
            A rota <code className="px-1 py-0.5 rounded bg-muted text-xs">{location.pathname}</code> não existe ou foi movida.
          </p>
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Button asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-1" /> Ir para o Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
