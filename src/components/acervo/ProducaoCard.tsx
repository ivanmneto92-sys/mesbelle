import { Producao, EtapaProducao, PRODUCAO_STATUS_LABELS } from "@/types/acervo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Image } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useRef } from "react";

interface Props {
  producao: Producao;
  etapas: EtapaProducao[];
  onToggleEtapa: (etapaId: string) => void;
  onUploadRef: (producaoId: string, url: string) => void;
  onOpenDetalhes: () => void;
}

export function ProducaoCard({ producao: p, etapas, onToggleEtapa, onUploadRef, onOpenDetalhes }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const done = etapas.filter(e => e.isConcluido).length;
  const total = etapas.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

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

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progresso</span>
            <span className="text-xs font-medium">{done}/{total} etapas ({percent}%)</span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>

        <div className="space-y-2 mb-4">
          {etapas.map((etapa) => (
            <div
              key={etapa.id}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onToggleEtapa(etapa.id)}
            >
              <Checkbox
                checked={etapa.isConcluido}
                onCheckedChange={() => onToggleEtapa(etapa.id)}
                className="pointer-events-none"
              />
              <span className={`text-sm transition-colors ${etapa.isConcluido ? "line-through text-muted-foreground" : "group-hover:text-primary"}`}>
                {etapa.nomeEtapa}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              if (hasRef) {
                window.open(p.refImagensUrls[0], "_blank");
              } else {
                fileRef.current?.click();
              }
            }}
          >
            {hasRef ? <Image className="h-3 w-3 mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
            {hasRef ? "Ver Referência" : "Upload Referência"}
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={onOpenDetalhes}>
            <FileText className="h-3 w-3 mr-1" />
            Detalhes Técnicos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
