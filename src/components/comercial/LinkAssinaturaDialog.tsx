import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, MessageCircle, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Contrato } from "@/types/comercial";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
  onGerar: (contratoId: string, validadeHoras: number) => Promise<string | null>;
}

export function LinkAssinaturaDialog({ open, onOpenChange, contrato, onGerar }: Props) {
  const [validade, setValidade] = useState("168"); // 7 dias
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => { setLink(null); setCopied(false); setValidade("168"); };

  const handleGerar = async () => {
    if (!contrato) return;
    setLoading(true);
    const url = await onGerar(contrato.id, parseInt(validade, 10));
    setLoading(false);
    if (url) {
      setLink(url);
      toast.success("Link gerado!");
    } else {
      toast.error("Não foi possível gerar o link.");
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = link && contrato
    ? `https://wa.me/?text=${encodeURIComponent(
        `Olá ${contrato.nomeCliente}! 💖\n\nSeu contrato Més Belle (#${contrato.numero}) está pronto para assinatura digital. Acesse o link abaixo no seu celular ou iPad para revisar e assinar:\n\n${link}\n\nQualquer dúvida, estamos à disposição!`
      )}`
    : "#";

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" /> Link de assinatura digital
          </DialogTitle>
          <DialogDescription>
            {contrato && <>Gere um link único para <strong>{contrato.nomeCliente}</strong> assinar o contrato online pelo celular ou iPad.</>}
          </DialogDescription>
        </DialogHeader>

        {!link ? (
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Validade do link</Label>
              <Select value={validade} onValueChange={setValidade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="72">3 dias</SelectItem>
                  <SelectItem value="168">7 dias</SelectItem>
                  <SelectItem value="720">30 dias</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Após esse prazo o link expira e a cliente precisará de um novo.</p>
            </div>
            <Button onClick={handleGerar} disabled={loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Gerando...</> : <><Link2 className="h-4 w-4 mr-1.5" />Gerar link único</>}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Link de assinatura</Label>
              <div className="flex gap-2">
                <Input value={link} readOnly className="font-mono text-xs" onClick={(e) => (e.target as HTMLInputElement).select()} />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                Copiar link
              </Button>
              <Button asChild className="bg-[#25D366] hover:bg-[#1faa52] text-white">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
                </a>
              </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p>📱 A cliente abre o link no celular ou iPad, lê o contrato e assina com o dedo ou Apple Pencil.</p>
              <p>🔒 O sistema registra automaticamente data, hora, IP e dispositivo da assinatura — válido juridicamente.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
