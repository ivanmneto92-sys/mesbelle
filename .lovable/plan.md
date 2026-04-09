
## Problema identificado

A logo está carregando corretamente em ambos os locais (Login e Sidebar). O problema é exclusivamente visual no sidebar: a classe CSS `brightness-0 invert` transforma a imagem, tornando-a quase invisível contra o fundo escuro.

## Correção

**Arquivo**: `src/components/layout/AppSidebar.tsx`, linha 43

Remover `brightness-0 invert` da classe da imagem no sidebar. Essas classes foram pensadas para logos SVG transparentes, mas com um JPG com fundo sólido elas distorcem as cores.

**De:**
```
className="h-10 object-contain brightness-0 invert"
```

**Para:**
```
className="h-10 object-contain"
```

Isso vai mostrar a logo com suas cores originais (bordô/vinho com texto claro), que já combina com o tema do sidebar.

## Resultado esperado

A logo "Més Belle" aparecerá visível e com cores corretas tanto na tela de login quanto no sidebar.
