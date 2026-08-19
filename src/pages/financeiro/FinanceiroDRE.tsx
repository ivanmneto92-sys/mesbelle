import { TrendingUp } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFinanceiro } from "@/hooks/useFinanceiro";
import { useDateRange } from "@/hooks/useDateRange";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Transacao, CATEGORIAS_VARIAVEIS, CATEGORIAS_FIXAS } from "@/types/financeiro";
import { formatBRL, categoriaLabel } from "@/lib/formatters";

function agruparPorCategoria(ts: Transacao[]) {
  const map: Record<string, number> = {};
  ts.forEach((t) => { map[t.categoria] = (map[t.categoria] ?? 0) + t.valor; });
  return Object.entries(map).map(([categoria, total]) => ({ categoria, total })).sort((a, b) => b.total - a.total);
}

const FinanceiroDRE = () => {
  const { range, setRange } = useDateRange();
  const { transacoes } = useFinanceiro(range);

  const receitaBruta = transacoes.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);

  const deducoes = transacoes
    .filter((t) => t.tipo === "saida" && t.categoria === "imposto")
    .reduce((s, t) => s + t.valor, 0);

  const receitaLiquida = receitaBruta - deducoes;

  const custosVariaveis = transacoes
    .filter((t) => t.tipo === "saida" && (t.tipoCusto === "variavel" || CATEGORIAS_VARIAVEIS.includes(t.categoria)))
    .filter((t) => t.categoria !== "imposto")
    .reduce((s, t) => s + t.valor, 0);

  const margemContribuicao = receitaLiquida - custosVariaveis;
  const percMC = receitaLiquida > 0 ? (margemContribuicao / receitaLiquida) * 100 : 0;

  const custosFixos = transacoes
    .filter((t) => t.tipo === "saida" && (t.tipoCusto === "fixo" || CATEGORIAS_FIXAS.includes(t.categoria)))
    .reduce((s, t) => s + t.valor, 0);

  const resultadoLiq = margemContribuicao - custosFixos;
  const margemLiq = receitaBruta > 0 ? (resultadoLiq / receitaBruta) * 100 : 0;

  const cvPorCategoria = agruparPorCategoria(
    transacoes.filter((t) => t.tipo === "saida" && (t.tipoCusto === "variavel" || CATEGORIAS_VARIAVEIS.includes(t.categoria)) && t.categoria !== "imposto")
  );
  const cfPorCategoria = agruparPorCategoria(
    transacoes.filter((t) => t.tipo === "saida" && (t.tipoCusto === "fixo" || CATEGORIAS_FIXAS.includes(t.categoria)))
  );

  const waterfall = [
    { name: "Receita Bruta", value: receitaBruta, fill: "hsl(var(--primary))" },
    { name: "Deduções", value: -deducoes, fill: "hsl(var(--destructive))" },
    { name: "Custos Variáveis", value: -custosVariaveis, fill: "hsl(var(--warning))" },
    { name: "Custos Fixos", value: -custosFixos, fill: "hsl(var(--warning))" },
    { name: "Resultado", value: resultadoLiq, fill: resultadoLiq >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))" },
  ];

  return (
    <>
      <SEO title="DRE — Més Belle" description="Demonstrativo de resultado do período." path="/financeiro/dre" />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader icon={TrendingUp} title="DRE — Demonstrativo de Resultado" description="Resultado financeiro do período selecionado" />
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <DRESectionHeader label="RECEITA" />
                <DRERow label="(+) Receita Bruta" value={receitaBruta} highlight />
                <DRERow label="(-) Deduções / Impostos s/ Receita" value={-deducoes} negative />
                <DRERow label="(=) Receita Líquida" value={receitaLiquida} total />

                <DRESectionHeader label="CUSTOS VARIÁVEIS" />
                {cvPorCategoria.map((c) => (
                  <DRERow key={c.categoria} label={categoriaLabel(c.categoria)} value={-c.total} negative indent />
                ))}
                <DRERow label="(-) Total Custos Variáveis" value={-custosVariaveis} negative />
                <DRERow
                  label={`(=) Margem de Contribuição (${percMC.toFixed(1)}%)`}
                  value={margemContribuicao}
                  total
                  colorClass={margemContribuicao >= 0 ? "text-success" : "text-destructive"}
                />

                <DRESectionHeader label="CUSTOS FIXOS" />
                {cfPorCategoria.map((c) => (
                  <DRERow key={c.categoria} label={categoriaLabel(c.categoria)} value={-c.total} negative indent />
                ))}
                <DRERow label="(-) Total Custos Fixos" value={-custosFixos} negative />

                <DRESectionHeader label="RESULTADO" />
                <DRERow
                  label={`(=) RESULTADO OPERACIONAL (margem ${margemLiq.toFixed(1)}%)`}
                  value={resultadoLiq}
                  total
                  highlight
                  colorClass={resultadoLiq >= 0 ? "text-success font-bold" : "text-destructive font-bold"}
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="font-serif text-base">Composição do Resultado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={waterfall}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfall.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

const DRESectionHeader = ({ label }: { label: string }) => (
  <TableRow className="bg-muted/40">
    <TableCell colSpan={2} className="py-2 px-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
      {label}
    </TableCell>
  </TableRow>
);

interface DRERowProps {
  label: string;
  value: number;
  highlight?: boolean;
  total?: boolean;
  negative?: boolean;
  indent?: boolean;
  colorClass?: string;
}

const DRERow = ({ label, value, highlight, total, negative, indent, colorClass }: DRERowProps) => (
  <TableRow className={total ? "border-t-2 bg-muted/20" : ""}>
    <TableCell className={`py-2.5 px-4 text-sm ${indent ? "pl-8 text-muted-foreground" : ""} ${total ? "font-semibold" : ""}`}>
      {label}
    </TableCell>
    <TableCell className={`py-2.5 px-4 text-sm text-right tabular-nums ${colorClass ?? (negative ? "text-destructive" : highlight ? "text-primary" : "")} ${total ? "font-semibold" : ""}`}>
      {formatBRL(value)}
    </TableCell>
  </TableRow>
);

export default FinanceiroDRE;
