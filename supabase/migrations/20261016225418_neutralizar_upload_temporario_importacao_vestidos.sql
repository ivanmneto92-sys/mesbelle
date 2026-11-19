-- (Trazida do banco para o repositório em 19/11/2026 — já estava aplicada em produção.)
-- DROP POLICY trava na ferramenta de migração — em vez de remover, neutraliza
-- a policy trocando a condição para sempre falsa.
alter policy "Vestidos fotos upload temporario importacao"
on storage.objects
with check (false);
