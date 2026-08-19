import { useMemo } from "react";
import { SEO } from "@/components/SEO";
import { BarChart3, CalendarCheck, Store, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useDateRange } from "@/hooks/useDateRange";
import { AGENDAMENTO_KANBAN_COLUMNS } from "@/types/comercial";

function KpiTile({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-xl p-4 border bg-card border-border-subtle shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

const ComercialRelatorioAgendamento = () => {
  const { agendamentos } = useAgendamentos();
  const { range, setRange } = useDateRange();

  const noPeriodo = useMemo(
    () => agendamentos.filter((l) => l.provaData && l.provaData >= range.from && l.provaData <= range.to),
    [agendamentos, range]
  );

  const chartData = useMemo(
    () => AGENDAMENTO_KANBAN_COLUMNS.map((col) => ({
      name: col.title,
      total: noPeriodo.filter((l) => l.statusFunil === col.id).length,
    })),
    [noPeriodo]
  );

  const total = noPeriodo.length;
  const compareceram = noPeriodo.filter((l) => l.statusFunil === "compareceu_alugou" || l.statusFunil === "compareceu_nao_alugou").length;
  const alugaram = noPeriodo.filter((l) => l.statusFunil === "compareceu_alugou").length;
  const canceladas = noPeriodo.filter((l) => l.statusFunil === "cancelada" || l.statusFunil === "reagendada").length;
  const taxaComparecimento = total > 0 ? Math.round((compareceram / total) * 100) : 0;
  const taxaConversao = compareceram > 0 ? Math.round((alugaram / compareceram) * 100) : 0;

  const statusMeta = (status: string) => AGENDAMENTO_KANBAN_COLUMNS.find((c) => c.id === status);

  return (
    <>
      <SEO title="Relatório de Agendamento — Comercial — Més Belle" description="Indicadores e histórico de agendamentos comerciais." path="/comercial/relatorio-agendamento" />
      <div className="space-y-6">
        <PageHeader
          icon={BarChart3}
          title="Relatório de Agendamento"
          description="Indicadores de visitas agendadas, comparecimento e conversão"
          actions={<DateRangePicker value={range} onChange={setRange} />}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiTile label="Agendamentos" value={String(total)} icon={CalendarCheck} sub="no período" />
          <KpiTile label="Compareceram" value={String(compareceram)} icon={Store} sub={`${taxaComparecimento}% de comparecimento`} />
          <KpiTile label="Alugaram" value={String(alugaram)} icon={CalendarCheck} sub={`${taxaConversao}% conversão`} />
          <KpiTile label="Canceladas/Reagendadas" value={String(canceladas)} icon={XCircle} />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Agendamentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Agendamentos no Período</CardTitle>
          </CardHeader>
          <CardContent>
            {noPeriodo.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento no período selecionado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noPeriodo.map((l) => {
                    const meta = statusMeta(l.statusFunil);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.nome}</TableCell>
                        <TableCell>
                          {l.provaData ? new Date(l.provaData + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                          {l.provaHora ? ` às ${l.provaHora}` : ""}
                        </TableCell>
                        <TableCell>{l.vendedorResponsavel || "—"}</TableCell>
                        <TableCell>
                          {meta && <Badge className={`${meta.colorClass} border font-medium text-xs`}>{meta.title}</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ComercialRelatorioAgendamento;
