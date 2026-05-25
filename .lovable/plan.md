## Objetivo

Permitir alterar (ou remover) a data/hora da prova diretamente no painel de detalhes do cliente no CRM, sem precisar arrastar o card entre colunas do kanban.

## Mudanças

**Arquivo único:** `src/components/crm/ClienteDetailPanel.tsx`

Na aba **Dados**, abaixo dos campos atuais, adicionar um bloco "Agendamento de Prova":

- Campo `Input type="date"` para `provaData` (controlado, pré-preenchido com `lead.provaData`)
- Campo `Input type="time"` para `provaHora` (controlado, pré-preenchido com `lead.provaHora`)
- Botão **Salvar prova** → chama `onUpdateLead(lead.id, { provaData, provaHora, statusFunil: "prova_agendada" })` e exibe toast "Prova agendada"
- Botão **Remover** (ícone X, só aparece se já houver prova) → chama `onUpdateLead(lead.id, { provaData: null, provaHora: null })` e toast "Prova removida"

A persistência já funciona ponta-a-ponta via `useLeads.updateLead` → `UPDATE leads SET prova_data, prova_hora` no Supabase. Nenhuma mudança no hook nem no banco.

## Detalhes técnicos

- Adicionar `provaData`/`provaHora` ao state `editData` no `useEffect` de hidratação.
- Para "Remover", o tipo `Lead` exige ajuste mínimo: o mapper `leadPatchToRow` em `useLeads.ts` já trata `provaData !== undefined`, mas grava `null` no banco apenas se passarmos `null` explícito. Vou usar `undefined`/string vazia no estado React e converter para `null` no patch enviado.
- Atualizar `lead.provaData ?? undefined` em `Lead` já cobre leitura. Para escrita de `null`, faço cast inline `{ provaData: null as unknown as undefined, provaHora: null as unknown as undefined }` — alternativamente, ajusto `Partial<Lead>` para aceitar `null` nesses dois campos (mais limpo).
- O ícone `CalendarClock` da `lucide-react` reforça o bloco visualmente.

## Fora de escopo

- Validação anti-conflito de horário com outras provas (não solicitado).
- Notificação WhatsApp automática ao remarcar.
