import { useState } from "react";
import { Vestido } from "@/types/acervo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (v: Omit<Vestido, "id">) => void;
}

export function NovoVestidoSheet({ open, onClose, onSave }: Props) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("");
  const [tamanho, setTamanho] = useState("M");
  const [comprimento, setComprimento] = useState("Longo");
  const [precoAluguel, setPrecoAluguel] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [isConsignado, setIsConsignado] = useState(false);
  const [imagemUrl, setImagemUrl] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagemUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!nome.trim()) return;
    onSave({
      nome, cor, tamanho, comprimento, isConsignado,
      precoAluguel: Number(precoAluguel) || 0,
      precoVenda: Number(precoVenda) || 0,
      status: "disponivel",
      imagemUrl: imagemUrl || "/placeholder.svg",
    });
    // reset
    setNome(""); setCor(""); setTamanho("M"); setComprimento("Longo");
    setPrecoAluguel(""); setPrecoVenda(""); setIsConsignado(false); setImagemUrl("");
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
            <Label>Foto</Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1" />
            {imagemUrl && (
              <div className="mt-2 aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <img src={imagemUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
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
