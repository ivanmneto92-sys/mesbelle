import { Vestido, STATUS_LABELS, STATUS_COLORS } from "@/types/acervo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Tag } from "lucide-react";

interface Props {
  vestido: Vestido;
  onClick: () => void;
  onAgenda: () => void;
}

export function VestidoCard({ vestido: v, onClick, onAgenda }: Props) {
  return (
    <Card
      className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50"
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={v.imagemUrl}
          alt={v.nome}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge className={`text-[10px] px-2 py-0.5 ${STATUS_COLORS[v.status]}`}>
            {STATUS_LABELS[v.status]}
          </Badge>
        </div>
        {v.isConsignado && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-amber-500/90 text-white text-[10px] px-2 py-0.5 border-0 backdrop-blur-sm">
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              Consignado
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3 space-y-1.5">
        <p className="font-semibold text-sm truncate font-serif">{v.nome}</p>
        <p className="text-xs text-muted-foreground">
          {v.cor} • {v.tamanho} • {v.comprimento}
        </p>
        <div className="flex justify-between text-xs pt-1">
          <span className="text-primary font-medium">
            Aluguel: R$ {v.precoAluguel.toLocaleString("pt-BR")}
          </span>
          <span className="text-muted-foreground">
            Venda: R$ {v.precoVenda.toLocaleString("pt-BR")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1 text-xs h-8"
          onClick={(e) => { e.stopPropagation(); onAgenda(); }}
        >
          <Calendar className="h-3 w-3 mr-1" />
          Ver Agenda
        </Button>
      </CardContent>
    </Card>
  );
}
