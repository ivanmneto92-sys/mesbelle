import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AluguelLogistica, StatusLogistica } from "@/types/logistica";
import { MapPin, Phone, Calendar, Truck } from "lucide-react";
import { useState } from "react";

const statusLabels: Record<StatusLogistica, string> = {
  para_enviar: "Para Enviar",
  em_transito: "Em Trânsito",
  com_cliente: "Com Cliente",
  atrasado: "Atrasado",
  devolvido: "Devolvido",
};

const statusColors: Record<StatusLogistica, string> = {
  para_enviar: "bg-info/20 text-info",
  em_transito: "bg-warning/20 text-warning",
  com_cliente: "bg-success/20 text-success",
  atrasado: "bg-destructive/20 text-destructive",
  devolvido: "bg-muted text-muted-foreground",
};

interface Props {
  item: AluguelLogistica | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: string, status: StatusLogistica) => void;
  onUpdateRastreio: (id: string, codigo: string) => void;
}

export default function LogisticaDetalhesSheet({ item, open, onOpenChange, onUpdateStatus, onUpdateRastreio }: Props) {
  const [status, setStatus] = useState<StatusLogistica>(item?.statusLogistica ?? "para_enviar");
  const [rastreio, setRastreio] = useState(item?.codigoRastreio ?? "");

  // Sync when item changes
  const currentItem = item;
  if (currentItem && status !== currentItem.statusLogistica) {
    setStatus(currentItem.statusLogistica);
    setRastreio(currentItem.codigoRastreio ?? "");
  }

  if (!currentItem) return null;

  const whatsappLink = `https://wa.me/55${currentItem.clienteTelefone.replace(/\D/g, "")}`;

  const handleSave = () => {
    onUpdateStatus(currentItem.id, status);
    if (rastreio !== (currentItem.codigoRastreio ?? "")) {
      onUpdateRastreio(currentItem.id, rastreio);
    }
    onOpenChange(false);
  };

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif">{currentItem.vestidoNome}</SheetTitle>
          <SheetDescription>Detalhes logísticos do aluguel</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status atual */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status atual:</span>
            <Badge className={`${statusColors[currentItem.statusLogistica]} border-0`}>
              {statusLabels[currentItem.statusLogistica]}
            </Badge>
          </div>

          {/* Cliente */}
          <div className="space-y-3 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold">Cliente</h4>
            <p className="text-sm font-medium">{currentItem.clienteNome}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{currentItem.clienteTelefone}</span>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="ml-auto text-success hover:underline text-xs font-medium">
                WhatsApp →
              </a>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{currentItem.enderecoEntrega}</span>
            </div>
          </div>

          {/* Datas */}
          <div className="space-y-2 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Datas</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Saída:</span>
                <p className="font-medium">{formatDate(currentItem.dataSaida)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Retorno:</span>
                <p className="font-medium">{formatDate(currentItem.dataRetorno)}</p>
              </div>
            </div>
          </div>

          {/* Alterar status */}
          <div className="space-y-2">
            <Label>Alterar status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusLogistica)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="para_enviar">Para Enviar</SelectItem>
                <SelectItem value="em_transito">Em Trânsito</SelectItem>
                <SelectItem value="com_cliente">Com Cliente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="devolvido">Devolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rastreio */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Código de Rastreio</Label>
            <Input placeholder="Ex: BR123456789" value={rastreio} onChange={(e) => setRastreio(e.target.value)} />
          </div>

          <Button onClick={handleSave} className="w-full">Salvar Alterações</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
