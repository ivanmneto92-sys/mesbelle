import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, FileSignature } from "lucide-react";
import { useMeusLeads } from "@/hooks/useMeusLeads";
import { NewLeadModal } from "@/components/crm/NewLeadModal";

const STATUS_LABELS: Record<string, string> = {
  novo_lead: "Novo Lead",
  em_atendimento: "Em Atendimento",
  prova_agendada: "Prova Agendada",
  agendado: "Agendado",
  compareceu_alugou: "Compareceu e Alugou",
  compareceu_nao_alugou: "Compareceu e Não Alugou",
  reagendada: "Reagendada",
  cancelada: "Cancelada",
  no_show: "No-Show",
};

const StatusFunilBadge = ({ status }: { status?: string | null }) => (
  <Badge variant="outline" className="text-[10px]">
    {STATUS_LABELS[status ?? ""] ?? status ?? "—"}
  </Badge>
);

const MeusLeads = () => {
  const { leads, addLead } = useMeusLeads();
  const [formOpen, setFormOpen] = useState(false);
  const navigate = useNavigate();

  const novos = leads.filter((l) => l.statusFunil === "novo_lead").length;
  const fechados = leads.filter((l) => l.enviadoComercial).length;

  return (
    <>
      <SEO title="Meus Leads — Més Belle" description="Clientes que você cadastrou e está atendendo." path="/meus-leads" />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader icon={Users} title="Meus Leads" description="Clientes que você cadastrou e está atendendo" />
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Cadastrar Lead
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline">{leads.length} leads total</Badge>
          <Badge variant="secondary">{novos} novos</Badge>
          <Badge>{fechados} fechados</Badge>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Tipo Evento</TableHead>
                  <TableHead>Data Evento</TableHead>
                  <TableHead>Status Funil</TableHead>
                  <TableHead>Comprou?</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-sm">{l.nome}</TableCell>
                    <TableCell className="text-sm">{l.telefone}</TableCell>
                    <TableCell className="text-xs">{l.tipoEvento || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {l.dataEvento ? new Date(l.dataEvento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell><StatusFunilBadge status={l.statusFunil} /></TableCell>
                    <TableCell>
                      {l.enviadoComercial
                        ? <Badge className="text-xs">Comprou</Badge>
                        : <Badge variant="outline" className="text-xs">Não ainda</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {!l.enviadoComercial && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => navigate(`/meu-contrato?leadId=${l.id}`)}>
                          <FileSignature className="h-3 w-3 mr-1" /> Gerar Contrato
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Nenhum lead cadastrado ainda.{" "}
                      <button className="underline" onClick={() => setFormOpen(true)}>Cadastrar agora</button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <NewLeadModal open={formOpen} onClose={() => setFormOpen(false)} onSave={addLead} />
    </>
  );
};

export default MeusLeads;
