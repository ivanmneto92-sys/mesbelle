import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import {
  DollarSign, CalendarCheck, Package,
  UserPlus, Handshake, Truck,
  Users, Ticket, Percent, Target, Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useDateRange, getPreset } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CRM_KANBAN_COLUMNS } from "@/types/comercial";

const statusFunilLabel = (status: string) =>
  CRM_KANBAN_COLUMNS.find((c) => c.id === status)?.title ?? status;

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
  // Sempre abre no "Hoje" — quem entra no Dashboard quer ver o dia, não o
  // mês inteiro acumulado (que era o padrão herdado do hook).
  const { range, setRange } = useDateRange(getPreset("hoje"));
  const { kpis, loading } = useDashboard(range);
  const firstName = user?.name?.split(" ")[0] ?? "bem-vinda";
  const [agendamentosAbertos, setAgendamentosAbertos] = useState(false);
  const [leadsAbertos, setLeadsAbertos] = useState(false);

  const shortcuts = [
    { label: "Novo Lead", icon: UserPlus, to: "/crm", roles: ["admin"], primary: false },
    { label: "Nova Venda", icon: Handshake, to: "/comercial", roles: ["admin"], primary: true },
    { label: "Logística", icon: Truck, to: "/operacional/logistica", roles: ["admin"], primary: false },
  ].filter((s) => user && s.roles.includes(user.role));

  const periodMetrics = [
    { eyebrow: "Faturamento do Período", value: fmtBRL(kpis.faturamentoPeriodo), icon: DollarSign, accent: "primary" as const },
    {
      eyebrow: "Volume de Leads",
      value: String(kpis.volumeLeads),
      icon: Users,
      accent: "info" as const,
      hint: kpis.leadsLista.length > 0 ? "Clique para ver quais" : undefined,
      onClick: kpis.leadsLista.length > 0 ? () => setLeadsAbertos(true) : undefined,
    },
    {
      eyebrow: "Agendamentos",
      value: String(kpis.agendamentos),
      icon: CalendarCheck,
      accent: "info" as const,
      hint: "Visitas de clientes novas — clique para ver quais",
      onClick: kpis.agendamentosLista.length > 0 ? () => setAgendamentosAbertos(true) : undefined,
    },
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

      <Dialog open={agendamentosAbertos} onOpenChange={setAgendamentosAbertos}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Agendamentos de clientes novas</DialogTitle>
            <DialogDescription>
              {kpis.agendamentosLista.length} visita(s) de clientes novas no período selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-1">
            {kpis.agendamentosLista.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <p className="text-sm font-medium truncate">{a.clienteNome}</p>
                <p className="text-xs text-muted-foreground shrink-0">
                  {format(parseISO(a.dataHora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            ))}
            {kpis.agendamentosLista.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum agendamento no período</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={leadsAbertos} onOpenChange={setLeadsAbertos}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Leads do período</DialogTitle>
            <DialogDescription>
              {kpis.leadsLista.length} lead(s) no período selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-1">
            {kpis.leadsLista.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <p className="text-sm font-medium truncate">{l.nome}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{statusFunilLabel(l.statusFunil)}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(l.criadoEm), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))}
            {kpis.leadsLista.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum lead no período</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
