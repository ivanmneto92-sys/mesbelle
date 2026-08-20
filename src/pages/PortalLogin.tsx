import { useState } from "react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Users } from "lucide-react";

const PortalLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === "forgot") {
      // Roteado por uma Edge Function (envia via Resend) em vez de
      // supabase.auth.resetPasswordForEmail, que usaria o mailer nativo do Supabase.
      const { error } = await supabase.functions.invoke("solicitar-redefinicao-senha", { body: { email } });
      if (error) {
        toast.error("Erro ao enviar e-mail de recuperação");
      } else {
        toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        setMode("login");
      }
      setIsLoading(false);
      return;
    }

    const success = await login(email, password);
    if (!success) {
      toast.error("Credenciais inválidas");
      setIsLoading(false);
      return;
    }

    // Este link é exclusivo do portal de funcionários — qualquer outro cargo
    // é deslogado imediatamente e orientado a usar o link do admin.
    const { data: { user } } = await supabase.auth.getUser();
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id ?? "")
      .maybeSingle();

    if (roleRow?.role !== "vendedor") {
      await supabase.auth.signOut();
      toast.error("Este link é exclusivo para funcionários. Administradores devem entrar em crm.mesbelle.com.br/login.");
      setIsLoading(false);
      return;
    }

    toast.success("Bem-vindo ao portal Més Belle!");
    setIsLoading(false);
  };

  return (
    <>
    <SEO title="Portal do Funcionário — Més Belle" description="Acesso ao portal de funcionários do ateliê Més Belle." path="/portal" />
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "hsl(340, 83%, 6%)" }}>
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-10">
          <img src="/logo-mesbelle.svg" alt="Més Belle" className="h-20 brightness-0 invert" />
        </div>

        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: "hsl(343, 100%, 18%)" }}>
            <Users className="h-5 w-5" style={{ color: "hsl(0, 0%, 90%)" }} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: "hsl(0, 0%, 50%)" }}>
              {mode === "login" ? "Portal do Funcionário" : "Recuperar senha"}
            </span>
          </div>
          <h2 className="text-2xl font-serif" style={{ color: "hsl(0, 0%, 92%)" }}>
            {mode === "login" ? "Bem-vindo(a) de volta" : "Esqueceu a senha?"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "hsl(0, 0%, 45%)" }}>
            {mode === "login"
              ? "Entre com suas credenciais para acessar seus leads e agendamentos"
              : "Informe seu e-mail para receber o link de redefinição"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(0, 0%, 50%)" }}>E-mail</label>
            <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="h-12 border-0 rounded-lg text-sm placeholder:text-[hsl(0,0%,30%)]"
              style={{ background: "hsl(340, 40%, 10%)", color: "hsl(0, 0%, 90%)" }} />
          </div>

          {mode === "login" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(0, 0%, 50%)" }}>Senha</label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  className="h-12 border-0 rounded-lg text-sm pr-11 placeholder:text-[hsl(0,0%,30%)]"
                  style={{ background: "hsl(340, 40%, 10%)", color: "hsl(0, 0%, 90%)" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "hsl(0, 0%, 40%)" }}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button type="button" onClick={() => setMode("forgot")}
                className="text-xs transition-colors hover:underline" style={{ color: "hsl(0, 0%, 45%)" }}>
                Esqueceu a senha?
              </button>
            </div>
          )}

          <Button type="submit" disabled={isLoading}
            className="w-full h-12 text-sm font-medium rounded-lg border-0 group transition-all duration-300"
            style={{ background: "linear-gradient(135deg, hsl(343, 100%, 18%), hsl(343, 80%, 25%))", color: "hsl(0, 0%, 95%)" }}>
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Entrar" : "Enviar link de recuperação"}
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        {mode === "forgot" && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-[1px]" style={{ background: "hsl(0, 0%, 15%)" }} />
              <span className="text-[11px] uppercase tracking-wider" style={{ color: "hsl(0, 0%, 30%)" }}>ou</span>
              <div className="flex-1 h-[1px]" style={{ background: "hsl(0, 0%, 15%)" }} />
            </div>
            <button type="button" onClick={() => setMode("login")}
              className="w-full h-11 rounded-lg border text-sm font-medium transition-all duration-200 hover:border-[hsl(0,0%,30%)]"
              style={{ borderColor: "hsl(0, 0%, 18%)", color: "hsl(0, 0%, 55%)", background: "transparent" }}>
              Voltar ao login
            </button>
          </>
        )}

        <p className="text-center mt-8 text-[11px]" style={{ color: "hsl(0, 0%, 25%)" }}>
          © {new Date().getFullYear()} Més Belle Ateliê. Todos os direitos reservados.
        </p>
      </div>
    </div>
    </>
  );
};

export default PortalLogin;
