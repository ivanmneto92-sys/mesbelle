// Utilitário Resend para todas as Edge Functions.
// Uso: import { enviarEmail, templateBase, botaoCTA } from "../_shared/resend.ts";

export interface EmailPayload {
  para: string | string[];
  assunto: string;
  html: string;
  de?: string; // usa EMAIL_FROM do env se não informado
  replyTo?: string;
}

export async function enviarEmail(payload: EmailPayload): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEnv = Deno.env.get("EMAIL_FROM") ?? "MesBelle <onboarding@resend.dev>";
  if (!apiKey) throw new Error("RESEND_API_KEY não configurado nos secrets");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.de ?? fromEnv,
      to: Array.isArray(payload.para) ? payload.para : [payload.para],
      subject: payload.assunto,
      html: payload.html,
      reply_to: payload.replyTo,
    }),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Resend API erro ${response.status}: ${erro}`);
  }
}

// ── Templates de e-mail reutilizáveis ──────────────────────────────────────

/** Wrapper HTML base com identidade visual da MesBelle */
export function templateBase(conteudo: string): string {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MesBelle</title>
  </head>
  <body style="margin:0;padding:0;background:#f9f5f1;font-family:'Georgia',serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f1;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0"
                 style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background:#4a1535;padding:32px 40px;text-align:center;">
                <img src="${Deno.env.get("SITE_URL") ?? "https://mesbelle.com.br"}/email-logo.png"
                     alt="MesBelle Atelier" width="96" height="96"
                     style="display:block;margin:0 auto;border-radius:12px;" />
              </td>
            </tr>
            <!-- Conteúdo -->
            <tr>
              <td style="padding:40px;">
                ${conteudo}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f9f5f1;padding:24px 40px;text-align:center;
                          border-top:1px solid #ede8e3;">
                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  © MesBelle Atelier · Este e-mail foi enviado automaticamente, não responda.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/** Botão CTA padrão */
export function botaoCTA(texto: string, url: string): string {
  return `
    <p style="text-align:center;margin:32px 0;">
      <a href="${url}"
         style="background:#4a1535;color:#f9f5f1;padding:14px 32px;border-radius:8px;
                text-decoration:none;font-size:15px;display:inline-block;letter-spacing:0.5px;">
        ${texto}
      </a>
    </p>
  `;
}
