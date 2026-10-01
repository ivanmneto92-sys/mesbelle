import { useState } from "react";
import { CategoriaPeca, CATEGORIA_LABELS, Vestido } from "@/types/acervo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";
import { vestidoSchema, firstZodError } from "@/lib/schemas";

const MAX_FOTOS = 10;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (v: Omit<Vestido, "id">) => void;
}

export function NovoVestidoSheet({ open, onClose, onSave }: Props) {
  const [nome, setNome] = useState("");
  const [categoriaPeca, setCategoriaPeca] = useState<CategoriaPeca>("vestido");
  const [cor, setCor] = useState("");
  const [tamanho, setTamanho] = useState("M");
  const [comprimento, setComprimento] = useState("Longo");
  const [precoAluguel, setPrecoAluguel] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isConsignado, setIsConsignado] = useState(false);
  const [imagens, setImagens] = useState<string[]>([]);

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

  const removeImagem = (idx: number) => setImagens((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    const candidate = {
      nome, cor, tamanho, comprimento, isConsignado,
      precoAluguel: Number(precoAluguel) || 0,
      precoVenda: Number(precoVenda) || 0,
      imagensUrls: imagens,
    };
    const parsed = vestidoSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(firstZodError(parsed.error));
      return;
    }
    onSave({
      ...(parsed.data as Omit<Vestido, "id" | "status" | "imagemUrl" | "imagensUrls" | "sku" | "categoriaPeca" | "descricao" | "qtdTotalLocacoes">),
      status: "disponivel",
      imagensUrls: parsed.data.imagensUrls,
      imagemUrl: parsed.data.imagensUrls[0] || "/placeholder.svg",
      sku: null,
      categoriaPeca,
      descricao: descricao || null,
      qtdTotalLocacoes: 0,
    });
    toast.success("Vestido cadastrado");
    // reset
    setNome(""); setCategoriaPeca("vestido"); setCor(""); setTamanho("M"); setComprimento("Longo");
    setPrecoAluguel(""); setPrecoVenda(""); setDescricao(""); setIsConsignado(false); setImagens([]);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif">Cadastrar Vestido</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div>
            <Label>Nome do Vestido</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Sereia Bordado Pedraria" className="mt-1" />
          </div>

          <div>
            <Label>Categoria</Label>
            <Select value={categoriaPeca} onValueChange={(v) => setCategoriaPeca(v as CategoriaPeca)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORIA_LABELS) as CategoriaPeca[]).map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORIA_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              O SKU será gerado automaticamente ao salvar (ex: <span className="font-mono">MB-VES-0042</span>)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cor</Label>
              <Input value={cor} onChange={(e) => setCor(e.target.value)} placeholder="Ex: Marsala" className="mt-1" />
            </div>
            <div>
              <Label>Tamanho</Label>
              <Select value={tamanho} onValueChange={setTamanho}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PP", "P", "M", "G", "GG", "XG"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Comprimento</Label>
            <Select value={comprimento} onValueChange={setComprimento}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Curto", "Midi", "Longo"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Preço Aluguel (R$)</Label>
              <Input type="number" value={precoAluguel} onChange={(e) => setPrecoAluguel(e.target.value)} placeholder="1200" className="mt-1" />
            </div>
            <div>
              <Label>Preço Venda (R$)</Label>
              <Input type="number" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} placeholder="4800" className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Fotos ({imagens.length}/{MAX_FOTOS})</Label>
            <Input
              type="file" accept="image/*" multiple
              onChange={handleImagesUpload} className="mt-1"
              disabled={imagens.length >= MAX_FOTOS}
            />
            {imagens.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {imagens.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImagem(idx)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-background/90 rounded px-1 py-0.5">Capa</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Detalhes adicionais da peça..." className="mt-1" />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Vestido Consignado</Label>
              <p className="text-xs text-muted-foreground">Peça de terceiros em consignação</p>
            </div>
            <Switch checked={isConsignado} onCheckedChange={setIsConsignado} />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!nome.trim()}>
            Salvar Vestido
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
