
Diagnóstico profundo do código atual

O snapshot não mostrou um erro de runtime ativo agora, então o problema “trava / fica branco após publicar” parece ser causado por falhas estruturais do código e dados persistidos, não por um único erro visível neste momento.

Principais bugs e vulnerabilidades encontrados

1. Crítico: autenticação totalmente insegura
- `src/contexts/AuthContext.tsx` usa usuários e senhas hardcoded no frontend.
- O papel do usuário (`admin`, `vendedor`, `socio`) fica salvo em `localStorage`.
- Qualquer pessoa pode abrir o DevTools, alterar `mesbelle_user` e virar admin.
- Isso é bypass total de autenticação e privilégio.

2. Crítico: controle de acesso só no menu, não nas rotas
- `src/components/layout/AppSidebar.tsx` apenas esconde menus por role.
- `src/App.tsx` protege só por “está logado”, não por papel.
- Um vendedor pode acessar `/financeiro`, `/configuracoes`, `/equipe` digitando a URL.

3. Crítico: dados sensíveis expostos no navegador
- Leads, CPF, endereço, medidas e contratos ficam em `localStorage` via `src/hooks/useLeads.ts`.
- Isso expõe dados pessoais no dispositivo do usuário e facilita manipulação.
- Também cria risco LGPD/privacidade.

4. Alta probabilidade de causa das telas brancas no publicado
- `useLeads.ts` faz `JSON.parse` com try/catch, mas não valida estrutura.
- Se `mesbelle_leads`, `mesbelle_medidas` ou `mesbelle_contratos` tiverem JSON válido porém formato errado, componentes depois assumem arrays e objetos corretos e podem quebrar.
- O `AuthContext` foi endurecido, mas o CRM ainda não.

5. ErrorBoundary reduz impacto, mas não corrige a origem
- O boundary em `src/components/ErrorBoundary.tsx` evita queda total, mas não resolve os dados ruins.
- `handleClearAndReload` usa `localStorage.clear()`, apagando tudo, inclusive CRM local. Em produção isso vira “recuperação destrutiva”.

6. Bug funcional no CRM: agendamento de prova não é salvo
- `src/components/comercial/KanbanBoard.tsx` abre o diálogo ao mover para `prova`, mas `confirmProva()` só muda `statusFunil`.
- `provaData` e `provaHora` nunca são persistidos no lead.
- Resultado: o requisito principal da etapa “Prova Agendada” está quebrado.

7. Bug funcional: painel da lead usa objeto desatualizado
- `src/pages/Comercial.tsx` guarda `selectedLead` como objeto inteiro.
- Quando a lead é editada, a lista atualiza, mas `selectedLead` pode ficar stale.
- Isso causa detalhes, notas e status inconsistentes até fechar e abrir o painel.

8. Bug de negócio: contratos duplicados e numeração frágil
- `addContrato()` em `useLeads.ts` usa `contratos.length + 130`.
- Isso pode gerar números repetidos em cenários reais.
- Também não há bloqueio para múltiplos contratos do mesmo lead em fechamento.

9. Funcionalidades prometidas mas não implementadas
- “Vestidos de interesse” não existe no painel da lead.
- Upload de foto das medidas não existe.
- Contrato não move lead nem fecha fluxo de forma consistente.
- Várias telas (`Acervo`, `Financeiro`, `Configurações`) são placeholders sem persistência real.

10. Cobertura de testes praticamente inexistente
- Só existe um teste trivial em `src/test/example.test.ts`.
- Não há smoke tests de navegação, permissões, recuperação de storage corrompido ou fluxo do CRM.

Risco real de publicação hoje

```text
Usuário publica app
  -> dados antigos/locais continuam no navegador
  -> storage de CRM pode estar incompleto ou adulterado
  -> tela carrega uma página que assume formato válido
  -> erro em componente/estado
  -> página branca ou boundary de erro
  -> navegação parece “travada”
```

Vulnerabilidades priorizadas

Críticas
- Auth fake no client
- Hardcoded credentials visíveis
- Role em localStorage
- Rotas sem proteção por role
- PII em localStorage

Altas
- Falta de validação/sanitização dos dados persistidos
- Recuperação destrutiva limpando todo storage
- Falta de observabilidade para erros publicados

Médias
- Falhas de integridade do CRM
- Duplicidade de contratos
- Telas operacionais sem persistência

Plano de correção recomendado

Fase 1 — Estabilizar o publicado
- Validar schema de `leads`, `medidas` e `contratos` antes de usar.
- Se um item estiver inválido, migrar/sanitizar ou remover só a chave problemática.
- Trocar `localStorage.clear()` por limpeza seletiva das chaves do app.
- Adicionar fallback visual com mensagem específica por módulo.

Fase 2 — Fechar as falhas de acesso
- Substituir auth mock por autenticação real (Lovable Cloud/Supabase).
- Implementar guard de rota por papel em `src/App.tsx`.
- Remover credenciais de teste da UI pública.
- Armazenar papéis em tabela separada `user_roles`, nunca no profile/localStorage.

Fase 3 — Corrigir a lógica do CRM
- Persistir `provaData` e `provaHora` ao mover para “Prova”.
- Em `Comercial.tsx`, guardar `selectedLeadId` e derivar a lead atual do array.
- Bloquear contrato duplicado por lead.
- Gerar numeração robusta.
- Completar “vestidos de interesse” e anexos de medidas.

Fase 4 — Proteger dados sensíveis
- Tirar CPF, endereço, medidas e contratos do `localStorage`.
- Mover dados para backend com regras de acesso.
- Mascarar CPF/telefone onde fizer sentido.
- Validar e normalizar inputs.

Fase 5 — Testes e diagnóstico
- Criar testes de navegação por rota.
- Criar testes para storage corrompido.
- Criar testes de permissão por role.
- Criar teste E2E do fluxo login -> menu -> CRM -> contrato.
- Adicionar logging de erros publicados.

Arquivos centrais para corrigir
- `src/contexts/AuthContext.tsx`
- `src/App.tsx`
- `src/hooks/useLeads.ts`
- `src/pages/Comercial.tsx`
- `src/components/comercial/KanbanBoard.tsx`
- `src/components/comercial/LeadDetailPanel.tsx`
- `src/components/comercial/ContratosTab.tsx`
- `src/components/ErrorBoundary.tsx`

Conclusão objetiva

O sistema hoje não está só “com bugs”; ele tem uma combinação de:
- segurança crítica quebrada,
- persistência frágil no navegador,
- CRM com regras incompletas,
- e falta de testes.

Se eu fosse priorizar, a ordem correta é:
1. autenticação/roles,
2. validação do storage e estabilidade,
3. correção da lógica do CRM,
4. migração dos dados sensíveis para backend,
5. testes de publicação.

Essa é a análise mais importante: a principal causa provável do “fica branco / trava após publicar” não é o roteamento em si, e sim o estado local inconsistente somado à ausência de validação forte nos dados do CRM.
