

## Melhorias no Módulo Logística e Cabeçalho Global

O módulo Logística já está funcional com grid 2x2, detalhes em slide-over, termo de retirada e auto-atraso. As melhorias focam em dois pontos: **cabeçalho global interativo** e **refinamentos visuais**.

### O que será feito

**1. Dropdown de Notificações (`AppLayout.tsx`)**
- Ao clicar no sino, abre um Popover com lista de alertas
- Alertas dinâmicos gerados a partir do localStorage: vestidos atrasados e entregas do dia
- Badge do sino mostra contagem real (atrasados + entregas pendentes)
- Cada alerta com ícone, texto descritivo e timestamp

**2. Menu do Usuário (`AppLayout.tsx`)**
- Ao clicar no nome/avatar, abre um DropdownMenu com "Minha Conta" e "Sair"
- "Sair" chama `logout()` e redireciona para `/login`

**3. Estilo visual nos itens atrasados (`Logistica.tsx`)**
- Nome do vestido no bloco "Atrasado" renderizado em `text-destructive` (vermelho)
- Data de retorno ultrapassada com indicador visual (ex: "2 dias de atraso")

**4. Contagem dinâmica no badge do sino**
- Hook utilitário que lê `mesbelle_logistica` do localStorage e conta itens atrasados + para_enviar do dia
- Badge atualiza em tempo real conforme mudanças na logística

### Arquivos modificados
- `src/components/layout/AppLayout.tsx` (notificações dropdown, menu do usuário)
- `src/pages/Logistica.tsx` (estilo vermelho para itens atrasados, indicador de dias de atraso)

### Arquivos criados
- Nenhum arquivo novo necessario; toda a logica fica nos arquivos existentes

