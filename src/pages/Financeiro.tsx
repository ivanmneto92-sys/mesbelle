import { useState, useRef, useCallback } from "react";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Upload, DollarSign, ArrowUpRight, ArrowDownRight, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useFinanceiro } from "@/hooks/useFinanceiro";
import { CategoriaTransacao, TipoTransacao, Transacao } from "@/types/financeiro";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

const categorias: CategoriaTransacao[] = ["Aluguel", "Venda", "Material", "Pessoal", "Fixo", "Variável", "Marketing", "Imposto", "Outros"];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

// OFX parser (simplified)
function parseOFX(text: string): Omit<Transacao, "id">[] {
  const items: Omit<Transacao, "id">[] = [];
  const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = new RegExp(`<${tag}>([^<\\n]+)`, "i").exec(block);
      return m ? m[1].trim() : "";
    };
    const amount = parseFloat(get("TRNAMT")) || 0;
    const rawDate = get("DTPOSTED");
    const dateStr = rawDate.length >= 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : new Date().toISOString().split("T")[0];
    items.push({
      tipo: amount >= 0 ? "entrada" : "saida",
      data: dateStr,
      descricao: get("MEMO") || get("NAME") || "Importado",
      categoria: "Outros",
      valor: Math.abs(amount),
      status: "pago",
    });
  }
  return items;
}

function parseCSV(text: string): Omit<Transacao, "id">[] {
  const lines = text.trim().split("\n").slice(1); // skip header
  return lines.map(line => {
    const parts = line.split(/[;,]/);
    const valor = parseFloat((parts[3] || parts[2] || "0").replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
    return {
      tipo: (valor >= 0 ? "entrada" : "saida") as TipoTransacao,
      data: parts[0]?.trim().split("/").reverse().join("-") || new Date().toISOString().split("T")[0],
      descricao: parts[1]?.trim() || "Importado",
      categoria: "Outros" as CategoriaTransacao,
      valor: Math.abs(valor),
      status: "pago" as const,
    };
  }).filter(t => t.valor > 0);
}

const Financeiro = () => {
  const { transacoes, addTransacao, addMany, removeTransacao, resumoMes, gastosPorCategoria, dreData, impostos, updateImpostos } = useFinanceiro();

  // Modal novo lançamento
  const [novoOpen, setNovoOpen] = useState(false);
  const [novoTipo, setNovoTipo] = useState<TipoTransacao>("entrada");
  const [novoData, setNovoData] = useState<Date | undefined>(new Date());
  const [novoDesc, setNovoDesc] = useState("");
  const [novoCat, setNovoCat] = useState<CategoriaTransacao>("Aluguel");
  const [novoValor, setNovoValor] = useState("");

  // Modal importar
  const [importOpen, setImportOpen] = useState(false);
  const [importItems, setImportItems] = useState<Omit<Transacao, "id">[]>([]);
  const [importStep, setImportStep] = useState<"upload" | "review">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  // Impostos local
  const [impLocal, setImpLocal] = useState(impostos);

  const handleSaveNovo = () => {
    const valor = parseFloat(novoValor.replace(/[^\d.,]/g, "").replace(",", "."));
    if (!valor || !novoDesc || !novoData) {
      toast.error("Preencha todos os campos");
      return;
    }
    addTransacao({
      tipo: novoTipo,
      data: format(novoData, "yyyy-MM-dd"),
      descricao: novoDesc,
      categoria: novoCat,
      valor,
      status: "pago",
    });
    toast.success("Lançamento salvo");
    setNovoOpen(false);
    setNovoDesc("");
    setNovoValor("");
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const ext = file.name.toLowerCase();
      let parsed: Omit<Transacao, "id">[] = [];
      if (ext.endsWith(".ofx") || ext.endsWith(".ofc")) {
        parsed = parseOFX(text);
      } else {
        parsed = parseCSV(text);
      }
      if (parsed.length === 0) {
        toast.error("Nenhuma transação encontrada no arquivo");
        return;
      }
      setImportItems(parsed);
      setImportStep("review");
    };
    reader.readAsText(file);
  }, []);

  const handleConfirmImport = () => {
    addMany(importItems);
    toast.success(`${importItems.length} transações importadas`);
    setImportOpen(false);
    setImportStep("upload");
    setImportItems([]);
  };

  const updateImportCategory = (index: number, cat: CategoriaTransacao) => {
    setImportItems(prev => prev.map((item, i) => i === index ? { ...item, categoria: cat } : item));
  };

  return (
    <>
    <SEO title="Financeiro — Més Belle" description="Receitas, despesas e fluxo de caixa do ateliê." path="/financeiro" />
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif">Financeiro & Controladoria</h1>
          <p className="text-muted-foreground text-sm">Gestão de caixa e lucro — sem API bancária</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Lançamento
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setImportOpen(true); setImportStep("upload"); }}>
            <Upload className="h-4 w-4 mr-1" /> Importar OFX/CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpRight className="h-4 w-4 text-success" />Receitas (mês)
            </div>
            <p className="text-2xl font-bold mt-1">{formatBRL(resumoMes.receitas)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowDownRight className="h-4 w-4 text-destructive" />Despesas (mês)
            </div>
            <p className="text-2xl font-bold mt-1">{formatBRL(resumoMes.despesas)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 text-primary" />Lucro Líquido
            </div>
            <p className={`text-2xl font-bold mt-1 ${resumoMes.lucro >= 0 ? "text-success" : "text-destructive"}`}>
              {formatBRL(resumoMes.lucro)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fluxo">
        <TabsList>
          <TabsTrigger value="fluxo">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="dre">DRE & Relatórios</TabsTrigger>
          <TabsTrigger value="impostos">Impostos & Taxas</TabsTrigger>
        </TabsList>

        {/* Fluxo de Caixa */}
        <TabsContent value="fluxo" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-28">Categoria</TableHead>
                      <TableHead className="text-right w-36">Valor</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoes.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{formatDateBR(t.data)}</TableCell>
                        <TableCell className="text-sm">{t.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{t.categoria}</Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${t.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                          {t.tipo === "entrada" ? "+" : "−"} {formatBRL(t.valor)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeTransacao(t.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {transacoes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma transação registrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DRE */}
        <TabsContent value="dre" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base font-serif">Receita vs Despesa</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base font-serif">Gastos por Categoria</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={gastosPorCategoria} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="cat" type="category" fontSize={12} width={80} />
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                    <Bar dataKey="valor" name="Valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* DRE table */}
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base font-serif">DRE Simplificado</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Despesa</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dreData.map((d) => {
                      const margem = d.receita > 0 ? ((d.lucro / d.receita) * 100) : 0;
                      return (
                        <TableRow key={d.mes}>
                          <TableCell className="font-medium">{d.mes}</TableCell>
                          <TableCell className="text-right tabular-nums text-success">{formatBRL(d.receita)}</TableCell>
                          <TableCell className="text-right tabular-nums text-destructive">{formatBRL(d.despesa)}</TableCell>
                          <TableCell className={`text-right tabular-nums font-medium ${d.lucro >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatBRL(d.lucro)}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${margem >= 0 ? "text-success" : "text-destructive"}`}>
                            {margem.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impostos & Taxas */}
        <TabsContent value="impostos" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg font-serif">Impostos & Taxas de Cartão</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Alíquotas de Impostos</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Simples Nacional</span>
                    <Input className="w-20 text-right" value={`${impLocal.simplesNacional}%`}
                      onChange={e => setImpLocal(prev => ({ ...prev, simplesNacional: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">ISS</span>
                    <Input className="w-20 text-right" value={`${impLocal.iss}%`}
                      onChange={e => setImpLocal(prev => ({ ...prev, iss: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Taxas de Cartão</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Débito</span>
                    <Input className="w-20 text-right" value={`${impLocal.debito}%`}
                      onChange={e => setImpLocal(prev => ({ ...prev, debito: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Crédito à Vista</span>
                    <Input className="w-20 text-right" value={`${impLocal.creditoVista}%`}
                      onChange={e => setImpLocal(prev => ({ ...prev, creditoVista: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Crédito Parcelado</span>
                    <Input className="w-20 text-right" value={`${impLocal.creditoParcelado}%`}
                      onChange={e => setImpLocal(prev => ({ ...prev, creditoParcelado: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-lg border bg-muted/30">
                <h4 className="text-sm font-semibold mb-2">Simulação sobre Receita do Mês ({formatBRL(resumoMes.receitas)})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Simples Nacional:</span>
                    <p className="font-medium text-destructive">{formatBRL(resumoMes.receitas * impLocal.simplesNacional / 100)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ISS:</span>
                    <p className="font-medium text-destructive">{formatBRL(resumoMes.receitas * impLocal.iss / 100)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taxa Crédito:</span>
                    <p className="font-medium text-destructive">{formatBRL(resumoMes.receitas * impLocal.creditoVista / 100)}</p>
                  </div>
                </div>
              </div>
              <Button className="mt-4" onClick={() => { updateImpostos(impLocal); toast.success("Configurações salvas"); }}>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Novo Lançamento */}
      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Novo Lançamento</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex gap-2">
              <Button variant={novoTipo === "entrada" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setNovoTipo("entrada")}>
                Receita (Entrada)
              </Button>
              <Button variant={novoTipo === "saida" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setNovoTipo("saida")}>
                Despesa (Saída)
              </Button>
            </div>

            <div>
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !novoData && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {novoData ? format(novoData, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={novoData} onSelect={setNovoData} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input className="mt-1" placeholder="Ex: Aluguel — Ana Beatriz" value={novoDesc} onChange={e => setNovoDesc(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={novoCat} onValueChange={v => setNovoCat(v as CategoriaTransacao)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input className="mt-1 text-right" placeholder="0,00" value={novoValor} onChange={e => setNovoValor(e.target.value)} />
              </div>
            </div>

            <Button className="w-full" onClick={handleSaveNovo}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Importar OFX/CSV */}
      <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) { setImportStep("upload"); setImportItems([]); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-serif">Importar OFX/CSV</DialogTitle></DialogHeader>

          {importStep === "upload" && (
            <div className="mt-4">
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && fileRef.current) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileRef.current.files = dt.files;
                    fileRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">Formatos aceitos: .ofx, .csv</p>
              </div>
              <input ref={fileRef} type="file" accept=".ofx,.ofc,.csv" className="hidden" onChange={handleFileUpload} />
            </div>
          )}

          {importStep === "review" && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{importItems.length} transações encontradas. Categorize antes de importar:</p>
              <div className="max-h-80 overflow-y-auto border rounded-lg">
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
                    {importItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{formatDateBR(item.data)}</TableCell>
                        <TableCell className="text-sm max-w-48 truncate">{item.descricao}</TableCell>
                        <TableCell>
                          <Select value={item.categoria} onValueChange={v => updateImportCategory(i, v as CategoriaTransacao)}>
                            <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${item.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                          {item.tipo === "entrada" ? "+" : "−"} {formatBRL(item.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button className="w-full" onClick={handleConfirmImport}>
                Confirmar Importação ({importItems.length} itens)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default Financeiro;
