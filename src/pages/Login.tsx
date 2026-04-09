import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay for polish
    await new Promise((r) => setTimeout(r, 600));
    
    if (login(email, password)) {
      toast.success("Bem-vinda ao Més Belle!");
    } else {
      toast.error("Credenciais inválidas");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(340, 83%, 8%)" }}>
      {/* Left — brand showcase */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(145deg, hsl(340, 83%, 15%) 0%, hsl(343, 100%, 12%) 50%, hsl(340, 83%, 8%) 100%)" }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, hsl(0, 0%, 85%) 1px, transparent 1px),
                            radial-gradient(circle at 80% 20%, hsl(0, 0%, 85%) 1px, transparent 1px),
                            radial-gradient(circle at 60% 80%, hsl(0, 0%, 85%) 1px, transparent 1px)`,
          backgroundSize: "120px 120px, 80px 80px, 100px 100px"
        }} />
        
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, hsl(0, 0%, 85%), transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(343, 100%, 30%), transparent 70%)" }} />

        <div className="relative z-10 text-center px-16 max-w-lg">
          <img
            src="/logo-mesbelle.svg"
            alt="Més Belle"
            className="h-32 mx-auto mb-10 brightness-0 invert drop-shadow-2xl"
          />
          <div className="space-y-4">
            <h1 className="text-3xl font-serif tracking-wide" style={{ color: "hsl(0, 0%, 92%)" }}>
              Gestão que veste<br />
              <span style={{ color: "hsl(0, 0%, 75%)" }}>seus sonhos</span>
            </h1>
            <div className="w-16 h-[1px] mx-auto" style={{ background: "linear-gradient(90deg, transparent, hsl(0, 0%, 60%), transparent)" }} />
            <p className="text-sm leading-relaxed" style={{ color: "hsl(0, 0%, 55%)" }}>
              CRM, acervo, produção e finanças — tudo em um só lugar para o seu ateliê brilhar.
            </p>
          </div>

          {/* Feature pills */}
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {["CRM Inteligente", "Gestão de Acervo", "Controle Financeiro", "Logística"].map((f) => (
              <span
                key={f}
                className="text-[11px] px-3 py-1.5 rounded-full border"
                style={{
                  borderColor: "hsl(0, 0%, 25%)",
                  color: "hsl(0, 0%, 55%)",
                  background: "hsl(340, 83%, 12%)"
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10" style={{ background: "hsl(340, 83%, 6%)" }}>
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <img src="/logo-mesbelle.svg" alt="Més Belle" className="h-20 brightness-0 invert" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" style={{ color: "hsl(0, 0%, 55%)" }} />
              <span className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: "hsl(0, 0%, 50%)" }}>
                {mode === "login" ? "Acesso ao sistema" : "Criar conta"}
              </span>
            </div>
            <h2 className="text-2xl font-serif" style={{ color: "hsl(0, 0%, 92%)" }}>
              {mode === "login" ? "Bem-vinda de volta" : "Junte-se a nós"}
            </h2>
            <p className="text-sm mt-1" style={{ color: "hsl(0, 0%, 45%)" }}>
              {mode === "login"
                ? "Entre com suas credenciais para continuar"
                : "Preencha seus dados para começar"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(0, 0%, 50%)" }}>
                  Nome completo
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === "register"}
                  className="h-12 border-0 rounded-lg text-sm placeholder:text-[hsl(0,0%,30%)]"
                  style={{
                    background: "hsl(340, 40%, 10%)",
                    color: "hsl(0, 0%, 90%)",
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(0, 0%, 50%)" }}>
                E-mail
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-0 rounded-lg text-sm placeholder:text-[hsl(0,0%,30%)]"
                style={{
                  background: "hsl(340, 40%, 10%)",
                  color: "hsl(0, 0%, 90%)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(0, 0%, 50%)" }}>
                Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-0 rounded-lg text-sm pr-11 placeholder:text-[hsl(0,0%,30%)]"
                  style={{
                    background: "hsl(340, 40%, 10%)",
                    color: "hsl(0, 0%, 90%)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "hsl(0, 0%, 40%)" }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button type="button" className="text-xs transition-colors hover:underline" style={{ color: "hsl(0, 0%, 45%)" }}>
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-sm font-medium rounded-lg border-0 group transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, hsl(343, 100%, 18%), hsl(343, 80%, 25%))",
                color: "hsl(0, 0%, 95%)",
              }}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Entrar" : "Criar Conta"}
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[1px]" style={{ background: "hsl(0, 0%, 15%)" }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "hsl(0, 0%, 30%)" }}>ou</span>
            <div className="flex-1 h-[1px]" style={{ background: "hsl(0, 0%, 15%)" }} />
          </div>

          {/* Toggle mode */}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full h-11 rounded-lg border text-sm font-medium transition-all duration-200 hover:border-[hsl(0,0%,30%)]"
            style={{
              borderColor: "hsl(0, 0%, 18%)",
              color: "hsl(0, 0%, 55%)",
              background: "transparent",
            }}
          >
            {mode === "login" ? "Criar uma conta" : "Já tenho uma conta"}
          </button>

          {/* Test credentials */}
          <div className="mt-8 p-4 rounded-lg" style={{ background: "hsl(340, 30%, 9%)", border: "1px solid hsl(0, 0%, 14%)" }}>
            <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: "hsl(0, 0%, 40%)" }}>
              Acessos de teste
            </p>
            <div className="space-y-1.5 text-xs" style={{ color: "hsl(0, 0%, 38%)" }}>
              <p><span style={{ color: "hsl(0, 0%, 50%)" }}>Admin:</span> admin@mesbelle.com / admin123</p>
              <p><span style={{ color: "hsl(0, 0%, 50%)" }}>Vendedor:</span> vendedor@mesbelle.com / vend123</p>
              <p><span style={{ color: "hsl(0, 0%, 50%)" }}>Sócio:</span> socio@mesbelle.com / socio123</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center mt-8 text-[11px]" style={{ color: "hsl(0, 0%, 25%)" }}>
            © {new Date().getFullYear()} Més Belle Ateliê. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
