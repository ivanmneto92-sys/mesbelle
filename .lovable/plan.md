
Diagnóstico atual

- No snapshot atual, não apareceu erro de runtime ativo; os logs mostram apenas warnings do React Router.
- O replay de sessão mostra a página carregando e tooltips funcionando, então a “tela branca” não parece ser um crash contínuo neste estado do código.
- As versões Radix em `package.json`, `package-lock.json` e `bun.lock` estão hoje alinhadas com os pins/overrides, então o problema anterior de `useRef` com React 18 parece estar mitigado no estado atual.

Principais problemas/riscos encontrados

1. Risco real de tela branca no boot
- `src/contexts/AuthContext.tsx` faz `JSON.parse` do `localStorage` sem `try/catch`.
- Se `mesbelle_user` estiver corrompido, a aplicação pode quebrar antes de renderizar qualquer rota.

2. Duplicidade de provider de tooltip
- `src/App.tsx` renderiza `TooltipProvider`.
- `src/components/ui/sidebar.tsx` renderiza outro `TooltipProvider` dentro do `SidebarProvider`.
- Isso não é necessariamente fatal, mas complica a árvore e dificulta isolar falhas.

3. Inconsistência no carregamento da logo
- `Login.tsx` usa `@/assets/logo.png`.
- `AppSidebar.tsx` usa `/ee838669-4bf8-4be5-a3ee-bad43c058d52.jpg`.
- O JPG não aparece em `public/` nem em `src/assets` nos arquivos listados, então esse caminho pode falhar em build/deploy ou em alguns ambientes.

4. Imagens externas frágeis no catálogo
- `src/pages/Acervo.tsx` usa imagens do Unsplash.
- Se houver bloqueio, lentidão ou falha de rede, os cards ficam sem imagem e a tela perde qualidade visual.

5. Dois lockfiles ainda coexistem
- `package-lock.json` e `bun.lock` continuam no projeto.
- Mesmo alinhados agora, isso mantém risco de reinstalação inconsistente no futuro.

6. Fontes externas
- `src/index.css` importa Google Fonts via `@import`.
- Isso não deve gerar tela branca, mas aumenta dependência de rede e pode degradar o primeiro carregamento.

Plano de correção

1. Blindar a inicialização da aplicação
- Proteger a leitura do `localStorage` com `try/catch`.
- Se o valor estiver inválido, limpar a chave e seguir como deslogado.

2. Simplificar tooltip/sidebar
- Padronizar para apenas um `TooltipProvider`.
- Manter o provider global ou o do sidebar, mas não os dois.

3. Unificar a logo
- Colocar a imagem aprovada em um local versionado do projeto (`public/` ou `src/assets/`).
- Fazer Login e Sidebar usarem a mesma origem.
- Adicionar fallback visual caso a imagem falhe.

4. Fortalecer imagens do Acervo
- Adicionar placeholder/fallback para falha de carregamento.
- Se a estabilidade for prioridade, substituir links externos por imagens locais controladas.

5. Padronizar o gerenciador de pacotes
- Escolher npm ou bun.
- Remover o lockfile não usado para evitar regressões.

6. Validar os fluxos críticos
- Testar `/login`, login/logout, rota `/`, colapso do sidebar e carregamento da logo.
- Testar com `localStorage` válido, vazio e corrompido.
- Validar comportamento com falha de imagem no catálogo.

Arquivos prioritários

- `src/contexts/AuthContext.tsx`
- `src/App.tsx`
- `src/components/ui/sidebar.tsx`
- `src/pages/Login.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/pages/Acervo.tsx`
- `src/assets/` ou `public/`
- `package-lock.json` / `bun.lock`

Conclusão técnica

- O risco mais forte de “tela totalmente branca” no código atual é o `JSON.parse` sem proteção no `AuthContext`.
- O principal problema visual atual é a logo estar inconsistente entre Login e Sidebar, com um caminho de imagem que não está claramente versionado no projeto.
- Como o snapshot atual não mostra erro ativo, eu priorizaria: robustez de boot, unificação de assets e simplificação do tooltip antes de qualquer nova tentativa de mexer em dependências.
