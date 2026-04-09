import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, FileSignature, Eye } from "lucide-react";
import { Contrato, ContratoStatus, Lead } from "@/types/comercial";
import { toast } from "sonner";

interface ContratosTabProps {
  contratos: Contrato[];
  leadsParaContrato: Lead[];
  onGerarContrato: (lead: Lead, valor: number) => void;
  onUpdateStatus: (contratoId: string, status: ContratoStatus) => void;
}

export function ContratosTab({ contratos, leadsParaContrato, onGerarContrato, onUpdateStatus }: ContratosTabProps) {
  const [busca, setBusca] = useState("");
  const [novoContratoOpen, setNovoContratoOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [valor, setValor] = useState("");
  const [previewContrato, setPreviewContrato] = useState<Contrato | null>(null);

  const filtered = contratos.filter((c) =>
    c.nomeCliente.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpfCliente.includes(busca) ||
    c.numero.includes(busca)
  );

  const statusColors: Record<ContratoStatus, string> = {
    pendente: "bg-warning/20 text-warning border-warning/30",
    assinado: "bg-success/20 text-success border-success/30",
    cancelado: "bg-destructive/20 text-destructive border-destructive/30",
  };

  const statusLabels: Record<ContratoStatus, string> = {
    pendente: "Pendente",
    assinado: "Assinado",
    cancelado: "Cancelado",
  };

  const handleGerar = () => {
    const lead = leadsParaContrato.find((l) => l.id === selectedLeadId);
    if (!lead || !valor) {
      toast.error("Selecione um lead e informe o valor.");
      return;
    }
    onGerarContrato(lead, parseFloat(valor));
    setNovoContratoOpen(false);
    setSelectedLeadId("");
    setValor("");
    toast.success("Contrato gerado com sucesso!");
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="font-serif text-lg">Contratos</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, CPF ou nº"
                  className="pl-8 w-[250px]"
                />
              </div>
              <Button size="sm" onClick={() => setNovoContratoOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Gerar Contrato
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum contrato encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data do Evento</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">#{c.numero}</TableCell>
                    <TableCell className="font-medium">{c.nomeCliente}</TableCell>
                    <TableCell>{new Date(c.dataEvento).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>R$ {c.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[c.statusAssinatura]} border text-xs`}>
                        {statusLabels[c.statusAssinatura]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewContrato(c)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {c.statusAssinatura === "pendente" && (
                          <Button size="sm" variant="outline" onClick={() => onUpdateStatus(c.id, "assinado")}>
                            <FileSignature className="h-4 w-4 mr-1" /> Assinar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Gerar contrato dialog */}
      <Dialog open={novoContratoOpen} onOpenChange={setNovoContratoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Gerar Novo Contrato</DialogTitle>
            <DialogDescription>Selecione a cliente e informe o valor do contrato.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Cliente (Leads em Fechamento)</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger><SelectValue placeholder="Selecione a cliente" /></SelectTrigger>
                <SelectContent>
                  {leadsParaContrato.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.nome} — {l.tipoEvento}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Total (R$)</Label>
              <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
            <Button onClick={handleGerar} className="w-full">Gerar Contrato</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview contrato */}
      <Sheet open={!!previewContrato} onOpenChange={() => setPreviewContrato(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {previewContrato && (
            <>
              <SheetHeader>
                <SheetTitle className="font-serif">Contrato #{previewContrato.numero}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Cliente</p>
                    <p className="font-medium">{previewContrato.nomeCliente}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">CPF</p>
                    <p className="font-medium">{previewContrato.cpfCliente}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Data do Evento</p>
                    <p className="font-medium">{new Date(previewContrato.dataEvento).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Valor Total</p>
                    <p className="font-medium">R$ {previewContrato.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <Separator />
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{previewContrato.termosTexto}</pre>
                </div>
                <Separator />
                {previewContrato.statusAssinatura === "pendente" && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
                      <FileSignature className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">Área de assinatura digital</p>
                      <p className="text-xs text-muted-foreground/60">Preparado para uso com iPad</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        onUpdateStatus(previewContrato.id, "assinado");
                        setPreviewContrato({ ...previewContrato, statusAssinatura: "assinado" });
                        toast.success("Contrato assinado!");
                      }}
                    >
                      <FileSignature className="h-4 w-4 mr-1" /> Confirmar Assinatura
                    </Button>
                  </div>
                )}
                {previewContrato.statusAssinatura === "assinado" && (
                  <Badge className="bg-success/20 text-success border-success/30 border text-sm py-1 px-3">
                    ✓ Contrato Assinado
                  </Badge>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
