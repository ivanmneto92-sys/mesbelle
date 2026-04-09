import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Truck, User, AlertTriangle, FileText } from "lucide-react";

type LogItem = { id: string; vestido: string; cliente: string; data: string };

const groups: { title: string; icon: React.ElementType; color: string; badge: string; items: LogItem[] }[] = [
  { title: "Para Enviar", icon: Send, color: "text-info", badge: "bg-info/20 text-info", items: [
    { id: "1", vestido: "Sereia Bordado Pedraria", cliente: "Ana Beatriz", data: "08/04/2026" },
    { id: "2", vestido: "Midi Crepe Dourado", cliente: "Fernanda Lima", data: "08/04/2026" },
  ]},
  { title: "Em Trânsito", icon: Truck, color: "text-warning", badge: "bg-warning/20 text-warning", items: [
    { id: "3", vestido: "Princesa Tule Rosa", cliente: "Camila Rocha", data: "07/04/2026" },
  ]},
  { title: "Com Cliente", icon: User, color: "text-success", badge: "bg-success/20 text-success", items: [
    { id: "4", vestido: "Longo Renda Preto", cliente: "Mariana Souza", data: "05/04/2026" },
    { id: "5", vestido: "A-line Verde Esmeralda", cliente: "Patrícia Nunes", data: "06/04/2026" },
  ]},
  { title: "Atrasado", icon: AlertTriangle, color: "text-destructive", badge: "bg-destructive/20 text-destructive", items: [
    { id: "6", vestido: "Tomara que Caia Azul", cliente: "Juliana Costa", data: "02/04/2026" },
  ]},
];

const Logistica = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold font-serif">Logística</h1>
        <p className="text-muted-foreground text-sm">Entregas e retiradas</p>
      </div>
      <Button size="sm"><FileText className="h-4 w-4 mr-1" /> Gerar Termo de Retirada</Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map((g) => (
        <Card key={g.title} className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif flex items-center gap-2">
              <g.icon className={`h-4 w-4 ${g.color}`} />
              {g.title}
              <Badge className={`${g.badge} border-0 ml-auto`}>{g.items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {g.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{item.vestido}</p>
                    <p className="text-xs text-muted-foreground">{item.cliente} • {item.data}</p>
                  </div>
                  <Button variant="outline" size="sm">Detalhes</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Logistica;
