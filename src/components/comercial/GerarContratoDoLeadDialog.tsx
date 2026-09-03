import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Contrato, Lead } from "@/types/comercial";
import { Vestido } from "@/types/acervo";
import { toast } from "sonner";

const METODOS_PAGAMENTO = [
  "Dinheiro", "PIX", "Cartão de Débito", "Cartão de Crédito à Vista",
  ...Array.from({ length: 11 }, (_, i) => `Cartão de Crédito ${i + 2}x`),
];

interface GerarContratoDoLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  vestidos: Vestido[];
  onGerar: (params: {
    leadId: string; produtoDescricao: string; valor: number; metodoPagamento: string;
    dadosComplementares?: { nome?: string; cpf?: string; telefone?: string; email?: string };
  }) => Promise<Contrato | null>;
}

export function GerarContratoDoLeadDialog({ open, onOpenChange, leads, vestidos, onGerar }: GerarContratoDoLeadDialogProps) {
  const [buscaLead, setBuscaLead] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [buscaPeca, setBuscaPeca] = useState("");
  const [vestidoId, setVestidoId] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lead = useMemo(() => leads.find((l) => l.id === leadId) ?? null, [leads, leadId]);
  const vestido = useMemo(() => vestidos.find((v) => v.id === vestidoId) ?? null, [vestidos, vestidoId]);

  const leadsFiltrados = useMemo(() => {
    if (!buscaLead.trim()) return [];
    const termo = buscaLead.toLowerCase();
    return leads.filter((l) => l.nome?.toLowerCase().includes(termo) || l.telefone?.includes(termo)).slice(0, 8);
  }, [leads, buscaLead]);

  const pecasFiltradas = useMemo(() => {
    if (!buscaPeca.trim()) return [];
    const termo = buscaPeca.toLowerCase();
    return vestidos.filter((v) => v.nome?.toLowerCase().includes(termo) || v.sku?.toLowerCase().includes(termo)).slice(0, 8);
  }, [vestidos, buscaPeca]);

  const reset = () => {
    setBuscaLead(""); setLeadId(null); setBuscaPeca(""); setVestidoId(null);
    setValor(""); setMetodoPagamento(""); setNome(""); setCpf(""); setTelefone(""); setEmail("");
  };

  const handleSelecionarLead = (l: Lead) => {
    setLeadId(l.id);
    setBuscaLead("");
    setNome(l.nome ?? "");
    setCpf(l.cpf ?? "");
    setTelefone(l.telefone ?? "");
    setEmail(l.email ?? "");
  };

  const handleSelecionarPeca = (v: Vestido) => {
    setVestidoId(v.id);
    setBuscaPeca("");
    setValor(String(v.precoAluguel || v.precoVenda || ""));
  };

  const faltamDados = !nome.trim() || !cpf.trim() || !telefone.trim() || !email.trim();
  const podeGerar = !!lead && !!vestido && Number(valor) > 0 && !!metodoPagamento && !faltamDados;

  const handleGerar = async () => {
    if (!lead || !vestido) return;
    const valorNum = Number(valor);
    if (!(valorNum > 0)) { toast.error("Informe o valor do produto."); return; }
    if (!metodoPagamento) { toast.error("Selecione a forma de pagamento."); return; }
    if (faltamDados) { toast.error("Complete nome, CPF, celular e e-mail da cliente."); return; }

    setSalvando(true);
    const contrato = await onGerar({
      leadId: lead.id,
      produtoDescricao: `${vestido.nome}${vestido.sku ? ` (${vestido.sku})` : ""}`,
      valor: valorNum,
      metodoPagamento,
      dadosComplementares: { nome, cpf, telefone, email },
    });
    setSalvando(false);

    if (!contrato) {
      toast.error("Não foi possível gerar o contrato. Confira os dados e tente novamente.");
      return;
    }
    toast.success("Contrato gerado! Pronto para assinatura no iPad.");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Gerar Contrato a partir do Lead</DialogTitle>
          <DialogDescription>
            Escolha o lead, o produto do acervo e o valor. Os dados da cliente preenchem o contrato automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>1. Lead</Label>
            {lead ? (
              <div className="flex items-center justify-between mt-1 rounded-md border px-3 py-2 text-sm">
                <span className="font-medium">{lead.nome}</span>
                <Button variant="ghost" size="sm" onClick={() => { setLeadId(null); setNome(""); setCpf(""); setTelefone(""); setEmail(""); }}>Trocar</Button>
              </div>
            ) : (
              <div className="relative mt-1">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={buscaLead}
                  onChange={(e) => setBuscaLead(e.target.value)}
                  placeholder="Buscar lead por nome ou telefone"
                  className="pl-8"
                />
                {leadsFiltrados.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                    {leadsFiltrados.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => handleSelecionarLead(l)}
                      >
                        <span className="font-medium">{l.nome}</span>
                        <span className="text-muted-foreground ml-2">{l.telefone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {lead && (
            <>
              <Separator />
              <div>
                <Label>2. Produto (Acervo)</Label>
                {vestido ? (
                  <div className="flex items-center justify-between mt-1 rounded-md border px-3 py-2 text-sm">
                    <span className="font-medium">{vestido.nome}{vestido.sku ? ` — ${vestido.sku}` : ""}</span>
                    <Button variant="ghost" size="sm" onClick={() => setVestidoId(null)}>Trocar</Button>
                  </div>
                ) : (
                  <div className="relative mt-1">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      value={buscaPeca}
                      onChange={(e) => setBuscaPeca(e.target.value)}
                      placeholder="Buscar por nome ou código (SKU)"
                      className="pl-8"
                    />
                    {pecasFiltradas.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                        {pecasFiltradas.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => handleSelecionarPeca(v)}
                          >
                            <span className="font-medium">{v.nome}</span>
                            {v.sku && <span className="text-muted-foreground ml-2">{v.sku}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {vestido && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
                    </div>
                    <div>
                      <Label>Forma de Pagamento</Label>
                      <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {METODOS_PAGAMENTO.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />
                  <div>
                    <Label>3. Dados da Locatária</Label>
                    <p className="text-xs text-muted-foreground mb-2">Confira e complete o que faltar.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Nome</Label>
                        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">CPF</Label>
                        <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Celular</Label>
                        <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">E-mail</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleGerar} disabled={!podeGerar || salvando} className="w-full">
                    {salvando ? "Gerando..." : "Gerar Contrato"}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
