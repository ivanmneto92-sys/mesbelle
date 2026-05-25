## Migrar dados restantes do localStorage para o banco

### Mudanças

**1. Migration — nova tabela `permissoes_config` (singleton)**
```sql
CREATE TABLE public.permissoes_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  vendedor jsonb NOT NULL,
  socio jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.permissoes_config ENABLE ROW LEVEL SECURITY;
-- Todos autenticados leem
CREATE POLICY "Permissoes read auth" ON public.permissoes_config FOR SELECT TO authenticated USING (true);
-- Apenas admin escreve
CREATE POLICY "Permissoes insert admin" ON public.permissoes_config FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Permissoes update admin" ON public.permissoes_config FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
-- Seed com defaults
INSERT INTO public.permissoes_config (id, vendedor, socio) VALUES (1, '{...defaults...}', '{...defaults...}');
-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.permissoes_config;
```

**2. `src/hooks/usePermissoes.ts` — refatorar**
- Remover `loadPermissoes()` / `localStorage`
- Carregar de `permissoes_config` no mount (estado loading)
- `updatePermissao` faz `update` no Supabase (otimista + rollback em erro)
- Inscrever em realtime para propagar mudanças entre dispositivos

**3. `src/components/layout/GlobalHeader.tsx` — alertas de logística**
- Substituir `getLogisticaAlerts()` por hook que consulta `alugueis_logistica`:
  - `status_logistica = 'atrasado'` OR (`status_logistica = 'para_enviar'` AND `data_saida = today`)
- Remover referência a `mesbelle_logistica`

**4. Cleanup**
- Remover `ACERVO_STORAGE_KEYS` export de `src/hooks/useAcervo.ts` (não tem consumidores)
- Manter `LEGACY_STORAGE_KEYS` em `useLeads.ts` (limpa cache antigo no logout — útil por mais um ciclo)

### Validação
- Admin altera permissão de Vendedor → recarregar em outro navegador → mudança presente
- Header mostra alertas reais de aluguéis atrasados/para enviar hoje
- Vendedor não consegue alterar `permissoes_config` (403)

### Fora de escopo
- Sessão Supabase Auth permanece em localStorage (padrão e correto)
