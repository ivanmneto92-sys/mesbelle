# Melhoria de Layout e Verificação de Rotas

## Objetivo
Tornar o sistema mais **intuitivo, consistente e elegante**, padronizando cabeçalhos, navegação e densidade visual em todas as páginas, e validar que todas as rotas estão funcionais para cada papel (admin, vendedor, sócio).

## Escopo visual (frontend apenas — sem mexer em lógica de dados)

### 1. Shell global (AppLayout + AppSidebar + Header)
- **Sidebar**: reorganizar em **grupos semânticos** com `SidebarGroupLabel`:
  - *Operação*: Dashboard, CRM, Comercial, Acervo, Logística
  - *Gestão*: Financeiro, Equipe, Sócios
  - *Sistema*: Configurações
- Manter colapso por ícone, com tooltip ao passar o mouse.
- Destacar rota ativa com barra lateral em `--primary` (atualmente só fundo).
- **Header**: adicionar **breadcrumb** dinâmico baseado na rota (Início / Seção / Subseção) + título da página à esquerda, ações + notificações + avatar à direita.
- Avatar do usuário com **iniciais coloridas** no lugar do nome cru no header.
- Versão mobile: header sticky, sidebar via Sheet (já funciona, mas o trigger fica mais visível).

### 2. Padrão de PageHeader reutilizável
Criar `src/components/layout/PageHeader.tsx` com:
- Título (`font-serif`), descrição curta, ícone do módulo (esquerda).
- Slot de ações primárias (direita).
- Linha divisória sutil abaixo.
Aplicar em: Dashboard, CRM, Comercial, Acervo, Logística, Financeiro, Equipe, Sócios, Configurações — eliminando os cabeçalhos artesanais repetidos hoje.

### 3. Padrão de tabs
Padronizar `TabsList` com largura fluida em mobile (`overflow-x-auto`), ícone + label em cada tab. Aplicar em CRM, Comercial, Acervo, Logística, Financeiro, Equipe, Sócios, Configurações.

### 4. Dashboard
- Trocar mocks por dados reais via hooks existentes (`useLeads`, `useFinanceiro`, `useLogistica`, `useAcervo`) — somente leitura, sem alterar regras.
- Cartões de métrica com **ícone à esquerda, número grande, variação à direita** (mais limpo).
- Painel de "Atalhos rápidos" no topo (Novo Lead / Nova Venda / Nova Reserva) — links para as rotas certas, respeitando permissões.
- "Avisos rápidos" passa a ser scrollável e clicável (cada item navega para a página de origem).

### 5. Estados vazios e loading
- Componente `EmptyState` reutilizável (ícone, título, descrição, CTA).
- Componente `LoadingState` com skeletons coerentes (substitui o spinner genérico).
- Aplicar em todas as listas/kanbans/tabelas.

### 6. Login
Pequenos ajustes (sem refazer):
- Reduzir a "muralha de texto" mobile, melhorar contraste do placeholder.
- Mensagem de erro inline (abaixo do campo) em vez de só toast.

### 7. Tokens e tipografia
- Garantir uso de tokens semânticos (`primary`, `muted-foreground`, etc.) — remover cores HSL inline residuais em páginas internas (login pode manter por ser dark exclusivo).
- Padronizar tamanhos de título (`text-2xl font-serif` em h1 de página, `text-lg` em CardTitle).

## Verificação de rotas
Conferir manualmente cada item do sidebar para os 3 papéis:

| Rota          | admin | vendedor | sócio |
|---------------|:-----:|:--------:|:-----:|
| `/`           |   ✓   |    ✓     |   ✓   |
| `/crm`        |   ✓   |    ✓     |   —   |
| `/comercial`  |   ✓   |    ✓     |   —   |
| `/acervo`     |   ✓   |    ✓     |   —   |
| `/logistica`  |   ✓   |    ✓     |   —   |
| `/financeiro` |   ✓   |    —     |   —   |
| `/equipe`     |   ✓   |    —     |   —   |
| `/socios`     |   ✓   |    —     |   ✓   |
| `/configuracoes` | ✓  |    —     |   —   |

Ações de verificação:
- Garantir que `ROUTE_ROLES` em `App.tsx` bate com o sidebar e com `usePermissoes` (`routePermissionMap`).
- Garantir redirect para `/` quando o papel não tem acesso (já existe — apenas conferir).
- Verificar que `NotFound` (404) é alcançável e tem CTA "voltar ao Dashboard".
- Verificar que `RedefinirSenha` é pública e não exige sessão.

## Detalhes técnicos
- Arquivos novos:
  - `src/components/layout/PageHeader.tsx`
  - `src/components/layout/Breadcrumbs.tsx`
  - `src/components/common/EmptyState.tsx`
  - `src/components/common/LoadingState.tsx`
- Arquivos editados (somente apresentação):
  - `src/components/layout/AppLayout.tsx`, `AppSidebar.tsx`
  - `src/pages/Dashboard.tsx`, `CRM.tsx`, `ComercialVendas.tsx`, `Acervo.tsx`, `Logistica.tsx`, `Financeiro.tsx`, `Equipe.tsx`, `Socios.tsx`, `Configuracoes.tsx`, `NotFound.tsx`, `Login.tsx`
- Sem mudanças em hooks, RLS, migrations, types.

## Riscos
- Nenhuma alteração de lógica/permissão; risco baixo.
- Possível necessidade de ajustar testes visuais se existirem (não há suíte de UI hoje).

## Fora de escopo
- Reescrita de identidade visual (mantém burgundy + Playfair/Inter).
- Mudanças no Login além de pequenos ajustes.
- Qualquer alteração em RLS, hooks ou edge functions.
