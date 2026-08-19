import { useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeftRight, Plus, Upload, ArrowDownCircle, ArrowUpCircle, Wallet, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFinanceiro } from "@/hooks/useFinanceiro";
import { useDateRange } from "@/hooks/useDateRange";
import { useLeads } from "@/hooks/useLeads";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Transacao } from "@/types/financeiro";
import { transacaoSchema, firstZodError } from "@/lib/schemas";
import { formatBRL, categoriaLabel } from "@/lib/formatters";
import { TransacaoDialog, type TransacaoFormValue } from "@/components/financeiro/TransacaoDialog";
import { ImportarTransacoesDialog } from "@/components/financeiro/ImportarTransacoesDialog";

const SaldoCard = ({ label, value, color, icon: Icon, highlight }: {
  label: string; value: number; color: "green" | "red"; icon: typeof Wallet; highlight?: boolean;
}) => (
  <Card className={`shadow-sm ${highlight ? "border-primary/30" : ""}`}>
    <CardContent className="pt-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={`h-4 w-4 ${color === "green" ? "text-success" : "text-destructive"}`} />
        {label}
      </div>
      <p className={`text-2xl font-bold mt-1 ${color === "green" ? "text-success" : "text-destructive"}`}>{formatBRL(value)}</p>
    </CardContent>
  </Card>
);

function fluxoPorSemana(transacoes: Transacao[]) {
  const map: Record<string, { semana: string; entradas: number; saidas: number }> = {};
  transacoes.forEach((t) => {
    const d = new Date(t.data + "T00:00:00");
    const inicio = new Date(d);
    inicio.setDate(d.getDate() - d.getDay());
    const key = inicio.toISOString().split("T")[0];
    if (!map[key]) map[key] = { semana: `${String(inicio.getDate()).padStart(2, "0")}/${String(inicio.getMonth() + 1).padStart(2, "0")}`, entradas: 0, saidas: 0 };
    if (t.tipo === "entrada") map[key].entradas += t.valor;
    else map[key].saidas += t.valor;
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

const FinanceiroFluxo = () => {
  const { range, setRange } = useDateRange();
  const { transacoes, criar, criarMuitas, atualizar, deletar } = useFinanceiro(range);
  const { leads } = useLeads();

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Transacao | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const totalEntradas = transacoes.filter((t) => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const totalSaidas = transacoes.filter((t) => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const chartData = useMemo(() => fluxoPorSemana(transacoes), [transacoes]);

  const handleSalvar = (form: TransacaoFormValue) => {
    const valor = parseFloat(form.valor.replace(",", "."));
    const candidate = {
      tipo: form.tipo,
      data: form.data,
      descricao: form.descricao,
      categoria: form.categoria,
      valor: Number.isNaN(valor) ? 0 : valor,
      status: "pago" as const,
    };
    const parsed = transacaoSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(firstZodError(parsed.error));
      return;
    }
    const payload: Omit<Transacao, "id"> = {
      tipo: parsed.data.tipo,
      data: parsed.data.data,
      descricao: parsed.data.descricao,
      categoria: parsed.data.categoria,
      valor: parsed.data.valor,
      status: parsed.data.status,
      tipoCusto: form.tipoCusto,
      leadId: form.leadId,
      observacoes: form.observacoes || null,
    };
    if (editando) atualizar.mutate({ id: editando.id, ...payload });
    else criar.mutate(payload);
    setFormOpen(false);
  };

  return (
    <>
      <SEO title="Entradas & Saídas — Més Belle" description="Fluxo de caixa do período." path="/financeiro/fluxo" />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader icon={ArrowLeftRight} title="Entradas & Saídas" description="Fluxo de caixa do período" />
          <div className="flex gap-2 items-center flex-wrap">
            <DateRangePicker value={range} onChange={setRange} />
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" /> Importar OFX/CSV
            </Button>
            <Button onClick={() => { setEditando(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nova Transação
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SaldoCard label="Total de Entradas" value={totalEntradas} color="green" icon={ArrowDownCircle} />
          <SaldoCard label="Total de Saídas" value={totalSaidas} color="red" icon={ArrowUpCircle} />
          <SaldoCard label="Saldo do Período" value={saldo} color={saldo >= 0 ? "green" : "red"} icon={Wallet} highlight />
        </div>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="font-serif text-base">Entradas vs Saídas por Semana</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="font-serif text-base">Transações</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo Custo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoes.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium text-sm">{t.descricao}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{categoriaLabel(t.categoria)}</Badge></TableCell>
                    <TableCell>
                      {t.tipo === "saida" && t.tipoCusto && (
                        <Badge variant={t.tipoCusto === "fixo" ? "secondary" : "outline"} className="text-xs">
                          {t.tipoCusto === "fixo" ? "Fixo" : "Variável"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${t.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                      {t.tipo === "entrada" ? "+" : "-"}{formatBRL(t.valor)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditando(t); setFormOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deletar.mutate(t.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {transacoes.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma transação no período</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TransacaoDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        transacao={editando}
        leads={leads}
        onSalvar={handleSalvar}
      />

      <ImportarTransacoesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportar={(itens) => criarMuitas.mutateAsync(itens)}
      />
    </>
  );
};

export default FinanceiroFluxo;
