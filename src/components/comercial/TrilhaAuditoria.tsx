import { Badge } from "@/components/ui/badge";
import { Contrato } from "@/types/comercial";
import { ShieldCheck, Clock, Globe, Monitor, KeyRound, CalendarClock, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

function parseUA(ua?: string): string {
  if (!ua) return "—";
  const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile/.test(ua));
  const isIPhone = /iPhone/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isWin = /Windows/.test(ua);
  const isMac = /Macintosh/.test(ua) && !isIPad;
  const browser = /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : /Edg\//.test(ua) ? "Edge" : "Navegador";
  const device = isIPad ? "iPad" : isIPhone ? "iPhone" : isAndroid ? "Android" : isWin ? "Windows" : isMac ? "Mac" : "Desconhecido";
  return `${device} • ${browser}`;
}

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "medium" }) : "—");

interface Props { contrato: Contrato }

export function TrilhaAuditoria({ contrato }: Props) {
  const assinado = contrato.statusAssinatura === "assinado";
  const cancelado = contrato.statusAssinatura === "cancelado";
  const tokenAtivo = !!contrato.signingToken && (!contrato.tokenExpiresAt || new Date(contrato.tokenExpiresAt) > new Date());

  return (
    <div className="border rounded-xl bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="font-serif text-sm font-semibold text-primary">Trilha de Auditoria</h3>
        <Badge
          variant="outline"
          className={
            assinado
              ? "ml-auto bg-success/15 text-success border-success/30 text-[10px]"
              : cancelado
              ? "ml-auto bg-destructive/15 text-destructive border-destructive/30 text-[10px]"
              : "ml-auto bg-warning/15 text-warning border-warning/30 text-[10px]"
          }
        >
          {assinado ? "Assinado" : cancelado ? "Cancelado" : "Pendente"}
        </Badge>
      </div>

      <ul className="space-y-2 text-xs">
        <Item icon={<FileText className="h-3.5 w-3.5" />} label="Contrato gerado em" value={fmt(contrato.dataCriacao + "T00:00:00")} />

        {tokenAtivo && !assinado && (
          <Item
            icon={<KeyRound className="h-3.5 w-3.5" />}
            label="Link de assinatura"
            value={
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-success" /> Ativo
                {contrato.tokenExpiresAt && <span className="text-muted-foreground">• expira {fmt(contrato.tokenExpiresAt)}</span>}
              </span>
            }
          />
        )}

        {assinado ? (
          <>
            <Item icon={<Clock className="h-3.5 w-3.5" />} label="Assinado em" value={fmt(contrato.dataAssinatura)} highlight />
            <Item icon={<Globe className="h-3.5 w-3.5" />} label="Endereço IP" value={contrato.ipAssinatura || "não capturado"} mono />
            <Item icon={<Monitor className="h-3.5 w-3.5" />} label="Dispositivo" value={parseUA(contrato.userAgentAssinatura)} />
            {contrato.userAgentAssinatura && (
              <li className="pl-5 -mt-1 text-[10px] text-muted-foreground/70 break-all font-mono leading-tight">
                {contrato.userAgentAssinatura}
              </li>
            )}
            {contrato.signingToken && (
              <Item icon={<KeyRound className="h-3.5 w-3.5" />} label="Token" value={contrato.signingToken} mono small />
            )}
          </>
        ) : (
          !cancelado && (
            <Item
              icon={<AlertCircle className="h-3.5 w-3.5" />}
              label="Assinatura"
              value={<span className="text-muted-foreground">Aguardando assinatura da cliente</span>}
            />
          )
        )}

        {contrato.emailCliente && (
          <Item icon={<CalendarClock className="h-3.5 w-3.5" />} label="E-mail vinculado" value={contrato.emailCliente} />
        )}
      </ul>

      {assinado && (
        <p className="text-[10px] text-muted-foreground border-t pt-2">
          🔒 Evidências armazenadas conforme MP 2.200-2/2001 art. 10 §2º. Esta trilha comprova autoria e integridade da assinatura eletrônica.
        </p>
      )}
    </div>
  );
}

function Item({ icon, label, value, mono, small, highlight }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean; small?: boolean; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className={`flex-1 ${mono ? "font-mono" : ""} ${small ? "text-[10px] break-all" : ""} ${highlight ? "font-semibold text-foreground" : ""}`}>
        {value}
      </span>
    </li>
  );
}
