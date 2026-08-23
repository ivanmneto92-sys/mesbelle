import { useMemo } from "react";
import { SEO } from "@/components/SEO";
import { BarChart3, CalendarCheck, Store, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAgenda } from "@/hooks/useAgenda";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useDateRange } from "@/hooks/useDateRange";
import { STATUS_KANBAN, COLUNAS_KANBAN, TIPO_CONFIG } from "@/types/agenda";

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
  const { range, setRange } = useDateRange();
  const { funcionarios } = useFuncionarios();
  const nomesFuncionarias = useMemo(
    () => Object.fromEntries(funcionarios.map((f) => [f.id, f.nome])),
    [funcionarios],
  );

  // range.from/range.to são datas locais "YYYY-MM-DD" — ancoradas em início/fim
  // do dia local para casar com como o resto da Agenda constrói os limites
  // (ver CalendarioDia/Semana/Mes), evitando o deslocamento de fuso que
  // `new Date("YYYY-MM-DD")` sozinho causaria (interpretado como UTC).
  const dataInicio = new Date(`${range.from}T00:00:00`);
  const dataFim = new Date(`${range.to}T23:59:59`);
  const { data: agendamentos } = useAgenda(dataInicio, dataFim);
  const noPeriodo = useMemo(() => agendamentos ?? [], [agendamentos]);

  const chartData = useMemo(
    () => COLUNAS_KANBAN.map((status) => ({
      name: STATUS_KANBAN[status].label,
      total: noPeriodo.filter((ag) => ag.status === status).length,
    })),
    [noPeriodo],
  );

  const total = noPeriodo.length;
  const compareceram = noPeriodo.filter((ag) => ag.status === "compareceu_alugou" || ag.status === "compareceu_nao_alugou").length;
  const alugaram = noPeriodo.filter((ag) => ag.status === "compareceu_alugou").length;
  const canceladas = noPeriodo.filter((ag) => ag.status === "cancelada" || ag.status === "reagendada").length;
  const taxaComparecimento = total > 0 ? Math.round((compareceram / total) * 100) : 0;
  const taxaConversao = compareceram > 0 ? Math.round((alugaram / compareceram) * 100) : 0;

  return (
    <>
      <SEO title="Relatório de Agendamento — Comercial — Més Belle" description="Indicadores e histórico de agendamentos da Agenda." path="/comercial/relatorio-agendamento" />
      <div className="space-y-6">
        <PageHeader
          icon={BarChart3}
          title="Relatório de Agendamento"
          description="Indicadores de visitas, provas, retiradas e devoluções agendadas na Agenda"
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionária</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noPeriodo.map((ag) => {
                    const statusCfg = STATUS_KANBAN[ag.status];
                    const tipoCfg = TIPO_CONFIG[ag.tipo];
                    return (
                      <TableRow key={ag.id}>
                        <TableCell className="font-medium">{ag.clienteNome}</TableCell>
                        <TableCell>{tipoCfg?.label ?? ag.tipo}</TableCell>
                        <TableCell>
                          {new Date(ag.dataHora).toLocaleDateString("pt-BR")}
                          {" às "}
                          {new Date(ag.dataHora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell>{ag.funcionariaId ? nomesFuncionarias[ag.funcionariaId] ?? "—" : "—"}</TableCell>
                        <TableCell>
                          <Badge
                            className="border font-medium text-xs"
                            style={{ backgroundColor: statusCfg.corBg, color: statusCfg.cor, borderColor: statusCfg.cor }}
                          >
                            {statusCfg.label}
                          </Badge>
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
