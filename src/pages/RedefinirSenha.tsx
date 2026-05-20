import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error("Erro ao redefinir senha: " + error.message);
    } else {
      toast.success("Senha redefinida com sucesso!");
      navigate("/");
    }
    setIsLoading(false);
  };

  return (
    <>
    <SEO title="Redefinir senha — Més Belle" description="Defina uma nova senha para acessar o painel Més Belle." path="/redefinir-senha" />
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(340, 83%, 6%)" }}>
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-10">
          <img src="/logo-mesbelle.svg" alt="Més Belle" className="h-20 brightness-0 invert" />
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: "hsl(343, 100%, 18%)" }}>
            <Lock className="h-5 w-5" style={{ color: "hsl(0, 0%, 90%)" }} />
          </div>
          <h2 className="text-2xl font-serif" style={{ color: "hsl(0, 0%, 92%)" }}>Redefinir Senha</h2>
          <p className="text-sm mt-1" style={{ color: "hsl(0, 0%, 45%)" }}>
            {isRecovery ? "Defina sua nova senha abaixo" : "Aguardando verificação..."}
          </p>
        </div>

        {isRecovery ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(0, 0%, 50%)" }}>Nova senha</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="h-12 border-0 rounded-lg text-sm pr-11 placeholder:text-[hsl(0,0%,30%)]"
                  style={{ background: "hsl(340, 40%, 10%)", color: "hsl(0, 0%, 90%)" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "hsl(0, 0%, 40%)" }}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(0, 0%, 50%)" }}>Confirmar senha</label>
              <Input type="password" placeholder="••••••••" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                className="h-12 border-0 rounded-lg text-sm placeholder:text-[hsl(0,0%,30%)]"
                style={{ background: "hsl(340, 40%, 10%)", color: "hsl(0, 0%, 90%)" }} />
            </div>
            <Button type="submit" disabled={isLoading}
              className="w-full h-12 text-sm font-medium rounded-lg border-0"
              style={{ background: "linear-gradient(135deg, hsl(343, 100%, 18%), hsl(343, 80%, 25%))", color: "hsl(0, 0%, 95%)" }}>
              {isLoading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Redefinir Senha"}
            </Button>
          </form>
        ) : (
          <p className="text-center text-sm" style={{ color: "hsl(0, 0%, 45%)" }}>
            Se você chegou aqui por um link de e-mail, aguarde enquanto verificamos sua identidade...
          </p>
        )}

        <p className="text-center mt-8 text-[11px]" style={{ color: "hsl(0, 0%, 25%)" }}>
          © {new Date().getFullYear()} Més Belle Ateliê. Todos os direitos reservados.
        </p>
      </div>
    </div>
    </>
  );
};

export default RedefinirSenha;
