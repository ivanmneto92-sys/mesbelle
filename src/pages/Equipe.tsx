import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from "recharts";
import { QrCode, Star, Phone, Mail, Percent } from "lucide-react";
import { useEquipe } from "@/hooks/useEquipe";
import { toast } from "sonner";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const vendedorColors: Record<string, string> = {
  "Juliana Costa": "hsl(343, 100%, 18%)",
  "Mariana Silva": "hsl(40, 90%, 50%)",
  "Renata Dias": "hsl(210, 70%, 50%)",
};

const Equipe = () => {
  const { funcionarios, updateFuncionario, chartData, vendedores, historicoVendas } = useEquipe();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [editComissao, setEditComissao] = useState("");

  const selected = funcionarios.find(f => f.id === selectedId);

  const openProfile = (id: string) => {
    const func = funcionarios.find(f => f.id === id);
    setSelectedId(id);
    setEditComissao(func ? String(func.percentualComissao * 100) : "");
    setSheetOpen(true);
  };

  const saveComissao = () => {
    if (!selectedId) return;
    const val = parseFloat(editComissao.replace(",", "."));
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Percentual inválido");
      return;
    }
    updateFuncionario(selectedId, { percentualComissao: val / 100 });
    toast.success("Comissão atualizada");
  };

  const historico = selectedId ? historicoVendas(selectedId) : [];
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif">Time & Performance</h1>
          <p className="text-muted-foreground text-sm">Gestão de equipe e desempenho</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
          <QrCode className="h-4 w-4 mr-1" /> QR Code Avaliação
        </Button>
      </div>

      {/* Tabela Equipe */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="font-serif text-lg">Equipe</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead className="text-right">Vendas (mês)</TableHead>
                  <TableHead className="text-right">Comissão Acum.</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((f) => (
                  <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openProfile(f.id)}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="text-sm">{f.cargo}</TableCell>
                    <TableCell><Badge variant="outline">{f.tipoContrato}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{f.vendasMes}</TableCell>
                    <TableCell className="text-right tabular-nums text-success font-medium">{formatBRL(f.comissao)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                        <span className="text-sm font-medium">{f.score > 0 ? f.score.toFixed(1) : "—"}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico Combo */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Performance Comercial: Volume × Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" fontSize={12} />
                  <YAxis yAxisId="left" fontSize={12} label={{ value: "Vendas", angle: -90, position: "insideLeft", fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} fontSize={12} label={{ value: "Score", angle: 90, position: "insideRight", fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm space-y-1">
                          <p className="font-semibold">{label}</p>
                          {payload.map((p, i) => {
                            if (String(p.dataKey) === "scoreGlobal") {
                              return (
                                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                                  <span>⭐ Score Geral:</span>
                                  <span className="font-medium">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm" style={{ background: p.color }} />
                                <span>{p.name}:</span>
                                <span className="font-medium">{p.value} vestidos</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  {vendedores.map((v) => (
                    <Bar
                      key={v.id}
                      yAxisId="left"
                      dataKey={v.nome}
                      name={v.nome}
                      fill={vendedorColors[v.nome] || "hsl(var(--primary))"}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="scoreGlobal"
                    name="Score Geral"
                    stroke="hsl(var(--warning))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(var(--warning))" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sheet Perfil Funcionário */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-serif">{selected.nome}</SheetTitle>
                <SheetDescription>{selected.cargo} • {selected.tipoContrato}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Contato */}
                <div className="space-y-2 p-4 rounded-lg border">
                  <h4 className="text-sm font-semibold">Contato</h4>
                  {selected.telefone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {selected.telefone}
                    </div>
                  )}
                  {selected.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {selected.email}
                    </div>
                  )}
                </div>

                {/* Resumo Mês */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Vendas</p>
                    <p className="text-lg font-bold">{selected.vendasMes}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Comissão</p>
                    <p className="text-lg font-bold text-success">{formatBRL(selected.comissao)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <p className="text-lg font-bold">{selected.score > 0 ? selected.score.toFixed(1) : "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Editar Comissão */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Percent className="h-3.5 w-3.5" /> Percentual de Comissão</Label>
                  <div className="flex gap-2">
                    <Input value={editComissao} onChange={e => setEditComissao(e.target.value)} placeholder="5" className="text-right" />
                    <span className="flex items-center text-sm text-muted-foreground">%</span>
                    <Button size="sm" onClick={saveComissao}>Salvar</Button>
                  </div>
                </div>

                {/* Histórico */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Histórico de Vendas</h4>
                  <div className="space-y-1.5">
                    {historico.length === 0 && <p className="text-xs text-muted-foreground">Sem histórico</p>}
                    {historico.map((h) => (
                      <div key={h.mes} className="flex items-center justify-between p-2.5 rounded-lg border text-sm">
                        <span className="text-muted-foreground">{meses[parseInt(h.mes.split("-")[1]) - 1]}/{h.mes.split("-")[0]}</span>
                        <span>{h.quantidade} vendas</span>
                        <span className="text-success font-medium">{formatBRL(h.valorTotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal QR Code */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader><DialogTitle className="font-serif">QR Code de Avaliação</DialogTitle></DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="mx-auto w-48 h-48 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent("https://mesbelle.lovable.app/avaliacao")}`}
                alt="QR Code Avaliação"
                className="w-44 h-44 rounded-lg"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Mostre este QR Code para a cliente após o atendimento.
              Ela poderá avaliar a vendedora de 1 a 5 estrelas.
            </p>
            <Button variant="outline" className="w-full" onClick={() => {
              window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent("https://mesbelle.lovable.app/avaliacao")}`, "_blank");
            }}>
              Baixar QR Code (alta resolução)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipe;
