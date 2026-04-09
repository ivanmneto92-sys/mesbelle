import { useState } from "react";
import { Negocio } from "@/types/comercial";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Edit, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";

interface NegociacoesTabProps {
  negocios: Negocio[];
  onUpdateNegocio: (negocioId: string, data: Partial<Negocio>) => void;
  onAprovarFechamento: (negocioId: string) => void;
  onSwitchToContratos: () => void;
}

const metodosPagamento = ["Cartão 1x", "Cartão 2x", "Cartão 3x", "Cartão 6x", "PIX", "Boleto", "Dinheiro"];

export function NegociacoesTab({ negocios, onUpdateNegocio, onAprovarFechamento, onSwitchToContratos }: NegociacoesTabProps) {
  const [editModal, setEditModal] = useState<{ open: boolean; negocio: Negocio | null }>({ open: false, negocio: null });
  const [editForm, setEditForm] = useState({ vestidoNome: "", valorNegociado: "", desconto: "", metodoPagamento: "" });

  const abertas = negocios.filter((n) => n.statusNegociacao === "aberto");
  const aprovadas = negocios.filter((n) => n.statusNegociacao === "aprovado");

  const openEdit = (n: Negocio) => {
    setEditForm({
      vestidoNome: n.vestidoNome || "",
      valorNegociado: String(n.valorNegociado || ""),
      desconto: String(n.desconto || ""),
      metodoPagamento: n.metodoPagamento || "",
    });
    setEditModal({ open: true, negocio: n });
  };

  const handleSaveEdit = () => {
    if (!editModal.negocio) return;
    onUpdateNegocio(editModal.negocio.id, {
      vestidoNome: editForm.vestidoNome,
      valorNegociado: Number(editForm.valorNegociado) || 0,
      desconto: Number(editForm.desconto) || 0,
      metodoPagamento: editForm.metodoPagamento,
    });
    toast.success("Negociação atualizada");
    setEditModal({ open: false, negocio: null });
  };

  const handleAprovar = (negocioId: string) => {
    onAprovarFechamento(negocioId);
    toast.success("Fechamento aprovado! Gere o contrato na aba Contratos.");
    onSwitchToContratos();
  };

  const renderCard = (n: Negocio) => {
    const valorFinal = n.valorNegociado - n.desconto;
    return (
      <Card key={n.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{n.clienteNome}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.vestidoNome || "Vestido não definido"}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-sm font-medium">
                  <DollarSign className="h-3.5 w-3.5 text-success" />
                  R$ {valorFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                {n.desconto > 0 && (
                  <Badge variant="outline" className="text-[10px] text-warning">
                    -R$ {n.desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </Badge>
                )}
                {n.metodoPagamento && (
                  <Badge variant="secondary" className="text-[10px]">{n.metodoPagamento}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                <Calendar className="h-2.5 w-2.5" />
                Evento: {n.dataEvento ? new Date(n.dataEvento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openEdit(n)}>
                <Edit className="h-3 w-3 mr-1" /> Editar
              </Button>
              {n.statusNegociacao === "aberto" && (
                <Button size="sm" className="text-xs h-7" onClick={() => handleAprovar(n.id)}>
                  <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Negociações Abertas ({abertas.length})
        </h3>
        <div className="space-y-2">
          {abertas.map(renderCard)}
          {abertas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma negociação aberta. Envie leads do CRM para iniciar.
            </p>
          )}
        </div>
      </div>

      {aprovadas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Aprovadas ({aprovadas.length})
          </h3>
          <div className="space-y-2">
            {aprovadas.map((n) => (
              <Card key={n.id} className="opacity-70 border-success/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <div>
                      <p className="text-sm font-medium">{n.clienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {(n.valorNegociado - n.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} • {n.metodoPagamento}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={editModal.open} onOpenChange={(o) => !o && setEditModal({ open: false, negocio: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Editar Negociação</DialogTitle>
            <DialogDescription>Ajuste os valores e condições de pagamento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <div>
              <Label>Vestido</Label>
              <Input value={editForm.vestidoNome} onChange={(e) => setEditForm({ ...editForm, vestidoNome: e.target.value })} placeholder="Nome do vestido" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" value={editForm.valorNegociado} onChange={(e) => setEditForm({ ...editForm, valorNegociado: e.target.value })} />
              </div>
              <div>
                <Label>Desconto (R$)</Label>
                <Input type="number" value={editForm.desconto} onChange={(e) => setEditForm({ ...editForm, desconto: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={editForm.metodoPagamento} onValueChange={(v) => setEditForm({ ...editForm, metodoPagamento: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {metodosPagamento.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
