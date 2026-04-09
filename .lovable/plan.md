

## Módulo Acervo & Produção — Implementação Completa

### Situação atual
A página `Acervo.tsx` é um placeholder estático com dados hardcoded, checkboxes desabilitados e nenhuma interatividade real (sem CRUD, sem agenda, sem persistência).

### Arquitetura

```text
src/
├── types/acervo.ts              (tipos e interfaces)
├── hooks/useAcervo.ts           (estado + localStorage com validação)
├── pages/Acervo.tsx             (página principal, abas)
├── components/acervo/
│   ├── CatalogoTab.tsx          (grid de cards + busca/filtro)
│   ├── VestidoCard.tsx          (card individual)
│   ├── VestidoDetailModal.tsx   (edição de vestido)
│   ├── NovoVestidoSheet.tsx     (formulário slide-over)
│   ├── AgendaModal.tsx          (calendário com dias bloqueados)
│   ├── ProducaoTab.tsx          (lista de produções)
│   ├── ProducaoCard.tsx         (card com checklist interativo)
│   └── DetalhesTecnicosSheet.tsx(painel lateral com notas)
```

### O que será construído

**1. Hook `useAcervo.ts`** — Persistência em localStorage com validação de schema (mesmo padrão do `useLeads.ts`)
- CRUD de vestidos, reservas de agenda, produções e etapas
- Validação ao carregar dados do storage
- Funções: `addVestido`, `updateVestido`, `deleteVestido`, `toggleEtapa`, `addProducao`, `addReserva`

**2. Tipos em `types/acervo.ts`**
- `Vestido`: id, nome, cor, tamanho, comprimento, precoAluguel, precoVenda, status (disponivel/alugado/ajuste/manutencao), isConsignado, imagemUrl
- `ReservaAgenda`: id, vestidoId, dataInicio, dataFim, statusReserva (aluguel/lavanderia/ajuste)
- `Producao`: id, tituloVestido, clienteNome, dataPrazo, dataProva, statusGeral, refImagensUrls, notasTecnicas
- `EtapaProducao`: id, producaoId, nomeEtapa, isConcluido

**3. Aba Catálogo** — `CatalogoTab.tsx` + `VestidoCard.tsx`
- Busca em tempo real por nome/cor
- Filtro por status (dropdown com "Todos", "Disponível", "Alugado", "Em Ajuste", "Em Manutenção")
- Grid responsivo (2 cols mobile, 3 tablet, 4 desktop)
- Cards com: imagem, badges de status (cores distintas por status), badge "Consignado" no canto direito, nome, atributos, precos, botão "Ver Agenda"
- Clique no card abre modal de detalhes/edição
- Clique em "Ver Agenda" abre modal de calendário

**4. Modal "Novo Vestido"** — `NovoVestidoSheet.tsx`
- Sheet (slide-over lateral) com formulário completo
- Campos: Nome, Categoria (select), Cor, Tamanho (select P/M/G/GG), Comprimento (select Curto/Midi/Longo), Preço Aluguel, Preço Venda, Upload de foto, Toggle "Consignado"
- Validação e salvamento via hook

**5. Modal de Detalhes** — `VestidoDetailModal.tsx`
- Exibe foto grande, todos os dados editáveis
- Permite alterar status, adicionar/trocar foto
- Botão de excluir vestido

**6. Modal Agenda** — `AgendaModal.tsx`
- Calendário mensal usando `Calendar` do shadcn
- Dias com reserva marcados em vermelho/cinza (disabled)
- Possibilidade de adicionar nova reserva (tipo: Aluguel, Lavanderia, Ajuste) com data início/fim

**7. Aba Produção** — `ProducaoTab.tsx` + `ProducaoCard.tsx`
- Cabeçalho "Produção — Primeiro Aluguel" + botão "+ Nova Produção"
- Cards largos com: título, cliente, datas, badge de status
- Checklist interativo com 7 etapas — ao clicar, marca como concluído com strikethrough e salvamento otimista
- Barra de progresso visual baseada nas etapas concluídas
- Botão "Upload Referência" abre file input (salva URL em base64 ou placeholder)
- Botão "Detalhes Técnicos" abre Sheet lateral com textarea para anotações do ateliê

**8. Formulário Nova Produção** — Dialog com campos: título do vestido, nome da cliente, data prazo, data prova

### Detalhes técnicos
- Persistência: localStorage com keys `mesbelle_vestidos`, `mesbelle_reservas`, `mesbelle_producoes`, `mesbelle_etapas`
- As keys serão adicionadas ao `APP_STORAGE_KEYS` em `useLeads.ts` para limpeza seletiva do ErrorBoundary
- Dados iniciais de demonstração (6 vestidos, 1 produção com etapas) carregados na primeira vez
- Salvamento otimista nos checkboxes (atualiza UI imediatamente)
- Tipografia: Playfair Display nos títulos, Inter nos textos

### Arquivos modificados/criados
- `src/types/acervo.ts` (novo)
- `src/hooks/useAcervo.ts` (novo)
- `src/pages/Acervo.tsx` (reescrito)
- `src/components/acervo/CatalogoTab.tsx` (novo)
- `src/components/acervo/VestidoCard.tsx` (novo)
- `src/components/acervo/VestidoDetailModal.tsx` (novo)
- `src/components/acervo/NovoVestidoSheet.tsx` (novo)
- `src/components/acervo/AgendaModal.tsx` (novo)
- `src/components/acervo/ProducaoTab.tsx` (novo)
- `src/components/acervo/ProducaoCard.tsx` (novo)
- `src/components/acervo/DetalhesTecnicosSheet.tsx` (novo)
- `src/hooks/useLeads.ts` (adicionar novas keys ao array de limpeza)

