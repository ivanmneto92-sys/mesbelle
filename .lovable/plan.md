

## Atualização da identidade visual: paleta e logo

### Nova paleta
```text
#3C0313  →  HSL 340 83% 15%   (bordô escuro — sidebar, textos fortes)
#5A0019  →  HSL 343 100% 18%  (bordô — botões, primary)
#B3B3B3  →  HSL 0 0% 70%      (cinza médio — bordas, muted)
#D9D9D9  →  HSL 0 0% 85%      (cinza claro — secondary, fundos suaves)
```

Predominância clara: fundo quase branco, cards brancos, bordas e acentos em cinza claro. Bordô apenas em sidebar, botões e destaques pontuais.

### O que muda

**1. Copiar o SVG da logo para o projeto**
- Copiar `user-uploads://Logo_Mes_Belle.svg` para `public/logo-mesbelle.svg`

**2. Substituir referências da logo antiga (JPG) pela nova (SVG)**
- `src/pages/Login.tsx` — trocar `/15a1017d-...jpg` por `/logo-mesbelle.svg`
- `src/components/layout/AppSidebar.tsx` — trocar a mesma referência

**3. Reescrever as variáveis CSS em `src/index.css`**

Modo claro (`:root`):
- `--background`: branco puro (0 0% 100%)
- `--foreground`: bordô escuro (#3C0313)
- `--primary`: bordô (#5A0019 → 343 100% 18%)
- `--primary-light`: tom levemente mais claro do bordô
- `--secondary`: cinza claro (#D9D9D9 → 0 0% 85%)
- `--muted`: cinza claro suave
- `--border / --input`: cinza médio (#B3B3B3 → 0 0% 70%) e derivados
- `--accent`: remover dourado, usar bordô claro ou cinza
- `--sidebar-background`: bordô escuro (#3C0313)
- `--sidebar-accent`: variação do bordô (#5A0019)

Modo escuro: ajustar proporcionalmente (fundo escuro neutro, bordô mais claro para contraste).

**4. Remover `--gold` e `--gold-light`**
- Atualizar `tailwind.config.ts` para remover `gold` / `gold-light`
- Substituir usos de `text-gold` e `bg-gold` nos componentes por `text-primary` ou `text-accent`
- Arquivos afetados: `src/pages/Acervo.tsx`, `src/components/comercial/MetricasTab.tsx`

**5. Ajustar o sidebar na logo**
- Como o SVG tem fundo transparente com traços em bordô, no sidebar (fundo bordô escuro) a logo precisa de `brightness-0 invert` ou `filter` para ficar clara — ou usar uma versão branca. Verificarei o SVG para decidir a melhor abordagem (se o fill é ajustável via CSS, usar `fill="currentColor"` inline; senão, aplicar filtro de inversão apenas no sidebar).

### Arquivos modificados
- `public/logo-mesbelle.svg` (novo)
- `src/index.css` (paleta completa)
- `tailwind.config.ts` (remover gold)
- `src/pages/Login.tsx` (logo)
- `src/components/layout/AppSidebar.tsx` (logo)
- `src/pages/Acervo.tsx` (substituir bg-gold)
- `src/components/comercial/MetricasTab.tsx` (substituir text-gold)

