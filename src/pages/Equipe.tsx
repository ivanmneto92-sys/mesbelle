import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { QrCode, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const equipe = [
  { nome: "Juliana Costa", cargo: "Vendedora", contrato: "CLT", comissao: "R$ 2.340", vendas: 12, score: 4.8 },
  { nome: "Mariana Silva", cargo: "Vendedora", contrato: "CLT", comissao: "R$ 1.890", vendas: 9, score: 4.5 },
  { nome: "Beatriz Oliveira", cargo: "Costureira", contrato: "PJ", comissao: "R$ 1.200", vendas: 0, score: 4.9 },
  { nome: "Renata Dias", cargo: "Atendente", contrato: "CLT", comissao: "R$ 780", vendas: 5, score: 4.2 },
];

const vendasPorVendedor = [
  { mes: "Jan", Juliana: 10, Mariana: 8, Renata: 4 },
  { mes: "Fev", Juliana: 12, Mariana: 7, Renata: 5 },
  { mes: "Mar", Juliana: 14, Mariana: 10, Renata: 6 },
  { mes: "Abr", Juliana: 12, Mariana: 9, Renata: 5 },
];

const Equipe = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold font-serif">Time & Performance</h1>
        <p className="text-muted-foreground text-sm">Gestão de equipe e desempenho</p>
      </div>
      <Button variant="outline" size="sm"><QrCode className="h-4 w-4 mr-1" /> QR Code Avaliação</Button>
    </div>

    <Card className="shadow-sm">
      <CardHeader><CardTitle className="font-serif text-lg">Equipe</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Vendas (mês)</TableHead>
              <TableHead>Comissão Acum.</TableHead>
              <TableHead>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipe.map((e) => (
              <TableRow key={e.nome}>
                <TableCell className="font-medium">{e.nome}</TableCell>
                <TableCell>{e.cargo}</TableCell>
                <TableCell><Badge variant="outline">{e.contrato}</Badge></TableCell>
                <TableCell>{e.vendas}</TableCell>
                <TableCell className="text-success font-medium">{e.comissao}</TableCell>
                <TableCell><div className="flex items-center gap-1"><Star className="h-3 w-3 text-warning fill-warning" />{e.score}</div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Card className="shadow-sm">
      <CardHeader><CardTitle className="font-serif text-lg">Vendas por Vendedor (Mensal)</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={vendasPorVendedor}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Juliana" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Mariana" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Renata" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

export default Equipe;
