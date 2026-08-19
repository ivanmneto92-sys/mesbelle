import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lead, Contrato, Negocio, CRM_KANBAN_COLUMNS } from "@/types/comercial";
import { Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DateRange } from "@/hooks/useDateRange";

interface MetricasTabProps {
  leads: Lead[];
  contratos: Contrato[];
  negocios: Negocio[];
  range: DateRange;
}

export function MetricasTab({ leads, contratos, range }: MetricasTabProps) {
  const leadsNoPeriodo = useMemo(
    () => leads.filter((l) => l.criadoEm >= range.from && l.criadoEm <= range.to),
    [leads, range]
  );
  const contratosNoPeriodo = useMemo(
    () => contratos.filter((c) => c.dataCriacao >= range.from && c.dataCriacao <= range.to),
    [contratos, range]
  );

  // Ranking vendedoras — contratos assinados no período
  const ranking = useMemo(() => {
    const vendedoraMap = new Map<string, number>();
    contratosNoPeriodo.filter((c) => c.statusAssinatura === "assinado").forEach((c) => {
      const lead = leads.find((l) => l.id === c.leadId);
      const vendedora = lead?.vendedorResponsavel || "Não atribuído";
      vendedoraMap.set(vendedora, (vendedoraMap.get(vendedora) || 0) + c.valorTotal);
    });
    return [...vendedoraMap.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [contratosNoPeriodo, leads]);

  // Funil CRM — leads criados no período
  const funnelData = useMemo(
    () => CRM_KANBAN_COLUMNS.map((col) => ({
      name: col.title,
      value: leadsNoPeriodo.filter((l) => l.statusFunil === col.id).length,
    })),
    [leadsNoPeriodo]
  );
  const barColors = ["hsl(210,80%,55%)", "hsl(40,55%,50%)", "hsl(350,57%,27%)", "hsl(0,84%,60%)"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Funil CRM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [`${value} leads`, "Quantidade"]} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-warning" /> Ranking de Vendedoras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda registrada no período</p>
            ) : (
              <div className="space-y-3">
                {ranking.map((r, i) => (
                  <div key={r.nome} className="flex items-center gap-3">
                    <span className={`text-lg font-bold w-8 text-center ${i === 0 ? "text-warning" : "text-muted-foreground"}`}>
                      {i + 1}º
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.nome}</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${(r.valor / (ranking[0]?.valor || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">
                      R$ {r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
