import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Link2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

const MetaAds = () => {
  return (
    <>
      <SEO title="Meta Ads — Més Belle" description="Acompanhe o desempenho das suas campanhas." path="/marketing/meta-ads" />
      <div className="space-y-6">
        <PageHeader icon={BarChart3} title="Meta Ads" description="Acompanhe o desempenho das suas campanhas" />

        <Card className="card-editorial">
          <CardContent className="py-16 flex flex-col items-center text-center gap-4 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-xl">Integração com Meta Ads</h2>
              <p className="text-sm text-muted-foreground text-pretty">
                Configure sua conta Business Manager para visualizar dados de campanhas, custo por lead e ROI diretamente aqui.
              </p>
            </div>
            <Button disabled className="rounded-full">
              <Link2 className="h-4 w-4 mr-1.5" /> Conectar conta Meta
            </Button>
            <Badge variant="outline">Em breve</Badge>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MetaAds;
