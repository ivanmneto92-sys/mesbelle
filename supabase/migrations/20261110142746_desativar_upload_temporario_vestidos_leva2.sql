-- (Trazida do banco para o repositório em 19/11/2026 — já estava aplicada em produção.)
alter policy "Vestidos fotos upload temporario importacao" on storage.objects with check (false);
