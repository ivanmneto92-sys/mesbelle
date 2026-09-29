import { Producao, EtapaProducao, PRODUCAO_STATUS_LABELS } from "@/types/acervo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Image } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRef } from "react";
import { ProducaoJornada } from "./ProducaoJornada";

interface Props {
  producao: Producao;
  etapas: EtapaProducao[];
  canManage: boolean;
  onToggleEtapa: (etapaId: string) => void;
  onUploadRef: (producaoId: string, url: string) => void;
  onOpenDetalhes: () => void;
}

export function ProducaoCard({ producao: p, etapas, canManage, onToggleEtapa, onUploadRef, onOpenDetalhes }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUploadRef(p.id, reader.result as string);
    reader.readAsDataURL(file);
  };

  const hasRef = p.refImagensUrls.length > 0;

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-semibold font-serif">{p.tituloVestido} — Cliente {p.clienteNome}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prazo: {format(parseISO(p.dataPrazo), "dd/MM/yyyy")} • Prova: {format(parseISO(p.dataProva), "dd/MM/yyyy")}
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs">
            {PRODUCAO_STATUS_LABELS[p.statusGeral]}
          </Badge>
        </div>

        <div className="mb-5">
          <ProducaoJornada etapas={etapas} canManage={canManage} onToggleEtapa={onToggleEtapa} />
        </div>

        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {(canManage || hasRef) && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                if (hasRef) {
                  window.open(p.refImagensUrls[0], "_blank");
                } else if (canManage) {
                  fileRef.current?.click();
                }
              }}
            >
              {hasRef ? <Image className="h-3 w-3 mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              {hasRef ? "Ver Referência" : "Upload Referência"}
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-xs" onClick={onOpenDetalhes}>
            <FileText className="h-3 w-3 mr-1" />
            Detalhes Técnicos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
