import { PieChart, UserPlus, CalendarCheck2, Users, TrendingUp, Receipt, Landmark } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart as RePieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useFinanceiro } from "@/hooks/useFinanceiro";
import { useDateRange, DateRange } from "@/hooks/useDateRange";
import { useLeads } from "@/hooks/useLeads";
import { Transacao } from "@/types/financeiro";
import { formatBRL, categoriaLabel } from "@/lib/formatters";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--accent-foreground))"];

function calcularVolumeMedioMensal(transacoes: Transacao[], range: DateRange): number {
  const from = new Date(range.from + "T00:00:00");
  const to = new Date(range.to + "T00:00:00");
  const meses = Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const receita = transacoes.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  return receita / meses;
}

const KpiFinCard = ({ label, value, sub, icon: Icon, trend }: {
  label: string; value: string; sub: string; icon: typeof PieChart; trend?: "good" | "bad" | "neutral";
}) => (
  <Card className="shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={`text-xl font-bold mt-1 tabular-nums ${trend === "good" ? "text-success" : trend === "bad" ? "text-destructive" : ""}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{sub}</p>
        </div>
        <div className={`p-2 rounded-lg shrink-0 ${trend === "good" ? "bg-success/10 text-success" : trend === "bad" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const FinanceiroRelatorios = () => {
  const { range, setRange } = useDateRange();
  const { transacoes } = useFinanceiro(range);
  const { leads, negocios } = useLeads();

  const leadsNoPeriodo = leads.filter((l) => l.criadoEm && l.criadoEm >= range.from && l.criadoEm <= range.to);
  const agendamentosNoPeriodo = leads.filter((l) => l.provaData && l.provaData >= range.from && l.provaData <= range.to);
  const negociosAprovados = negocios.filter((n) => n.statusNegociacao === "aprovado" && n.criadoEm >= range.from && n.criadoEm <= range.to);

  const receitaTotal = transacoes.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const gastoMarketing = transacoes.filter((t) => t.tipo === "saida" && t.categoria === "marketing").reduce((s, t) => s + t.valor, 0);
  const impostosETaxas = transacoes.filter((t) => t.tipo === "saida" && t.categoria === "imposto").reduce((s, t) => s + t.valor, 0);

  const totalLeads = leadsNoPeriodo.length;
  const totalAgendamentos = agendamentosNoPeriodo.length;
  const totalClientes = negociosAprovados.length;

  const cac = totalClientes > 0 ? gastoMarketing / totalClientes : 0;
  const custoAgendamento = totalAgendamentos > 0 ? gastoMarketing / totalAgendamentos : 0;
  const custoLead = totalLeads > 0 ? gastoMarketing / totalLeads : 0;
  const ticketMedio = totalClientes > 0 ? receitaTotal / totalClientes : 0;
  const volumeMedioMensal = calcularVolumeMedioMensal(transacoes, range);
  const percImpostos = receitaTotal > 0 ? (impostosETaxas / receitaTotal) * 100 : 0;

  const despesasPorCategoria = (() => {
    const map: Record<string, number> = {};
    transacoes.filter((t) => t.tipo === "saida").forEach((t) => { map[t.categoria] = (map[t.categoria] ?? 0) + t.valor; });
    return Object.entries(map).map(([categoria, value]) => ({ name: categoriaLabel(categoria), value })).sort((a, b) => b.value - a.value);
  })();

  const marketingVsReceitaMensal = (() => {
    const map: Record<string, { mes: string; marketing: number; receita: number }> = {};
    transacoes.forEach((t) => {
      const mes = t.data.slice(0, 7);
      if (!map[mes]) map[mes] = { mes, marketing: 0, receita: 0 };
      if (t.tipo === "entrada") map[mes].receita += t.valor;
      if (t.tipo === "saida" && t.categoria === "marketing") map[mes].marketing += t.valor;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  })();

  const impostosDetalhe = transacoes.filter((t) => t.tipo === "saida" && t.categoria === "imposto");

  return (
    <>
      <SEO title="Relatórios Financeiros — Més Belle" description="KPIs de aquisição, eficiência e rentabilidade." path="/financeiro/relatorios" />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader icon={PieChart} title="Relatórios Financeiros" description="KPIs de aquisição, eficiência e rentabilidade" />
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiFinCard label="CAC — Custo de Aquisição" value={formatBRL(cac)} sub="Gasto marketing ÷ novos clientes" icon={UserPlus} trend={cac < 300 ? "good" : "bad"} />
          <KpiFinCard label="Custo por Agendamento" value={formatBRL(custoAgendamento)} sub="Marketing ÷ agendamentos realizados" icon={CalendarCheck2} trend={custoAgendamento < 150 ? "good" : "bad"} />
          <KpiFinCard label="Custo por Lead" value={formatBRL(custoLead)} sub="Marketing ÷ leads captados" icon={Users} trend={custoLead < 50 ? "good" : "bad"} />
          <KpiFinCard label="Volume Médio Mensal" value={formatBRL(volumeMedioMensal)} sub="Receita total ÷ meses no período" icon={TrendingUp} />
          <KpiFinCard label="Ticket Médio" value={formatBRL(ticketMedio)} sub="Receita ÷ negócios aprovados" icon={Receipt} />
          <KpiFinCard label="Impostos & Taxas" value={`${percImpostos.toFixed(1)}%`} sub={`${formatBRL(impostosETaxas)} sobre receita de ${formatBRL(receitaTotal)}`} icon={Landmark} trend={percImpostos > 15 ? "bad" : "neutral"} />
        </div>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="font-serif text-base">Marketing vs Receita por Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={marketingVsReceitaMensal}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Legend />
                <Bar dataKey="receita" name="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="marketing" name="Marketing" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="font-serif text-base">Despesas por Categoria</CardTitle></CardHeader>
            <CardContent>
              {despesasPorCategoria.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma despesa no período</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <RePieChart>
                    <Pie data={despesasPorCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(d) => d.name}>
                      {despesasPorCategoria.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="font-serif text-base">Impostos & Taxas no Período</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {impostosDetalhe.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.descricao}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right text-destructive font-medium tabular-nums">{formatBRL(t.valor)}</TableCell>
                    </TableRow>
                  ))}
                  {impostosDetalhe.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhum imposto lançado no período</TableCell></TableRow>
                  )}
                  <TableRow className="bg-muted/30 font-semibold border-t-2">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right text-destructive tabular-nums">{formatBRL(impostosETaxas)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FinanceiroRelatorios;
