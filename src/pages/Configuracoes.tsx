import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mail, FileText, QrCode, Settings, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  usePermissoes,
  permissaoLabels,
  vendedorPermKeys,
  socioPermKeys,
  type RolePermissoes,
} from "@/hooks/usePermissoes";

const Configuracoes = () => {
  const { permissoes, updatePermissao } = usePermissoes();

  const renderToggleGroup = (
    role: "vendedor" | "socio",
    keys: (keyof RolePermissoes)[]
  ) => (
    <div className="space-y-3">
      {keys.map((key) => (
        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
          <Label htmlFor={`${role}-${key}`} className="text-sm font-medium cursor-pointer">
            {permissaoLabels[key]}
          </Label>
          <Switch
            id={`${role}-${key}`}
            checked={permissoes[role][key]}
            onCheckedChange={(v) => updatePermissao(role, key, v)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <>
    <SEO title="Configurações — Més Belle" description="Ajustes da conta e preferências do sistema Més Belle." path="/configuracoes" />
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Configurações & Automações"
        description="Integrações, automações e controle de acesso"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Controle de Acesso */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Controle de Acesso por Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Defina quais módulos e informações ficam visíveis para cada perfil de usuário.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Vendedor</Badge>
                </h3>
                {renderToggleGroup("vendedor", vendedorPermKeys)}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Sócio</Badge>
                </h3>
                {renderToggleGroup("socio", socioPermKeys)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Motor de E-mails
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">E-mail de confirmação de agendamento</p>
                <p className="text-xs text-muted-foreground">Enviado automaticamente ao agendar prova</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Lembrete de devolução</p>
                <p className="text-xs text-muted-foreground">2 dias antes do prazo de devolução</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Pós-venda / Avaliação</p>
                <p className="text-xs text-muted-foreground">Enviado 3 dias após o evento</p>
              </div>
              <Switch />
            </div>
            <Badge variant="outline" className="text-xs">Placeholder — integração pendente</Badge>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Emissão de NFe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Input placeholder="CNPJ do ateliê" />
              <Input placeholder="Inscrição Estadual" />
              <Input placeholder="Chave da API NFe (ex: Focus NFe, Nota Carioca)" />
              <Input placeholder="Ambiente (Homologação / Produção)" />
            </div>
            <Button className="w-full">Salvar Integração NFe</Button>
            <Badge variant="outline" className="text-xs">Placeholder — integração com API de terceiros</Badge>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> QR Code de Avaliação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Gere QR Codes para clientes avaliarem o atendimento após visita ou evento.</p>
            <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/30">
              <div className="text-center">
                <QrCode className="h-16 w-16 text-primary mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">QR Code Preview</p>
                <p className="text-xs text-muted-foreground mt-1">mesbelle.com/avaliacao</p>
              </div>
            </div>
            <Button className="w-full">Gerar Novo QR Code</Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Input placeholder="Nome do Ateliê" defaultValue="Més Belle" />
              <Input placeholder="Telefone" defaultValue="(11) 99999-0000" />
              <Input placeholder="Endereço" defaultValue="Rua das Flores, 123 — São Paulo, SP" />
              <Input placeholder="Instagram" defaultValue="@mesbelle" />
            </div>
            <Button className="w-full">Salvar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default Configuracoes;
