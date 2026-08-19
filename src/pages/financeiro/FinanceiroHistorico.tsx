import { useMemo, useState } from "react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserSearch, Phone, Mail, CalendarDays, Wallet, ShoppingBag, FileText, Receipt, Clock } from "lucide-react";
import { useHistoricoCliente } from "@/hooks/useHistoricoCliente";
import { useLeads } from "@/hooks/useLeads";
import { formatBRL, categoriaLabel } from "@/lib/formatters";

const ClienteKpiCard = ({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Wallet }) => (
  <Card className="shadow-sm">
    <CardContent className="p-3 flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
    </CardContent>
  </Card>
);

type EventoTipo = "negocio" | "receita" | "despesa" | "contrato";

const LinhaDoTempo = ({ historico }: { historico: ReturnType<typeof useHistoricoCliente> }) => {
  const eventos = useMemo(() => [
    ...historico.negocios.map((n) => ({
      data: n.criadoEm,
      tipo: "negocio" as EventoTipo,
      descricao: `Negócio: ${n.vestidoNome ?? "vestido"}`,
      valor: n.valorNegociado - n.desconto,
    })),
    ...historico.transacoes.map((t) => ({
      data: t.data,
      tipo: (t.tipo === "entrada" ? "receita" : "despesa") as EventoTipo,
      descricao: t.descricao,
      valor: t.valor,
    })),
    ...historico.contratos.map((c) => ({
      data: c.dataCriacao,
      tipo: "contrato" as EventoTipo,
      descricao: `Contrato #${c.numero} — ${c.statusAssinatura === "assinado" ? "assinado" : "pendente"}`,
      valor: 0,
    })),
  ].filter((e) => e.data).sort((a, b) => b.data.localeCompare(a.data)), [historico]);

  if (eventos.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento registrado</p>;

  const dotColor: Record<EventoTipo, string> = {
    negocio: "bg-primary",
    receita: "bg-success",
    contrato: "bg-info",
    despesa: "bg-destructive",
  };

  return (
    <div className="space-y-3">
      {eventos.map((e, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${dotColor[e.tipo]}`} />
          <div className="flex-1 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{e.descricao}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
            {e.valor > 0 && (
              <span className={`text-sm font-semibold tabular-nums ${e.tipo === "despesa" ? "text-destructive" : "text-success"}`}>
                {e.tipo === "despesa" ? "-" : "+"}{formatBRL(e.valor)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const FinanceiroHistorico = () => {
  const { leads } = useLeads();
  const [busca, setBusca] = useState("");
  const [leadSelecionado, setLeadSelecionado] = useState<string | null>(null);
  const historico = useHistoricoCliente(leadSelecionado);

  const leadsFiltrados = busca.length >= 2
    ? leads.filter((l) => l.nome?.toLowerCase().includes(busca.toLowerCase()) || l.telefone?.includes(busca)).slice(0, 10)
    : [];

  return (
    <>
      <SEO title="Histórico do Cliente — Més Belle" description="Rastreamento completo por cliente." path="/financeiro/clientes" />
      <div className="space-y-6">
        <PageHeader icon={UserSearch} title="Histórico do Cliente" description="Rastreamento completo por cliente" />

        <Card className="shadow-sm max-w-lg">
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar cliente por nome ou telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            {leadsFiltrados.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y overflow-hidden">
                {leadsFiltrados.map((l) => (
                  <button
                    key={l.id}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent/10 transition-colors flex items-center justify-between"
                    onClick={() => { setLeadSelecionado(l.id); setBusca(""); }}
                  >
                    <span className="font-medium">{l.nome}</span>
                    <span className="text-muted-foreground text-xs">{l.telefone}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {leadSelecionado && historico.lead && (
          <div className="space-y-4">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-serif font-bold">{historico.lead.nome}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{historico.lead.telefone || "—"}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{historico.lead.email || "—"}</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {historico.lead.criadoEm ? `Cliente desde ${new Date(historico.lead.criadoEm + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLeadSelecionado(null)}>
                ← Buscar outro cliente
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ClienteKpiCard label="Total Pago" value={formatBRL(historico.totalPago)} icon={Wallet} />
              <ClienteKpiCard label="Negócios" value={String(historico.qtdNegocios)} icon={ShoppingBag} />
              <ClienteKpiCard label="Contratos" value={String(historico.qtdContratos)} icon={FileText} />
              <ClienteKpiCard label="Ticket Médio" value={formatBRL(historico.ticketMedio)} icon={Receipt} />
            </div>

            {historico.negocios.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-serif text-sm flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-primary" /> Negócios / Peças</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vestido</TableHead>
                        <TableHead>Data do Evento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historico.negocios.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell className="font-medium text-sm">{n.vestidoNome ?? "—"}</TableCell>
                          <TableCell className="text-xs">{n.dataEvento ? new Date(n.dataEvento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatBRL(n.valorNegociado - n.desconto)}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{n.statusNegociacao}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {historico.transacoes.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-serif text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Pagamentos Registrados</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historico.transacoes.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-sm font-medium">{t.descricao}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{categoriaLabel(t.categoria)}</Badge></TableCell>
                          <TableCell className={`text-right font-semibold tabular-nums ${t.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                            {t.tipo === "entrada" ? "+" : "-"}{formatBRL(t.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="font-serif text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Linha do Tempo</CardTitle></CardHeader>
              <CardContent>
                <LinhaDoTempo historico={historico} />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="font-serif text-sm">Dados Cadastrais</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {[
                    ["Tipo de Evento", historico.lead.tipoEvento || "—"],
                    ["Data do Evento", historico.lead.dataEvento ? new Date(historico.lead.dataEvento + "T00:00:00").toLocaleDateString("pt-BR") : "—"],
                    ["Status Funil", historico.lead.statusFunil || "—"],
                    ["Prova Data", historico.lead.provaData ? new Date(historico.lead.provaData + "T00:00:00").toLocaleDateString("pt-BR") : "—"],
                    ["Prova Horário", historico.lead.provaHora || "—"],
                    ["Vendedor Responsável", historico.lead.vendedorResponsavel || "—"],
                  ].map(([label, valor]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{valor}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!leadSelecionado && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <UserSearch className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Busque uma cliente pelo nome ou telefone para ver o histórico completo</p>
          </div>
        )}
      </div>
    </>
  );
};

export default FinanceiroHistorico;
