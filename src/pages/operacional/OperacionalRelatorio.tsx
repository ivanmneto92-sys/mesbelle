import { BarChart3, AlertTriangle, Clock } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useRelatorioOperacional, AluguelAtivo } from "@/hooks/useRelatorioOperacional";
import { useDateRange } from "@/hooks/useDateRange";
import { CATEGORIA_LABELS } from "@/types/acervo";
import { formatBRL } from "@/lib/formatters";

const CHART_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#6366f1", "#ec4899"];

const StatusCard = ({ label, value, color, highlight }: {
  label: string; value: string | number;
  color: "default" | "green" | "yellow" | "red" | "blue";
  highlight?: boolean;
}) => {
  const colorMap = {
    default: "text-foreground",
    green: "text-success",
    yellow: "text-warning",
    red: "text-destructive",
    blue: "text-info",
  };
  return (
    <Card className={`shadow-sm ${highlight ? "ring-1 ring-primary/30" : ""}`}>
      <CardContent className="p-3 text-center">
        <p className={`text-2xl font-bold tabular-nums ${colorMap[color]}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
};

const AluguelTable = ({ itens }: { itens: AluguelAtivo[] }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Peça</TableHead>
        <TableHead>Cliente</TableHead>
        <TableHead>Devolução Prev.</TableHead>
        <TableHead>Situação</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {itens.map((a) => (
        <TableRow key={a.id}>
          <TableCell className="font-medium text-sm">{a.vestidoNome}</TableCell>
          <TableCell className="text-sm">{a.clienteNome}</TableCell>
          <TableCell className="text-xs">{a.dataDevolucao ? new Date(a.dataDevolucao + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
          <TableCell>
            {a.diasRestantes < 0
              ? <span className="text-xs font-semibold text-destructive">{Math.abs(a.diasRestantes)} dias atraso</span>
              : <span className="text-xs font-semibold text-warning">Vence em {a.diasRestantes}d</span>}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const OperacionalRelatorio = () => {
  const { range, setRange } = useDateRange();
  const rel = useRelatorioOperacional(range);

  return (
    <>
      <SEO title="Relatório Operacional — Més Belle" description="Status do acervo, ocupação e performance de locações." path="/operacional/relatorio" />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader icon={BarChart3} title="Relatório Operacional" description="Status do acervo, ocupação e performance de locações" />
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status do Acervo — Hoje</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatusCard label="Total de Peças" value={rel.totalPecas} color="default" />
            <StatusCard label="Disponíveis" value={rel.disponiveis} color="green" />
            <StatusCard label="Alugadas" value={rel.alugadas} color="yellow" />
            <StatusCard label="Manutenção" value={rel.emManutencao} color="red" />
            <StatusCard label="Produção" value={rel.emProducao} color="blue" />
            <StatusCard label="Taxa de Ocupação" value={`${rel.taxaOcupacao.toFixed(1)}%`} color={rel.taxaOcupacao > 50 ? "green" : "yellow"} highlight />
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium">Distribuição do Acervo</span>
              <span className="text-xs text-muted-foreground">({rel.totalPecas} peças total)</span>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
              {rel.disponiveis > 0 && <div className="bg-primary" style={{ flex: rel.disponiveis }} title="Disponível" />}
              {rel.alugadas > 0 && <div className="bg-warning" style={{ flex: rel.alugadas }} title="Alugado" />}
              {rel.emManutencao > 0 && <div className="bg-destructive" style={{ flex: rel.emManutencao }} title="Manutenção" />}
              {rel.emProducao > 0 && <div className="bg-info" style={{ flex: rel.emProducao }} title="Produção" />}
              {rel.inativas > 0 && <div className="bg-muted-foreground/30" style={{ flex: rel.inativas }} title="Inativo" />}
            </div>
            <div className="flex gap-4 mt-2 flex-wrap">
              {[
                { label: "Disponível", color: "bg-primary", n: rel.disponiveis },
                { label: "Alugado", color: "bg-warning", n: rel.alugadas },
                { label: "Manutenção", color: "bg-destructive", n: rel.emManutencao },
                { label: "Produção", color: "bg-info", n: rel.emProducao },
                { label: "Inativo", color: "bg-muted-foreground/30", n: rel.inativas },
              ].filter((l) => l.n > 0).map((l) => (
                <span key={l.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                  {l.label} ({l.n})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {(rel.atrasados.length > 0 || rel.vencendoLogo.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Alertas de Devolução</h3>

            {rel.atrasados.length > 0 && (
              <Card className="shadow-sm border-l-4 border-l-destructive">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {rel.atrasados.length} peça(s) com devolução atrasada
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <AluguelTable itens={rel.atrasados} />
                </CardContent>
              </Card>
            )}

            {rel.vencendoLogo.length > 0 && (
              <Card className="shadow-sm border-l-4 border-l-warning">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-warning flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {rel.vencendoLogo.length} peça(s) com devolução nos próximos 3 dias
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <AluguelTable itens={rel.vencendoLogo} />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Locações Ativas Agora ({rel.alugueisAtivos.length})
          </h3>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {rel.alugueisAtivos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peça</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Devolução Prev.</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rel.alugueisAtivos.map((a) => (
                      <TableRow key={a.id} className={a.diasRestantes < 0 ? "bg-destructive/5" : a.diasRestantes <= 3 ? "bg-warning/5" : ""}>
                        <TableCell className="font-medium text-sm">{a.vestidoNome}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{a.vestidoSku ?? "—"}</TableCell>
                        <TableCell className="text-sm">{a.clienteNome}</TableCell>
                        <TableCell className="text-xs">{a.dataSaida ? new Date(a.dataSaida + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell className="text-xs">{a.dataDevolucao ? new Date(a.dataDevolucao + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell>
                          {a.diasRestantes < 0
                            ? <Badge variant="destructive" className="text-xs">{Math.abs(a.diasRestantes)} dias atrasado</Badge>
                            : a.diasRestantes === 0
                            ? <Badge variant="outline" className="text-xs border-warning text-warning">Hoje</Badge>
                            : a.diasRestantes <= 3
                            ? <Badge variant="outline" className="text-xs border-warning text-warning">{a.diasRestantes}d restantes</Badge>
                            : <Badge variant="secondary" className="text-xs">{a.diasRestantes}d restantes</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma peça em locação no momento</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Performance no Período</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatusCard label="Negócios no Período" value={rel.totalLocacoesPeriodo} color="default" />
            <StatusCard label="Receita do Período" value={formatBRL(rel.receitaPeriodo)} color="green" />
            <StatusCard label="Ticket Médio" value={formatBRL(rel.ticketMedioPeriodo)} color="default" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="font-serif text-sm">Mais Alugadas (Qtd)</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Peça</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Negócios</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rel.ranking.filter((r) => r.qtdLocacoes > 0).slice(0, 10).map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-muted-foreground text-xs w-8">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{r.sku ?? "—"}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{r.qtdLocacoes}×</TableCell>
                      </TableRow>
                    ))}
                    {rel.ranking.filter((r) => r.qtdLocacoes > 0).length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">Nenhum negócio no período</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="font-serif text-sm">Mais Rentáveis (R$)</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Peça</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">T. Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rel.rankingReceita.filter((r) => r.receitaTotal > 0).slice(0, 10).map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-muted-foreground text-xs w-8">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                        <TableCell className="text-right text-success font-semibold tabular-nums text-sm">{formatBRL(r.receitaTotal)}</TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums text-xs">{formatBRL(r.ticketMedio)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="font-serif text-sm">Acervo por Categoria</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={Object.entries(rel.porCategoria).map(([name, value]) => ({ name: CATEGORIA_LABELS[name as keyof typeof CATEGORIA_LABELS] ?? name, value }))}
                    cx="50%" cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {Object.entries(rel.porCategoria).map(([name], i) => (
                      <Cell key={name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-sm flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{rel.paradas.length}</Badge>
                Peças sem negócio no período
              </CardTitle>
              <p className="text-xs text-muted-foreground">Itens do acervo sem negócio registrado — considere verificar disponibilidade ou atualizar cadastro.</p>
            </CardHeader>
            <CardContent className="p-0 max-h-60 overflow-y-auto">
              {rel.paradas.length > 0 ? (
                <Table>
                  <TableBody>
                    {rel.paradas.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{p.nome}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.sku ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{p.statusPeca}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Todas as peças tiveram negócios no período</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OperacionalRelatorio;
