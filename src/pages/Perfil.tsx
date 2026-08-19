import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import { SEO } from "@/components/SEO";
import { UserCircle, Save } from "lucide-react";

const Perfil = () => {
  const { user, refreshUser } = useAuth();
  const [nome, setNome] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nome: nome.trim() })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao salvar. Tente novamente.");
    } else {
      await refreshUser();
      toast.success("Nome atualizado com sucesso!");
    }
    setSaving(false);
  };

  return (
    <>
      <SEO title="Meu Perfil — Més Belle" description="Edite suas informações de exibição." path="/perfil" />
      <div className="space-y-6 max-w-lg">
        <PageHeader icon={UserCircle} title="Meu Perfil" description="Edite suas informações de exibição" />
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Nome de exibição</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
            <Input value={user?.email ?? ""} disabled className="mt-1.5 opacity-60" />
            <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado aqui.</p>
          </div>
          <Button onClick={handleSave} disabled={saving || !nome.trim()}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default Perfil;
