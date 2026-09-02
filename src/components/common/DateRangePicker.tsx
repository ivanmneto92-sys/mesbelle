import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DATE_PRESETS, DatePresetKey, DateRange, getPreset } from "@/hooks/useDateRange";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const parseLocalDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const fmtLabel = (d: Date) => format(d, "d 'de' MMM 'de' yyyy", { locale: ptBR });

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const [activePreset, setActivePreset] = useState<DatePresetKey | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(value);
      setActivePreset(null);
    }
    setOpen(next);
  };

  const handlePresetClick = (key: DatePresetKey) => {
    setDraft(getPreset(key));
    setActivePreset(key);
  };

  const handleCalendarSelect = (r: DayPickerRange | undefined) => {
    setActivePreset(null);
    if (!r?.from) return;
    const to = r.to ?? r.from;
    setDraft({ from: format(r.from, "yyyy-MM-dd"), to: format(to, "yyyy-MM-dd") });
  };

  const handleAtualizar = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleCancelar = () => {
    setDraft(value);
    setOpen(false);
  };

  const fromDate = parseLocalDate(value.from);
  const toDate = parseLocalDate(value.to);
  const triggerLabel = value.from === value.to
    ? fmtLabel(fromDate)
    : `${fmtLabel(fromDate)} a ${fmtLabel(toDate)}`;

  const draftFrom = parseLocalDate(draft.from);
  const draftTo = parseLocalDate(draft.to);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 rounded-full px-4 bg-card border-border-subtle gap-2 font-normal text-sm",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="w-auto max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto p-0 shadow-editorial-lg border-border-subtle rounded-lg"
      >
        <div className="sticky top-0 z-10 bg-popover rounded-t-lg px-4 py-3 border-b border-border-subtle">
          <p className="text-sm font-medium">
            {fmtLabel(draftFrom)} a {fmtLabel(draftTo)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row">
          <div className="flex sm:flex-col gap-1 p-2 border-b sm:border-b-0 sm:border-r border-border-subtle overflow-x-auto sm:w-48 sm:shrink-0">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePresetClick(p.key)}
                className={cn(
                  "text-left text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors shrink-0",
                  activePreset === p.key
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="p-2 overflow-x-auto">
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={draftFrom}
              selected={{ from: draftFrom, to: draftTo }}
              onSelect={handleCalendarSelect}
              locale={ptBR}
              className="min-w-max"
            />
          </div>
        </div>
        <div className="sticky bottom-0 z-10 bg-popover rounded-b-lg flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
          <Button variant="ghost" size="sm" onClick={handleCancelar}>Cancelar</Button>
          <Button size="sm" onClick={handleAtualizar}>Atualizar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
