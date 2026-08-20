import { useState } from "react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Users, Info } from "lucide-react";
import { useFuncionarios } from "@/hooks/useFuncionarios";

const GestaoFuncionarios = () => {
  const { funcionarios, isLoading, criar, gerir } = useFuncionarios();
  const [novoOpen, setNovoOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");

  const handleCriar = () => {
    criar.mutate({ nome: novoNome, email: novoEmail });
    setNovoOpen(false);
    setNovoNome("");
    setNovoEmail("");
  };

  return (
    <>
      <SEO title="Gestão de Funcionários — Més Belle" description="Gerencie o acesso da equipe de vendas." path="/admin/funcionarios" />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader icon={Users} title="Funcionários" description="Gerencie o acesso da equipe de vendas" />
          <Button onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Funcionário
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((f) => (
                  <TableRow key={f.id} className={f.bloqueado ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.email}</TableCell>
                    <TableCell className="text-xs">{new Date(f.criadoEm).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-xs">
                      {f.ultimoLogin
                        ? new Date(f.ultimoLogin).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "Nunca acessou"}
                    </TableCell>
                    <TableCell>
                      {f.bloqueado
                        ? <Badge variant="destructive" className="text-xs">Desativado</Badge>
                        : f.confirmado
                        ? <Badge className="text-xs">Ativo</Badge>
                        : <Badge variant="outline" className="text-xs">Convite pendente</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {!f.confirmado && (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => gerir.mutate({ userId: f.id, action: "reenviar_convite" })}>
                            Reenviar convite
                          </Button>
                        )}
                        {!f.bloqueado && f.confirmado && (
                          <Button size="sm" variant="outline" className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive hover:text-white" onClick={() => gerir.mutate({ userId: f.id, action: "desativar" })}>
                            Desativar
                          </Button>
                        )}
                        {f.bloqueado && (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => gerir.mutate({ userId: f.id, action: "reativar" })}>
                            Reativar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {funcionarios.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Nenhum funcionário cadastrado. Adicione o primeiro clicando no botão acima.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-1 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" /> Como funciona
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Ao adicionar um funcionário, ele recebe um e-mail com um link para definir a própria senha.</li>
              <li>Após definir a senha, ele acessa o portal de funcionários — ambiente completamente separado do admin.</li>
              <li>Funcionários veem apenas os próprios leads, agendamentos e métricas.</li>
              <li>Você pode desativar o acesso a qualquer momento; o funcionário não consegue mais entrar.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Adicionar Funcionário</DialogTitle>
            <DialogDescription>
              Um e-mail de convite será enviado automaticamente. O funcionário define a própria senha.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <div className="space-y-1.5">
              <Label>Nome completo *</Label>
              <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Maria Silva" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="maria@mesbelle.com" />
            </div>
            <Button onClick={handleCriar} disabled={!novoNome || !novoEmail || criar.isPending}>
              {criar.isPending ? "Enviando convite..." : "Enviar convite"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GestaoFuncionarios;
