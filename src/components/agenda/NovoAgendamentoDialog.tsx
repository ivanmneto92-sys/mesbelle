import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Trash2, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Agendamento, NovoAgendamento, TipoAgendamento, TIPO_CONFIG } from "@/types/agenda";
import { useCriarAgendamento, useEditarAgendamento, useExcluirAgendamento } from "@/hooks/useAgenda";
import { useLeadsBusca } from "@/hooks/useLeadsBusca";

interface FuncionariaOpcao {
  id: string;
  nome: string;
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
  dataHoraInicial?: Date; // para criar na hora clicada
  agendamentoEditar?: Agendamento; // para editar existente
  funcionarias?: FuncionariaOpcao[]; // só passado no calendário admin
  funcionariaIdFixo?: string; // portal do funcionário: todo novo agendamento nasce atribuído a ela
  onSalvo?: (dataHora: Date) => void; // navega o calendário até a data salva
}

export function NovoAgendamentoDialog({
  aberto, onFechar, dataHoraInicial, agendamentoEditar, funcionarias, funcionariaIdFixo, onSalvo,
}: Props) {
  const criar = useCriarAgendamento();
  const editar = useEditarAgendamento();
  const excluir = useExcluirAgendamento();
  const { data: leads } = useLeadsBusca();

  const modoEditar = !!agendamentoEditar;

  const [tipo, setTipo] = useState<TipoAgendamento>("visita");
  const [dataHora, setDataHora] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [cliente, setCliente] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [funcionariaId, setFuncionariaId] = useState("");
  const [obs, setObs] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadPopoverAberto, setLeadPopoverAberto] = useState(false);

  useEffect(() => {
    if (agendamentoEditar) {
      setTipo(agendamentoEditar.tipo);
      setDataHora(format(new Date(agendamentoEditar.dataHora), "yyyy-MM-dd'T'HH:mm"));
      setDuracao(agendamentoEditar.duracaoMinutos);
      setCliente(agendamentoEditar.clienteNome);
      setEmail(agendamentoEditar.clienteEmail ?? "");
      setTelefone(agendamentoEditar.clienteTelefone ?? "");
      setFuncionariaId(agendamentoEditar.funcionariaId ?? "");
      setObs(agendamentoEditar.observacoes ?? "");
      setLeadId(agendamentoEditar.leadId ?? null);
    } else if (dataHoraInicial) {
      setDataHora(format(dataHoraInicial, "yyyy-MM-dd'T'HH:mm"));
      setTipo("visita");
      setDuracao(60);
      setCliente("");
      setEmail("");
      setTelefone("");
      setFuncionariaId(funcionariaIdFixo ?? "");
      setObs("");
      setLeadId(null);
    }
  }, [agendamentoEditar, dataHoraInicial, aberto, funcionariaIdFixo]);

  const valido = cliente.trim().length > 0 && dataHora.length > 0;

  const handleSelecionarLead = (lead: { id: string; nome: string; telefone: string; email: string } | null) => {
    setLeadId(lead?.id ?? null);
    if (lead) {
      setCliente(lead.nome);
      setTelefone(lead.telefone);
      setEmail(lead.email);
    }
    setLeadPopoverAberto(false);
  };

  const handleSalvar = async () => {
    const payload: NovoAgendamento = {
      tipo,
      dataHora: new Date(dataHora).toISOString(),
      duracaoMinutos: duracao,
      clienteNome: cliente.trim(),
      clienteEmail: email.trim() || undefined,
      clienteTelefone: telefone.trim() || undefined,
      funcionariaId: funcionariaId || undefined,
      observacoes: obs.trim() || undefined,
      leadId: leadId ?? undefined,
    };
    if (modoEditar) {
      await editar.mutateAsync({ id: agendamentoEditar.id, ...payload });
    } else {
      await criar.mutateAsync(payload);
    }
    onSalvo?.(new Date(dataHora));
    onFechar();
  };

  const handleExcluir = async () => {
    if (!agendamentoEditar) return;
    if (!confirm("Excluir este agendamento?")) return;
    await excluir.mutateAsync(agendamentoEditar.id);
    onFechar();
  };

  const pending = criar.isPending || editar.isPending || excluir.isPending;

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{modoEditar ? "Editar agendamento" : "Novo agendamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoAgendamento)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(TIPO_CONFIG) as [TipoAgendamento, typeof TIPO_CONFIG[TipoAgendamento]][]).map(
                  ([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Data e hora</Label>
              <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Duração (min)</Label>
              <Input
                type="number"
                min={15}
                step={15}
                value={duracao}
                onChange={(e) => setDuracao(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Cliente (Lead cadastrado)</Label>
            <div className="flex items-center gap-2">
              <Popover open={leadPopoverAberto} onOpenChange={setLeadPopoverAberto}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={leadPopoverAberto}
                    className="w-full justify-between font-normal"
                  >
                    {leadId ? leads?.find((l) => l.id === leadId)?.nome ?? "Lead selecionado" : "Buscar lead cadastrado..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar por nome..." />
                    <CommandList>
                      <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>
                      <CommandGroup>
                        {(leads ?? []).map((lead) => (
                          <CommandItem
                            key={lead.id}
                            value={lead.nome}
                            onSelect={() => handleSelecionarLead(lead)}
                          >
                            <Check className={cn("mr-2 h-4 w-4", leadId === lead.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span>{lead.nome}</span>
                              {lead.telefone && <span className="text-xs text-muted-foreground">{lead.telefone}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {leadId && (
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleSelecionarLead(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecionar um lead preenche nome, e-mail e telefone abaixo. Também dá pra preencher manualmente para um cliente avulso.
            </p>
          </div>

          <div className="space-y-1">
            <Label>Nome da cliente *</Label>
            <Input placeholder="Ana Carolina Silva" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input type="email" placeholder="ana@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          </div>

          {funcionarias && funcionarias.length > 0 && (
            <div className="space-y-1">
              <Label>Responsável</Label>
              <Select value={funcionariaId || "nenhuma"} onValueChange={(v) => setFuncionariaId(v === "nenhuma" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="A definir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">A definir</SelectItem>
                  {funcionarias.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea rows={2} placeholder="Detalhes adicionais..." value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {modoEditar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExcluir}
              disabled={pending}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" onClick={onFechar} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={!valido || pending}>
            {pending ? "Salvando..." : modoEditar ? "Salvar alterações" : "Criar agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
