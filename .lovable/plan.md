## Correção de permissões RLS (403 em todo o app)

### Causa raiz
As funções `SECURITY DEFINER` usadas pelas políticas RLS (`has_role`, `can_read_crm`, `can_write_crm`, `can_read_socios`, `is_own_funcionario`) não têm `EXECUTE` concedido para o role `authenticated`. Resultado: toda query autenticada retorna 403 (`permission denied for function has_role`), incluindo login (role/nome), CRM, Comercial, Contratos, Acervo, Logística, Equipe, Sócios e Financeiro.

### Mudanças

**1. Migration SQL** — conceder EXECUTE nas 5 funções:
```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_read_crm(uuid)                 TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_write_crm(uuid)                TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_read_socios(uuid)              TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_own_funcionario(uuid, text)     TO authenticated, anon;
```
As funções permanecem `SECURITY DEFINER` — apenas o privilégio de execução é liberado. Sem isso, todas as policies que as chamam falham silenciosamente com 403.

**2. `src/contexts/AuthContext.tsx`** — Melhorar tratamento de erro nas queries `user_roles` e `profiles`:
- logar `error.message` no console
- exibir toast "Falha ao carregar perfil — recarregue a página" se erro 403/permissão
- não mascarar erro como "vendedor" silenciosamente

### Validação pós-fix
- `/rest/v1/user_roles` e `/rest/v1/profiles` retornam 200
- Dashboard, CRM, Comercial, Contratos carregam dados
- Aprovar negociação gera contrato sem erro 403
- Login mostra nome e cargo corretos no header

### Fora de escopo (anotado para depois)
- Tratamento individual de erros no `Promise.all` de `useLeads.ts`
- Índice único em `contratos.numero` para evitar duplicação no formato `MB-YYMM-###`
- Comportamento de `addContrato` quando há contrato cancelado preexistente
