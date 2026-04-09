import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lead, KANBAN_COLUMNS } from "@/types/comercial";
import { Contrato } from "@/types/comercial";
import { Users, TrendingUp, UserX, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface MetricasTabProps {
  leads: Lead[];
  contratos: Contrato[];
}

export function MetricasTab({ leads, contratos }: MetricasTabProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const leadsDoMes = leads.filter((l) => {
    const d = new Date(l.criadoEm);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalLeads = leads.length;
  const fechados = leads.filter((l) => l.statusFunil === "fechamento").length;
  const taxaConversao = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : "0";

  const provasAgendadas = leads.filter((l) => ["prova", "negociacao", "fechamento"].includes(l.statusFunil)).length;
  const perdidos = leads.filter((l) => l.statusFunil === "perdido").length;
  const taxaNoShow = provasAgendadas + perdidos > 0 ? ((perdidos / (provasAgendadas + perdidos)) * 100).toFixed(1) : "0";

  const totalValor = contratos.reduce((sum, c) => sum + c.valorTotal, 0);
  const ticketMedio = contratos.length > 0 ? totalValor / contratos.length : 0;

  const funnelData = KANBAN_COLUMNS.map((col) => ({
    name: col.title,
    value: leads.filter((l) => l.statusFunil === col.id).length,
  }));

  const barColors = ["hsl(210,80%,55%)", "hsl(40,55%,50%)", "hsl(350,57%,27%)", "hsl(38,92%,50%)", "hsl(142,71%,45%)", "hsl(0,84%,60%)"];

  const kpis = [
    { label: "Leads no Mês", value: leadsDoMes.length, icon: Users, color: "text-info" },
    { label: "Taxa de Conversão", value: `${taxaConversao}%`, icon: TrendingUp, color: "text-success" },
    { label: "Taxa de No-Show", value: `${taxaNoShow}%`, icon: UserX, color: "text-destructive" },
    { label: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-gold" },
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

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Funil de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
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
    </div>
  );
}
