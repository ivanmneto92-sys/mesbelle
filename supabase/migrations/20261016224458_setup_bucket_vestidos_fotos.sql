-- (Trazida do banco para o repositório em 19/11/2026 — já estava aplicada em produção.)
-- Bucket público para as fotos dos vestidos importados (104 peças).
insert into storage.buckets (id, name, public)
values ('vestidos', 'vestidos', true)
on conflict (id) do nothing;

-- Leitura pública (necessária pro <img> carregar sem autenticação).
create policy "Vestidos fotos leitura publica"
on storage.objects for select
to public
using (bucket_id = 'vestidos');

-- Upload temporário via chave anon, só pra essa importação em lote —
-- removida logo depois de concluída (ver cleanup no fim da importação).
create policy "Vestidos fotos upload temporario importacao"
on storage.objects for insert
to anon
with check (bucket_id = 'vestidos');
