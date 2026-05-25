import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Loader2, CheckCircle2, Heart } from "lucide-react";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";

interface Vendedor { id: string; nome: string }

export default function AvaliacaoPublica() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [funcionarioId, setFuncionarioId] = useState<string>("geral");
  const [nota, setNota] = useState<number>(0);
  const [hoverNota, setHoverNota] = useState<number>(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).rpc("listar_vendedores_publico");
      if (data) setVendedores(data as Vendedor[]);
    })();
  }, []);

  const handleSubmit = async () => {
    if (nota < 1) {
      toast.error("Por favor, escolha uma nota de 1 a 5 estrelas.");
      return;
    }
    if (comentario.length > 500) {
      toast.error("Comentário deve ter no máximo 500 caracteres.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await (supabase as any).rpc("submeter_avaliacao_publica", {
      _funcionario_id: funcionarioId === "geral" ? null : funcionarioId,
      _nota: nota,
      _comentario: comentario.trim() || null,
    });
    setSubmitting(false);
    if (error || !data?.ok) {
      toast.error("Não foi possível enviar sua avaliação. Tente novamente.");
      return;
    }
    setDone(true);
  };

  return (
    <>
      <SEO title="Avaliação — Més Belle" description="Conte como foi sua experiência no ateliê Més Belle." path="/avaliacao" />
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{ background: "linear-gradient(135deg, hsl(340, 83%, 6%) 0%, hsl(348, 88%, 12%) 100%)" }}
      >
        <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur border-0 shadow-2xl rounded-2xl">
          {done ? (
            <div className="text-center py-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl mb-2">Obrigada!</h1>
              <p className="text-muted-foreground flex items-center justify-center gap-1.5">
                Seu feedback é um presente <Heart className="h-4 w-4 text-primary fill-primary" />
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="font-display text-3xl">Sua opinião importa</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Conte como foi sua experiência no ateliê
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium block mb-2">Quem te atendeu?</label>
                  <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Não sei / Avaliação geral</SelectItem>
                      {vendedores.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Sua nota</label>
                  <div className="flex justify-center gap-2 py-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNota(n)}
                        onMouseEnter={() => setHoverNota(n)}
                        onMouseLeave={() => setHoverNota(0)}
                        className="transition-transform hover:scale-110"
                        aria-label={`${n} estrelas`}
                      >
                        <Star
                          className={`h-10 w-10 ${
                            (hoverNota || nota) >= n
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    Comentário <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <Textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value.slice(0, 500))}
                    placeholder="Conte mais sobre sua experiência..."
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">{comentario.length}/500</p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || nota < 1}
                  className="w-full h-12 rounded-full text-base"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                  ) : (
                    "Enviar avaliação"
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
