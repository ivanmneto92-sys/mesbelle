import { useState } from "react";
import { Vestido, VestidoStatus, STATUS_LABELS } from "@/types/acervo";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { VestidoCard } from "./VestidoCard";
import { VestidoDetailModal } from "./VestidoDetailModal";
import { AgendaModal } from "./AgendaModal";
import { ReservaAgenda } from "@/types/acervo";

interface Props {
  vestidos: Vestido[];
  reservas: ReservaAgenda[];
  onUpdate: (id: string, patch: Partial<Vestido>) => void;
  onDelete: (id: string) => void;
  onAddReserva: (r: Omit<ReservaAgenda, "id">) => void;
  getReservas: (vestidoId: string) => ReservaAgenda[];
}

export function CatalogoTab({ vestidos, onUpdate, onDelete, onAddReserva, getReservas }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedVestido, setSelectedVestido] = useState<Vestido | null>(null);
  const [agendaVestido, setAgendaVestido] = useState<Vestido | null>(null);

  const filtered = vestidos.filter((v) => {
    const matchSearch = v.nome.toLowerCase().includes(search.toLowerCase()) ||
      v.cor.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vestido, cor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {(Object.keys(STATUS_LABELS) as VestidoStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhum vestido encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((v) => (
            <VestidoCard
              key={v.id}
              vestido={v}
              onClick={() => setSelectedVestido(v)}
              onAgenda={() => setAgendaVestido(v)}
            />
          ))}
        </div>
      )}

      {selectedVestido && (
        <VestidoDetailModal
          vestido={selectedVestido}
          open={!!selectedVestido}
          onClose={() => setSelectedVestido(null)}
          onUpdate={(patch) => { onUpdate(selectedVestido.id, patch); setSelectedVestido(prev => prev ? { ...prev, ...patch } : null); }}
          onDelete={() => { onDelete(selectedVestido.id); setSelectedVestido(null); }}
        />
      )}

      {agendaVestido && (
        <AgendaModal
          vestido={agendaVestido}
          open={!!agendaVestido}
          onClose={() => setAgendaVestido(null)}
          reservas={getReservas(agendaVestido.id)}
          onAddReserva={(r) => onAddReserva({ ...r, vestidoId: agendaVestido.id })}
        />
      )}
    </div>
  );
}
