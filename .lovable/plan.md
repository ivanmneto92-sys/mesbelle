
# Més Belle — Sistema de Gestão de Ateliê

## Design System
- **Cores**: Fundo branco, bordô/vinho (#6B1D2A / #8B2332) como cor principal, detalhes em dourado suave
- **Logo**: Incorporar a logo enviada no menu lateral e tela de login
- **Tipografia**: Elegante e limpa, fontes serif para títulos (Playfair Display) e sans-serif para corpo
- **UI**: Shadcn/ui com tema customizado bordô, cards com sombras suaves, ícones Lucide

## Estrutura

### 1. Autenticação
- Tela de login elegante com logo centralizada, campos email/senha
- Mock de 3 níveis de acesso: Admin, Vendedor, Sócio (localStorage por enquanto)

### 2. Layout Principal
- **Sidebar** colapsável com ícones e navegação para todas as seções
- Header com nome do usuário, notificações e logout
- Responsivo: sidebar vira drawer no mobile

### 3. Dashboard Principal
- Cards de métricas: Faturamento Hoje, Agendamentos, Entregas Pendentes
- Gráfico velocímetro "Score Geral da Loja"
- Painel de Avisos Rápidos com alertas mockados

### 4. Comercial & CRM
- **Kanban** drag-and-drop: Leads → Contato → Prova Agendada → Negociação → Fechamento → No-Show
- Formulário de cadastro de leads/clientes completo
- Tabela de métricas comerciais (taxa conversão, CPL, CAC)
- Área de contratos com botão de geração e placeholder assinatura digital

### 5. Acervo & Produção
- **Catálogo em grade** com cards de vestidos (foto, nome, cor, tamanho, valores, status)
- Filtros: pesquisa, status (Disponível/Alugado/Em Ajuste), categoria, cor
- Badge visual para peças consignadas
- Calendário individual por peça (bloqueio de datas)
- Tela de produção com checklist de etapas e upload de referências

### 6. Logística
- Painel com vestidos agrupados: Para Enviar, Em Trânsito, Com Cliente, Atrasado
- Botão para gerar Termo de Retirada (placeholder)

### 7. Financeiro
- Tabela de fluxo de caixa (entradas/saídas)
- Formulário rápido de lançamentos com upload de comprovante
- Placeholder para importação OFX/CSV
- Gráficos DRE: gastos por categoria, Previsão vs Realizado
- Configuração de impostos e taxas de cartão

### 8. Time & Performance
- Lista de funcionários com comissão acumulada
- Gráficos comparativos de vendas por vendedor
- Placeholder QR Code avaliação

### 9. Portal de Sócios
- Dashboard executivo simplificado
- Lista de ativos com depreciação automática
- Cálculo de Valuation (multiplicador EBITDA)
- Distribuição de lucros

### 10. Configurações
- Placeholder motor de e-mails automáticos
- Placeholder emissão NFe
- Gerador de QR Code

## Dados
- Todos os dados serão mockados com valores realistas em português (R$, nomes brasileiros)
- Estrutura preparada para futura integração com Supabase
