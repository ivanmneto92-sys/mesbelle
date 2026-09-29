import { Vestido } from "@/types/acervo";
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
        {/* Nenhum badge de status aqui — a peça pode estar alugada agora e
            disponível de novo em breve (ou vice-versa), então um selo fixo
            no card sempre passava uma ideia incompleta ou desatualizada. A
            situação real (com quem, até quando, se está na costura/
            lavanderia) aparece ao clicar na peça. */}
        {v.isConsignado && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5 border-0 backdrop-blur-sm">
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              Consignado
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3 space-y-1.5">
        <p className="font-semibold text-sm truncate font-serif">{v.nome}</p>
        {v.sku && <p className="text-[10px] text-muted-foreground font-mono">{v.sku}</p>}
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
