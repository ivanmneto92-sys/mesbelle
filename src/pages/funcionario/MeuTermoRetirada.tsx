import { useState } from "react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";
import { useLogistica } from "@/hooks/useLogistica";
import TermoRetiradaModal from "@/components/logistica/TermoRetiradaModal";

const MeuTermoRetirada = () => {
  const { items, assinarTermo } = useLogistica();
  const [termoOpen, setTermoOpen] = useState(false);

  const eligible = items.filter((i) => i.statusLogistica === "para_enviar" || i.statusLogistica === "com_cliente");
  const pendentes = eligible.filter((i) => !i.assinaturaBase64).length;

  return (
    <>
      <SEO title="Termo de Retirada — Més Belle" description="Colete a assinatura digital da cliente na retirada da peça." path="/meu-termo-retirada" />
      <div className="space-y-6 max-w-2xl mx-auto">
        <PageHeader
          icon={FileText}
          title="Termo de Retirada"
          description="Gere o termo e colete a assinatura digital da cliente na hora da retirada"
        />

        <Card className="shadow-sm">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {eligible.length === 0
                  ? "Nenhuma peça aguardando retirada no momento"
                  : `${eligible.length} peça${eligible.length > 1 ? "s" : ""} elegível${eligible.length > 1 ? "eis" : ""} para retirada`}
              </p>
              {eligible.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  {pendentes > 0 ? (
                    <>{pendentes} ainda sem assinatura</>
                  ) : (
                    <><CheckCircle className="h-3.5 w-3.5 text-success" /> Todas assinadas</>
                  )}
                </p>
              )}
            </div>
            <Button onClick={() => setTermoOpen(true)}>
              <FileText className="h-4 w-4 mr-1" /> Gerar Termo de Retirada
            </Button>
          </CardContent>
        </Card>

        <TermoRetiradaModal items={items} open={termoOpen} onOpenChange={setTermoOpen} onAssinar={assinarTermo} />
      </div>
    </>
  );
};

export default MeuTermoRetirada;
