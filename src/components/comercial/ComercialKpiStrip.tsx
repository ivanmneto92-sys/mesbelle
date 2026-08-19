import type { LucideIcon } from "lucide-react";
import { ComercialKpis } from "@/hooks/useComercialKpis";
import { DateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import {
  Users, CalendarCheck, Store, Handshake,
  TrendingUp, DollarSign, BarChart3, ShoppingBag,
} from "lucide-react";

function KpiTile({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border flex flex-col gap-2 ${accent ? "bg-primary/5 border-primary/20" : "bg-card border-border-subtle"} shadow-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground/60"}`} />
      </div>
      <p className={`text-2xl font-bold leading-none ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function FunnelStep({
  label, count, total, color,
}: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium truncate">{label}</span>
        <span className="text-xs font-bold ml-2 shrink-0">{count}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`${color} rounded-full h-2 transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% do total de leads</p>
    </div>
  );
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

interface ComercialKpiStripProps {
  kpis: ComercialKpis;
  range: DateRange;
  onRangeChange: (r: DateRange) => void;
}

export function ComercialKpiStrip({ kpis, range, onRangeChange }: ComercialKpiStripProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Funil de Conversão</p>
          <p className="text-xs text-muted-foreground/70">Acompanhe cada etapa da jornada da cliente</p>
        </div>
        <DateRangePicker value={range} onChange={onRangeChange} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile
          label="Volume de Leads"
          value={String(kpis.volumeLeads)}
          icon={Users}
          sub="leads no período"
        />
        <KpiTile
          label="Agendamentos"
          value={String(kpis.agendamentos)}
          icon={CalendarCheck}
          sub={`${kpis.taxaLeadAgendamento}% dos leads`}
        />
        <KpiTile
          label="Clientes na Loja"
          value={String(kpis.clientesNaLoja)}
          icon={Store}
          sub={`${kpis.taxaComparecimento}% compareceram`}
        />
        <KpiTile
          label="Fechamentos"
          value={String(kpis.agendamentosFechados)}
          icon={Handshake}
          accent
          sub={`${kpis.taxaFechamento}% taxa de fechamento`}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiTile
          label="Faturamento do Período"
          value={fmtBRL(kpis.faturamentoPeriodo)}
          icon={DollarSign}
          accent
        />
        <KpiTile
          label="Ticket Médio"
          value={fmtBRL(kpis.ticketMedio)}
          icon={TrendingUp}
          sub="por contrato assinado"
        />
        <KpiTile
          label="Negócios Aprovados"
          value={String(kpis.negociosAprovados)}
          icon={ShoppingBag}
          sub="negocios no período"
        />
      </div>

      <div className="rounded-xl border border-border-subtle bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" /> Fluxo do Funil
        </p>
        <div className="space-y-3">
          <FunnelStep label="Leads" count={kpis.volumeLeads} total={kpis.volumeLeads} color="bg-info" />
          <FunnelStep label="Agendamentos" count={kpis.agendamentos} total={kpis.volumeLeads} color="bg-primary/60" />
          <FunnelStep label="Compareceram" count={kpis.clientesNaLoja} total={kpis.volumeLeads} color="bg-warning" />
          <FunnelStep label="Fecharam" count={kpis.agendamentosFechados} total={kpis.volumeLeads} color="bg-success" />
        </div>
      </div>
    </div>
  );
}
