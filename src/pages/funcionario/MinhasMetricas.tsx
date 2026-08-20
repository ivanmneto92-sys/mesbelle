import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart2, CheckCircle, Wallet, Receipt, TrendingUp, Users, Gift, Clock } from "lucide-react";
import { useMeusKpis } from "@/hooks/useMeusKpis";
import { useMeusLeads } from "@/hooks/useMeusLeads";
import { useDateRange } from "@/hooks/useDateRange";
import { formatBRL } from "@/lib/formatters";

type CardColor = "default" | "green" | "yellow" | "red";
const COLOR_MAP: Record<CardColor, string> = { default: "", green: "text-success", yellow: "text-warning", red: "text-destructive" };

const MetricaCard = ({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: typeof BarChart2;
  color: CardColor;
}) => (
  <Card className="shadow-sm">
    <CardContent className="p-4 flex items-start gap-3">
      <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-0.5"><Icon className="h-4 w-4 text-primary" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold tabular-nums mt-0.5 ${COLOR_MAP[color]}`}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

const STATUS_LABELS: Record<string, string> = {
  novo_lead: "Novo Lead",
  em_atendimento: "Em Atendimento",
  prova_agendada: "Prova Agendada",
  agendado: "Agendado",
  compareceu_alugou: "Compareceu e Alugou",
  compareceu_nao_alugou: "Compareceu e Não Alugou",
  reagendada: "Reagendada",
  cancelada: "Cancelada",
  no_show: "No-Show",
};

const MinhasMetricas = () => {
  const { range, setRange } = useDateRange();
  const kpis = useMeusKpis(range);
  const { leads } = useMeusLeads();
  const navigate = useNavigate();

  const compraram = leads.filter((l) => l.enviadoComercial);
  const naoCompraram = leads.filter((l) => !l.enviadoComercial && l.statusFunil !== "novo_lead");
  const ticketMedio = kpis.negociosFechados > 0 ? kpis.faturamentoGerado / kpis.negociosFechados : 0;

  return (
    <>
      <SEO title="Minhas Métricas — Més Belle" description="Performance e projeção de ganho." path="/minhas-metricas" />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader icon={BarChart2} title="Minhas Métricas" description="Performance e projeção de ganho" />
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricaCard label="Negócios Fechados" value={kpis.negociosFechados} color="green" icon={CheckCircle} />
          <MetricaCard label="Faturamento Gerado" value={formatBRL(kpis.faturamentoGerado)} color="green" icon={Wallet} />
          <MetricaCard label="Ticket Médio" value={kpis.negociosFechados > 0 ? formatBRL(ticketMedio) : "—"} color="default" icon={Receipt} />
          <MetricaCard label="Taxa de Conversão" value={`${kpis.taxaConversao.toFixed(1)}%`} color={kpis.taxaConversao > 25 ? "green" : "yellow"} icon={TrendingUp} />
          <MetricaCard label="Leads no Período" value={kpis.totalMeusLeads} color="default" icon={Users} />
          <MetricaCard label="Projeção de Ganho" value="A configurar" sub="O admin irá definir a regra de comissão em breve" color="default" icon={Gift} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" /> Clientes que compraram ({compraram.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-60 overflow-y-auto">
              {compraram.length > 0 ? (
                <Table>
                  <TableBody>
                    {compraram.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm font-medium">{l.nome}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.tipoEvento || "—"}</TableCell>
                        <TableCell className="text-xs text-right">
                          {l.dataEvento ? new Date(l.dataEvento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum cliente fechado ainda</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" /> Em atendimento sem compra ({naoCompraram.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-60 overflow-y-auto">
              {naoCompraram.length > 0 ? (
                <Table>
                  <TableBody>
                    {naoCompraram.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm font-medium">{l.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{STATUS_LABELS[l.statusFunil ?? ""] ?? l.statusFunil}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => navigate(`/meu-contrato?leadId=${l.id}`)}>
                            Gerar contrato →
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Todos os clientes em atendimento já compraram!</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-dashed">
          <CardContent className="p-4 flex items-center gap-4">
            <Gift className="h-8 w-8 text-muted-foreground/30 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Projeção de Ganho</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                A regra de comissão ainda será configurada pelo admin. Assim que definida,
                sua projeção de ganho aparecerá aqui automaticamente.
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">Em breve</Badge>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MinhasMetricas;
