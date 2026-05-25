## Objetivo

Eliminar o passo manual "Gerar Contrato" e fechar a lacuna de auditoria na assinatura feita no ateliê (iPad). Hoje o fluxo exige 3 cliques após o cadastro; vamos reduzir para 2 e garantir trilha completa.

## Fluxo novo

```text
CRM (cadastro do Lead)
   │
   ▼ Enviar para Comercial
Negócio (aberto) — define vestido/valor/desconto/pagamento
   │
   ▼ Aprovar fechamento  ◄── dispara automaticamente:
                              1. cria Contrato (pendente)
                              2. mostra toast com link "Abrir contrato"
                              3. troca a aba para Contratos e abre o preview
```

## Mudanças

### 1. `src/hooks/useLeads.ts` — automação + auditoria

- **`aprovarFechamento(negocioId)`**: após o `UPDATE` do status, chamar internamente `addContratoFromNegocio(negocio)` e retornar `{ negocio, contrato }`. Idempotente — se já existir contrato ativo para o lead, reaproveita.
- **`assinarContrato(contratoId, base64)`**: capturar `navigator.userAgent` e o IP via `fetch("https://api.ipify.org?format=json")` (com `try/catch` — se falhar, grava `null` e segue). Persistir `ip_assinatura` e `user_agent_assinatura` no `UPDATE`, e refletir no estado local.
- **Numeração do contrato**: trocar `Date.now().slice(-6)` por `MB-{YY}{MM}-{seq}` calculado pelo `count` da tabela no mês. Reduz colisão e fica legível.
- **Validação mínima** antes de gerar: exigir `cpf`, `dataEvento` e `valorNegociado > 0`. Se faltar, retornar erro tratável.

### 2. `src/components/comercial/NegociacoesTab.tsx`

- `handleAprovar` passa a chamar `await onAprovarFechamento(id)` que agora devolve o contrato criado.
- Toast muda para: "Fechamento aprovado e contrato #X gerado". Botão de ação no toast leva direto à aba Contratos com o preview aberto.
- Props: `onAprovarFechamento` passa a retornar `Promise<{ contrato?: Contrato }>`.

### 3. `src/pages/ComercialVendas.tsx`

- Adicionar estado `contratoAutoAbrir: string | null` e propagar para `ContratosTab` como prop opcional `autoOpenContratoId`.
- Ao aprovar, setar esse id + `setActiveTab("contratos")`.

### 4. `src/components/comercial/ContratosTab.tsx`

- Aceitar `autoOpenContratoId?: string` e, num `useEffect`, abrir o `Sheet` de preview quando aparecer.
- Manter o botão "Gerar Contrato" manual como fallback (útil para contratos avulsos / recriação após cancelamento).

### 5. `src/components/comercial/TrilhaAuditoria.tsx`

- Sem mudança estrutural — passa a exibir IP/UA também para contratos assinados via iPad (hoje sempre "—" nesse caminho).

## Pontos que NÃO vamos mexer agora

- Template de termos hardcoded (`"Termos e condições..."`) — fica para um próximo passo dedicado a templates editáveis.
- Estrutura do banco (`contratos`) já tem todas as colunas necessárias (`ip_assinatura`, `user_agent_assinatura`). Nenhuma migration.

## Riscos

- `api.ipify.org` é externo. Em caso de bloqueio de rede, IP fica `null` (graceful). Aceitável — UA ainda é gravado.
- Auto-criação ao aprovar pode gerar contrato indesejado se a vendedora aprovou por engano. Mitigação: idempotência + botão "Cancelar contrato" já existe.

## Validação

- Aprovar uma negociação → ver toast e Sheet abrir com o contrato.
- Assinar no iPad → reabrir Trilha de Auditoria e confirmar IP + User-Agent populados.
- Aprovar duas vezes a mesma negociação → não duplica contrato.
