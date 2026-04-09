

## Módulo Logística — Implementação Completa

### Situação atual
Página estática com dados hardcoded, sem persistência, sem modais, sem mudança de status.

### Arquitetura

```text
src/
├── types/logistica.ts              (tipos)
├── hooks/useLogistica.ts           (estado + localStorage + auto-atraso)
├── pages/Logistica.tsx             (reescrito)
├── components/logistica/
│   ├── LogisticaDetalhesSheet.tsx   (slide-over com dados operacionais)
│   └── TermoRetiradaModal.tsx      (seleção de cliente + geração do termo)
```

### O que será construído

**1. Tipos `types/logistica.ts`**
- `StatusLogistica`: "para_enviar" | "em_transito" | "com_cliente" | "atrasado" | "devolvido"
- `AluguelLogistica`: id, vestidoNome, clienteNome, clienteTelefone, enderecoEntrega, dataSaida, dataRetorno, statusLogistica, codigoRastreio

**2. Hook `useLogistica.ts`**
- localStorage com key `mesbelle_logistica`, validação no load (padrão useLeads)
- Dados seed: 6 itens distribuídos pelos 4 status ativos
- `updateStatus(id, novoStatus)` — move item entre blocos
- `updateRastreio(id, codigo)` — salva código de rastreio
- **Automação de atraso**: ao carregar, percorre itens "com_cliente" e compara `dataRetorno < hoje` → muda para "atrasado" automaticamente
- Itens "devolvido" ficam ocultos do painel (filtrados)

**3. Página `Logistica.tsx` (reescrita)**
- Grid 2x2 com os 4 blocos (Para Enviar, Em Trânsito, Com Cliente, Atrasado)
- Cards com ícones coloridos (Send/azul, Truck/amarelo, User/verde, AlertTriangle/vermelho)
- Badge contador dinâmico por bloco
- Mini-cards com nome do vestido, cliente + data, botão "Detalhes"
- Botão "Gerar Termo de Retirada" no cabeçalho

**4. `LogisticaDetalhesSheet.tsx` (slide-over)**
- Exibe: endereço, telefone (com link WhatsApp), datas saída/retorno
- Dropdown para mudar status — ao salvar, card se move para o bloco correto
- Campo de rastreio editável
- Ao mudar para "devolvido", item sai do painel

**5. `TermoRetiradaModal.tsx`**
- Dialog listando clientes com status "para_enviar" ou "com_cliente"
- Ao selecionar, gera termo com dados (nome, vestido, datas, termos de responsabilidade)
- Exibe pré-visualização do termo em tela para impressão/assinatura

### Arquivos criados/modificados
- `src/types/logistica.ts` (novo)
- `src/hooks/useLogistica.ts` (novo)
- `src/pages/Logistica.tsx` (reescrito)
- `src/components/logistica/LogisticaDetalhesSheet.tsx` (novo)
- `src/components/logistica/TermoRetiradaModal.tsx` (novo)
- `src/hooks/useLeads.ts` (adicionar key ao APP_STORAGE_KEYS)

