import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAcervo } from "@/hooks/useAcervo";
import { useMeusLeads } from "@/hooks/useMeusLeads";
import { useDisponibilidade } from "@/hooks/useDisponibilidade";
import { useCriarVenda } from "@/hooks/useCriarVenda";
import { formatBRL } from "@/lib/formatters";
import type { Vestido } from "@/types/acervo";
import { ItemCarrinho, DadosPagamento, FormaPagamento, ResumoPedido } from "@/types/venda";
import {
  Search, Plus, Trash2, Tag, CalendarRange, CreditCard,
  CheckCircle, AlertTriangle, Loader2, ShoppingBag, Receipt,
  User, Package,
} from "lucide-react";

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string; icon: string }[] = [
  { value: "pix", label: "PIX", icon: "⚡" },
  { value: "dinheiro", label: "Dinheiro", icon: "💵" },
  { value: "credito", label: "Cartão de Crédito", icon: "💳" },
  { value: "debito", label: "Cartão de Débito", icon: "💳" },
  { value: "boleto", label: "Boleto", icon: "📄" },
  { value: "misto", label: "Misto (PIX + Cartão)", icon: "🔀" },
];

const OPCOES_PARCELAS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

const MinhaVenda = () => {
  const navigate = useNavigate();
  const { vestidos } = useAcervo();
  const { leads } = useMeusLeads();
  const { verificar } = useDisponibilidade();
  const criarVenda = useCriarVenda();

  const [leadId, setLeadId] = useState<string>("");
  const [buscaPeca, setBuscaPeca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [pagamento, setPagamento] = useState<DadosPagamento>({
    forma: "pix", parcelas: 1, descontoGeral: 0, observacoes: "",
  });
  const [vendaConfirmada, setVendaConfirmada] = useState<string | null>(null);

  const pecasFiltradas = vestidos.filter((v) => {
    if (!buscaPeca.trim()) return false;
    const termo = buscaPeca.toLowerCase();
    return v.nome?.toLowerCase().includes(termo) || v.sku?.toLowerCase().includes(termo);
  });

  const adicionarPeca = (peca: Vestido) => {
    if (carrinho.some((i) => i.vestidoId === peca.id)) {
      toast.info("Esta peça já foi adicionada ao carrinho.");
      return;
    }
    const novo: ItemCarrinho = {
      id: crypto.randomUUID(),
      vestidoId: peca.id,
      nome: peca.nome ?? "",
      sku: peca.sku ?? "",
      fotoUrl: peca.imagemUrl || null,
      categoria: peca.categoriaPeca ?? "vestido",
      valorOriginal: Number(peca.precoAluguel ?? 0),
      desconto: 0,
      valorFinal: Number(peca.precoAluguel ?? 0),
      dataRetirada: null,
      dataDevolucao: null,
      disponivel: null,
      verificando: false,
    };
    setCarrinho((prev) => [...prev, novo]);
    setBuscaPeca("");
  };

  const removerItem = (id: string) => {
    setCarrinho((prev) => prev.filter((i) => i.id !== id));
  };

  const atualizarItem = (id: string, campo: Partial<ItemCarrinho>) => {
    setCarrinho((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const atualizado = { ...i, ...campo };
        atualizado.valorFinal = Math.max(0, atualizado.valorOriginal - atualizado.desconto);
        return atualizado;
      }),
    );
  };

  const verificarDisponibilidade = useCallback(
    async (id: string, vestidoId: string, retirada: string, devolucao: string) => {
      if (!retirada || !devolucao || retirada >= devolucao) return;
      atualizarItem(id, { verificando: true, disponivel: null });
      try {
        const ok = await verificar(vestidoId, retirada, devolucao);
        atualizarItem(id, { verificando: false, disponivel: ok });
      } catch {
        atualizarItem(id, { verificando: false, disponivel: null });
      }
    },
    [verificar],
  );

  const resumo: ResumoPedido = (() => {
    const subtotal = carrinho.reduce((s, i) => s + i.valorOriginal, 0);
    const descontoItens = carrinho.reduce((s, i) => s + i.desconto, 0);
    const descontoGeral = pagamento.descontoGeral;
    const total = Math.max(0, subtotal - descontoItens - descontoGeral);
    return { subtotal, descontoItens, descontoGeral, total };
  })();

  const podeConcluir =
    !!leadId &&
    carrinho.length > 0 &&
    carrinho.every((i) => i.dataRetirada && i.dataDevolucao && i.disponivel !== false) &&
    !!pagamento.forma;

  const handleConfirmar = async () => {
    const lead = leads.find((l) => l.id === leadId);
    if (!podeConcluir || !lead) return;
    const result = await criarVenda.mutateAsync({ lead, itens: carrinho, pagamento, resumo });
    if (result?.negocioId) setVendaConfirmada(result.negocioId);
  };

  if (vendaConfirmada) {
    return (
      <>
        <SEO title="Venda registrada — Més Belle" description="Venda registrada com sucesso." path="/minha-venda" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
          <div className="p-6 bg-green-100 rounded-full">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold">Venda registrada! 🎉</h2>
            <p className="text-muted-foreground mt-1">
              O pagamento foi registrado e as peças foram reservadas.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/meus-leads")}>
              Ver meus leads
            </Button>
            <Button onClick={() => navigate(`/meu-contrato?leadId=${leadId}`)}>
              Gerar contrato →
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Nova Venda — Més Belle" description="Registre a locação de peças e o pagamento da cliente." path="/minha-venda" />
      <div className="space-y-6 max-w-4xl mx-auto">

        <PageHeader
          icon={ShoppingBag}
          title="Nova Venda"
          description="Registre a locação de peças e o pagamento da cliente"
        />

        {/* SEÇÃO 1: Cliente */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> 1. Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Buscar cliente pelo nome..." />
              </SelectTrigger>
              <SelectContent>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    <span className="font-medium">{l.nome}</span>
                    {l.telefone && (
                      <span className="text-muted-foreground text-xs ml-2">{l.telefone}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {leads.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Nenhum lead cadastrado.{" "}
                <button className="underline" onClick={() => navigate("/meus-leads")}>
                  Cadastrar cliente →
                </button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* SEÇÃO 2: Peças */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> 2. Peças
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar peça por nome ou SKU..."
                value={buscaPeca}
                onChange={(e) => setBuscaPeca(e.target.value)}
              />
              {buscaPeca.trim() && (
                <div className="absolute z-10 mt-1 w-full bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {pecasFiltradas.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">
                      Nenhuma peça encontrada para "{buscaPeca}"
                    </div>
                  )}
                  {pecasFiltradas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => adicionarPeca(p)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left transition-colors"
                    >
                      {p.imagemUrl ? (
                        <img src={p.imagemUrl} alt={p.nome} className="h-10 w-8 object-cover rounded" />
                      ) : (
                        <div className="h-10 w-8 bg-muted rounded flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.sku} · {formatBRL(Number(p.precoAluguel ?? 0))}
                        </p>
                      </div>
                      {p.status !== "disponivel" && (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300 shrink-0">
                          {p.status}
                        </Badge>
                      )}
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {carrinho.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma peça adicionada ainda</p>
                <p className="text-xs">Use a busca acima para adicionar vestidos ou acessórios</p>
              </div>
            )}

            {carrinho.map((item) => (
              <ItemCarrinhoCard
                key={item.id}
                item={item}
                onRemover={() => removerItem(item.id)}
                onAtualizar={(campo) => atualizarItem(item.id, campo)}
                onVerificarDisponibilidade={(retirada, devolucao) =>
                  verificarDisponibilidade(item.id, item.vestidoId, retirada, devolucao)
                }
              />
            ))}
          </CardContent>
        </Card>

        {/* SEÇÃO 3: Pagamento */}
        {carrinho.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> 3. Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              <div className="space-y-2">
                <Label className="text-sm font-medium">Forma de pagamento *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAS_PAGAMENTO.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setPagamento((p) => ({ ...p, forma: f.value, parcelas: 1 }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                        pagamento.forma === f.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span>{f.icon}</span> {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {pagamento.forma === "credito" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Número de parcelas</Label>
                  <div className="flex flex-wrap gap-2">
                    {OPCOES_PARCELAS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPagamento((p) => ({ ...p, parcelas: n }))}
                        className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                          pagamento.parcelas === n
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        {n === 1 ? "À vista" : `${n}x`}
                        {n > 1 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {formatBRL(resumo.total / n)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Desconto no total (R$)
                </Label>
                <div className="relative w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    min={0}
                    max={resumo.subtotal - resumo.descontoItens}
                    step={10}
                    className="pl-9"
                    value={pagamento.descontoGeral || ""}
                    onChange={(e) => setPagamento((p) => ({
                      ...p,
                      descontoGeral: Math.max(0, Number(e.target.value)),
                    }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Observações (opcional)</Label>
                <Textarea
                  placeholder="Ex: pagamento em duas vezes, sinal pago..."
                  value={pagamento.observacoes}
                  onChange={(e) => setPagamento((p) => ({ ...p, observacoes: e.target.value }))}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* RESUMO E CONFIRMAÇÃO */}
        {carrinho.length > 0 && (
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-serif font-semibold text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Resumo da venda
              </h3>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({carrinho.length} peça{carrinho.length > 1 ? "s" : ""})</span>
                  <span>{formatBRL(resumo.subtotal)}</span>
                </div>
                {resumo.descontoItens > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descontos por peça</span>
                    <span>− {formatBRL(resumo.descontoItens)}</span>
                  </div>
                )}
                {resumo.descontoGeral > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto geral</span>
                    <span>− {formatBRL(resumo.descontoGeral)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatBRL(resumo.total)}</span>
                </div>
                {pagamento.forma === "credito" && pagamento.parcelas > 1 && (
                  <p className="text-xs text-muted-foreground text-right">
                    {pagamento.parcelas}× de {formatBRL(resumo.total / pagamento.parcelas)}
                  </p>
                )}
              </div>

              {!leadId && (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Selecione a cliente
                </p>
              )}
              {carrinho.some((i) => !i.dataRetirada || !i.dataDevolucao) && (
                <p className="text-xs text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Informe as datas de retirada e devolução em todas as peças
                </p>
              )}
              {carrinho.some((i) => i.disponivel === false) && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Uma ou mais peças não estão disponíveis nas datas escolhidas
                </p>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!podeConcluir || criarVenda.isPending}
                onClick={handleConfirmar}
              >
                {criarVenda.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registrando...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Confirmar venda</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </>
  );
};

const ItemCarrinhoCard = ({
  item,
  onRemover,
  onAtualizar,
  onVerificarDisponibilidade,
}: {
  item: ItemCarrinho;
  onRemover: () => void;
  onAtualizar: (campo: Partial<ItemCarrinho>) => void;
  onVerificarDisponibilidade: (retirada: string, devolucao: string) => void;
}) => {
  const handleDataChange = (campo: "dataRetirada" | "dataDevolucao", valor: string) => {
    onAtualizar({ [campo]: valor, disponivel: null });
    const nova = { ...item, [campo]: valor };
    if (nova.dataRetirada && nova.dataDevolucao && nova.dataRetirada < nova.dataDevolucao) {
      onVerificarDisponibilidade(nova.dataRetirada, nova.dataDevolucao);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        {item.fotoUrl ? (
          <img src={item.fotoUrl} alt={item.nome} className="h-16 w-12 object-cover rounded" />
        ) : (
          <div className="h-16 w-12 bg-muted rounded flex items-center justify-center shrink-0">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight">{item.nome}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.sku}</p>
          <p className="text-sm font-semibold text-primary mt-1">{formatBRL(item.valorOriginal)}</p>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onRemover}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarRange className="h-3 w-3" /> Retirada *
          </Label>
          <Input
            type="date"
            value={item.dataRetirada ?? ""}
            onChange={(e) => handleDataChange("dataRetirada", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarRange className="h-3 w-3" /> Devolução *
          </Label>
          <Input
            type="date"
            value={item.dataDevolucao ?? ""}
            min={item.dataRetirada ?? ""}
            onChange={(e) => handleDataChange("dataDevolucao", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {item.verificando && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidade...
        </p>
      )}
      {!item.verificando && item.disponivel === true && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Disponível para as datas selecionadas
        </p>
      )}
      {!item.verificando && item.disponivel === false && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Peça indisponível neste período — escolha outras datas
        </p>
      )}

      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Tag className="h-3 w-3" /> Desconto (R$)
        </Label>
        <div className="relative w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
          <Input
            type="number"
            min={0}
            max={item.valorOriginal}
            step={10}
            className="pl-8 h-8 text-sm"
            value={item.desconto || ""}
            onChange={(e) => onAtualizar({ desconto: Math.max(0, Number(e.target.value)) })}
            placeholder="0"
          />
        </div>
        {item.desconto > 0 && (
          <span className="text-sm font-semibold text-primary">
            = {formatBRL(item.valorFinal)}
          </span>
        )}
      </div>
    </div>
  );
};

export default MinhaVenda;
