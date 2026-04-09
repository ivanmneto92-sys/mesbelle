

## Diagnóstico: Páginas em branco após publicação

### Causa raiz identificada

O sistema **não possui um Error Boundary** (componente React que captura erros de renderização). Quando qualquer erro de JavaScript ocorre em produção -- por exemplo, um dado corrompido no `localStorage`, uma propriedade `undefined` acessada, ou um problema com bibliotecas como `recharts` ou `@hello-pangea/dnd` -- o React derruba toda a árvore de componentes e a página fica em branco, sem nenhuma mensagem ao usuário.

Além disso, o `AuthContext` lê do `localStorage` no carregamento inicial. Se o JSON armazenado estiver corrompido ou incompleto, a aplicação pode falhar silenciosamente.

### Plano de correção

**1. Criar um Error Boundary global**
- Novo arquivo `src/components/ErrorBoundary.tsx` com um componente de classe que implementa `componentDidCatch`
- Exibe uma tela amigável com botão "Recarregar" e opção de limpar localStorage (para resolver sessões corrompidas)
- Envolver o `<AppRoutes />` dentro do Error Boundary no `App.tsx`

**2. Fortalecer o AuthContext**
- Adicionar validação ao `JSON.parse` do localStorage: verificar que o objeto retornado contém `id`, `name`, `email` e `role` antes de usá-lo
- Se a validação falhar, limpar o localStorage e retornar `null` (redireciona para login)

**3. Adicionar Error Boundary por rota**
- Envolver cada página dentro do `ProtectedRoute` com um Error Boundary individual, para que um erro em uma página (ex: Comercial) não derrube o sidebar e a navegação inteira

### Detalhes técnicos

```text
App.tsx
  └─ AuthProvider
       └─ BrowserRouter
            └─ ErrorBoundary (global - captura erros fatais)
                 └─ AppRoutes
                      └─ ProtectedRoute
                           └─ AppLayout
                                └─ ErrorBoundary (por página)
                                     └─ <Comercial /> etc.
```

**Arquivos modificados:**
- `src/components/ErrorBoundary.tsx` (novo)
- `src/App.tsx` (envolver rotas com ErrorBoundary)
- `src/contexts/AuthContext.tsx` (validação do localStorage)

