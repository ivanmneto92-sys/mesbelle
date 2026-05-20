import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DollarSign, TrendingUp, Briefcase, PieChart, Plus, Trash2, CalendarIcon, ShieldCheck, ShieldOff } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSocios } from "@/hooks/useSocios";
import { CategoriaAtivo } from "@/types/socios";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const categoriasAtivo: CategoriaAtivo[] = ["Vestido", "Imobilizado", "Equipamento"];

const Socios = () => {
  const {
    ativos, socios, distribuicao, multiplicador, updateMultiplicador,
    addAtivo, removeAtivo, toggleSocioAtivo, updateSocioExpiracao,
    totalPatrimonio, valuation, receitaMes, ebitda,
  } = useSocios();

  const [multInput, setMultInput] = useState(String(multiplicador));
  const [addOpen, setAddOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoCat, setNovoCat] = useState<CategoriaAtivo>("Vestido");
  const [novoValor, setNovoValor] = useState("");
  const [novoDesagio, setNovoDesagio] = useState("");
  const [novoData, setNovoData] = useState<Date | undefined>(new Date());

  const handleMultChange = (val: string) => {
    setMultInput(val);
    const num = parseFloat(val.replace(",", ".").replace("x", ""));
    if (!isNaN(num) && num > 0) updateMultiplicador(num);
  };

  const handleAddAtivo = () => {
    const valor = parseFloat(novoValor.replace(/[^\d.,]/g, "").replace(",", "."));
    const desagio = parseFloat(novoDesagio.replace(",", "."));
    if (!novoNome || !valor || isNaN(desagio) || !novoData) {
      toast.error("Preencha todos os campos");
      return;
    }
    addAtivo({
      nome: novoNome,
      categoria: novoCat,
      dataCompra: format(novoData, "yyyy-MM-dd"),
      valorOriginal: valor,
      percentualDesagio: desagio,
    });
    toast.success("Ativo adicionado");
    setAddOpen(false);
    setNovoNome("");
    setNovoValor("");
    setNovoDesagio("");
  };

  return (
    <>
    <SEO title="Portal de Sócios — Més Belle" description="Indicadores e relatórios para sócios do ateliê Més Belle." path="/socios" />
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Portal de Sócios"
        description="Visão macro, valuation e distribuição de lucros"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 text-success" />Receita Mensal
            </div>
            <p className="text-xl font-bold mt-1">{formatBRL(receitaMes)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />EBITDA Anual
            </div>
            <p className="text-xl font-bold mt-1">{formatBRL(ebitda)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4 text-warning" />Patrimônio
            </div>
            <p className="text-xl font-bold mt-1">{formatBRL(totalPatrimonio)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PieChart className="h-4 w-4 text-info" />Valuation
            </div>
            <p className="text-xl font-bold mt-1 transition-all duration-300">{formatBRL(valuation)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Patrimônio & Valuation */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center justify-between flex-wrap gap-3">
            <span>Patrimônio & Valuation</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-normal">
                <span className="text-muted-foreground">Multiplicador EBITDA:</span>
                <Input
                  className="w-20 h-8 text-center text-sm"
                  value={multInput}
                  onChange={e => handleMultChange(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Ativo
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Valor Original</TableHead>
                  <TableHead>Deságio</TableHead>
                  <TableHead className="text-right">Valor Atual</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ativos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{a.nome}</span>
                        <Badge variant="outline" className="ml-2 text-[10px]">{a.categoria}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(a.valorOriginal)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.percentualDesagio}%</Badge></TableCell>
                    <TableCell className="text-right tabular-nums font-bold">{formatBRL(a.valorAtual)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{a.idade}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAtivo(a.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {ativos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum ativo cadastrado</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground mr-3">Total Patrimônio:</span>
            <span className="font-bold">{formatBRL(totalPatrimonio)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição de Lucros */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="font-serif text-lg">Distribuição de Lucros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {distribuicao.map((s) => (
              <div key={s.id} className="p-5 border rounded-xl text-center space-y-2">
                <p className="font-semibold text-lg">{s.nome}</p>
                <p className="text-xs text-muted-foreground">Participação: {s.percentualParticipacao}%</p>
                <p className={`text-2xl font-bold transition-all duration-300 ${s.lucroMensal >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatBRL(s.lucroMensal)}
                </p>
                <p className="text-xs text-muted-foreground">Lucro mensal</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestão de Sócios */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="font-serif text-lg">Gestão de Acesso dos Sócios</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {socios.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  {s.ativo ? (
                    <ShieldCheck className="h-5 w-5 text-success" />
                  ) : (
                    <ShieldOff className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">{s.nome}</p>
                    <p className="text-xs text-muted-foreground">{s.percentualParticipacao}% de participação</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Expira em:</p>
                    <Input
                      type="date"
                      className="h-7 text-xs w-36"
                      value={s.dataExpiracao || ""}
                      onChange={e => updateSocioExpiracao(s.id, e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.ativo ? "Ativo" : "Bloqueado"}</span>
                    <Switch checked={s.ativo} onCheckedChange={() => toggleSocioAtivo(s.id)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal Adicionar Ativo */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Adicionar Ativo</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome do Ativo</Label>
              <Input className="mt-1" placeholder="Ex: Máquina de Costura" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={novoCat} onValueChange={v => setNovoCat(v as CategoriaAtivo)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoriasAtivo.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Compra</Label>
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Original (R$)</Label>
                <Input className="mt-1 text-right" placeholder="0,00" value={novoValor} onChange={e => setNovoValor(e.target.value)} />
              </div>
              <div>
                <Label>Deságio (%)</Label>
                <Input className="mt-1 text-right" placeholder="20" value={novoDesagio} onChange={e => setNovoDesagio(e.target.value)} />
              </div>
            </div>
            <Button className="w-full" onClick={handleAddAtivo}>Salvar Ativo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default Socios;
