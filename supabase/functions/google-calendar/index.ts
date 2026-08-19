// ============================================================================
// SETUP — Configuração do Google Cloud (fazer manualmente antes de usar)
// ============================================================================
// 1. Acesse https://console.cloud.google.com e crie um projeto "MesBelle".
// 2. Ative a Google Calendar API: APIs e Serviços → Biblioteca → buscar
//    "Google Calendar API" → Ativar.
// 3. Crie uma Conta de Serviço: APIs e Serviços → Credenciais → Criar
//    Credenciais → Conta de Serviço. Nome sugerido: mesbelle-calendar.
//    Não precisa de papel especial no Google Cloud.
// 4. Na conta de serviço → Chaves → Adicionar Chave → JSON. Guarde o arquivo:
//    você vai precisar dos campos `client_email` e `private_key`.
// 5. Crie o calendário da empresa em https://calendar.google.com (conta do
//    ateliê): "Més Belle — Agenda". Nas configurações do calendário →
//    Compartilhar com pessoas específicas → adicione o `client_email` da
//    conta de serviço com permissão "Fazer alterações nos eventos". Copie o
//    ID do calendário (formato xxxxx@group.calendar.google.com).
// 6. Configure os secrets desta função no Supabase (Project Settings →
//    Edge Functions → Secrets):
//      GOOGLE_SERVICE_ACCOUNT_EMAIL       = client_email do JSON
//      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = private_key do JSON (com \n)
//      GOOGLE_CALENDAR_ID                 = ID do calendário do passo 5
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gera um access token para a Google Calendar API via JWT assinado (service account).
async function getGoogleAccessToken(): Promise<string> {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL")!;
  const rawKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")!.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const b64url = (s: string) => s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const header = b64url(btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = b64url(btoa(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })));
  const message = `${header}.${payload}`;

  const keyData = rawKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(message)
  );
  const sig = b64url(btoa(String.fromCharCode(...new Uint8Array(signature))));
  const jwt = `${message}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Falha ao autenticar com o Google: ${JSON.stringify(json)}`);
  }
  return json.access_token as string;
}

type Action =
  | { action: "upsert_prova"; leadId: string; nome: string; data: string; hora?: string; tipoEvento?: string }
  | { action: "upsert_entrega"; aluguelId: string; vestido: string; cliente: string; tipo: "saida" | "retorno"; data: string }
  | { action: "delete"; tipo: string; referenciaId: string };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Valida que quem chama está autenticado no Supabase antes de gastar uma
    // chamada à API do Google — a service_role key nunca é exposta ao cliente.
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const token = await getGoogleAccessToken();
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const body: Action = await req.json();

    // --- UPSERT PROVA ---
    if (body.action === "upsert_prova") {
      const { leadId, nome, data, hora, tipoEvento } = body;
      const isAllDay = !hora;
      const start = hora ? `${data}T${hora}:00` : data;
      const end = hora
        ? `${data}T${String(Number(hora.split(":")[0]) + 1).padStart(2, "0")}:${hora.split(":")[1]}:00`
        : data;

      const eventBody = {
        summary: `👗 Prova — ${nome}`,
        description: `Tipo de Evento: ${tipoEvento || "—"}\nCliente: ${nome}\nAgendado via Més Belle`,
        colorId: "11", // tomato (vermelho)
        ...(isAllDay
          ? { start: { date: data }, end: { date: data } }
          : { start: { dateTime: start, timeZone: "America/Sao_Paulo" }, end: { dateTime: end, timeZone: "America/Sao_Paulo" } }),
      };

      const { data: existing } = await supabase
        .from("google_calendar_events")
        .select("google_event_id")
        .eq("tipo", "prova")
        .eq("referencia_id", leadId)
        .maybeSingle();

      let googleEventId: string;
      if (existing?.google_event_id) {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existing.google_event_id}`,
          { method: "PUT", headers, body: JSON.stringify(eventBody) }
        );
        const ev = await res.json();
        googleEventId = ev.id;
      } else {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
          { method: "POST", headers, body: JSON.stringify(eventBody) }
        );
        const ev = await res.json();
        googleEventId = ev.id;
        await supabase.from("google_calendar_events").insert({
          tipo: "prova", referencia_id: leadId, google_event_id: googleEventId,
        });
      }

      return new Response(JSON.stringify({ ok: true, eventId: googleEventId }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // --- UPSERT ENTREGA/SAÍDA ---
    if (body.action === "upsert_entrega") {
      const { aluguelId, vestido, cliente, tipo, data } = body;
      const emoji = tipo === "saida" ? "🚚" : "📦";
      const label = tipo === "saida" ? "Saída" : "Devolução";
      const colorId = tipo === "saida" ? "2" : "5"; // sage / banana

      const eventBody = {
        summary: `${emoji} ${label} — ${vestido}`,
        description: `Cliente: ${cliente}\nVestido: ${vestido}\nRegistrado via Més Belle`,
        colorId,
        start: { date: data },
        end: { date: data },
      };

      const { data: existing } = await supabase
        .from("google_calendar_events")
        .select("google_event_id")
        .eq("tipo", tipo)
        .eq("referencia_id", aluguelId)
        .maybeSingle();

      let googleEventId: string;
      if (existing?.google_event_id) {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existing.google_event_id}`,
          { method: "PUT", headers, body: JSON.stringify(eventBody) }
        );
        const ev = await res.json();
        googleEventId = ev.id;
      } else {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
          { method: "POST", headers, body: JSON.stringify(eventBody) }
        );
        const ev = await res.json();
        googleEventId = ev.id;
        await supabase.from("google_calendar_events").insert({
          tipo, referencia_id: aluguelId, google_event_id: googleEventId,
        });
      }

      return new Response(JSON.stringify({ ok: true, eventId: googleEventId }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // --- DELETE ---
    if (body.action === "delete") {
      const { tipo, referenciaId } = body;
      const { data: existing } = await supabase
        .from("google_calendar_events")
        .select("google_event_id")
        .eq("tipo", tipo)
        .eq("referencia_id", referenciaId)
        .maybeSingle();

      if (existing?.google_event_id) {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existing.google_event_id}`,
          { method: "DELETE", headers }
        );
        await supabase.from("google_calendar_events")
          .delete().eq("tipo", tipo).eq("referencia_id", referenciaId);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
