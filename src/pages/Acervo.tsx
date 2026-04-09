import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Tag, Calendar } from "lucide-react";

interface Vestido {
  id: string; name: string; category: string; color: string; size: string;
  rentPrice: string; salePrice: string; status: "disponivel" | "alugado" | "ajuste";
  consigned: boolean; image: string;
}

const vestidos: Vestido[] = [
  { id: "1", name: "Sereia Bordado Pedraria", category: "Longo", color: "Marsala", size: "M", rentPrice: "R$ 1.200", salePrice: "R$ 4.800", status: "disponivel", consigned: false, image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300&h=400&fit=crop" },
  { id: "2", name: "Princesa Tule Rosa", category: "Longo", color: "Rosa", size: "P", rentPrice: "R$ 980", salePrice: "R$ 3.500", status: "alugado", consigned: false, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop" },
  { id: "3", name: "Midi Crepe Dourado", category: "Midi", color: "Dourado", size: "G", rentPrice: "R$ 650", salePrice: "R$ 2.200", status: "disponivel", consigned: true, image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=400&fit=crop" },
  { id: "4", name: "Longo Renda Preto", category: "Longo", color: "Preto", size: "M", rentPrice: "R$ 890", salePrice: "R$ 3.200", status: "ajuste", consigned: false, image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop" },
  { id: "5", name: "Tomara que Caia Azul", category: "Longo", color: "Azul Royal", size: "P", rentPrice: "R$ 1.100", salePrice: "R$ 4.200", status: "disponivel", consigned: false, image: "https://images.unsplash.com/photo-1562137369-1a1a0bc66744?w=300&h=400&fit=crop" },
  { id: "6", name: "A-line Verde Esmeralda", category: "Longo", color: "Verde", size: "GG", rentPrice: "R$ 780", salePrice: "R$ 2.800", status: "disponivel", consigned: true, image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop" },
];

const statusMap = { disponivel: { label: "Disponível", variant: "default" as const }, alugado: { label: "Alugado", variant: "secondary" as const }, ajuste: { label: "Em Ajuste", variant: "outline" as const } };

const productionSteps = [
  { name: "Tecido Comprado", done: true },
  { name: "Modelista", done: true },
  { name: "Costura Base", done: true },
  { name: "Bordadeira", done: false },
  { name: "Provas", done: false },
  { name: "Acabamento Final", done: false },
  { name: "Entrega", done: false },
];

const Acervo = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = vestidos.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.color.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Acervo & Produção</h1>
          <p className="text-muted-foreground text-sm">Gestão de inventário e ateliê</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Vestido</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">Cadastrar Vestido</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Input placeholder="Nome do vestido" className="col-span-2" />
              <Select><SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent><SelectItem value="longo">Longo</SelectItem><SelectItem value="midi">Midi</SelectItem><SelectItem value="curto">Curto</SelectItem></SelectContent></Select>
              <Input placeholder="Cor" />
              <Input placeholder="Tamanho" />
              <Input placeholder="Valor Aluguel (R$)" />
              <Input placeholder="Valor Venda (R$)" />
              <Select><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="disponivel">Disponível</SelectItem><SelectItem value="alugado">Alugado</SelectItem><SelectItem value="ajuste">Em Ajuste</SelectItem></SelectContent></Select>
              <div className="col-span-2"><label className="text-sm text-muted-foreground">Foto</label><Input type="file" accept="image/*" className="mt-1" /></div>
              <Button className="col-span-2">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="producao">Produção</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar vestido, cor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="alugado">Alugado</SelectItem>
                <SelectItem value="ajuste">Em Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((v) => (
              <Card key={v.id} className="overflow-hidden shadow-sm group cursor-pointer hover:shadow-md transition-shadow">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={v.image} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant={statusMap[v.status].variant} className="text-[10px]">{statusMap[v.status].label}</Badge>
                    {v.consigned && <Badge className="bg-primary text-primary-foreground text-[10px] border-0"><Tag className="h-2.5 w-2.5 mr-0.5" />Consignado</Badge>}
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.color} • {v.size} • {v.category}</p>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-primary font-medium">Aluguel: {v.rentPrice}</span>
                    <span className="text-muted-foreground">Venda: {v.salePrice}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-2 text-xs"><Calendar className="h-3 w-3 mr-1" />Ver Agenda</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="producao" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="font-serif text-lg">Produção — Primeiro Aluguel</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Vestido Sereia Pedraria — Cliente Maria Silva</p>
                      <p className="text-xs text-muted-foreground">Prazo: 20/07/2026 • Prova: 10/07/2026</p>
                    </div>
                    <Badge>Em Produção</Badge>
                  </div>
                  <div className="space-y-2">
                    {productionSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Checkbox checked={step.done} disabled />
                        <span className={`text-sm ${step.done ? "line-through text-muted-foreground" : ""}`}>{step.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">Upload Referência</Button>
                    <Button variant="outline" size="sm">Detalhes Técnicos</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Acervo;
