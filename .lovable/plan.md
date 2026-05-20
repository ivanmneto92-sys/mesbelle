# Restringir leitura por papel (RLS SELECT)

## Situação atual

Após a migração para o Lovable Cloud, todas as tabelas estão com RLS ativa e escrita restrita por papel. Porém, o scanner apontou **9 alertas (4 erros + 5 avisos)**: todas as tabelas usam `SELECT USING (true)`, ou seja, **qualquer usuário autenticado lê tudo** — incluindo CPF, endereços, medidas, contratos assinados, financeiro e participação dos sócios.

Avanços já conquistados nas etapas anteriores:
- RLS ativa em todas as tabelas operacionais
- Escrita restrita (admin/vendedor para CRM e operações; somente admin para Financeiro e Sócios)
- localStorage limpo no logout e dados de CRM migrados para o backend
- Sanitização de campos livres com DOMPurify

## Objetivo

Aplicar princípio do menor privilégio também na **leitura**, encerrando os 9 alertas.

## Matriz de leitura proposta

| Tabela | Quem pode ler |
|---|---|
| leads, medidas, contratos, negocios | admin + vendedor |
| funcionarios | admin (todos) + próprio funcionário (sua linha, via match por email) |
| vendas_funcionarios, avaliacoes_clientes | admin + vendedor |
| vestidos, reservas_agenda, producoes, etapas_producao | admin + vendedor |
| alugueis_logistica | admin + vendedor |
| transacoes_financeiras, config_financeiro | admin |
| ativos_patrimonio, socios_empresa, config_socios | admin + sócio |

Observação: a leitura para "sócio" usa o papel `socio` já existente em `app_role`, garantindo que o Portal do Sócio continue funcionando sem expor essas tabelas a vendedores/atendentes.

## O que será feito

1. **Migração SQL** substituindo as policies `SELECT USING (true)` por verificações com `has_role` / `can_write_crm` / regra de "próprio funcionário".
2. **Função helper** `can_read_crm(uid)` = admin OR vendedor — apenas para evitar repetição.
3. **Função helper** `can_read_socios(uid)` = admin OR socio.
4. **Validação rápida** após aplicar: rodar novamente o scanner e checar telas chave (CRM, Comercial, Financeiro, Sócios, Equipe) com cada papel.

## Detalhes técnicos

- Será criada uma migração única dropando as policies "* read for authenticated" / "* read auth" atuais e recriando com as condições por papel.
- A policy de `funcionarios` para o próprio usuário usará `email = (SELECT email FROM auth.users WHERE id = auth.uid())` dentro de uma função `SECURITY DEFINER` para evitar leitura cruzada de `auth.users`.
- Nenhuma mudança em código front-end é necessária: os hooks já estão preparados para receber listas vazias quando o papel não tiver permissão.

## Riscos

- Usuários sem papel atribuído deixarão de ver dados. Mitigação: garantir que todo usuário ativo tenha pelo menos um papel (admin, vendedor ou socio) no `user_roles`.
- Telas que misturam dados de múltiplos módulos (ex.: Dashboard) podem ficar parcialmente vazias para papéis restritos — comportamento esperado.
