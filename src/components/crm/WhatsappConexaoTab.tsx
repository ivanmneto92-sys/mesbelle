import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, QrCode, WifiOff } from "lucide-react";
import { useWhatsappConexao } from "@/hooks/useWhatsappConexao";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function WhatsappConexaoTab() {
  const { status, qr, numeroConectado, atualizadoEm, loading } = useWhatsappConexao();
  const [qrImagem, setQrImagem] = useState<string | null>(null);

  // Gera a imagem do QR code no navegador a partir do texto que o bot
  // escreveu no banco — assim não precisa o bot gerar/subir uma imagem,
  // só o texto que o WhatsApp manda.
  useEffect(() => {
    if (!qr) {
      setQrImagem(null);
      return;
    }
    let cancelado = false;
    QRCode.toDataURL(qr, { width: 280, margin: 1 })
      .then((url) => { if (!cancelado) setQrImagem(url); })
      .catch((err) => console.error("[WhatsApp] Falha ao gerar imagem do QR code:", err));
    return () => { cancelado = true; };
  }, [qr]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" /> Conexão com o WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        {status === "conectado" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="p-4 bg-success/10 rounded-full">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <p className="font-medium">WhatsApp conectado</p>
              {numeroConectado && (
                <p className="text-sm text-muted-foreground mt-1">{numeroConectado}</p>
              )}
            </div>
          </div>
        )}

        {status === "aguardando_qr" && (
          <div className="flex flex-col items-center gap-3 py-4">
            {qrImagem ? (
              <img src={qrImagem} alt="QR code para conectar o WhatsApp" className="rounded-lg border" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground max-w-xs">
              Abra o WhatsApp no celular → Aparelhos conectados → Conectar aparelho, e escaneie este código.
            </p>
          </div>
        )}

        {status === "desconectado" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="p-4 bg-muted rounded-full">
              <WifiOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">WhatsApp desconectado</p>
              <p className="text-sm text-muted-foreground mt-1">
                O serviço do WhatsApp (whatsapp-bot) ainda não está rodando ou perdeu a conexão.
              </p>
            </div>
          </div>
        )}

        {atualizadoEm && (
          <p className="text-xs text-muted-foreground border-t pt-3">
            Atualizado {format(parseISO(atualizadoEm), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
