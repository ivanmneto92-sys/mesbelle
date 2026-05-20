import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  DollarSign, CalendarCheck, Package, AlertTriangle, TrendingUp, TrendingDown,
  LayoutDashboard, UserPlus, Handshake, Truck, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const metrics = [
  { title: "Faturamento Hoje", value: "R$ 4.850,00", change: "+12%", up: true, icon: DollarSign },
  { title: "Agendamentos", value: "7", change: "+2 novos", up: true, icon: CalendarCheck },
  { title: "Entregas Pendentes", value: "4", change: "2 atrasadas", up: false, icon: Package },
];

const alerts: { text: string; type: "destructive" | "default" | "secondary"; href: string }[] = [
  { text: "3 vestidos não devolvidos — prazo expirado", type: "destructive", href: "/logistica" },
  { text: "Prova agendada hoje: Maria Silva — 14h", type: "default", href: "/crm" },
  { text: "Estoque baixo: categoria Longo Bordado", type: "secondary", href: "/acervo" },
  { text: "Pagamento pendente: Contrato #0127", type: "destructive", href: "/comercial" },
  { text: "Nova lead via Instagram: Ana Beatriz", type: "default", href: "/crm" },
];

const ScoreGauge = ({ score }: { score: number }) => {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 70 ? "hsl(var(--success))" : score >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-48 h-28">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--border))" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251.2} 251.2`}
        />
        <line
          x1="100" y1="100" x2={100 + 60 * Math.cos((angle * Math.PI) / 180)} y2={100 + 60 * Math.sin((angle * Math.PI) / 180)}
          stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill="hsl(var(--foreground))" />
        <text x="100" y="90" textAnchor="middle" className="text-2xl font-bold" fill="hsl(var(--foreground))" fontSize="28" fontWeight="700">
          {score}
        </text>
      </svg>
      <p className="text-sm text-muted-foreground mt-1">Score Geral da Loja</p>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  const shortcuts = [
    { label: "Novo Lead", icon: UserPlus, to: "/crm", roles: ["admin", "vendedor"] },
    { label: "Nova Venda", icon: Handshake, to: "/comercial", roles: ["admin", "vendedor"] },
    { label: "Logística", icon: Truck, to: "/logistica", roles: ["admin", "vendedor"] },
  ].filter((s) => user && s.roles.includes(user.role));

  return (
    <>
    <SEO title="Dashboard — Més Belle" description="Visão geral do ateliê: vendas, produção e logística em um só lugar." path="/" />
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title={`Olá, ${user?.name?.split(" ")[0] ?? "bem-vinda"} 👋`}
        description="Visão geral do ateliê"
        actions={
          shortcuts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {shortcuts.map((s) => (
                <Button key={s.to} asChild size="sm" variant="outline">
                  <Link to={s.to}>
                    <s.icon className="h-4 w-4 mr-1" /> {s.label}
                  </Link>
                </Button>
              ))}
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card key={m.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.title}</p>
                  <p className="text-2xl font-bold mt-1">{m.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {m.up ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                    <span className={`text-xs ${m.up ? "text-success" : "text-destructive"}`}>{m.change}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <m.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif">Score da Loja</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ScoreGauge score={73} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Avisos Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {alerts.map((a, i) => (
                <Link
                  key={i}
                  to={a.href}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <Badge variant={a.type} className="mt-0.5 shrink-0 text-xs">
                    {a.type === "destructive" ? "Urgente" : "Info"}
                  </Badge>
                  <p className="text-sm flex-1">{a.text}</p>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
