import { useState } from "react";
import { CategoriaPeca, CATEGORIA_LABELS, Vestido, VestidoStatus, STATUS_LABELS } from "@/types/acervo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

interface Props {
  vestido: Vestido;
  open: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<Vestido>) => void;
  onDelete: () => void;
}

export function VestidoDetailModal({ vestido, open, onClose, onUpdate, onDelete }: Props) {
  const [nome, setNome] = useState(vestido.nome);
  const [categoriaPeca, setCategoriaPeca] = useState<CategoriaPeca>(vestido.categoriaPeca);
  const [cor, setCor] = useState(vestido.cor);
  const [tamanho, setTamanho] = useState(vestido.tamanho);
  const [comprimento, setComprimento] = useState(vestido.comprimento);
  const [precoAluguel, setPrecoAluguel] = useState(String(vestido.precoAluguel));
  const [precoVenda, setPrecoVenda] = useState(String(vestido.precoVenda));
  const [descricao, setDescricao] = useState(vestido.descricao ?? "");
  const [status, setStatus] = useState<VestidoStatus>(vestido.status);
  const [imagemUrl, setImagemUrl] = useState(vestido.imagemUrl);

  const handleSave = () => {
    onUpdate({
      nome, categoriaPeca, cor, tamanho, comprimento, status, imagemUrl,
      precoAluguel: Number(precoAluguel) || 0,
      precoVenda: Number(precoVenda) || 0,
      descricao: descricao || null,
    });
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagemUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Detalhes do Vestido</DialogTitle>
          {vestido.sku && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">{vestido.sku}</Badge>
              <span className="text-xs text-muted-foreground">SKU da peça</span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            <img src={imagemUrl} alt={nome} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Trocar Foto</Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={categoriaPeca} onValueChange={(v) => setCategoriaPeca(v as CategoriaPeca)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_LABELS) as CategoriaPeca[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cor</Label>
              <Input value={cor} onChange={(e) => setCor(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tamanho</Label>
              <Select value={tamanho} onValueChange={setTamanho}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PP", "P", "M", "G", "GG", "XG"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Comprimento</Label>
              <Select value={comprimento} onValueChange={setComprimento}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Curto", "Midi", "Longo"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as VestidoStatus)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as VestidoStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Preço Aluguel (R$)</Label>
              <Input type="number" value={precoAluguel} onChange={(e) => setPrecoAluguel(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Preço Venda (R$)</Label>
              <Input type="number" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="mt-1" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">Salvar</Button>
            <Button variant="destructive" size="icon" onClick={() => { onDelete(); onClose(); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
