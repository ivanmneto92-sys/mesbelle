import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SignaturePad } from "@/components/comercial/SignaturePad";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { SEO } from "@/components/SEO";
import { baixarContratoPDF } from "@/components/comercial/ContratoAssinadoPDF";
import { toast } from "sonner";

interface PublicContrato {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cliente: string;
  data_evento: string;
  valor_total: number;
  termos_texto: string;
  status_assinatura: "pendente" | "assinado" | "cancelado";
  assinatura_base64: string | null;
  data_assinatura: string | null;
  token_expires_at: string | null;
}

type LoadState = "loading" | "ready" | "signed" | "invalid" | "cancelled" | "error";

export default function AssinaturaPublica() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<LoadState>("loading");
  const [contrato, setContrato] = useState<PublicContrato | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceIp, setEvidenceIp] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!contrato) return;
    setDownloading(true);
    try {
      await baixarContratoPDF({
        numero: contrato.numero,
        nome_cliente: contrato.nome_cliente,
        cpf_cliente: contrato.cpf_cliente,
        data_evento: contrato.data_evento,
        valor_total: contrato.valor_total,
        termos_texto: contrato.termos_texto,
        assinatura_base64: contrato.assinatura_base64,
        data_assinatura: contrato.data_assinatura,
        ip_assinatura: evidenceIp || null,
        user_agent: navigator.userAgent,
        token: token ?? null,
      });
    } catch (e) {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const load = async () => {
    if (!token) { setState("invalid"); return; }
    const { data, error } = await supabase.rpc("get_contrato_by_token", { _token: token });
    if (error || !data || !Array.isArray(data) || data.length === 0) {
      setState("invalid");
      return;
    }
    const c = data[0] as PublicContrato;
    setContrato(c);
    if (c.status_assinatura === "cancelado") setState("cancelled");
    else if (c.status_assinatura === "assinado") setState("signed");
    else setState("ready");
  };

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAssinar = async (base64: string) => {
    if (!token) return;
    setSubmitting(true);
    // Best-effort IP capture (server-side via header would be ideal; fallback to client meta)
    let ip = "";
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      const j = await r.json();
      ip = j.ip ?? "";
    } catch { /* ignore */ }
    setEvidenceIp(ip);

    const { data, error } = await supabase.rpc("assinar_contrato_publico", {
      _token: token,
      _assinatura: base64,
      _ip: ip,
      _user_agent: navigator.userAgent,
    });
    setSubmitting(false);
    if (error || !data || typeof data !== "object" || !(data as { ok?: boolean }).ok) {
      const err = (data as { error?: string })?.error ?? "erro_desconhecido";
      if (err === "ja_assinado") { setState("signed"); await load(); return; }
      if (err === "token_invalido_ou_expirado") { setState("invalid"); return; }
      alert("Não foi possível registrar a assinatura. Tente novamente.");
      return;
    }
    await load();
    setState("signed");

    // Envia a confirmação por e-mail à cliente — best-effort: se falhar, a
    // assinatura já foi registrada e a cliente ainda pode baixar o PDF aqui.
    supabase.functions.invoke("enviar-contrato-cliente", { body: { token } }).catch(console.error);
  };

  return (
    <>
      <SEO title="Assinatura Digital — Més Belle" description="Assine seu contrato digitalmente." path="/assinar" />
      <div className="min-h-screen bg-gradient-to-br from-[#fdf6f8] to-[#f8e9ef]">
        <header className="border-b bg-white/70 backdrop-blur">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif text-lg">M</div>
              <div>
                <p className="font-serif text-lg leading-tight text-primary">Més Belle</p>
                <p className="text-xs text-muted-foreground">Ateliê de Noivas</p>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:flex gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Assinatura segura
            </Badge>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-4">
          {state === "loading" && (
            <Card><CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Carregando contrato...</p>
            </CardContent></Card>
          )}

          {state === "invalid" && (
            <Card><CardContent className="py-12 text-center space-y-3">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h1 className="font-serif text-2xl">Link inválido ou expirado</h1>
              <p className="text-muted-foreground">Este link de assinatura não existe mais ou já expirou. Entre em contato com o ateliê para receber um novo.</p>
            </CardContent></Card>
          )}

          {state === "cancelled" && (
            <Card><CardContent className="py-12 text-center space-y-3">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h1 className="font-serif text-2xl">Contrato cancelado</h1>
              <p className="text-muted-foreground">Este contrato foi cancelado. Procure o ateliê para mais informações.</p>
            </CardContent></Card>
          )}

          {(state === "ready" || state === "signed") && contrato && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Contrato</p>
                      <h1 className="font-serif text-2xl text-primary">#{contrato.numero}</h1>
                    </div>
                    {state === "signed" ? (
                      <Badge className="bg-success/20 text-success border-success/30 border gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Assinado
                      </Badge>
                    ) : (
                      <Badge className="bg-warning/20 text-warning border-warning/30 border">Aguardando assinatura</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{contrato.nome_cliente}</p></div>
                    <div><p className="text-xs text-muted-foreground">CPF</p><p className="font-medium">{contrato.cpf_cliente}</p></div>
                    <div><p className="text-xs text-muted-foreground">Data do evento</p>
                      <p className="font-medium">{contrato.data_evento ? new Date(contrato.data_evento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</p>
                    </div>
                    <div><p className="text-xs text-muted-foreground">Valor total</p>
                      <p className="font-medium">R$ {Number(contrato.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Termos e condições</p>
                    <div className="bg-muted/50 rounded-lg p-4 max-h-72 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{contrato.termos_texto}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {state === "ready" && (
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="font-serif text-xl text-primary">Sua assinatura</h2>
                    <p className="text-sm text-muted-foreground">Ao assinar, você concorda com os termos acima. Sua data, hora e dispositivo serão registrados.</p>
                  </CardHeader>
                  <CardContent>
                    {submitting ? (
                      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-sm">Registrando assinatura...</p>
                      </div>
                    ) : (
                      <SignaturePad onConfirm={handleAssinar} height={240} />
                    )}
                  </CardContent>
                </Card>
              )}

              {state === "signed" && (
                <Card>
                  <CardContent className="py-8 text-center space-y-4">
                    <CheckCircle2 className="h-14 w-14 mx-auto text-success" />
                    <div>
                      <h2 className="font-serif text-2xl text-primary">Contrato assinado com sucesso!</h2>
                      <p className="text-sm text-muted-foreground mt-1">Uma cópia ficou registrada com data, hora e dispositivo.</p>
                    </div>
                    {contrato.assinatura_base64 && (
                      <div className="border rounded-xl p-4 bg-white max-w-xs mx-auto">
                        <p className="text-xs text-muted-foreground mb-2">Sua assinatura</p>
                        <img src={contrato.assinatura_base64} alt="Assinatura" className="max-h-[120px] mx-auto" />
                        {contrato.data_assinatura && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(contrato.data_assinatura).toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                      <Button onClick={handleDownloadPDF} disabled={downloading} size="lg" className="gap-2">
                        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Baixar contrato em PDF
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">O PDF inclui sua assinatura, data, hora e evidências de autenticidade. Guarde uma cópia para seus registros.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <p className="text-center text-xs text-muted-foreground pt-4">
            🔒 Assinatura eletrônica válida conforme MP 2.200-2/2001 art. 10 §2º
          </p>
        </main>
      </div>
    </>
  );
}
