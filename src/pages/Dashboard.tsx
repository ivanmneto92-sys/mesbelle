import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CalendarCheck, Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

const metrics = [
  { title: "Faturamento Hoje", value: "R$ 4.850,00", change: "+12%", up: true, icon: DollarSign },
  { title: "Agendamentos", value: "7", change: "+2 novos", up: true, icon: CalendarCheck },
  { title: "Entregas Pendentes", value: "4", change: "2 atrasadas", up: false, icon: Package },
];

const alerts = [
  { text: "3 vestidos não devolvidos — prazo expirado", type: "destructive" as const },
  { text: "Prova agendada hoje: Maria Silva — 14h", type: "default" as const },
  { text: "Estoque baixo: categoria Longo Bordado", type: "secondary" as const },
  { text: "Pagamento pendente: Contrato #0127", type: "destructive" as const },
  { text: "Nova lead via Instagram: Ana Beatriz", type: "default" as const },
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do ateliê</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card key={m.title} className="shadow-sm">
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
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50">
                  <Badge variant={a.type} className="mt-0.5 shrink-0 text-xs">{a.type === "destructive" ? "Urgente" : "Info"}</Badge>
                  <p className="text-sm">{a.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
