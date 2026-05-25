# O que falta para tudo funcionar de verdade

O cadastro de leads em `/crm` já está 100% integrado ao banco. Os pontos abertos estão **no Dashboard** (tudo mockado) e na **página pública de avaliação** (não existe — o QR Code aponta para uma rota inexistente, então o score nunca muda sozinho).

## 1. Dashboard hoje é estático

Atualmente em `src/pages/Dashboard.tsx` está tudo escrito à mão:

- **KPIs**: "Faturamento hoje R$ 4.850", "Agendamentos 7", "Entregas pendentes 4", "Conversão 62%" — valores fixos.
- **"Hoje no ateliê / Sua agenda"**: lista 4 itens fictícios (Maria Silva 10h, Ana Beatriz 11h30…).
- **Alertas**: 5 avisos fictícios.
- **Score da loja**: `<ScoreGauge score={73} />`, NPS 82, No prazo 94%, Conversão 62% — todos hardcoded.
- **Saudação**: "você tem 3 provas e 4 entregas hoje" — número fixo no título.

## 2. Página pública `/avaliacao` não existe

- O QR Code da página `/equipe` aponta para `https://mesbelle.lovable.app/avaliacao`.
- Não há rota cadastrada → cai no `NotFound`.
- Sem essa página, a tabela `avaliacoes_clientes` nunca recebe registros e o score **nunca muda automaticamente**.

---

# Plano de implementação

## A. Dashboard ligado ao banco

Substituir todos os mocks por dados reais (mantém visual idêntico — só troca a fonte dos números).

**KPIs (4 cards no topo)**
- *Faturamento hoje*: soma de `transacoes_financeiras` onde `tipo='receita'` e `data=hoje`. Comparação com ontem para o trend.
- *Agendamentos*: contagem de `leads` com `prova_data=hoje` + `+N novos hoje` = leads criados hoje (`criado_em=hoje`).
- *Entregas pendentes*: `alugueis_logistica` com `status_logistica in ('para_enviar','em_transito')`. Sub-rótulo: quantos `status='atrasado'`.
- *Conversão do mês*: % de `leads` do mês com `status_funil='convertido'` (ou negócios aprovados / total).

**"Hoje no ateliê" (agenda real)**
- `leads` com `prova_data = hoje` → tipo `prova`, link `/crm`.
- `alugueis_logistica` com `data_saida = hoje` → tipo `retirada`/`entrega`, link `/logistica`.
- Ordenar por horário (`prova_hora`). Mostrar até 6 itens. Empty state se não houver nada.

**Alertas (timeline)**
- Aluguéis atrasados (`status_logistica='atrasado'`) → severidade `urgent`.
- Contratos `status_assinatura='pendente'` há mais de 3 dias → `urgent`.
- Provas agendadas hoje → `info`.
- Leads novos das últimas 24h não enviados ao comercial → `info`.

**Saudação dinâmica**
- "{nome}, você tem X provas e Y entregas hoje." — calcular X/Y a partir das mesmas queries acima.

**Score da loja (cálculo automático)**
- `score` = média ponderada de 3 sub-métricas, normalizada para 0–100:
  - **NPS**: média de `avaliacoes_clientes.nota` dos últimos 30 dias × 20 (escala 1–5 → 0–100).
  - **No prazo**: `alugueis_logistica` devolvidos sem atraso ÷ total devolvidos nos últimos 30 dias.
  - **Conversão**: leads convertidos ÷ leads criados nos últimos 30 dias.
- Cada uma também aparece no rodapé do card (substitui os "82", "94%", "62%" fixos).

**Onde fica a lógica**
- Novo hook `src/hooks/useDashboard.ts` centraliza todas as queries (com `Promise.all`) e devolve `{ kpis, agendaHoje, alertas, score, subScores, loading }`.
- `Dashboard.tsx` consome o hook e elimina os arrays `metrics`, `todayItems`, `alerts`.

## B. Página pública `/avaliacao` (QR Code → score automático)

**Nova rota pública** (sem login, igual a `/assinar/:token`):

- Arquivo: `src/pages/AvaliacaoPublica.tsx`.
- Registrar em `src/App.tsx` antes do `ProtectedRoute`.
- Layout dark/elegante seguindo o tema das páginas públicas (Auth/Assinatura), Fraunces + Nunito.

**Fluxo do formulário**
1. Cliente escaneia QR → abre `/avaliacao`.
2. Seleciona o vendedor que atendeu (lista vinda de `funcionarios` ativos) — opcional, pode ser "Não sei / Geral".
3. Dá nota de 1 a 5 estrelas (obrigatório).
4. Comentário livre (opcional, até 500 caracteres).
5. Submit → `INSERT` em `avaliacoes_clientes` via função `submeter_avaliacao_publica` (SECURITY DEFINER, igual ao padrão de `assinar_contrato_publico`) para que não precise de login.
6. Tela de agradecimento simples ("Obrigada pelo seu feedback 💛").

**Segurança**
- Função RPC valida: nota entre 1 e 5, comentário ≤ 500 chars, `funcionario_id` existe (se enviado).
- Rate-limit leve: bloquear mais de 5 envios do mesmo `funcionario_id` em 1 minuto (opcional, pode ficar para depois).
- Não retorna lista de avaliações — só aceita escrita.

**Resultado automático**
- Toda avaliação enviada já entra em `avaliacoes_clientes`.
- O `useDashboard` recalcula NPS na próxima leitura → score da loja muda sozinho.
- A página `/equipe` (que já lê `avaliacoes_clientes`) também atualiza o score por vendedor.

## C. Pequeno cleanup

- Remover `ACERVO_STORAGE_KEYS` de `src/hooks/useAcervo.ts` (sem consumidores).
- Manter `LEGACY_STORAGE_KEYS` no `useLeads.ts` (limpa caches antigos no login).

---

## Detalhes técnicos

- Nova migration: função `public.submeter_avaliacao_publica(_funcionario_id uuid, _nota int, _comentario text)` `SECURITY DEFINER` retornando `jsonb {ok, error?}`. Sem novas tabelas — `avaliacoes_clientes` já existe.
- Ajustar RLS de `avaliacoes_clientes` (somente leitura via CRM permanece; INSERT público só via RPC).
- `useDashboard.ts` faz 6 queries paralelas em mount + um `supabase.channel` opcional escutando `transacoes_financeiras`, `leads`, `alugueis_logistica`, `avaliacoes_clientes` para refresh em tempo real.
- Skeletons enquanto `loading=true` para não "piscar" zeros.

## Validação

- Cadastrar 1 lead com `prova_data=hoje` → aparece em "Sua agenda" no Dashboard.
- Marcar 1 aluguel como `atrasado` → aparece em alertas e nos KPIs.
- Abrir `/avaliacao` em aba anônima, enviar nota 5 → NPS e score do Dashboard sobem; aparece no `/equipe`.
- Logout/login: tudo persiste.

## Fora de escopo

- Notificações push/e-mail de alertas.
- Filtros por período no Dashboard (hoje/semana/mês).
- Anti-fraude pesado na página pública (captcha) — pode ser adicionado depois se houver abuso.
