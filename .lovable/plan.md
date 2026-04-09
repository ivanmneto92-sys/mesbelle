
Objetivo: corrigir a tela branca de forma definitiva. O problema mais provável não está mais no código do App em si, mas na resolução real das dependências instaladas.

O que identifiquei
- `src/App.tsx` ainda monta `TooltipProvider`, e `src/components/ui/sidebar.tsx` também usa `TooltipProvider` e `Tooltip`.
- Isso por si só não deveria quebrar.
- Porém há um conflito claro entre arquivos de dependência:
  - `package.json` está com versões Radix antigas/compatíveis com React 18, como `@radix-ui/react-tooltip: 1.1.6`
  - `package-lock.json` ainda aponta para versões mais novas, como `@radix-ui/react-tooltip: 1.2.7`, `@radix-ui/react-slot: 1.2.3`, `@radix-ui/react-dialog: 1.1.14`
- Então o projeto está em estado inconsistente: um gerenciador diz uma coisa, o lockfile do npm diz outra. Isso explica por que a tela continua branca mesmo após a tentativa anterior.

Do I know what the issue is?
- Sim. O problema é que as dependências efetivamente resolvidas ainda podem estar vindo do `package-lock.json` com versões mais novas do Radix, enquanto o código foi ajustado assumindo versões compatíveis com React 18. Resultado: o erro de `useRef` no `TooltipProvider` continua acontecendo.

Plano de correção
1. Unificar o gerenciador de pacotes
- Escolher um único lockfile para o projeto.
- Como o repositório tem `package-lock.json`, `bun.lock` e `bun.lockb`, a implementação deve padronizar para um só fluxo.
- Recomendação: manter npm ou bun, mas não ambos.

2. Sincronizar dependências Radix com React 18
- Garantir que `package.json` e o lockfile escolhido apontem para o mesmo conjunto de versões compatíveis.
- Prioridade especial para:
  - `@radix-ui/react-tooltip`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-dropdown-menu`
  - dependências Radix compartilhadas que entram transitivamente no sidebar/sheet/tooltip

3. Remover a fonte da inconsistência
- Atualizar ou remover o lockfile conflitante para que a instalação não volte a puxar versões erradas.
- Se o projeto ficar em npm, regenerar `package-lock.json`.
- Se ficar em bun, remover o lock do npm e regenerar o lock do bun.

4. Validar ponto crítico da renderização
- Confirmar que `TooltipProvider` carrega sem erro no `App.tsx`.
- Confirmar que o `SidebarProvider` e os botões com tooltip deixam de quebrar a árvore React.
- Se necessário, simplificar temporariamente o uso de tooltip no sidebar para isolar a causa durante validação.

5. Verificação final de interface
- Abrir `/login` e validar que a página renderiza.
- Testar login e navegação básica.
- Conferir desktop e mobile para garantir que o sidebar/drawer não reintroduzem o erro.

Arquivos envolvidos
- `package.json`
- `package-lock.json`
- `bun.lock`
- `src/App.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/tooltip.tsx`

Detalhe técnico
```text
Causa raiz provável:
package.json = Radix compatível
package-lock.json = Radix mais novo
instalação efetiva = lockfile conflitante
resultado = TooltipProvider quebra em runtime
```

Observação importante
- Como estou em modo somente leitura, não posso aplicar a correção agora.
- A implementação deve focar primeiro em alinhar os lockfiles/dependências; mexer apenas no componente de tooltip sem resolver isso provavelmente não elimina a tela branca.
