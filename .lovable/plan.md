

## Criar usuário Admin inicial

O login falha porque o banco está vazio — não existe nenhum usuário real ainda. Vou criar o primeiro admin com as credenciais que você informou.

### O que será feito

1. **Criar uma Edge Function temporária `seed-admin`** que usa `supabase.auth.admin.createUser()` para criar o usuário com:
   - E-mail: `rafacheik@outlook.com`
   - Senha: `12345678`
   - E-mail já confirmado

2. **Chamar a função** para criar o usuário — o trigger `handle_new_user` cria o profile automaticamente

3. **Inserir a role `admin`** na tabela `user_roles` via migração SQL

4. **Remover a Edge Function `seed-admin`** após uso (não precisa ficar no projeto)

### Abordagem técnica

Como não é possível inserir diretamente em `auth.users` via SQL, usaremos uma Edge Function com `SUPABASE_SERVICE_ROLE_KEY` para criar o usuário via Admin API, e uma migração para garantir que a role admin seja atribuída via trigger automático.

**Alternativa mais simples**: Criar um trigger que atribui `admin` ao primeiro usuário criado, e então criar o usuário via Edge Function.

### Resultado esperado

Após a execução, você poderá fazer login com `rafacheik@outlook.com` / `12345678` e terá acesso admin completo ao sistema.

