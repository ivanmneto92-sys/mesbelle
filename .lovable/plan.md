

## Assinatura Digital no iPad com Canvas

### O que será feito

Implementar um pad de assinatura real usando HTML5 Canvas, otimizado para toque (iPad/tablet). Quando a cliente assinar com o dedo ou Apple Pencil, a assinatura é capturada como imagem (base64 PNG), salva no contrato e fica no histórico.

### Fluxo do usuário

```text
Gerar Contrato → Pré-visualizar com dados do cliente → 
Cliente assina no iPad (canvas touch) → Confirmar → 
Assinatura salva como imagem no contrato (localStorage) → 
Status muda para "Assinado" → Histórico acessível
```

### Componentes

**1. `SignaturePad.tsx`** — Componente reutilizável de assinatura
- Canvas HTML5 com suporte a touch e mouse
- Largura 100%, altura ~200px, fundo branco, traço bordô (#5A0019)
- Botões: "Limpar" e "Confirmar Assinatura"
- Ao confirmar, exporta `canvas.toDataURL("image/png")` como base64
- Otimizado para iPad: `touch-action: none`, previne scroll durante assinatura
- Suporte a pressão do Apple Pencil via `PointerEvent.pressure`

**2. Atualização do tipo `Contrato`**
- Novo campo: `assinaturaBase64?: string` — armazena a imagem PNG da assinatura
- Novo campo: `dataAssinatura?: string` — timestamp de quando foi assinado

**3. Atualização do `ContratosTab.tsx`**
- Substituir o placeholder tracejado pelo componente `SignaturePad`
- Ao assinar: salvar base64 no contrato, mudar status para "assinado", gravar data
- Contratos já assinados: exibir a imagem da assinatura (readonly) em vez do pad
- Botão "Baixar Contrato" para gerar versão imprimível com assinatura embutida

**4. Atualização do `useLeads.ts`**
- `updateContratoStatus` passa a aceitar dados extras (assinatura, data)
- Nova função `assinarContrato(contratoId, assinaturaBase64)` que salva tudo de uma vez

### Detalhes técnicos
- Canvas usa `PointerEvent` (unifica touch/mouse/stylus)
- `getContext("2d")` com `lineWidth: 2`, `lineCap: "round"`, `strokeStyle: "#5A0019"`
- `touch-action: none` no canvas para evitar scroll acidental
- Base64 PNG salvo diretamente no localStorage junto com o contrato
- Versão para impressão usa `window.open()` com layout formatado incluindo a assinatura como `<img>`

### Arquivos criados
- `src/components/comercial/SignaturePad.tsx`

### Arquivos modificados
- `src/types/comercial.ts` (campos assinaturaBase64, dataAssinatura)
- `src/components/comercial/ContratosTab.tsx` (integrar SignaturePad, exibir assinatura)
- `src/hooks/useLeads.ts` (função assinarContrato)

