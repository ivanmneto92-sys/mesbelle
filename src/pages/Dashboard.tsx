import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import {
  DollarSign, CalendarCheck, Package, AlertTriangle,
  UserPlus, Handshake, Truck, ArrowRight, Clock, MapPin, Scissors, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

const typeMeta = {
  prova: { icon: Scissors, color: "text-primary", bg: "bg-primary/10" },
  entrega: { icon: Truck, color: "text-info", bg: "bg-info/10" },
  retirada: { icon: MapPin, color: "text-success", bg: "bg-success/10" },
} as const;

const severityMeta = {
  urgent: { dot: "bg-destructive", label: "Urgente", labelColor: "text-destructive" },
  warn: { dot: "bg-warning", label: "Atenção", labelColor: "text-warning" },
  info: { dot: "bg-info", label: "Info", labelColor: "text-info" },
} as const;

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

const ScoreGauge = ({ score }: { score: number }) => {
  const angle = (score / 100) * 180 - 90;
  const color = score >= 70 ? "hsl(var(--success))" : score >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  return (
    <svg viewBox="0 0 200 120" className="w-full max-w-[220px] h-auto">
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--border-subtle))" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * 251.2} 251.2`}
      />
      <line
        x1="100" y1="100"
        x2={100 + 55 * Math.cos((angle * Math.PI) / 180)}
        y2={100 + 55 * Math.sin((angle * Math.PI) / 180)}
        stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round"
      />
      <circle cx="100" cy="100" r="6" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <text x="100" y="86" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="32" fontWeight="600" fontFamily="Fraunces, serif">
        {score}
      </text>
    </svg>
  );
};

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const Dashboard = () => {
  const { user } = useAuth();
  const { kpis, agendaHoje, alertas, score, loading } = useDashboard();
  const firstName = user?.name?.split(" ")[0] ?? "bem-vinda";

  const shortcuts = [
    { label: "Novo Lead", icon: UserPlus, to: "/crm", roles: ["admin", "vendedor"], primary: false },
    { label: "Nova Venda", icon: Handshake, to: "/comercial", roles: ["admin", "vendedor"], primary: true },
    { label: "Logística", icon: Truck, to: "/logistica", roles: ["admin", "vendedor"], primary: false },
  ].filter((s) => user && s.roles.includes(user.role));

  const fatTrend = kpis.faturamentoOntem > 0
    ? ((kpis.faturamentoHoje - kpis.faturamentoOntem) / kpis.faturamentoOntem) * 100
    : (kpis.faturamentoHoje > 0 ? 100 : 0);

  const metrics = [
    {
      eyebrow: "Faturamento hoje",
      value: fmtBRL(kpis.faturamentoHoje),
      hint: "vs ontem",
      trend: { value: `${fatTrend >= 0 ? "+" : ""}${fatTrend.toFixed(0)}%`, up: fatTrend >= 0 },
      icon: DollarSign, accent: "primary" as const, sparkline: [3, 4, 3.5, 5, 4.5, 6, 5.5, 7],
    },
    {
      eyebrow: "Agendamentos",
      value: String(kpis.agendamentosHoje),
      hint: kpis.leadsNovosHoje > 0 ? `+${kpis.leadsNovosHoje} novos hoje` : "nenhum novo hoje",
      trend: { value: kpis.agendamentosHoje > 0 ? "Hoje" : "Livre", up: true },
      icon: CalendarCheck, accent: "info" as const, sparkline: [2, 3, 3, 4, 5, 5, 6, 7],
    },
    {
      eyebrow: "Entregas pendentes",
      value: String(kpis.entregasPendentes),
      hint: kpis.entregasAtrasadas > 0 ? `${kpis.entregasAtrasadas} atrasada${kpis.entregasAtrasadas > 1 ? "s" : ""}` : "tudo em dia",
      trend: { value: kpis.entregasAtrasadas > 0 ? "Atenção" : "OK", up: kpis.entregasAtrasadas === 0 },
      icon: Package, accent: "warning" as const, sparkline: [6, 5, 5, 4, 4, 5, 4, 4],
    },
    {
      eyebrow: "Conversão do mês",
      value: `${kpis.conversaoMes.toFixed(0)}%`,
      hint: "leads convertidos",
      trend: { value: `${kpis.conversaoMes.toFixed(0)}%`, up: kpis.conversaoMes >= 50 },
      icon: TrendingUp, accent: "success" as const, sparkline: [55, 58, 56, 60, 59, 61, 62, 62],
    },
  ];

  const tituloHeader = loading
    ? `${firstName}, carregando seu dia…`
    : kpis.agendamentosHoje === 0 && kpis.entregasPendentes === 0
      ? `${firstName}, nada agendado para hoje.`
      : `${firstName}, você tem ${kpis.agendamentosHoje} prova${kpis.agendamentosHoje !== 1 ? "s" : ""} e ${kpis.entregasPendentes} entrega${kpis.entregasPendentes !== 1 ? "s" : ""} hoje.`;

  return (
    <>
      <SEO title="Dashboard — Més Belle" description="Visão geral do ateliê: vendas, produção e logística em um só lugar." path="/" />
      <PageHeader
        eyebrow={greeting()}
        title={tituloHeader}
        description="Resumo do dia, alertas urgentes e atalhos para suas ações mais frequentes."
        actions={
          shortcuts.length > 0 && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {shortcuts.map((s) => (
                <Button
                  key={s.to}
                  asChild
                  size="default"
                  variant={s.primary ? "default" : "outline"}
                  className={s.primary ? "h-10 rounded-full px-4 sm:px-5 shadow-glow flex-1 sm:flex-none min-w-0" : "h-10 rounded-full px-3 sm:px-4 bg-card border-border-subtle flex-1 sm:flex-none min-w-0"}
                >
                  <Link to={s.to}>
                    <s.icon className="h-4 w-4 mr-1.5 shrink-0" /> <span className="truncate">{s.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          )
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : metrics.map((m) => <KpiCard key={m.eyebrow} {...m} />)}
      </div>

      {/* Hoje no ateliê + Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <Card className="card-editorial lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <p className="label-eyebrow">Hoje no ateliê</p>
              <h2 className="font-display text-xl mt-1">Sua agenda</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground gap-1">
              <Link to="/crm">Ver tudo <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="border-t border-border-subtle">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : agendaHoje.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                Nenhum compromisso para hoje.
              </div>
            ) : (
              agendaHoje.map((it, i) => {
                const meta = typeMeta[it.type];
                return (
                  <Link
                    key={i}
                    to={it.href}
                    className="flex items-center gap-4 px-6 py-4 border-b border-border-subtle last:border-0 hover:bg-surface-cream/60 transition-colors group"
                  >
                    <div className="flex items-center gap-1 text-sm font-mono text-muted-foreground w-14 shrink-0">
                      <Clock className="h-3 w-3" />
                      {it.time}
                    </div>
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{it.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>
                    </div>
                    <span className="label-eyebrow capitalize hidden sm:block">{it.type}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        {/* Score */}
        <Card className="card-editorial p-6 flex flex-col">
          <div>
            <p className="label-eyebrow">Saúde da operação</p>
            <h2 className="font-display text-xl mt-1">Score da loja</h2>
          </div>
          <div className="flex justify-center my-2">
            {loading ? <Skeleton className="h-32 w-52 rounded-2xl" /> : <ScoreGauge score={score.score} />}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle">
            {[
              { label: "NPS", value: score.nps > 0 ? String(score.nps) : "—" },
              { label: "No prazo", value: `${score.noPrazo}%` },
              { label: "Conversão", value: `${score.conversao}%` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-lg leading-none">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Avisos rápidos */}
      <Card className="card-editorial p-0 overflow-hidden mt-6">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="label-eyebrow">Para você agir</p>
              <h2 className="font-display text-xl mt-0.5">Avisos rápidos</h2>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3 border-t border-border-subtle">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : alertas.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground border-t border-border-subtle">
              Tudo em ordem por aqui. ✨
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle border-t border-border-subtle">
              {alertas.map((a, i) => {
                const meta = severityMeta[a.severity];
                return (
                  <li key={i} className="group flex items-center gap-4 px-6 py-3.5 hover:bg-surface-cream/60 transition-colors">
                    <span className={`h-2 w-2 rounded-full ${meta.dot} shrink-0`} />
                    <span className={`text-[10px] uppercase tracking-wider font-semibold w-16 shrink-0 ${meta.labelColor}`}>
                      {meta.label}
                    </span>
                    <p className="text-sm flex-1 truncate">{a.text}</p>
                    <Button asChild size="sm" variant="ghost" className="opacity-70 group-hover:opacity-100 h-8 rounded-full text-xs">
                      <Link to={a.href}>{a.cta} <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Dashboard;
