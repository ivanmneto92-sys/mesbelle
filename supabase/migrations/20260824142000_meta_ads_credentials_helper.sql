-- Credenciais do Meta Ads guardadas no Vault (META_ACCESS_TOKEN, META_AD_ACCOUNT_ID).
-- Helper restrito à service_role, usado só pela edge function meta-ads.
create or replace function public._get_meta_credentials()
returns table(access_token text, ad_account_id text)
language sql
security definer
set search_path = public
as $$
  select
    (select decrypted_secret from vault.decrypted_secrets where name = 'META_ACCESS_TOKEN'),
    (select decrypted_secret from vault.decrypted_secrets where name = 'META_AD_ACCOUNT_ID');
$$;

revoke all on function public._get_meta_credentials() from public, anon, authenticated;
grant execute on function public._get_meta_credentials() to service_role;
