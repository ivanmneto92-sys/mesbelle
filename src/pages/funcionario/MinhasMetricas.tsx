import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart2, CheckCircle, Wallet, Receipt, TrendingUp, Users, Gift, Clock, Circle, Loader2,
} from "lucide-react";
import { useMeusKpis } from "@/hooks/useMeusKpis";
import { useMeusLeads } from "@/hooks/useMeusLeads";
import { useExtratoComissao } from "@/hooks/useExtratoComissao";
import { useDateRange } from "@/hooks/useDateRange";
import { formatBRL } from "@/lib/formatters";
import { FAIXAS_COMISSAO, BONUS_COMISSAO_LIMIAR, BONUS_COMISSAO_VALOR, calcularPercentualComissao } from "@/lib/comissao";
import { ExtratoComissaoCard } from "@/components/funcionario/ExtratoComissaoCard";

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
  const { grupos: gruposComissao, loading: extratoCarregando, totalAReceber } = useExtratoComissao(range);
  const navigate = useNavigate();

  const compraram = leads.filter((l) => l.enviadoComercial);
  const naoCompraram = leads.filter((l) => !l.enviadoComercial && l.statusFunil !== "novo_lead");
  const ticketMedio = kpis.negociosFechados > 0 ? kpis.faturamentoGerado / kpis.negociosFechados : 0;

  const faturamentoMesAtual = kpis.faturamentoMesAtual;
  const percentualAtual = calcularPercentualComissao(faturamentoMesAtual);
  const faixaAtualIndex = FAIXAS_COMISSAO.findIndex((f) => f.percentual === percentualAtual);
  const proximaFaixa = FAIXAS_COMISSAO[faixaAtualIndex + 1];
  const progressoProximaFaixa = proximaFaixa ? Math.min(100, (faturamentoMesAtual / proximaFaixa.min) * 100) : 100;
  const bonusAtingido = faturamentoMesAtual >= BONUS_COMISSAO_LIMIAR;
  const progressoBonus = Math.min(100, (faturamentoMesAtual / BONUS_COMISSAO_LIMIAR) * 100);

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
          <MetricaCard label="A Receber (período)" value={formatBRL(totalAReceber)} sub="Comissão + ajustes + bônus" color="green" icon={Gift} />
        </div>

        {/* Metas do mês — sempre o mês corrente, independente do filtro de período acima */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-sm flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" /> Metas do Mês Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Faturamento do mês: <span className="font-semibold text-foreground">{formatBRL(faturamentoMesAtual)}</span> — faixa atual: <span className="font-semibold text-foreground">{(percentualAtual * 100).toLocaleString("pt-BR")}%</span>
            </p>

            <div className="space-y-2">
              {FAIXAS_COMISSAO.map((f) => {
                const atingida = faturamentoMesAtual >= f.min;
                const ativa = f.percentual === percentualAtual;
                return (
                  <div
                    key={f.percentual}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      ativa ? "border-primary bg-primary/5" : atingida ? "border-success/30 bg-success/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {atingida ? (
                        <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{(f.percentual * 100).toLocaleString("pt-BR")}% de comissão</p>
                        <p className="text-xs text-muted-foreground">
                          {f.max === Infinity ? `A partir de ${formatBRL(f.min)}` : `${formatBRL(f.min)} a ${formatBRL(f.max)}`}
                        </p>
                      </div>
                    </div>
                    {ativa && <Badge className="shrink-0">Faixa atual</Badge>}
                  </div>
                );
              })}
            </div>

            {proximaFaixa && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">
                    Progresso até {(proximaFaixa.percentual * 100).toLocaleString("pt-BR")}%
                  </span>
                  <span className="text-xs font-medium">{formatBRL(faturamentoMesAtual)} / {formatBRL(proximaFaixa.min)}</span>
                </div>
                <Progress value={progressoProximaFaixa} className="h-2" />
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {bonusAtingido ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <Gift className="h-4 w-4 text-muted-foreground/50" />
                  )}
                  <p className="text-sm font-medium">Bônus de {formatBRL(BONUS_COMISSAO_VALOR)}</p>
                </div>
                {bonusAtingido ? (
                  <Badge variant="outline" className="bg-success/15 text-success border-success/30 shrink-0">Conquistado</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">
                    Faltam {formatBRL(Math.max(0, BONUS_COMISSAO_LIMIAR - faturamentoMesAtual))}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">Ao ultrapassar {formatBRL(BONUS_COMISSAO_LIMIAR)} faturados no mês</p>
              <Progress value={progressoBonus} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Extrato de comissão — respeita o período selecionado no topo */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Extrato de Comissão
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {extratoCarregando ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando extrato...
              </div>
            ) : gruposComissao.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum lançamento de comissão neste período.</p>
            ) : (
              <div className="max-h-[32rem] overflow-y-auto space-y-3 p-4 pt-0">
                {gruposComissao.map((g) => (
                  <ExtratoComissaoCard key={g.negocioId} grupo={g} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </>
  );
};

export default MinhasMetricas;
