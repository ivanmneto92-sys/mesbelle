import { useState } from "react";
import { CategoriaPeca, CATEGORIA_LABELS, Vestido, VestidoStatus, STATUS_LABELS } from "@/types/acervo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useVestidoSituacao } from "@/hooks/useVestidoSituacao";
import { VestidoSituacaoAtual } from "./VestidoSituacaoAtual";

const MAX_FOTOS = 10;

interface Props {
  vestido: Vestido;
  open: boolean;
  canManage: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<Vestido>) => void;
  onDelete: () => void;
}

export function VestidoDetailModal({ vestido, open, canManage, onClose, onUpdate, onDelete }: Props) {
  const [nome, setNome] = useState(vestido.nome);
  const [categoriaPeca, setCategoriaPeca] = useState<CategoriaPeca>(vestido.categoriaPeca);
  const [cor, setCor] = useState(vestido.cor);
  const [tamanho, setTamanho] = useState(vestido.tamanho);
  const [comprimento, setComprimento] = useState(vestido.comprimento);
  const [precoAluguel, setPrecoAluguel] = useState(vestido.precoAluguel);
  const [precoVenda, setPrecoVenda] = useState(vestido.precoVenda);
  const [descricao, setDescricao] = useState(vestido.descricao ?? "");
  const [status, setStatus] = useState<VestidoStatus>(vestido.status);
  const [imagens, setImagens] = useState<string[]>(vestido.imagensUrls.length > 0 ? vestido.imagensUrls : (vestido.imagemUrl ? [vestido.imagemUrl] : []));
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const { situacao, loading: loadingSituacao } = useVestidoSituacao(open ? vestido.id : null);

  const handleSave = () => {
    onUpdate({
      nome, categoriaPeca, cor, tamanho, comprimento, status,
      imagensUrls: imagens,
      imagemUrl: imagens[0] || "/placeholder.svg",
      precoAluguel,
      precoVenda,
      descricao: descricao || null,
    });
    onClose();
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (imagens.length + files.length > MAX_FOTOS) {
      toast.error(`Máximo de ${MAX_FOTOS} fotos por peça`);
      return;
    }
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" é muito grande (máx. 5MB)`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" não é uma imagem`);
        return;
      }
    }
    const novas = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
    setImagens((prev) => [...prev, ...novas]);
  };

  const removeImagem = (idx: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== idx));
    setFotoAtiva((prev) => (idx <= prev ? Math.max(0, prev - 1) : prev));
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
          <VestidoSituacaoAtual situacao={situacao} loading={loadingSituacao} />

          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            <img src={imagens[fotoAtiva] || "/placeholder.svg"} alt={nome} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Fotos ({imagens.length}/{MAX_FOTOS}) — clique para ampliar</Label>
            {imagens.length > 0 && (
              <div className="mt-1 grid grid-cols-4 gap-2">
                {imagens.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setFotoAtiva(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-muted group ${idx === fotoAtiva ? "ring-2 ring-primary" : ""}`}
                  >
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    {canManage && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); removeImagem(idx); }}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-background/90 rounded px-1 py-0.5">Capa</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {canManage && (
              <Input
                type="file" accept="image/*" multiple
                onChange={handleImagesUpload} className="mt-2"
                disabled={imagens.length >= MAX_FOTOS}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" disabled={!canManage} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={categoriaPeca} onValueChange={(v) => setCategoriaPeca(v as CategoriaPeca)} disabled={!canManage}>
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
              <Input value={cor} onChange={(e) => setCor(e.target.value)} className="mt-1" disabled={!canManage} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tamanho</Label>
              <Select value={tamanho} onValueChange={setTamanho} disabled={!canManage}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PP", "P", "M", "G", "GG", "XG"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Comprimento</Label>
              <Select value={comprimento} onValueChange={setComprimento} disabled={!canManage}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Curto", "Midi", "Longo"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as VestidoStatus)} disabled={!canManage}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as VestidoStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Preço Aluguel</Label>
              <CurrencyInput value={precoAluguel} onChange={setPrecoAluguel} className="mt-1" disabled={!canManage} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Preço Venda</Label>
              <CurrencyInput value={precoVenda} onChange={setPrecoVenda} className="mt-1" disabled={!canManage} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="mt-1" disabled={!canManage} />
          </div>

          {canManage ? (
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">Salvar</Button>
              <Button variant="destructive" size="icon" onClick={() => { onDelete(); onClose(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pt-2">
              Somente um administrador pode editar ou excluir uma peça do acervo.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
