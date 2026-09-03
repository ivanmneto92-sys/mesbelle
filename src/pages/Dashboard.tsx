import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import {
  DollarSign, CalendarCheck, Package,
  UserPlus, Handshake, Truck, TrendingUp,
  Users, Ticket, Percent, Target, Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useDateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Skeleton } from "@/components/ui/skeleton";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const fmtPct = (v: number) => `${v.toFixed(0)}%`;

const Dashboard = () => {
  const { user } = useAuth();
  const { range, setRange } = useDateRange();
  const { kpis, loading } = useDashboard(range);
  const firstName = user?.name?.split(" ")[0] ?? "bem-vinda";

  const shortcuts = [
    { label: "Novo Lead", icon: UserPlus, to: "/crm", roles: ["admin"], primary: false },
    { label: "Nova Venda", icon: Handshake, to: "/comercial", roles: ["admin"], primary: true },
    { label: "Logística", icon: Truck, to: "/operacional/logistica", roles: ["admin"], primary: false },
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

  const periodMetrics = [
    { eyebrow: "Faturamento do Período", value: fmtBRL(kpis.faturamentoPeriodo), icon: DollarSign, accent: "primary" as const },
    { eyebrow: "Volume de Leads", value: String(kpis.volumeLeads), icon: Users, accent: "info" as const },
    { eyebrow: "Agendamentos", value: String(kpis.agendamentos), icon: CalendarCheck, accent: "info" as const },
    { eyebrow: "Aluguéis", value: String(kpis.alugueis), icon: Package, accent: "warning" as const },
    { eyebrow: "Ticket Médio", value: fmtBRL(kpis.ticketMedio), icon: Ticket, accent: "primary" as const },
    { eyebrow: "Conversão por Agendamento", value: fmtPct(kpis.conversaoPorAgendamento), icon: Percent, accent: "success" as const },
    { eyebrow: "Custo por Agendamento", value: fmtBRL(kpis.custoPorAgendamento), icon: Target, accent: "warning" as const },
    { eyebrow: "Custo de Aquisição", value: fmtBRL(kpis.custoDeAquisicao), icon: Wallet, accent: "warning" as const },
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
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <DateRangePicker value={range} onChange={setRange} />
            {shortcuts.length > 0 && shortcuts.map((s) => (
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
        }
      />

      {/* KPIs do período selecionado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : periodMetrics.map((m) => <KpiCard key={m.eyebrow} {...m} />)}
      </div>

      {/* KPIs de hoje */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : metrics.map((m) => <KpiCard key={m.eyebrow} {...m} />)}
      </div>
    </>
  );
};

export default Dashboard;
