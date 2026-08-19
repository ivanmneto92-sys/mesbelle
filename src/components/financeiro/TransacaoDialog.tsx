import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIAS, Transacao } from "@/types/financeiro";
import type { Lead } from "@/types/comercial";

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
  categoria: "outros",
  tipoCusto: "fixo",
  descricao: "",
  valor: "",
  data: hoje(),
  leadId: null,
  observacoes: "",
};

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

  const handleCategoriaChange = (cat: string) => {
    const c = CATEGORIAS.find((x) => x.value === cat);
    if (!c) return;
    setForm((f) => ({ ...f, categoria: cat, tipo: c.tipo, tipoCusto: c.tipoCusto }));
  };

  const handleSalvar = () => onSalvar(form);
  const valorValido = parseFloat(form.valor.replace(",", ".")) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{transacao ? "Editar Transação" : "Nova Transação"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 mt-2">
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={form.categoria} onValueChange={handleCategoriaChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Receitas</SelectLabel>
                  {CATEGORIAS.filter((c) => c.tipoCusto === null).map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Custos Variáveis</SelectLabel>
                  {CATEGORIAS.filter((c) => c.tipoCusto === "variavel").map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Custos Fixos</SelectLabel>
                  {CATEGORIAS.filter((c) => c.tipoCusto === "fixo").map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 items-center p-3 border rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground">Tipo detectado:</span>
            <Badge variant={form.tipo === "entrada" ? "default" : "destructive"}>
              {form.tipo === "entrada" ? "Receita (Entrada)" : `Despesa ${form.tipoCusto === "fixo" ? "Fixa" : "Variável"}`}
            </Badge>
          </div>

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

          <Button onClick={handleSalvar} disabled={!form.descricao || !valorValido}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
