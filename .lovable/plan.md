

## Sistema de Permissões por Role (Admin controla visibilidade)

### Resumo
Criar um painel em Configuracoes onde o Admin define quais modulos e informacoes ficam visiveis para cada role (vendedor e socio). Essas permissoes sao salvas no localStorage e aplicadas dinamicamente no sidebar e nas paginas.

### O que o Admin controla

**Para o Vendedor**, o admin pode ligar/desligar:
- Dashboard (metricas gerais vs so as dele)
- CRM (ver todos os leads ou so os dele)
- Comercial (contratos, metricas de vendas)
- Acervo (catalogo, producao)
- Logistica (entregas)
- Ver comissoes proprias
- Ver ranking da equipe

**Para o Socio**, o admin pode ligar/desligar:
- Dashboard
- Portal de Socios (valuation, EBITDA, patrimonio)
- Financeiro (fluxo de caixa, DRE)
- Ver distribuicao de lucros
- Ver equipe/performance

### Arquitetura

```text
localStorage: mesbelle_permissoes
{
  vendedor: {
    dashboard: true,
    crm: true,
    comercial: true,
    acervo: true,
    logistica: true,
    comissoes: true,
    rankingEquipe: false,
    financeiro: false
  },
  socio: {
    dashboard: true,
    socios: true,
    financeiro: true,
    equipe: false,
    acervo: false
  }
}
```

### Implementacao

**1. Hook `usePermissoes.ts`**
- Le/salva permissoes no localStorage
- Funcao `temPermissao(role, modulo)` para checar acesso
- Valores default definidos no codigo

**2. Configuracoes.tsx — novo card "Controle de Acesso"**
- Grid de toggles (Switch) organizado por role
- Cada toggle liga/desliga um modulo ou informacao para aquela role
- Visivel apenas para Admin

**3. AppSidebar.tsx — filtro dinamico**
- Alem do filtro por `roles[]` fixo, cruzar com as permissoes do hook
- Se o admin desligou "financeiro" para socio, o item some do menu

**4. Paginas individuais — blocos condicionais**
- Dentro de cada pagina, esconder secoes especificas baseado nas permissoes (ex: vendedor nao ve ranking se desligado)

### Arquivos criados
- `src/hooks/usePermissoes.ts`

### Arquivos modificados
- `src/pages/Configuracoes.tsx` (card de controle de acesso com toggles)
- `src/components/layout/AppSidebar.tsx` (filtro dinamico por permissoes)

