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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Users, Info, Loader2, Trash2 } from "lucide-react";
import { useFuncionarios, type Funcionario } from "@/hooks/useFuncionarios";

const GestaoFuncionarios = () => {
  const { funcionarios, isLoading, criar, gerir } = useFuncionarios();
  const [novoOpen, setNovoOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [excluirAlvo, setExcluirAlvo] = useState<Funcionario | null>(null);

  const handleCriar = () => {
    if (!novoNome.trim() || !novoEmail.trim()) return;
    // Fecha o dialog imediatamente — a atualização otimista do hook já
    // insere o novo funcionário na tabela sem esperar a resposta da API.
    setNovoOpen(false);
    criar.mutate({ nome: novoNome.trim(), email: novoEmail.trim() });
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
                        <Button
                          size="sm" variant="ghost" className="text-xs h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-white"
                          onClick={() => setExcluirAlvo(f)} aria-label="Excluir funcionário"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
              <li>O funcionário sempre entra por <strong>crm.mesbelle.com.br/portal</strong> — um link separado do login do admin (crm.mesbelle.com.br/login). Cada um só consegue entrar pelo link certo.</li>
              <li>Funcionários veem apenas os próprios leads, agendamentos e métricas.</li>
              <li>Você pode desativar o acesso a qualquer momento; o funcionário não consegue mais entrar.</li>
              <li>Excluir remove o acesso permanentemente; os leads/negócios já feitos por ele continuam no sistema, sem vendedor responsável.</li>
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
            <Button onClick={handleCriar} disabled={!novoNome || !novoEmail || criar.isPending} className="w-full">
              {criar.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando convite...
                </>
              ) : (
                "Enviar convite"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluirAlvo} onOpenChange={(open) => !open && setExcluirAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove permanentemente o acesso de <strong>{excluirAlvo?.nome}</strong> ({excluirAlvo?.email}) ao sistema.
              Leads, agendamentos e contratos que já eram dele não são apagados — ficam sem vendedor responsável e
              passam a aparecer para toda a equipe. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (excluirAlvo) gerir.mutate({ userId: excluirAlvo.id, action: "excluir" });
                setExcluirAlvo(null);
              }}
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GestaoFuncionarios;
