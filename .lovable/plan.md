# Análise de Vazamento de Dados no Front-End

## TL;DR

**Risco ALTO**. Hoje, todos os dados de clientes, vendas, financeiro, vestidos, sócios e comissões estão em `localStorage` no navegador, em texto puro, sem criptografia e sem vínculo com o usuário autenticado. Qualquer pessoa com acesso físico ao computador/tablet — ou com uma extensão maliciosa — lê tudo em segundos. Não é um problema de RLS no backend; é arquitetural: os dados nunca chegam ao backend.

## O que está exposto no `localStorage` do navegador

| Chave | Conteúdo sensível |
|-------|-------------------|
| `mesbelle_leads` | Nome, telefone, e-mail, evento, orçamento de **toda cliente** |
| `mesbelle_medidas` | Medidas corporais das clientes |
| `mesbelle_contratos` | Contratos assinados (PDF base64 / assinatura digital) |
| `mesbelle_negocios` | Valores fechados, descontos, vendedora responsável |
| `mesbelle_financeiro` | DRE, fluxo de caixa, impostos da empresa |
| `mesbelle_vestidos` / `mesbelle_reservas` / `mesbelle_producoes` / `mesbelle_etapas` | Acervo completo, custos, fornecedores |
| `mesbelle_logistica` | Endereços de entrega de clientes |
| `mesbelle_permissoes` | Matriz de permissões editável pelo cliente |
| (Sócios) Multiplicador de valuation, distribuição de lucros | Dados estratégicos da empresa |

## Cenários reais de vazamento

1. **Computador compartilhado no ateliê** — vendedora sai, próxima pessoa abre DevTools → Application → Local Storage e copia tudo.
2. **iPad esquecido** — quem pegar o aparelho desbloqueado vê toda a base.
3. **Extensão de navegador maliciosa** — lê `localStorage` de qualquer aba.
4. **XSS** (script injetado via campo de texto sem sanitização) — exfiltra `localStorage` inteiro para servidor externo. Já existe risco hoje em campos como observações de lead.
5. **Login com outra conta** — `localStorage` é por **navegador, não por usuário**. Quem logar depois enxerga os dados da pessoa anterior.
6. **Bypass de permissão** — `usePermissoes` valida no cliente. Basta editar `mesbelle_permissoes` no DevTools para virar admin visual.

## O que NÃO está em risco

- Credenciais e senhas (Lovable Cloud Auth, nunca no front).
- Tabelas `profiles` e `user_roles` (já corrigidas — RLS restrita).
- Service role key (só em edge functions).
- Conexões externas (não há APIs bancárias por design).

## Vetores adicionais identificados

- **Sem sanitização de HTML** em campos livres (observações, descrições) → janela aberta para XSS.
- **Sem Content Security Policy (CSP)** no `index.html` → qualquer script de terceiros pode rodar.
- **Mock de dados iniciais hardcoded** em `useLeads.ts` e similares ficam no bundle JS público — clientes fictícias, mas o padrão de exposição é o mesmo.
- **`localStorage` não é limpo no logout** — só ao chamar `clearAppStorage()` em casos de erro.

## Recomendação estratégica

A correção real exige **migrar os dados operacionais do `localStorage` para o Lovable Cloud** com RLS por papel (admin / vendedor / sócio). Isso resolve simultaneamente:

- Multi-dispositivo (hoje cada navegador tem sua base própria, não sincroniza).
- Vazamento físico (dados não ficam no aparelho).
- Bypass de permissão (validação server-side).
- Auditoria (quem viu/editou o quê).

## Plano de mitigação em camadas

### Imediato (1 sessão de trabalho) — reduz risco sem refazer arquitetura
1. **Limpar `localStorage` no logout** — chamar `clearAppStorage()` dentro de `AuthContext.logout()`.
2. **Limpar `localStorage` ao trocar de usuário** — detectar mudança de `user.id` no `AuthContext` e limpar antes de carregar.
3. **Adicionar CSP** em `index.html` (`default-src 'self'`, bloqueando inline scripts externos).
4. **Sanitizar entradas livres** (observações, descrições) com DOMPurify antes de renderizar.
5. **Mover `usePermissoes` para read-only no cliente** e validar permissões via `has_role` no backend nas operações sensíveis (já estamos prontos — `user_roles` existe).
6. **Avisar visualmente** quando o usuário não for admin e tentar acessar dados financeiros — hoje a rota bloqueia, mas os dados ainda existem no `localStorage`.

### Curto prazo (próximas iterações) — migração progressiva
Migrar do `localStorage` para o Lovable Cloud, em ordem de criticidade:
1. **Clientes / Leads / Medidas / Contratos** (CRM) — dados pessoais LGPD.
2. **Financeiro / Sócios** — dados estratégicos.
3. **Vendas / Negociações** — comissões e valores.
4. **Acervo / Produção / Logística** — menos sensível, pode ficar por último.

Cada migração inclui:
- Tabela com RLS por papel
- Hook reescrito usando `supabase.from(...).select()`
- Remoção do `localStorage` correspondente

### Médio prazo
- Auditoria de acessos (log de quem leu/editou) via tabela `audit_log` + trigger.
- Rate limiting nas edge functions sensíveis.
- Exportação/importação de dados controlada por admin (LGPD: portabilidade).

## Decisão necessária

Quer que eu execute:

- **(A) Mitigação imediata** (passos 1–6 acima) — defensável, mas dados continuam no navegador
- **(B) Mitigação imediata + migrar CRM (clientes) para o Cloud** — corrige o vetor mais sensível (LGPD)
- **(C) Plano completo** — migrar tudo para o Cloud, módulo por módulo

Recomendo começar por **(B)**: protege o dado mais regulado (clientes) primeiro e mantém o resto operacional enquanto migramos.
