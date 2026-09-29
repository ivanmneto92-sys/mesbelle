import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AluguelLogistica } from "@/types/logistica";
import { useState, useRef } from "react";
import { FileText, Printer, CheckCircle } from "lucide-react";
import { SignaturePad } from "@/components/comercial/SignaturePad";
import { toast } from "sonner";

interface Props {
  items: AluguelLogistica[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssinar: (id: string, assinaturaBase64: string) => Promise<void> | void;
}

export default function TermoRetiradaModal({ items, open, onOpenChange, onAssinar }: Props) {
  const [selected, setSelected] = useState<AluguelLogistica | null>(null);
  const termoRef = useRef<HTMLDivElement>(null);

  const eligible = items.filter((i) => i.statusLogistica === "para_enviar" || i.statusLogistica === "com_cliente");

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const handleAssinar = async (base64: string) => {
    if (!selected) return;
    await onAssinar(selected.id, base64);
    setSelected({ ...selected, assinaturaBase64: base64, dataAssinatura: new Date().toISOString() });
    toast.success("Termo assinado com sucesso!");
  };

  const handlePrint = () => {
    if (!termoRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Termo de Retirada</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        h1 { font-family: 'Playfair Display', serif; text-align: center; margin-bottom: 8px; }
        h2 { text-align: center; font-size: 14px; color: #666; margin-bottom: 32px; }
        .section { margin-bottom: 20px; }
        .label { font-weight: 600; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .sig-line { width: 45%; text-align: center; border-top: 1px solid #333; padding-top: 8px; }
        .sig-img { max-width: 260px; max-height: 130px; }
        @media print { body { padding: 20px; } }
      </style></head><body>${termoRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2"><FileText className="h-5 w-5" /> Gerar Termo de Retirada</DialogTitle>
          <DialogDescription>Selecione o cliente para gerar o termo de responsabilidade</DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-2 mt-4">
            {eligible.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente elegível no momento.</p>
            )}
            {eligible.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium">{item.clienteNome}</p>
                  <p className="text-xs text-muted-foreground">{item.vestidoNome}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.assinaturaBase64 && (
                    <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                      <CheckCircle className="h-3 w-3 mr-1" /> Assinado
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(item.dataSaida)}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div ref={termoRef} className="p-6 border rounded-lg bg-background text-sm space-y-4">
              <h1 style={{ fontFamily: "'Playfair Display', serif", textAlign: "center", fontSize: "20px", marginBottom: "4px" }}>
                Més Belle — Termo de Retirada
              </h1>
              <h2 style={{ textAlign: "center", fontSize: "12px", color: "#888", marginBottom: "24px" }}>
                Termo de Responsabilidade e Conservação da Peça
              </h2>

              <div>
                <p><strong>Cliente:</strong> {selected.clienteNome}</p>
                <p><strong>Telefone:</strong> {selected.clienteTelefone}</p>
                <p><strong>Endereço:</strong> {selected.enderecoEntrega}</p>
              </div>

              <div>
                <p><strong>Vestido:</strong> {selected.vestidoNome}</p>
                <p><strong>Data de Saída:</strong> {formatDate(selected.dataSaida)}</p>
                <p><strong>Data de Retorno:</strong> {formatDate(selected.dataRetorno)}</p>
              </div>

              <div style={{ marginTop: "16px", fontSize: "12px", lineHeight: "1.7" }}>
                <p>A CONTRATANTE declara ter recebido a peça acima identificada em perfeito estado de conservação, comprometendo-se a:</p>
                <p>1. Devolver a peça na data estipulada, limpa e nas mesmas condições em que foi recebida;</p>
                <p>2. Não realizar quaisquer alterações, customizações ou reparos na peça sem autorização prévia;</p>
                <p>3. Responsabilizar-se por danos, manchas, rasgos ou perda da peça, arcando com os custos de reparo ou reposição;</p>
                <p>4. Em caso de atraso na devolução, pagar multa de 10% do valor do aluguel por dia de atraso.</p>
              </div>

              <div style={{ marginTop: "48px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ width: "45%", textAlign: "center", borderTop: "1px solid #333", paddingTop: "8px" }}>
                  <p>Més Belle</p>
                </div>
                <div style={{ width: "45%", textAlign: "center" }}>
                  {selected.assinaturaBase64 ? (
                    <>
                      <img src={selected.assinaturaBase64} alt="Assinatura da cliente" className="sig-img mx-auto" style={{ maxWidth: "220px", maxHeight: "100px" }} />
                      <div style={{ borderTop: "1px solid #333", paddingTop: "8px" }}>
                        <p>{selected.clienteNome}</p>
                      </div>
                    </>
                  ) : (
                    <div style={{ borderTop: "1px solid #333", paddingTop: "8px" }}>
                      <p>{selected.clienteNome}</p>
                    </div>
                  )}
                </div>
              </div>

              {selected.assinaturaBase64 && selected.dataAssinatura && (
                <p style={{ fontSize: "11px", color: "#888", textAlign: "right", marginTop: "4px" }}>
                  Assinado digitalmente em {new Date(selected.dataAssinatura).toLocaleString("pt-BR")}
                </p>
              )}
            </div>

            {!selected.assinaturaBase64 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Assinatura da Cliente</p>
                <SignaturePad onConfirm={handleAssinar} />
              </div>
            )}

            {selected.assinaturaBase64 && (
              <Badge className="bg-success/20 text-success border-success/30 border text-sm py-1 px-3">
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Termo Assinado
              </Badge>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelected(null)} className="flex-1">Voltar</Button>
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-1" /> Imprimir Termo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
