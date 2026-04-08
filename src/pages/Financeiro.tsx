import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const fluxoCaixa = [
  { id: "1", data: "08/04", desc: "Aluguel — Ana Beatriz", cat: "Receita", valor: "R$ 1.200,00", tipo: "entrada" },
  { id: "2", data: "07/04", desc: "Tecido fornecedor", cat: "Material", valor: "R$ 850,00", tipo: "saida" },
  { id: "3", data: "07/04", desc: "Aluguel — Camila Rocha", cat: "Receita", valor: "R$ 980,00", tipo: "entrada" },
  { id: "4", data: "06/04", desc: "Energia elétrica", cat: "Fixo", valor: "R$ 420,00", tipo: "saida" },
  { id: "5", data: "06/04", desc: "Venda — Patrícia Nunes", cat: "Receita", valor: "R$ 4.800,00", tipo: "entrada" },
  { id: "6", data: "05/04", desc: "Comissão vendedora", cat: "Pessoal", valor: "R$ 480,00", tipo: "saida" },
  { id: "7", data: "05/04", desc: "Aluguel loja", cat: "Fixo", valor: "R$ 3.500,00", tipo: "saida" },
];

const dreData = [
  { mes: "Jan", receita: 28000, despesa: 19500, previsao: 30000 },
  { mes: "Fev", receita: 32000, despesa: 21000, previsao: 30000 },
  { mes: "Mar", receita: 35000, despesa: 22500, previsao: 32000 },
  { mes: "Abr", receita: 29000, despesa: 20000, previsao: 33000 },
];

const gastosCat = [
  { cat: "Material", valor: 8500 },
  { cat: "Pessoal", valor: 12000 },
  { cat: "Fixo", valor: 7200 },
  { cat: "Marketing", valor: 3500 },
  { cat: "Outros", valor: 1800 },
];

const Financeiro = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Financeiro & Controladoria</h1>
          <p className="text-muted-foreground text-sm">Gestão de caixa e lucro — sem API bancária</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Lançamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-serif">Novo Lançamento</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Select><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="entrada">Receita</SelectItem><SelectItem value="saida">Despesa</SelectItem></SelectContent></Select>
                <Input placeholder="Valor (R$)" />
                <Input type="date" />
                <Select><SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="material">Material</SelectItem><SelectItem value="pessoal">Pessoal</SelectItem><SelectItem value="fixo">Fixo</SelectItem><SelectItem value="marketing">Marketing</SelectItem></SelectContent></Select>
                <Input placeholder="Descrição" className="col-span-2" />
                <div className="col-span-2"><label className="text-sm text-muted-foreground">Comprovante</label><Input type="file" className="mt-1" /></div>
                <Button className="col-span-2">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Importar OFX/CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm"><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpRight className="h-4 w-4 text-success" />Receitas (mês)</div>
          <p className="text-2xl font-bold mt-1">R$ 29.000</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowDownRight className="h-4 w-4 text-destructive" />Despesas (mês)</div>
          <p className="text-2xl font-bold mt-1">R$ 20.000</p>
        </CardContent></Card>
        <Card className="shadow-sm"><CardContent className="pt-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4 text-primary" />Lucro Líquido</div>
          <p className="text-2xl font-bold mt-1 text-success">R$ 9.000</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="fluxo">
        <TabsList>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="dre">DRE & Relatórios</TabsTrigger>
          <TabsTrigger value="impostos">Impostos & Taxas</TabsTrigger>
        </TabsList>

        <TabsContent value="fluxo" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fluxoCaixa.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{l.data}</TableCell>
                      <TableCell className="text-sm">{l.desc}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{l.cat}</Badge></TableCell>
                      <TableCell className={`text-right font-medium ${l.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                        {l.tipo === "entrada" ? "+" : "−"} {l.valor}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dre" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base font-serif">Receita vs Despesa vs Previsão</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="previsao" name="Previsão" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base font-serif">Gastos por Categoria</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={gastosCat} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis dataKey="cat" type="category" fontSize={12} width={80} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                    <Bar dataKey="valor" name="Valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="impostos" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg font-serif">Impostos & Taxas de Cartão</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Alíquotas de Impostos</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Simples Nacional</span><Input className="w-20 text-right" defaultValue="6%" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">ISS</span><Input className="w-20 text-right" defaultValue="5%" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Taxas de Cartão</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Débito</span><Input className="w-20 text-right" defaultValue="1.5%" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Crédito à Vista</span><Input className="w-20 text-right" defaultValue="3.2%" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Crédito Parcelado</span><Input className="w-20 text-right" defaultValue="4.8%" />
                  </div>
                </div>
              </div>
              <Button className="mt-4">Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financeiro;
