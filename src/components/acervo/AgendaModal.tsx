import { useState } from "react";
import { Vestido, ReservaAgenda, ReservaStatus } from "@/types/acervo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  vestido: Vestido;
  open: boolean;
  onClose: () => void;
  reservas: ReservaAgenda[];
  onAddReserva: (r: Omit<ReservaAgenda, "id" | "vestidoId">) => void;
}

const RESERVA_LABELS: Record<ReservaStatus, string> = {
  aluguel: "Aluguel",
  lavanderia: "Lavanderia",
  ajuste: "Ajuste",
};

export function AgendaModal({ vestido, open, onClose, reservas, onAddReserva }: Props) {
  const [adding, setAdding] = useState(false);
  const [tipo, setTipo] = useState<ReservaStatus>("aluguel");
  const [dateInicio, setDateInicio] = useState<Date>();
  const [dateFim, setDateFim] = useState<Date>();

  const blockedDays = reservas.flatMap((r) => {
    const days: Date[] = [];
    const start = parseISO(r.dataInicio);
    const end = parseISO(r.dataFim);
    const d = new Date(start);
    while (d <= end) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  });

  const isBlocked = (date: Date) => {
    return reservas.some((r) =>
      isWithinInterval(date, { start: parseISO(r.dataInicio), end: parseISO(r.dataFim) })
    );
  };

  const handleAdd = () => {
    if (!dateInicio || !dateFim) return;
    onAddReserva({
      dataInicio: format(dateInicio, "yyyy-MM-dd"),
      dataFim: format(dateFim, "yyyy-MM-dd"),
      statusReserva: tipo,
    });
    setAdding(false);
    setDateInicio(undefined);
    setDateFim(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Agenda — {vestido.nome}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center">
          <Calendar
            mode="single"
            locale={ptBR}
            disabled={isBlocked}
            modifiers={{ blocked: blockedDays }}
            modifiersStyles={{ blocked: { backgroundColor: "hsl(var(--destructive) / 0.15)", color: "hsl(var(--destructive))", borderRadius: "0" } }}
            className="p-3 pointer-events-auto"
          />
        </div>

        {reservas.length > 0 && (
          <div className="space-y-1.5 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Reservas</p>
            {reservas.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1.5">
                <span className="font-medium">{RESERVA_LABELS[r.statusReserva]}</span>
                <span className="text-muted-foreground">
                  {format(parseISO(r.dataInicio), "dd/MM")} — {format(parseISO(r.dataFim), "dd/MM/yyyy")}
                </span>
              </div>
            ))}
          </div>
        )}

        {!adding ? (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="w-full">
            + Nova Reserva
          </Button>
        ) : (
          <div className="border rounded-lg p-3 space-y-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as ReservaStatus)}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(RESERVA_LABELS) as ReservaStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{RESERVA_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full mt-1 text-xs justify-start", !dateInicio && "text-muted-foreground")}>
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {dateInicio ? format(dateInicio, "dd/MM/yy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateInicio} onSelect={setDateInicio} disabled={isBlocked} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs">Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full mt-1 text-xs justify-start", !dateFim && "text-muted-foreground")}>
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {dateFim ? format(dateFim, "dd/MM/yy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFim} onSelect={setDateFim} disabled={isBlocked} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!dateInicio || !dateFim} className="flex-1">Confirmar</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
