

## Migrar para Supabase Auth + Cadastro de Vendedor pelo Admin

Esta e uma migracao significativa: o sistema atual usa autenticacao simulada (mock) com localStorage. Precisamos conectar um backend real (Lovable Cloud/Supabase) para ter autenticacao real com envio de e-mail.

### Pre-requisito

O projeto ainda nao tem Supabase configurado. O primeiro passo e habilitar o Lovable Cloud (backend integrado) que provisiona automaticamente um projeto Supabase.

### O que sera feito

**1. Habilitar Lovable Cloud**
- Voce precisara ativar o Lovable Cloud nas configuracoes do projeto (Settings > Backend). Isso cria automaticamente o banco de dados e a autenticacao.

**2. Criar tabela `profiles` e `user_roles`**
- `profiles`: id (FK auth.users), nome, cargo, tipo_contrato, percentual_comissao, telefone, ativo
- `user_roles`: user_id (FK auth.users), role (admin/vendedor/socio) — separada para seguranca
- RLS policies para cada tabela
- Trigger para criar profile automaticamente no signup

**3. Reescrever `AuthContext.tsx`**
- Trocar mock por Supabase Auth real (`supabase.auth.signInWithPassword`, `onAuthStateChange`)
- Buscar role do usuario da tabela `user_roles`
- Manter a interface `useAuth()` igual para nao quebrar o resto do app

**4. Criar `src/integrations/supabase/client.ts`**
- Cliente Supabase configurado com as env vars do Lovable Cloud

**5. Atualizar `Login.tsx`**
- Remover credenciais de teste
- Usar `supabase.auth.signInWithPassword()`
- Adicionar fluxo de "esqueceu a senha" real

**6. Criar pagina `/redefinir-senha`**
- Formulario para definir nova senha apos clicar no link do e-mail
- Usa `supabase.auth.updateUser({ password })`

**7. Funcionalidade "Admin cadastra vendedor"**
- Novo modal na pagina Equipe: formulario com nome, email, cargo, contrato, comissao
- Ao salvar, cria o usuario via Edge Function (usando `supabase.auth.admin.createUser`) com `email_confirm: false`
- Envia e-mail automatico do Supabase para o vendedor definir sua senha
- Cria o profile e a role automaticamente

**8. Edge Function `create-team-member`**
- Recebe dados do formulario (nome, email, role, cargo, etc.)
- Valida que quem chama e admin
- Cria usuario no Supabase Auth
- Insere profile e role
- Dispara convite por e-mail (password reset link)

### Fluxo do vendedor

```text
Admin preenche formulario → Edge Function cria usuario
→ Vendedor recebe e-mail → Clica no link → Define senha
→ Faz login normalmente
```

### Arquivos criados
- `src/integrations/supabase/client.ts`
- `src/pages/RedefinirSenha.tsx`
- `supabase/functions/create-team-member/index.ts`
- Migracoes SQL (profiles, user_roles, RLS, triggers)

### Arquivos modificados
- `src/contexts/AuthContext.tsx` (Supabase Auth real)
- `src/pages/Login.tsx` (remover mock, usar Supabase)
- `src/pages/Equipe.tsx` (modal de cadastro de vendedor)
- `src/App.tsx` (adicionar rota /redefinir-senha)

### Proximo passo
Para iniciar, voce precisa habilitar o Lovable Cloud. Va em **Settings** (engrenagem no canto inferior esquerdo) > **Backend** e ative o Lovable Cloud. Depois disso, posso implementar tudo.

