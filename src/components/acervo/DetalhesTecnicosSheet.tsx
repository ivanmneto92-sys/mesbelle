import { useState } from "react";
import { Producao } from "@/types/acervo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
  producao: Producao;
  onSave: (notas: string) => void;
}

export function DetalhesTecnicosSheet({ open, onClose, producao, onSave }: Props) {
  const [notas, setNotas] = useState(producao.notasTecnicas);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif">Detalhes Técnicos</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <p className="font-medium text-sm">{producao.tituloVestido}</p>
            <p className="text-xs text-muted-foreground">Cliente: {producao.clienteNome}</p>
          </div>
          <div>
            <Label>Anotações do Ateliê</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Tipo de renda, alterações de decote, medidas específicas da cliente..."
              className="mt-1 min-h-[200px]"
            />
          </div>
          <Button onClick={() => onSave(notas)} className="w-full">
            Salvar Anotações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
