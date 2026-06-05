import { useState } from "react";
import { Lead } from "@/types/comercial";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { leadSchema, firstZodError } from "@/lib/schemas";

interface NewLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (lead: Omit<Lead, "id" | "criadoEm" | "statusFunil">) => Lead | Promise<Lead | null>;
}

const tiposEvento = ["Casamento", "Formatura", "Gala", "Debutante", "Festa", "Outro"];

export function NewLeadModal({ open, onClose, onSave }: NewLeadModalProps) {
  const [form, setForm] = useState({
    nome: "", telefone: "", email: "", cpf: "", endereco: "",
    tipoEvento: "", dataEvento: "", notasInternas: "", vendedorResponsavel: "Juliana Costa",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(firstZodError(parsed.error));
      return;
    }
    try {
      await onSave(parsed.data);
      toast.success("Lead cadastrado com sucesso!");
      setForm({ nome: "", telefone: "", email: "", cpf: "", endereco: "", tipoEvento: "", dataEvento: "", notasInternas: "", vendedorResponsavel: "Juliana Costa" });
      onClose();
    } catch {
      toast.error("Erro ao salvar lead");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Novo Lead / Cliente</DialogTitle>
          <DialogDescription>Preencha os dados do novo lead para iniciar o atendimento.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-2">
          <div>
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefone *</Label>
              <Input value={form.telefone} onChange={(e) => update("telefone", e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => update("endereco", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Evento</Label>
              <Select value={form.tipoEvento} onValueChange={(v) => update("tipoEvento", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {tiposEvento.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data do Evento</Label>
              <Input type="date" value={form.dataEvento} onChange={(e) => update("dataEvento", e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSave}>Cadastrar Lead</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
