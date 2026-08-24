import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, RefreshCw, AlertCircle, Wallet, Users, Target, MousePointerClick } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { useDateRange, getPreset } from "@/hooks/useDateRange";
import { useMetaAds, type MetaCampanha } from "@/hooks/useMetaAds";
import { MetaMediaSection } from "@/components/marketing/MetaMediaSection";
import { formatBRL } from "@/lib/formatters";

const STATUS_CONTA: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  1: { label: "Ativa", variant: "default" },
  2: { label: "Desativada", variant: "destructive" },
  3: { label: "Pendência de pagamento", variant: "destructive" },
  7: { label: "Em revisão de risco", variant: "secondary" },
  9: { label: "Período de carência", variant: "secondary" },
  100: { label: "Fechamento pendente", variant: "secondary" },
  101: { label: "Fechada", variant: "destructive" },
};

const STATUS_CAMPANHA: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Ativa", variant: "default" },
  PAUSED: { label: "Pausada", variant: "secondary" },
  DELETED: { label: "Excluída", variant: "outline" },
  ARCHIVED: { label: "Arquivada", variant: "outline" },
};

const OBJETIVO_LABEL: Record<string, string> = {
  OUTCOME_SALES: "Vendas",
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_LEADS: "Leads",
  OUTCOME_AWARENESS: "Reconhecimento",
  LINK_CLICKS: "Cliques no link",
};

function formatNum(v: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(v));
}

function CampanhaRow({ c }: { c: MetaCampanha }) {
  const statusInfo = STATUS_CAMPANHA[c.status] ?? { label: c.status, variant: "outline" as const };
  return (
    <TableRow>
      <TableCell className="font-medium max-w-[280px] truncate" title={c.nome}>{c.nome}</TableCell>
      <TableCell><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></TableCell>
      <TableCell className="text-muted-foreground text-sm">{OBJETIVO_LABEL[c.objetivo] ?? c.objetivo}</TableCell>
      <TableCell className="text-right tabular-nums">{formatBRL(c.gasto)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatNum(c.impressoes)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatNum(c.cliques)}</TableCell>
      <TableCell className="text-right tabular-nums">{c.ctr.toFixed(2)}%</TableCell>
      <TableCell className="text-right tabular-nums font-medium">{formatNum(c.resultadoQtd)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {c.custoPorResultado != null ? formatBRL(c.custoPorResultado) : "—"}
      </TableCell>
    </TableRow>
  );
}

const MetaAds = () => {
  const { range, setRange, setPreset } = useDateRange(getPreset("ultimos_30"));
  const { data, isLoading, isError, error, refetch, isFetching } = useMetaAds(range);

  return (
    <>
      <SEO title="Meta Ads — Més Belle" description="Acompanhe o desempenho das suas campanhas." path="/marketing/meta-ads" />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader icon={BarChart3} title="Meta Ads" description="Desempenho das campanhas — Facebook e Instagram Ads" />
          <div className="flex items-center gap-2">
            <DateRangePicker value={range} onChange={setRange} />
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} title="Atualizar">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        )}

        {isError && (
          <Card className="card-editorial">
            <CardContent className="py-16 flex flex-col items-center text-center gap-4 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-xl">Não foi possível carregar o Meta Ads</h2>
                <p className="text-sm text-muted-foreground text-pretty">{(error as Error)?.message}</p>
              </div>
              <Button variant="outline" className="rounded-full" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1.5" /> Tentar de novo
              </Button>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{data.conta.nome}</span>
              {STATUS_CONTA[data.conta.status] && (
                <Badge variant={STATUS_CONTA[data.conta.status].variant}>{STATUS_CONTA[data.conta.status].label}</Badge>
              )}
              {data.conta.status === 3 && (
                <span className="text-xs text-muted-foreground">
                  — há uma pendência de pagamento na conta, verifique no Ads Manager
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                eyebrow="Investido no período"
                value={formatBRL(data.totais.gasto)}
                icon={Wallet}
                accent="primary"
              />
              <KpiCard
                eyebrow="Resultados (conversas/leads)"
                value={formatNum(data.totais.resultados)}
                icon={Users}
                accent="success"
              />
              <KpiCard
                eyebrow="Custo por resultado"
                value={data.totais.custoPorResultadoMedio != null ? formatBRL(data.totais.custoPorResultadoMedio) : "—"}
                icon={Target}
                accent="warning"
              />
              <KpiCard
                eyebrow="CTR médio"
                value={`${data.totais.ctrMedio.toFixed(2)}%`}
                icon={MousePointerClick}
                accent="info"
              />
            </div>

            <Card className="card-editorial">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Objetivo</TableHead>
                        <TableHead className="text-right">Gasto</TableHead>
                        <TableHead className="text-right">Impressões</TableHead>
                        <TableHead className="text-right">Cliques</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">Resultados</TableHead>
                        <TableHead className="text-right">Custo/Resultado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.campanhas
                        .filter((c) => c.gasto > 0 || c.status === "ACTIVE")
                        .sort((a, b) => b.gasto - a.gasto)
                        .map((c) => <CampanhaRow key={c.id} c={c} />)}
                    </TableBody>
                  </Table>
                </div>
                {data.campanhas.filter((c) => c.gasto > 0 || c.status === "ACTIVE").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma campanha com atividade nesse período</p>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-right">
              Atualizado em {new Date(data.atualizadoEm).toLocaleString("pt-BR")} · Campanhas pausadas sem gasto no período ficam ocultas
            </p>

            <MetaMediaSection range={range} />
          </>
        )}
      </div>
    </>
  );
};

export default MetaAds;
