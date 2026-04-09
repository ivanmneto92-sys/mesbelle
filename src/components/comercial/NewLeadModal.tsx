import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Lead } from "@/types/comercial";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NewLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (lead: Omit<Lead, "id" | "criadoEm" | "statusFunil">) => void;
}

export function NewLeadModal({ open, onClose, onSave }: NewLeadModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nome: "", telefone: "", email: "", cpf: "",
    endereco: "", tipoEvento: "", dataEvento: "",
  });

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = () => {
    if (!form.nome.trim() || !form.telefone.trim()) {
      toast.error("Nome e telefone são obrigatórios.");
      return;
    }
    onSave({
      ...form,
      notasInternas: "",
      vendedorResponsavel: user?.name || "",
    });
    setForm({ nome: "", telefone: "", email: "", cpf: "", endereco: "", tipoEvento: "", dataEvento: "" });
    onClose();
    toast.success("Lead cadastrada com sucesso!");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Cadastrar Nova Lead</DialogTitle>
          <DialogDescription>Preencha os dados da nova cliente interessada.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2">
            <Label>Nome completo *</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome da cliente" />
          </div>
          <div>
            <Label>Telefone *</Label>
            <Input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" type="email" />
          </div>
          <div>
            <Label>CPF</Label>
            <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
          </div>
          <div>
            <Label>Tipo de Evento</Label>
            <Select value={form.tipoEvento} onValueChange={(val) => setForm({ ...form, tipoEvento: val })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Casamento">Casamento</SelectItem>
                <SelectItem value="Formatura">Formatura</SelectItem>
                <SelectItem value="Gala">Gala</SelectItem>
                <SelectItem value="Debutante">Debutante</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data do Evento</Label>
            <Input type="date" value={form.dataEvento} onChange={(e) => setForm({ ...form, dataEvento: e.target.value })} />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número, bairro" />
          </div>
          <div className="col-span-2">
            <Button onClick={handleSubmit} className="w-full">Salvar Lead</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
