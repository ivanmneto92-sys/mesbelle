import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, Briefcase, PieChart } from "lucide-react";

const ativos = [
  { nome: "Vestido Sereia Bordado", valorOriginal: "R$ 4.800", deprec: "20%", valorAtual: "R$ 3.840", idade: "6 meses" },
  { nome: "Vestido Princesa Tule", valorOriginal: "R$ 3.500", deprec: "30%", valorAtual: "R$ 2.450", idade: "1 ano" },
  { nome: "Vestido Midi Crepe", valorOriginal: "R$ 2.200", deprec: "15%", valorAtual: "R$ 1.870", idade: "3 meses" },
  { nome: "Móveis da Loja", valorOriginal: "R$ 25.000", deprec: "40%", valorAtual: "R$ 15.000", idade: "2 anos" },
  { nome: "Equipamentos Costura", valorOriginal: "R$ 8.000", deprec: "25%", valorAtual: "R$ 6.000", idade: "1 ano" },
];

const totalAtivos = 29160;
const ebitdaAnual = 108000;

const Socios = () => {
  const multiplicador = 3.5;
  const valuation = ebitdaAnual * multiplicador;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Portal de Sócios</h1>
        <p className="text-muted-foreground text-sm">Visão macro e indicadores executivos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm"><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4 text-success" />Receita Mensal</div>
          <p className="text-xl font-bold mt-1">R$ 29.000</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4 text-primary" />EBITDA Anual</div>
          <p className="text-xl font-bold mt-1">R$ {ebitdaAnual.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Briefcase className="h-4 w-4 text-gold" />Patrimônio</div>
          <p className="text-xl font-bold mt-1">R$ {totalAtivos.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><PieChart className="h-4 w-4 text-info" />Valuation</div>
          <p className="text-xl font-bold mt-1">R$ {valuation.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center justify-between">
            Patrimônio & Valuation
            <div className="flex items-center gap-2 text-sm font-normal">
              <span className="text-muted-foreground">Multiplicador EBITDA:</span>
              <Input className="w-16 h-8 text-center text-sm" defaultValue="3.5x" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Valor Original</TableHead>
                <TableHead>Deságio</TableHead>
                <TableHead>Valor Atual</TableHead>
                <TableHead>Idade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ativos.map((a) => (
                <TableRow key={a.nome}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell>{a.valorOriginal}</TableCell>
                  <TableCell><Badge variant="outline">{a.deprec}</Badge></TableCell>
                  <TableCell className="font-medium">{a.valorAtual}</TableCell>
                  <TableCell className="text-muted-foreground">{a.idade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle className="font-serif text-lg">Distribuição de Lucros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { socio: "Ricardo Almeida", participacao: "50%", valor: "R$ 4.500" },
              { socio: "Carolina Mendes", participacao: "30%", valor: "R$ 2.700" },
              { socio: "André Pereira", participacao: "20%", valor: "R$ 1.800" },
            ].map((s) => (
              <div key={s.socio} className="p-4 border rounded-lg text-center">
                <p className="font-medium">{s.socio}</p>
                <p className="text-xs text-muted-foreground mt-1">Participação: {s.participacao}</p>
                <p className="text-lg font-bold text-success mt-2">{s.valor}</p>
                <p className="text-xs text-muted-foreground">Lucro mensal</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Socios;
