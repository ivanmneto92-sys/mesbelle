import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIAS, Transacao } from "@/types/financeiro";
import type { Lead } from "@/types/comercial";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircle, ArrowUpCircle, Check,
  Shirt, ShoppingBag, CircleDollarSign,
  Users, TrendingUp, Gift, Receipt, CreditCard, Scissors, Undo2,
  Building2, Wallet, Megaphone, Repeat, Wrench, MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface TransacaoFormValue {
  tipo: "entrada" | "saida";
  categoria: string;
  tipoCusto: "fixo" | "variavel" | null;
  descricao: string;
  valor: string;
  data: string;
  leadId: string | null;
  observacoes: string;
}

interface TransacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao: Transacao | null;
  leads: Lead[];
  onSalvar: (value: TransacaoFormValue) => void;
}

const hoje = () => new Date().toISOString().split("T")[0];

const emptyForm: TransacaoFormValue = {
  tipo: "saida",
  categoria: "",
  tipoCusto: null,
  descricao: "",
  valor: "",
  data: hoje(),
  leadId: null,
  observacoes: "",
};

const CATEGORIA_ICONS: Record<string, LucideIcon> = {
  locacao: Shirt,
  venda: ShoppingBag,
  receita_outros: CircleDollarSign,
  comissao: Users,
  ajuste_comissao: TrendingUp,
  bonus_comissao: Gift,
  imposto: Receipt,
  taxa_cartao: CreditCard,
  custo_producao: Scissors,
  devolucao: Undo2,
  aluguel_atelier: Building2,
  salario: Wallet,
  marketing: Megaphone,
  servico: Repeat,
  manutencao: Wrench,
  outros: MoreHorizontal,
};

// Cada grupo de categoria tem sua própria cor — reforça visualmente a
// diferença entre receita e os dois tipos de despesa, em vez de um <select>
// plano onde tudo tem a mesma cara.
const GRUPO_ESTILO = {
  entrada: {
    tile: "border-success/30 bg-success/5 hover:bg-success/10",
    tileSelecionada: "border-success bg-success/15 ring-1 ring-success/40",
    icone: "text-success",
    badge: "bg-success",
  },
  variavel: {
    tile: "border-warning/30 bg-warning/5 hover:bg-warning/10",
    tileSelecionada: "border-warning bg-warning/15 ring-1 ring-warning/40",
    icone: "text-warning",
    badge: "bg-warning",
  },
  fixo: {
    tile: "border-destructive/30 bg-destructive/5 hover:bg-destructive/10",
    tileSelecionada: "border-destructive bg-destructive/15 ring-1 ring-destructive/40",
    icone: "text-destructive",
    badge: "bg-destructive",
  },
} as const;

function CategoriaTile({
  value, label, grupo, selecionada, onClick,
}: {
  value: string; label: string; grupo: keyof typeof GRUPO_ESTILO; selecionada: boolean; onClick: () => void;
}) {
  const Icon = CATEGORIA_ICONS[value] ?? MoreHorizontal;
  const estilo = GRUPO_ESTILO[grupo];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center text-center gap-1.5 rounded-xl border-2 p-3 transition-colors",
        selecionada ? estilo.tileSelecionada : estilo.tile,
      )}
    >
      {selecionada && (
        <span className={cn("absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center", estilo.badge)}>
          <Check className="h-2.5 w-2.5 text-white" />
        </span>
      )}
      <Icon className={cn("h-5 w-5", estilo.icone)} />
      <span className="text-[11px] leading-tight font-medium">{label}</span>
    </button>
  );
}

export function TransacaoDialog({ open, onOpenChange, transacao, leads, onSalvar }: TransacaoDialogProps) {
  const [form, setForm] = useState<TransacaoFormValue>(emptyForm);

  useEffect(() => {
    if (transacao) {
      setForm({
        tipo: transacao.tipo,
        categoria: transacao.categoria,
        tipoCusto: transacao.tipoCusto ?? null,
        descricao: transacao.descricao,
        valor: String(transacao.valor),
        data: transacao.data,
        leadId: transacao.leadId ?? null,
        observacoes: transacao.observacoes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [transacao, open]);

  const handleTipoChange = (tipo: "entrada" | "saida") => {
    setForm((f) => ({ ...f, tipo, categoria: "", tipoCusto: tipo === "entrada" ? null : f.tipoCusto }));
  };

  const handleCategoriaChange = (cat: string) => {
    const c = CATEGORIAS.find((x) => x.value === cat);
    if (!c) return;
    setForm((f) => ({ ...f, categoria: cat, tipoCusto: c.tipoCusto }));
  };

  const handleSalvar = () => onSalvar(form);
  const valorValido = parseFloat(form.valor.replace(",", ".")) > 0;
  const podeSalvar = !!form.descricao && !!form.categoria && valorValido;

  const receitas = CATEGORIAS.filter((c) => c.tipo === "entrada");
  const variaveis = CATEGORIAS.filter((c) => c.tipoCusto === "variavel");
  const fixas = CATEGORIAS.filter((c) => c.tipoCusto === "fixo");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{transacao ? "Editar Transação" : "Nova Transação"}</DialogTitle>
          <DialogDescription>Escolha se é entrada ou saída, depois a categoria.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 mt-1">

          {/* Passo 1: Entrada ou Saída — dois botões grandes e coloridos */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTipoChange("entrada")}
              className={cn(
                "flex items-center gap-2 rounded-xl border-2 p-3 transition-colors",
                form.tipo === "entrada"
                  ? "border-success bg-success/10 ring-1 ring-success/40"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <ArrowDownCircle className="h-5 w-5 text-success shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-success">Entrada</p>
                <p className="text-[11px] text-muted-foreground">Receita</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange("saida")}
              className={cn(
                "flex items-center gap-2 rounded-xl border-2 p-3 transition-colors",
                form.tipo === "saida"
                  ? "border-destructive bg-destructive/10 ring-1 ring-destructive/40"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <ArrowUpCircle className="h-5 w-5 text-destructive shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-destructive">Saída</p>
                <p className="text-[11px] text-muted-foreground">Despesa</p>
              </div>
            </button>
          </div>

          {/* Passo 2: Categoria — grade de blocos coloridos por grupo */}
          {form.tipo === "entrada" ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Categoria da receita</Label>
              <div className="grid grid-cols-3 gap-2">
                {receitas.map((c) => (
                  <CategoriaTile
                    key={c.value} value={c.value} label={c.label} grupo="entrada"
                    selecionada={form.categoria === c.value}
                    onClick={() => handleCategoriaChange(c.value)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-warning uppercase tracking-wide font-semibold">Custo variável</Label>
                <div className="grid grid-cols-3 gap-2">
                  {variaveis.map((c) => (
                    <CategoriaTile
                      key={c.value} value={c.value} label={c.label} grupo="variavel"
                      selecionada={form.categoria === c.value}
                      onClick={() => handleCategoriaChange(c.value)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-destructive uppercase tracking-wide font-semibold">Custo fixo</Label>
                <div className="grid grid-cols-3 gap-2">
                  {fixas.map((c) => (
                    <CategoriaTile
                      key={c.value} value={c.value} label={c.label} grupo="fixo"
                      selecionada={form.categoria === c.value}
                      onClick={() => handleCategoriaChange(c.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Pagamento Meta Ads — agosto" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Data *</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Vincular a cliente (opcional)</Label>
            <Select value={form.leadId ?? "none"} onValueChange={(v) => setForm((f) => ({ ...f, leadId: v === "none" ? null : v }))}>
              <SelectTrigger><SelectValue placeholder="Nenhum cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </div>

          <Button size="lg" onClick={handleSalvar} disabled={!podeSalvar}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
