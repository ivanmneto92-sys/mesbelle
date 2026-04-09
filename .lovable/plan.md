

## Refatoração: Separar "Comercial & CRM" em dois módulos independentes

### Resumo
Dividir a tela única "Comercial & CRM" em dois módulos no menu lateral: **CRM** (relacionamento e captação) e **Comercial** (vendas, contratos e métricas). Cada um terá sua própria rota, página e componentes.

### Arquitetura

```text
src/
├── types/comercial.ts           (expandido: novos tipos Negocio, CRM columns)
├── hooks/useLeads.ts            (expandido: addNegocio, enviarParaComercial)
├── pages/
│   ├── CRM.tsx                  (nova página)
│   └── ComercialVendas.tsx      (nova página, substitui Comercial.tsx)
├── components/
│   ├── crm/
│   │   ├── CrmKanbanBoard.tsx   (kanban com colunas CRM)
│   │   ├── BaseClientesTab.tsx  (tabela + perfil lateral)
│   │   ├── AgendaProvasTab.tsx  (calendário semanal/diário)
│   │   └── ClienteDetailPanel.tsx (painel lateral completo)
│   ├── comercial/
│   │   ├── NegociacoesTab.tsx   (nova: lista de negociações abertas)
│   │   ├── ContratosTab.tsx     (existente, mantido)
│   │   ├── MetricasTab.tsx      (existente, adaptado)
│   │   ├── KanbanBoard.tsx      (removido — substituído pelo CrmKanbanBoard)
│   │   ├── LeadDetailPanel.tsx  (movido para crm/)
│   │   └── NewLeadModal.tsx     (movido para crm/)
```

### O que será construído

**1. Tipos e dados (`types/comercial.ts`)**
- Novo `CrmFunnelStatus`: "novo_lead" | "em_atendimento" | "prova_agendada" | "no_show"
- Novo `CRM_KANBAN_COLUMNS` com 4 colunas
- Nova interface `Negocio`: id, clienteId, vestidoId?, vestidoNome?, valorNegociado, desconto, metodoPagamento, statusNegociacao ("aberto" | "aprovado" | "cancelado"), criadoEm
- Adicionar campo `origemCRM?: boolean` e `enviadoComercial?: boolean` ao Lead

**2. Hook `useLeads.ts` (expandido)**
- Novo state `negocios` com localStorage key `mesbelle_negocios`
- `enviarParaComercial(leadId)`: marca lead como `enviadoComercial: true`, cria entrada na lista de negócios
- `addNegocio`, `updateNegocio`, `aprovarFechamento`
- `getClientesBase()`: retorna todos os leads (diretório completo)
- Adicionar key ao `APP_STORAGE_KEYS`

**3. Página CRM (`pages/CRM.tsx`)**
- Cabeçalho: "CRM" + subtítulo "Relacionamento e atendimento" + botão "+ Novo Lead/Cliente"
- 3 abas: "Funil de Captação", "Base de Clientes", "Agenda de Provas"

**4. CRM — Aba Funil (`CrmKanbanBoard.tsx`)**
- Kanban drag & drop com 4 colunas: Novo Lead, Em Atendimento, Prova Agendada, No-Show
- Cards com botão "Enviar para Comercial" quando lead está pronto para fechamento
- Ao clicar "Enviar para Comercial": cria negócio e muda flag do lead

**5. CRM — Aba Base de Clientes (`BaseClientesTab.tsx`)**
- Tabela com todos os clientes, filtros por nome/CPF/tipo de evento
- Clique abre `ClienteDetailPanel` (painel lateral completo)

**6. CRM — ClienteDetailPanel (`ClienteDetailPanel.tsx`)**
- Evolução do `LeadDetailPanel` com seções: Dados Básicos, Ficha de Medidas, Histórico (timeline de provas/aluguéis), Notas Internas (textarea rico)
- Link WhatsApp no telefone

**7. CRM — Aba Agenda de Provas (`AgendaProvasTab.tsx`)**
- Calendário com visão semanal e diária
- Mostra leads com `provaData` preenchida
- Cards nos slots do calendário com nome da cliente e horário

**8. Página Comercial (`pages/ComercialVendas.tsx`)**
- Cabeçalho: "Comercial" + subtítulo "Vendas e contratos" + botões "+ Novo Orçamento" e "Emitir Contrato"
- 3 abas: "Negociações Abertas", "Contratos", "Performance e Métricas"

**9. Comercial — Aba Negociações (`NegociacoesTab.tsx`)**
- Lista de cards/tabela com clientes vindos do CRM
- Exibe: nome, vestido escolhido, valor, descontos, forma de pagamento
- Botão "Aprovar Fechamento" → direciona para aba Contratos
- Modal para editar valores, desconto e método de pagamento

**10. Comercial — Contratos e Métricas**
- `ContratosTab` mantido, adaptado para receber negócios aprovados (não mais leads em "fechamento")
- `MetricasTab` adaptado: faturamento (contratos assinados), conversão (leads CRM → contratos), ticket médio, ranking de vendedoras

**11. Roteamento e Sidebar**
- `App.tsx`: remover rota `/comercial`, adicionar `/crm` e `/comercial-vendas`
- `AppSidebar.tsx`: substituir item "Comercial & CRM" por dois itens separados:
  - "CRM" (ícone Users, rota `/crm`)
  - "Comercial" (ícone HandCoins ou Banknote, rota `/comercial-vendas`)
- `ROUTE_ROLES`: adicionar `/crm` e `/comercial-vendas` com roles `["admin", "vendedor"]`

**12. Limpeza**
- Remover `KanbanBoard.tsx` antigo (substituído por `CrmKanbanBoard`)
- Mover `NewLeadModal.tsx` e `LeadDetailPanel.tsx` para `src/components/crm/`
- Remover `pages/Comercial.tsx` (substituído por `CRM.tsx` + `ComercialVendas.tsx`)

### Regra de transição (fluxo de dados)
```text
CRM (leads/clientes) ──[Enviar para Comercial]──▶ Comercial (negócios)
                                                       │
                                                  [Aprovar Fechamento]
                                                       │
                                                       ▼
                                                  Contratos (geração + assinatura)
```

### Arquivos criados
- `src/pages/CRM.tsx`
- `src/pages/ComercialVendas.tsx`
- `src/components/crm/CrmKanbanBoard.tsx`
- `src/components/crm/BaseClientesTab.tsx`
- `src/components/crm/AgendaProvasTab.tsx`
- `src/components/crm/ClienteDetailPanel.tsx`
- `src/components/comercial/NegociacoesTab.tsx`

### Arquivos modificados
- `src/types/comercial.ts` (novos tipos)
- `src/hooks/useLeads.ts` (negócios + enviarParaComercial)
- `src/App.tsx` (novas rotas)
- `src/components/layout/AppSidebar.tsx` (dois itens no menu)
- `src/components/comercial/ContratosTab.tsx` (adaptado para negócios)
- `src/components/comercial/MetricasTab.tsx` (novas métricas)

### Arquivos removidos
- `src/pages/Comercial.tsx`
- `src/components/comercial/KanbanBoard.tsx`
- `src/components/comercial/LeadDetailPanel.tsx` (movido para crm/)
- `src/components/comercial/NewLeadModal.tsx` (movido para crm/)

