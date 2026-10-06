import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Trash2, Check, ChevronsUpDown, X, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Agendamento, NovoAgendamento, TipoAgendamento, TIPO_CONFIG } from "@/types/agenda";
import { capitalizarPrimeiraLetra } from "@/lib/formatters";
import { useCriarAgendamento, useEditarAgendamento, useExcluirAgendamento } from "@/hooks/useAgenda";
import { useLeadsBusca } from "@/hooks/useLeadsBusca";
import { useAcervo } from "@/hooks/useAcervo";

// Horários fechados de 30 em 30 min (00:00, 00:30, ... 23:30) — antes era um
// <input type="time"> nativo, que deixava escolher qualquer minuto (10:57,
// 14:28...) e tinha um layout de rolagem ruim no desktop.
const OPCOES_HORARIO = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

function arredondarParaMeiaHora(data: Date): Date {
  const arredondada = new Date(data);
  const minutos = arredondada.getMinutes();
  const minutosArredondados = Math.round(minutos / 30) * 30;
  arredondada.setMinutes(minutosArredondados, 0, 0);
  return arredondada;
}

function parseLocalDateTime(dataHora: string): { data: Date | undefined; hora: string } {
  if (!dataHora) return { data: undefined, hora: "" };
  const [dataParte, horaParte] = dataHora.split("T");
  const [y, m, d] = dataParte.split("-").map(Number);
  return { data: new Date(y, m - 1, d), hora: horaParte ?? "" };
}

function combinarDataHora(data: Date, hora: string): string {
  return `${format(data, "yyyy-MM-dd")}T${hora}`;
}

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
  const { vestidos } = useAcervo();

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
  const [dataPopoverAberto, setDataPopoverAberto] = useState(false);
  const [vestidoId, setVestidoId] = useState<string | null>(null);
  const [vestidoPopoverAberto, setVestidoPopoverAberto] = useState(false);

  useEffect(() => {
    if (agendamentoEditar) {
      setTipo(agendamentoEditar.tipo);
      setDataHora(format(arredondarParaMeiaHora(new Date(agendamentoEditar.dataHora)), "yyyy-MM-dd'T'HH:mm"));
      setDuracao(agendamentoEditar.duracaoMinutos);
      setCliente(agendamentoEditar.clienteNome);
      setEmail(agendamentoEditar.clienteEmail ?? "");
      setTelefone(agendamentoEditar.clienteTelefone ?? "");
      setFuncionariaId(agendamentoEditar.funcionariaId ?? "");
      setObs(agendamentoEditar.observacoes ?? "");
      setLeadId(agendamentoEditar.leadId ?? null);
      setVestidoId(agendamentoEditar.vestidoId ?? null);
    } else if (dataHoraInicial) {
      setDataHora(format(arredondarParaMeiaHora(dataHoraInicial), "yyyy-MM-dd'T'HH:mm"));
      setTipo("visita");
      setDuracao(60);
      setCliente("");
      setEmail("");
      setTelefone("");
      setFuncionariaId(funcionariaIdFixo ?? "");
      setObs("");
      setLeadId(null);
      setVestidoId(null);
    }
  }, [agendamentoEditar, dataHoraInicial, aberto, funcionariaIdFixo]);

  const valido = cliente.trim().length > 0 && dataHora.length > 0 && Number.isFinite(duracao) && duracao > 0;

  // Guard síncrono contra duplo-clique/duplo-toque disparando duas
  // mutations antes do React re-renderizar o botão desabilitado (o
  // `pending` do react-query só reflete no próximo render).
  const salvandoRef = useRef(false);

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
    if (salvandoRef.current) return;
    salvandoRef.current = true;
    try {
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
        vestidoId: vestidoId ?? undefined,
      };
      if (modoEditar) {
        await editar.mutateAsync({ id: agendamentoEditar.id, ...payload });
      } else {
        await criar.mutateAsync(payload);
      }
      onSalvo?.(new Date(dataHora));
      onFechar();
    } catch {
      // Erro já foi exibido via toast pelo onError da mutation (useAgenda) —
      // aqui só garantimos que o modal permaneça aberto com os dados intactos
      // para o usuário corrigir e tentar de novo, em vez de uma promise
      // rejeitada sem tratamento subindo até o React.
    } finally {
      salvandoRef.current = false;
    }
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
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
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
              <Label>Data</Label>
              <Popover open={dataPopoverAberto} onOpenChange={setDataPopoverAberto}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal gap-2">
                    <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {parseLocalDateTime(dataHora).data
                      ? format(parseLocalDateTime(dataHora).data!, "d 'de' MMM 'de' yyyy", { locale: ptBR })
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={parseLocalDateTime(dataHora).data}
                    defaultMonth={parseLocalDateTime(dataHora).data}
                    onSelect={(d) => {
                      if (!d) return;
                      const horaAtual = parseLocalDateTime(dataHora).hora || "09:00";
                      setDataHora(combinarDataHora(d, horaAtual));
                      setDataPopoverAberto(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label>Horário</Label>
              <Select
                value={parseLocalDateTime(dataHora).hora}
                onValueChange={(hora) => {
                  const dataAtual = parseLocalDateTime(dataHora).data ?? new Date();
                  setDataHora(combinarDataHora(dataAtual, hora));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="max-h-64" position="item-aligned">
                  {OPCOES_HORARIO.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {tipo !== "visita" && (
            <div className="space-y-1">
              <Label>Vestido</Label>
              <div className="flex items-center gap-2">
                <Popover open={vestidoPopoverAberto} onOpenChange={setVestidoPopoverAberto}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={vestidoPopoverAberto}
                      className="w-full justify-between font-normal"
                    >
                      {vestidoId ? vestidos.find((v) => v.id === vestidoId)?.nome ?? "Vestido selecionado" : "Buscar vestido no acervo..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar por nome ou SKU..." />
                      <CommandList>
                        <CommandEmpty>Nenhum vestido encontrado.</CommandEmpty>
                        <CommandGroup>
                          {vestidos.map((v) => (
                            <CommandItem
                              key={v.id}
                              value={`${v.nome} ${v.sku ?? ""}`}
                              onSelect={() => { setVestidoId(v.id); setVestidoPopoverAberto(false); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4 shrink-0", vestidoId === v.id ? "opacity-100" : "opacity-0")} />
                              {v.imagemUrl && (
                                <img src={v.imagemUrl} alt="" className="h-8 w-8 rounded object-cover mr-2 shrink-0" />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="truncate">{v.nome}</span>
                                {v.sku && <span className="text-xs text-muted-foreground">{v.sku}</span>}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {vestidoId && (
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setVestidoId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {vestidoId && vestidos.find((v) => v.id === vestidoId)?.imagemUrl && (
                <img
                  src={vestidos.find((v) => v.id === vestidoId)!.imagemUrl}
                  alt={vestidos.find((v) => v.id === vestidoId)!.nome}
                  className="mt-2 h-32 w-full rounded-md border object-cover"
                />
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label>Nome da cliente *</Label>
            <Input placeholder="Ana Carolina Silva" value={cliente} onChange={(e) => setCliente(capitalizarPrimeiraLetra(e.target.value))} />
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
            <Textarea rows={2} placeholder="Detalhes adicionais..." value={obs} onChange={(e) => setObs(capitalizarPrimeiraLetra(e.target.value))} />
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
