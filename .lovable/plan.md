# Redesign editorial do front-end Més Belle

## Objetivo
Elevar o sistema a um padrão "editorial de ateliê" — hierarquia clara, densidade controlada, navegação fluida e funciona impecável em iPad/celular. Mantém a identidade (burgundy + Fraunces/Nunito) mas com composição, ritmo e detalhes muito mais sofisticados.

## Princípios do novo layout
1. **Hierarquia tipográfica forte** — títulos Fraunces grandes com kerning gracioso, sub-rótulos minúsculos em uppercase, números em destaque (R$, contagens) com peso visual maior que os cards.
2. **Espaço respira** — menos cards comprimidos, mais "agrupamentos editoriais" com divisores sutis em vez de bordas grossas. Cards ganham fundo creme (#FAF6F4) e burgundy reservado para ações/foco.
3. **Densidade adaptativa** — tabelas viram **tabelas em desktop + cards empilhados em mobile/iPad** (não scroll horizontal). Lead/Negócio/Contrato/Vestido cabem em "stack cards" com a info essencial acima da dobra.
4. **Navegação previsível** — header global persistente com breadcrumbs + busca rápida (⌘K), atalhos "Novo Lead / Nova Venda / Logística" sempre presentes, voltar inteligente.
5. **Mobile-first iPad** — sidebar vira drawer, botões com alvo mínimo 44px, sheets em vez de dialogs apertados, assinatura ocupa tela cheia.

## Mudanças por área

### 1. Shell global (AppLayout + AppSidebar + Header)
- Sidebar mais estreita (224 → 200 px) com agrupamentos: **Operação** (Dashboard, CRM, Comercial) / **Catálogo** (Acervo, Logística) / **Gestão** (Equipe, Financeiro, Sócios) / **Sistema** (Configurações). Cada grupo com label em micro-caps.
- Item ativo: barra burgundy à esquerda + fundo creme + ícone preenchido (não só cor de fundo).
- Header global novo: breadcrumbs animadas + **busca global (⌘K)** + atalhos rápidos + sino de notificações + avatar com menu.
- Footer da sidebar mostra usuário com avatar circular maior, papel em tag, link rápido para perfil.

### 2. Dashboard
- Cabeçalho "Olá, [Nome]" com saudação por horário, frase contextual ("Você tem 3 provas hoje") e CTA único proeminente em vez de 3 botões iguais.
- KPIs: cartões maiores em **grid 4 colunas** (desktop) com gráfico sparkline embutido em cada um, comparativo vs. mês anterior, label minúsculo "ontem/hoje/semana".
- Score da Loja: gauge maior, com **3 sub-KPIs ao lado** (NPS, % vestidos no prazo, taxa conversão).
- Avisos rápidos viram **timeline** agrupada por urgência, com ação inline ("Cobrar", "Reagendar").
- Nova seção: **"Hoje no ateliê"** — provas + entregas + retiradas do dia em coluna única.

### 3. CRM (Kanban + Base + Agenda)
- Kanban com colunas mais altas, **card de lead reformulado**: avatar inicial em circle burgundy, nome em Fraunces, evento e data em micro-tags, valor potencial em destaque, ações via long-press/menu.
- Filtros viram **barra de chips** filtráveis (vendedora, evento, período) em vez de selects empilhados.
- Base de Clientes: cards em grid 3 cols em vez de tabela densa; mobile vira lista vertical com swipe actions.
- Agenda de Provas: calendário semanal compacto + lista do dia ao lado (estilo Linear/Notion).
- Painel lateral de detalhe da cliente vira **sheet largo** com tabs Resumo/Medidas/Histórico/Contratos.

### 4. Comercial (Negociações + Contratos + Métricas)
- Tabs viram **segmented control** elegante no topo.
- Negociações: cards de negócio em vez de tabela bruta, com status em pill colorida lateral, valor grande, ações principais (Aprovar/Editar) sempre visíveis.
- Contratos: tabela em desktop ganha **status-stripe lateral** colorida, ações agrupadas em menu kebab; em mobile vira lista de cards com botão "Assinar no iPad" gigante.
- Painel de detalhe do contrato (Sheet) reorganizado: **header sticky** com nº+status+ações, blocos visuais separados (Cliente / Termos / Trilha Auditoria / Assinatura).
- Métricas: gráficos maiores, KPIs com comparativo período-anterior, tabela de comissões com sticky header.

### 5. Acervo + Logística
- Acervo Catálogo: grid de vestidos com **hover state cinematográfico** (zoom suave + overlay com preço e disponibilidade), filtros laterais em drawer no mobile.
- Cards de vestido com badge "Disponível/Reservado/Em produção" canto superior direito, preço em Fraunces grande.
- Produção: checklist 7 etapas vira **progress stepper horizontal** no card + tabela de tarefas; mobile vira accordion.
- Logística: grid 2x2 atual vira **timeline vertical de status** (Para enviar → Enviado → Em uso → Devolvido) com cards arrastáveis entre colunas.
- Termo de Retirada: modal full-screen em mobile/iPad otimizado para assinatura.

### 6. Tabelas → padrão único
Componente novo `DataList` que renderiza:
- Em desktop (≥1024px): tabela com colunas configuráveis, sticky header, ordenação, paginação.
- Em tablet/mobile: stack de cards com a mesma info essencial, ações via sheet.
- Empty state, loading skeleton e filter chips embutidos.

### 7. Responsividade
- Sidebar offcanvas <1024px, com trigger persistente no header.
- Sheets/Dialogs viram **bottom sheets** no mobile.
- Botões primários ≥44px de altura.
- Forms: 1 coluna no mobile, max 2 no tablet, grid no desktop.

## Design tokens (sem alterar identidade)
- Adicionar tokens: `--surface-cream` (#FAF6F4), `--surface-elevated`, `--border-subtle`, `--text-muted-soft`.
- Sombras editoriais: `--shadow-card` (soft, 1px), `--shadow-elevated` (8px difuso). Substitui sombras genéricas do shadcn.
- Espaçamento: nova escala 2/4/6/10/16/24/40 para ritmo mais editorial.
- Animações: micro-fades 200ms em entradas, scale 0.98→1 em cards on click. Sem motion exagerada.

## Detalhes técnicos
- **Novos componentes**: `GlobalHeader`, `CommandPalette` (⌘K via `cmdk` já instalado), `DataList`, `StatusStripe`, `KpiCard`, `PageHero`, `BottomSheet`.
- **Refatorar**: `AppLayout`, `AppSidebar`, todas as 8 páginas principais (Dashboard, CRM, ComercialVendas, Acervo, Logistica, Equipe, Financeiro, Socios), todos os `*Tab.tsx` da pasta `comercial/` e `crm/`.
- **Tokens**: estender `index.css` (novas variáveis HSL) e `tailwind.config.ts` (semantic colors, shadow scale, spacing).
- **Tabelas**: introduzir `DataList` reaproveitável; migrar ContratosTab, NegociacoesTab, BaseClientesTab, ProducaoTab, Logística primeiro.
- Sem mexer em lógica de negócio, hooks, schemas ou Supabase. Mudança puramente de UI/UX.

## Ordem de entrega sugerida
1. **Fundação**: tokens, GlobalHeader, AppSidebar redesenhada, CommandPalette.
2. **Dashboard** novo (validar linguagem visual).
3. **CRM** (Kanban + Base + Agenda).
4. **Comercial** (Negociações + Contratos + Métricas).
5. **Acervo + Logística**.
6. Polimento responsivo iPad/mobile em todas as telas.

## Fora de escopo
- Mudança de fontes ou cor primária.
- Novas funcionalidades de negócio.
- Refactor de hooks, Supabase ou estrutura de dados.
- Tema dark fora da Auth.
