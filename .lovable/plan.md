# Análise de Segurança — Vazamento de Dados

Fiz uma varredura completa no backend (Lovable Cloud) e nas integrações. Encontrei **6 problemas**, sendo **1 crítico** relacionado a vazamento direto de dados sensíveis.

## Resumo dos achados

| # | Severidade | Problema | Risco |
|---|------------|----------|-------|
| 1 | **CRÍTICO** | Tabela `profiles` legível por qualquer usuário autenticado | Qualquer vendedor pode ver **comissão, contrato e telefone** de TODOS os colegas |
| 2 | Médio | Tabela `user_roles` legível por todos autenticados | Qualquer usuário pode enumerar quem é admin/sócio/vendedor |
| 3 | Baixo | Função `has_role` (SECURITY DEFINER) executável por `anon` e `authenticated` | Exposição da API interna a anônimos |
| 4 | Baixo | Função `handle_new_user` (SECURITY DEFINER) executável por `anon` e `authenticated` | Trigger interno não deveria ser chamável via API |

Sem achados em conectores externos. Sem segredos vazados no código. Edge function `create-team-member` valida JWT e checa role admin — OK.

## Correções propostas

### 1. `profiles` — restringir SELECT (CRÍTICO)
Remover a policy "Authenticated users can view all profiles" e substituir por duas:
- Usuário lê o **próprio** profile (`auth.uid() = user_id`)
- **Admins** leem todos (via `has_role(auth.uid(), 'admin')`)

Impacto na UI: telas que listam equipe (`Equipe.tsx`, `Socios.tsx`) já são restritas a admin/sócio nas rotas — continuam funcionando. Componentes que mostram nome de vendedor em leads/vendas precisarão buscar via join controlado ou via uma **view pública** com apenas `id, user_id, nome` (sem comissão/telefone/contrato).

### 2. `user_roles` — restringir SELECT
Substituir "Authenticated users can view roles" por:
- Usuário lê a **própria** role
- Admins leem todas

Impacto: `AuthContext.fetchUserRole` já busca apenas o próprio user_id — continua funcionando.

### 3 e 4. Revogar EXECUTE público das funções SECURITY DEFINER
```sql
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
```
`has_role` continua funcionando dentro das policies RLS (executa como definer). `handle_new_user` só roda via trigger.

### 5. View pública para nomes de vendedores (se necessário)
Criar `public.profiles_public` (view com `security_invoker=on`) expondo apenas `user_id, nome, ativo` — para telas que precisam mostrar "Vendedor responsável: Maria" sem vazar comissão.

## Arquivos afetados

- **Migração SQL nova** — policies + revokes + view
- **Nenhuma mudança no frontend** se a view for criada (os componentes que hoje fazem `select * from profiles` passam a usar `profiles_public`)
- Possíveis ajustes em `useEquipe.ts` se ele depender de leitura ampla para usuários não-admin (a verificar)

## O que NÃO está em risco

- Senhas: gerenciadas pelo Auth do Lovable Cloud, nunca expostas
- Service role key: usada apenas em edge functions
- Dados operacionais (leads, vendas, vestidos): hoje em `localStorage` por cliente, sem vazamento cross-user
- Edge function `create-team-member`: validação de JWT + checagem de role admin OK
