-- Cache de quais breakdowns de asset/mídia a Graph API aceita para esta
-- conta (evita re-testar breakdown inválido a cada refresh — Fase 19).
-- Sem policies = bloqueado para anon/authenticated por padrão do RLS, só a
-- edge function meta-media-insights (service_role) acessa.
create table if not exists public.meta_breakdown_capabilities (
  ad_account_id text primary key,
  image_asset boolean,
  video_asset boolean,
  media_asset_url boolean,
  flexible_format_asset_type boolean,
  media_type boolean,
  detalhes jsonb,
  tested_at timestamptz not null default now()
);
alter table public.meta_breakdown_capabilities enable row level security;
