import { useState } from "react";
import { Lead, MedidasCliente } from "@/types/comercial";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BaseClientesTabProps {
  leads: Lead[];
  onClienteClick: (lead: Lead) => void;
  getMedidas: (leadId: string) => MedidasCliente | undefined;
}

export function BaseClientesTab({ leads, onClienteClick, getMedidas }: BaseClientesTabProps) {
  const [search, setSearch] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("todos");

  const tiposEvento = [...new Set(leads.map((l) => l.tipoEvento))];

  const filtered = leads.filter((l) => {
    const matchSearch = l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.cpf.includes(search) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchEvento = filtroEvento === "todos" || l.tipoEvento === filtroEvento;
    return matchSearch && matchEvento;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroEvento} onValueChange={setFiltroEvento}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os eventos</SelectItem>
            {tiposEvento.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Data Evento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onClienteClick(lead)}
              >
                <TableCell className="font-medium">{lead.nome}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{lead.cpf}</TableCell>
                <TableCell className="text-sm">{lead.telefone}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{lead.tipoEvento}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {lead.dataEvento ? new Date(lead.dataEvento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={lead.enviadoComercial ? "default" : "secondary"} className="text-xs">
                    {lead.enviadoComercial ? "No Comercial" : lead.statusFunil.replace("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
