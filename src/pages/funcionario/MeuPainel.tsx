import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, CalendarCheck2, UserCheck, TrendingUp, CheckCircle, Wallet, Gift, AlertTriangle,
} from "lucide-react";
import { useMeusKpis } from "@/hooks/useMeusKpis";
import { useDateRange } from "@/hooks/useDateRange";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { formatBRL } from "@/lib/formatters";

type CardColor = "default" | "green" | "blue" | "yellow" | "red";

const COLOR_MAP: Record<CardColor, string> = {
  default: "",
  green: "text-success",
  blue: "text-info",
  yellow: "text-warning",
  red: "text-destructive",
};

const PainelKpiCard = ({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: typeof Users;
  color: CardColor;
}) => (
  <Card className="shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold mt-0.5 tabular-nums ${COLOR_MAP[color]}`}>{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className="p-2 bg-primary/10 rounded-lg shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
      </div>
    </CardContent>
  </Card>
);

const MeuPainel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { range, setRange } = useDateRange();
  const kpis = useMeusKpis(range);
  const primeiroNome = user?.name?.split(" ")[0] || "bem-vinda";

  return (
    <>
      <SEO title="Meu Painel — Més Belle" description="Resumo das suas atividades comerciais." path="/meu-painel" />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold">Olá, {primeiroNome}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Aqui está o resumo das suas atividades</p>
          </div>
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PainelKpiCard label="Meus Leads" value={kpis.totalMeusLeads} icon={Users} color="default" />
          <PainelKpiCard label="Agendamentos" value={kpis.meusAgendamentos} icon={CalendarCheck2} color="blue" />
          <PainelKpiCard label="Clientes Ativos" value={kpis.clientesAtivos} icon={UserCheck} color="green" />
          <PainelKpiCard
            label="Taxa de Conversão"
            value={`${kpis.taxaConversao.toFixed(1)}%`}
            icon={TrendingUp}
            color={kpis.taxaConversao > 20 ? "green" : "yellow"}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <PainelKpiCard label="Negócios Fechados" value={kpis.negociosFechados} icon={CheckCircle} color="green" />
          <PainelKpiCard label="Faturamento Gerado" value={formatBRL(kpis.faturamentoGerado)} icon={Wallet} color="default" />
          <PainelKpiCard
            label="Projeção de Ganho"
            value={kpis.projecaoGanho > 0 ? formatBRL(kpis.projecaoGanho) : "—"}
            sub="Regra de comissão a configurar"
            icon={Gift}
            color="default"
          />
        </div>

        {kpis.clientesSemCompra > 0 && (
          <Card className="shadow-sm border-l-4 border-l-warning">
            <CardContent className="p-4 flex items-center gap-3 flex-wrap">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-semibold">{kpis.clientesSemCompra} cliente(s) em atendimento sem compra finalizada</p>
                <p className="text-xs text-muted-foreground">Verifique seus leads e agende uma prova para avançar no funil.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/meus-leads")}>
                Ver leads
              </Button>
            </CardContent>
          </Card>
        )}

        {kpis.clientesSemCompra === 0 && kpis.totalMeusLeads > 0 && (
          <Card className="shadow-sm bg-muted/20 border-dashed">
            <CardContent className="p-4 flex items-center gap-3">
              <Badge variant="outline">Tudo em dia</Badge>
              <p className="text-sm text-muted-foreground">Nenhum cliente pendente sem compra no momento.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default MeuPainel;
