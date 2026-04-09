import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lead, Contrato, Negocio, CRM_KANBAN_COLUMNS } from "@/types/comercial";
import { Users, TrendingUp, UserX, DollarSign, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface MetricasTabProps {
  leads: Lead[];
  contratos: Contrato[];
  negocios: Negocio[];
}

export function MetricasTab({ leads, contratos, negocios }: MetricasTabProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Faturamento = soma dos contratos assinados no mês
  const contratosAssinados = contratos.filter((c) => {
    if (c.statusAssinatura !== "assinado") return false;
    const d = new Date(c.dataCriacao);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const faturamento = contratosAssinados.reduce((sum, c) => sum + c.valorTotal, 0);

  // Conversão = contratos fechados / total leads
  const totalLeads = leads.length;
  const totalContratos = contratos.filter((c) => c.statusAssinatura === "assinado").length;
  const taxaConversao = totalLeads > 0 ? ((totalContratos / totalLeads) * 100).toFixed(1) : "0";

  // Ticket médio
  const allAssinados = contratos.filter((c) => c.statusAssinatura === "assinado");
  const ticketMedio = allAssinados.length > 0 ? allAssinados.reduce((s, c) => s + c.valorTotal, 0) / allAssinados.length : 0;

  // No-show
  const noShows = leads.filter((l) => l.statusFunil === "no_show").length;
  const taxaNoShow = totalLeads > 0 ? ((noShows / totalLeads) * 100).toFixed(1) : "0";

  // Ranking vendedoras
  const vendedoraMap = new Map<string, number>();
  contratos.filter((c) => c.statusAssinatura === "assinado").forEach((c) => {
    const lead = leads.find((l) => l.id === c.leadId);
    const vendedora = lead?.vendedorResponsavel || "Não atribuído";
    vendedoraMap.set(vendedora, (vendedoraMap.get(vendedora) || 0) + c.valorTotal);
  });
  const ranking = [...vendedoraMap.entries()]
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  // Funnel data
  const funnelData = CRM_KANBAN_COLUMNS.map((col) => ({
    name: col.title,
    value: leads.filter((l) => l.statusFunil === col.id).length,
  }));
  const barColors = ["hsl(210,80%,55%)", "hsl(40,55%,50%)", "hsl(350,57%,27%)", "hsl(0,84%,60%)"];

  const kpis = [
    { label: "Faturamento do Mês", value: `R$ ${faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-success" },
    { label: "Taxa de Conversão", value: `${taxaConversao}%`, icon: TrendingUp, color: "text-info" },
    { label: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: Users, color: "text-primary" },
    { label: "Taxa de No-Show", value: `${taxaNoShow}%`, icon: UserX, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda registrada</p>
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
