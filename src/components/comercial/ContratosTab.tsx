import { useEffect, useMemo, useState } from "react";
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
import { Plus, Search, FileSignature, Eye, Printer, Link2, UserSearch } from "lucide-react";
import { Contrato, ContratoStatus, Lead, Negocio } from "@/types/comercial";
import { Vestido } from "@/types/acervo";
import { SignaturePad } from "./SignaturePad";
import { LinkAssinaturaDialog } from "./LinkAssinaturaDialog";
import { GerarContratoDoLeadDialog } from "./GerarContratoDoLeadDialog";
import { TrilhaAuditoria } from "./TrilhaAuditoria";
import { toast } from "sonner";

interface ContratosTabProps {
  contratos: Contrato[];
  // Fluxo antigo (negociação já aprovada no funil comercial) — hoje só faz
  // sentido na página do vendedor (/meu-contrato), chamada logo após uma
  // venda em /minha-venda já ter criado o negócio aprovado com peça e valor.
  negociosAprovados?: Negocio[];
  onGerarContratoFromNegocio?: (negocio: Negocio) => (Contrato | undefined) | Promise<Contrato | null | undefined>;
  // Fluxo principal (admin): gera o contrato direto do lead, escolhendo a
  // peça no Acervo e o valor na hora — não depende de nenhuma negociação
  // ter sido aprovada antes.
  leads?: Lead[];
  vestidos?: Vestido[];
  onGerarContratoDoLead?: (params: {
    leadId: string; produtoDescricao: string; valor: number; metodoPagamento: string;
    dadosComplementares?: { nome?: string; cpf?: string; telefone?: string; email?: string };
  }) => Promise<Contrato | null>;
  onUpdateStatus: (contratoId: string, status: ContratoStatus) => void;
  onAssinar: (contratoId: string, assinaturaBase64: string) => void;
  onGerarLink: (contratoId: string, validadeHoras: number) => Promise<string | null>;
  autoOpenContratoId?: string | null;
  onAutoOpenHandled?: () => void;
}

export function ContratosTab({ contratos, negociosAprovados, leads, vestidos, onGerarContratoFromNegocio, onGerarContratoDoLead, onUpdateStatus, onAssinar, onGerarLink, autoOpenContratoId, onAutoOpenHandled }: ContratosTabProps) {
  const [busca, setBusca] = useState("");
  const [novoContratoOpen, setNovoContratoOpen] = useState(false);
  const [novoDoLeadOpen, setNovoDoLeadOpen] = useState(false);
  const [selectedNegocioId, setSelectedNegocioId] = useState("");
  const [previewContrato, setPreviewContrato] = useState<Contrato | null>(null);
  const [linkContrato, setLinkContrato] = useState<Contrato | null>(null);

  const usaFluxoDoLead = !!onGerarContratoDoLead && !!leads && !!vestidos;

  const leadsSemContrato = useMemo(
    () => (leads ?? []).filter((l) => !contratos.some((c) => c.leadId === l.id && c.statusAssinatura !== "cancelado")),
    [leads, contratos]
  );

  // Auto-abre o preview quando vier um contrato recém-criado por aprovação de negociação.
  useEffect(() => {
    if (!autoOpenContratoId) return;
    const found = contratos.find((c) => c.id === autoOpenContratoId);
    if (found) {
      setPreviewContrato(found);
      onAutoOpenHandled?.();
    }
  }, [autoOpenContratoId, contratos, onAutoOpenHandled]);

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

  const negociosSemContrato = (negociosAprovados ?? []).filter(
    (n) => !contratos.some((c) => c.negocioId === n.id && c.statusAssinatura !== "cancelado")
  );

  const handleGerar = () => {
    const negocio = negociosSemContrato.find((n) => n.id === selectedNegocioId);
    if (!negocio || !onGerarContratoFromNegocio) {
      toast.error("Selecione uma negociação aprovada.");
      return;
    }
    onGerarContratoFromNegocio(negocio);
    setNovoContratoOpen(false);
    setSelectedNegocioId("");
    toast.success("Contrato gerado com sucesso!");
  };

  const handleAbrirGerar = () => {
    if (usaFluxoDoLead) setNovoDoLeadOpen(true);
    else setNovoContratoOpen(true);
  };

  const handleAssinar = (base64: string) => {
    if (!previewContrato) return;
    onAssinar(previewContrato.id, base64);
    setPreviewContrato({ ...previewContrato, statusAssinatura: "assinado", assinaturaBase64: base64, dataAssinatura: new Date().toISOString() });
    toast.success("Contrato assinado com sucesso!");
  };

  const handlePrint = (contrato: Contrato) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const esc = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    // Only accept safe data: image URIs for the signature; otherwise omit.
    const sigOk =
      typeof contrato.assinaturaBase64 === "string" &&
      /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(contrato.assinaturaBase64);
    const sigBlock = sigOk
      ? `<div class="sig"><p style="font-size:14px;font-weight:bold">Assinatura da Cliente</p><img src="${esc(contrato.assinaturaBase64)}" alt="Assinatura"/><p class="sig-date">Assinado em: ${esc(contrato.dataAssinatura ? new Date(contrato.dataAssinatura).toLocaleString("pt-BR") : "—")}</p></div>`
      : '<div class="sig"><p>Pendente de assinatura</p></div>';
    win.document.write(`<!DOCTYPE html><html><head><title>Contrato #${esc(contrato.numero)}</title>
      <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#333}
      h1{text-align:center;color:#5A0019;font-size:20px}
      .info{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
      .info div{font-size:14px}.label{color:#888;font-size:12px}
      .terms{background:#f9f9f9;padding:20px;border-radius:8px;white-space:pre-wrap;font-size:14px;line-height:1.6;margin:20px 0}
      .sig{text-align:center;margin-top:30px;padding:20px;border-top:1px solid #ddd}
      .sig img{max-width:300px;max-height:150px}
      .sig-date{font-size:12px;color:#888;margin-top:8px}
      @media print{body{margin:20px}}</style></head><body>
      <h1>CONTRATO #${esc(contrato.numero)}</h1>
      <h2 style="text-align:center;font-size:14px;color:#5A0019">Més Belle Ateliê</h2>
      <div class="info">
        <div><span class="label">Cliente</span><br><strong>${esc(contrato.nomeCliente)}</strong></div>
        <div><span class="label">CPF</span><br><strong>${esc(contrato.cpfCliente)}</strong></div>
        <div><span class="label">Data do Evento</span><br><strong>${esc(new Date(contrato.dataEvento + "T00:00:00").toLocaleDateString("pt-BR"))}</strong></div>
        <div><span class="label">Valor Total</span><br><strong>R$ ${esc(contrato.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 }))}</strong></div>
      </div>
      <div class="terms">${esc(contrato.termosTexto)}</div>
      ${sigBlock}
      </body></html>`);
    win.document.close();
    win.print();
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
                <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, CPF ou nº" className="pl-8 w-[250px]" />
              </div>
              <Button size="sm" onClick={handleAbrirGerar}>
                {usaFluxoDoLead ? <UserSearch className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />} Gerar Contrato
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
                    <TableCell>{new Date(c.dataEvento + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => handlePrint(c)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        {c.statusAssinatura === "pendente" && (
                          <>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => setLinkContrato(c)}>
                              <Link2 className="h-4 w-4" /> Enviar link
                            </Button>
                            <Button size="sm" onClick={() => setPreviewContrato(c)}>
                              <FileSignature className="h-4 w-4 mr-1" /> Assinar no iPad
                            </Button>
                          </>
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

      <Dialog open={!usaFluxoDoLead && novoContratoOpen} onOpenChange={setNovoContratoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Gerar Novo Contrato</DialogTitle>
            <DialogDescription>Selecione uma negociação aprovada para gerar o contrato.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Negociação Aprovada</Label>
              <Select value={selectedNegocioId} onValueChange={setSelectedNegocioId}>
                <SelectTrigger><SelectValue placeholder="Selecione a negociação" /></SelectTrigger>
                <SelectContent>
                  {negociosSemContrato.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.clienteNome} — R$ {(n.valorNegociado - n.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {negociosSemContrato.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">Nenhuma negociação aprovada sem contrato.</p>
              )}
            </div>
            <Button onClick={handleGerar} className="w-full" disabled={negociosSemContrato.length === 0}>
              Gerar Contrato
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                    <p className="font-medium">{new Date(previewContrato.dataEvento + "T00:00:00").toLocaleDateString("pt-BR")}</p>
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

                <TrilhaAuditoria contrato={previewContrato} />

                <Separator />


                {previewContrato.statusAssinatura === "pendente" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Assinatura da Cliente</p>
                    <SignaturePad onConfirm={handleAssinar} />
                  </div>
                )}

                {previewContrato.statusAssinatura === "assinado" && (
                  <div className="space-y-3">
                    <Badge className="bg-success/20 text-success border-success/30 border text-sm py-1 px-3">
                      ✓ Contrato Assinado
                    </Badge>
                    {previewContrato.assinaturaBase64 && (
                      <div className="border rounded-xl p-4 bg-white">
                        <p className="text-xs text-muted-foreground mb-2">Assinatura</p>
                        <img src={previewContrato.assinaturaBase64} alt="Assinatura da cliente" className="max-h-[120px] mx-auto" />
                        {previewContrato.dataAssinatura && (
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Assinado em: {new Date(previewContrato.dataAssinatura).toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handlePrint(previewContrato)}>
                      <Printer className="h-4 w-4 mr-1" /> Imprimir / Baixar
                    </Button>
                  </div>
                )}
              </div>

      <LinkAssinaturaDialog
        open={!!linkContrato}
        onOpenChange={(o) => !o && setLinkContrato(null)}
        contrato={linkContrato}
        onGerar={onGerarLink}
      />
    </>
          )}
        </SheetContent>
      </Sheet>

      {usaFluxoDoLead && (
        <GerarContratoDoLeadDialog
          open={novoDoLeadOpen}
          onOpenChange={setNovoDoLeadOpen}
          leads={leadsSemContrato}
          vestidos={vestidos ?? []}
          onGerar={onGerarContratoDoLead!}
        />
      )}
    </>
  );
}
