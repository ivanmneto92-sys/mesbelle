import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, GripVertical, FileText, UserPlus } from "lucide-react";

type KanbanColumn = { id: string; title: string; color: string; items: KanbanItem[] };
type KanbanItem = { id: string; name: string; phone: string; event: string; date: string };

const initialColumns: KanbanColumn[] = [
  { id: "leads", title: "Leads", color: "bg-info/20 text-info", items: [
    { id: "1", name: "Ana Beatriz", phone: "(11) 99876-5432", event: "Casamento", date: "15/06" },
    { id: "2", name: "Fernanda Lima", phone: "(21) 98765-4321", event: "Formatura", date: "20/07" },
  ]},
  { id: "contato", title: "Contato", color: "bg-gold/20 text-gold", items: [
    { id: "3", name: "Mariana Souza", phone: "(11) 91234-5678", event: "Gala", date: "10/06" },
  ]},
  { id: "prova", title: "Prova Agendada", color: "bg-primary/20 text-primary", items: [
    { id: "4", name: "Camila Rocha", phone: "(31) 99999-1234", event: "Casamento", date: "05/06" },
  ]},
  { id: "negociacao", title: "Negociação", color: "bg-warning/20 text-warning", items: [] },
  { id: "fechamento", title: "Fechamento", color: "bg-success/20 text-success", items: [
    { id: "5", name: "Patrícia Nunes", phone: "(41) 98888-7777", event: "Debutante", date: "12/08" },
  ]},
  { id: "noshow", title: "No-Show", color: "bg-destructive/20 text-destructive", items: [] },
];

const metricsData = [
  { etapa: "Leads → Contato", taxa: "68%", cpl: "R$ 12,50" },
  { etapa: "Contato → Prova", taxa: "54%", cpl: "R$ 23,15" },
  { etapa: "Prova → Negociação", taxa: "72%", cpl: "R$ 32,00" },
  { etapa: "Negociação → Fechamento", taxa: "61%", cpl: "R$ 52,30" },
  { etapa: "Total (Lead → Venda)", taxa: "16%", cpl: "R$ 52,30" },
];

const Comercial = () => {
  const [columns] = useState<KanbanColumn[]>(initialColumns);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Comercial & CRM</h1>
          <p className="text-muted-foreground text-sm">Gestão de vendas e relacionamento</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Nova Lead</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif">Cadastrar Lead / Cliente</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Input placeholder="Nome completo" className="col-span-2" />
                <Input placeholder="Telefone" />
                <Input placeholder="E-mail" />
                <Input placeholder="CPF" />
                <Input placeholder="Evento" />
                <Input placeholder="Endereço" className="col-span-2" />
                <div className="col-span-2">
                  <label className="text-sm text-muted-foreground">Upload de medidas</label>
                  <Input type="file" accept="image/*" className="mt-1" />
                </div>
                <Button className="col-span-2">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" /> Contratos</Button>
        </div>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Funil de Vendas</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {columns.map((col) => (
              <div key={col.id} className="min-w-[220px] w-[220px] shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={col.color + " border-0"}>{col.title}</Badge>
                  <span className="text-xs text-muted-foreground">{col.items.length}</span>
                </div>
                <div className="space-y-2">
                  {col.items.map((item) => (
                    <Card key={item.id} className="shadow-sm cursor-grab active:cursor-grabbing">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.phone}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.event}</Badge>
                              <span className="text-[10px] text-muted-foreground">{item.date}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metricas" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="font-serif text-lg">Métricas Comerciais</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Taxa de Conversão</TableHead>
                    <TableHead>CPL / CAC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricsData.map((m) => (
                    <TableRow key={m.etapa}>
                      <TableCell className="font-medium">{m.etapa}</TableCell>
                      <TableCell>{m.taxa}</TableCell>
                      <TableCell>{m.cpl}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contratos" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="font-serif text-lg">Contratos</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Patrícia Nunes — Contrato #0132 — Aluguel", "Maria Santos — Contrato #0131 — Venda", "Camila Rocha — Contrato #0130 — Aluguel"].map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">{c}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Visualizar</Button>
                      <Button size="sm">Assinar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Comercial;
