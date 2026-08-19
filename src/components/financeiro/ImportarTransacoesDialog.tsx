import { useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { transacaoArraySchema, firstZodError } from "@/lib/schemas";
import { parseFinanceiroFile, type ImportFailure, type ParsedItem } from "@/lib/financeiroImport";
import { CATEGORIAS, Transacao } from "@/types/financeiro";
import { formatBRL, categoriaLabel } from "@/lib/formatters";

interface ImportarTransacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportar: (itens: Omit<Transacao, "id">[]) => Promise<void>;
}

const formatDateBR = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};

export function ImportarTransacoesDialog({ open, onOpenChange, onImportar }: ImportarTransacoesDialogProps) {
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [errors, setErrors] = useState<ImportFailure[]>([]);
  const [total, setTotal] = useState(0);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setItems([]);
    setErrors([]);
    setTotal(0);
  }, []);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const result = parseFinanceiroFile(file.name, text);
        if (result.totalDetected === 0) {
          toast.error("Nenhuma transação detectada no arquivo");
          return;
        }
        setItems(result.valid);
        setErrors(result.invalid);
        setTotal(result.totalDetected);
        setStep("review");
        if (result.invalid.length > 0) {
          toast.warning(`${result.valid.length} válida(s) • ${result.invalid.length} com erro de ${result.totalDetected} detectada(s)`);
        } else {
          toast.success(`${result.valid.length} transação(ões) prontas para revisão`);
        }
      } catch (err) {
        console.error("[Importação] Falha ao processar arquivo:", err);
        toast.error("Falha ao processar o arquivo. Verifique o formato.");
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.onerror = () => toast.error("Não foi possível ler o arquivo");
    reader.readAsText(file);
  }, []);

  const updateCategoria = (index: number, categoria: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, categoria } : item)));
  };

  const handleConfirm = async () => {
    if (items.length === 0) {
      toast.error("Nenhum item válido para importar");
      return;
    }
    const parsed = transacaoArraySchema.safeParse(items);
    if (!parsed.success) {
      toast.error(`Importação inválida: ${firstZodError(parsed.error)}`);
      return;
    }
    try {
      await onImportar(parsed.data as Omit<Transacao, "id">[]);
      const skipped = errors.length;
      toast.success(skipped > 0 ? `${parsed.data.length} importada(s) • ${skipped} ignorada(s) por erro` : `${parsed.data.length} transações importadas`);
      onOpenChange(false);
      reset();
    } catch (err) {
      console.error("[Importação] Falha ao salvar:", err);
      toast.error("Erro ao salvar transações no banco");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="font-serif">Importar OFX/CSV</DialogTitle></DialogHeader>

        {step === "upload" && (
          <div className="mt-4">
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && fileRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileRef.current.files = dt.files;
                  fileRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">Formatos aceitos: .ofx, .csv</p>
            </div>
            <input ref={fileRef} type="file" accept=".ofx,.ofc,.csv" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {step === "review" && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border p-2 text-center">
                <p className="text-[11px] uppercase text-muted-foreground tracking-wider">Detectadas</p>
                <p className="text-lg font-semibold tabular-nums">{total}</p>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/5 p-2 text-center">
                <p className="text-[11px] uppercase text-success tracking-wider flex items-center justify-center gap-1"><CheckCircle2 className="h-3 w-3" />Válidas</p>
                <p className="text-lg font-semibold tabular-nums text-success">{items.length}</p>
              </div>
              <div className={`rounded-lg border p-2 text-center ${errors.length > 0 ? "border-destructive/30 bg-destructive/5" : ""}`}>
                <p className={`text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 ${errors.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  <AlertTriangle className="h-3 w-3" />Com erro
                </p>
                <p className={`text-lg font-semibold tabular-nums ${errors.length > 0 ? "text-destructive" : ""}`}>{errors.length}</p>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> {errors.length} item(s) ignorado(s)
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {errors.slice(0, 20).map((err, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-muted-foreground shrink-0">Linha {err.line}:</span>
                      <span className="text-destructive">{err.reason}</span>
                    </div>
                  ))}
                  {errors.length > 20 && <p className="text-muted-foreground italic">…e mais {errors.length - 20} erro(s)</p>}
                </div>
              </div>
            )}

            {items.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">Categorize antes de importar:</p>
                <div className="max-h-72 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{formatDateBR(item.data)}</TableCell>
                          <TableCell className="text-sm max-w-48 truncate">{item.descricao}</TableCell>
                          <TableCell>
                            <Select value={item.categoria} onValueChange={(v) => updateCategoria(i, v)}>
                              <SelectTrigger className="h-8 text-xs w-40"><SelectValue>{categoriaLabel(item.categoria)}</SelectValue></SelectTrigger>
                              <SelectContent>
                                {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className={`text-right font-medium tabular-nums ${item.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                            {item.tipo === "entrada" ? "+" : "−"} {formatBRL(item.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button className="w-full" onClick={handleConfirm}>
                  Confirmar Importação ({items.length} itens)
                </Button>
              </>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Nenhum item válido para importar. Corrija o arquivo e tente novamente.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
