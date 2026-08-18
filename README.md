# Mes Belle

estou enviando a logo e as cores, bom usar uma cor predominante branco com esse estilo de vermelho. 

Crie uma aplicação web responsiva (desktop e mobile) para gerenciar todas as operações de um ateliê de aluguel e venda de vestidos de festa. O sistema deve ter uma interface limpa, com um menu lateral de navegação e autenticação de usuário (login/senha) com níveis de acesso (Admin, Vendedor, Sócio). O design deve ser elegante, focado em facilidade de uso para a equipe de loja.

Estrutura de Navegação (Menu Lateral):

1. Dashboard Principal (Home)

Seções de UI: Cards de resumo com métricas diárias: "Faturamento Hoje" (R$), "Agendamentos" (número), "Entregas Pendentes" (número).

Score: Exibir "Score Geral da Loja" (gráfico de velocímetro de 0 a 100).

Alertas: Painel de "Avisos Rápidos" (ex: "3 Vestidos não devolvidos").

2. Comercial & CRM (Gestão de Vendas)

Funil de Vendas (Kanban): Visualização em colunas: Leads, Contato, Prova Agendada, Negociação, Fechamento, No-Show.

Cadastro de Leads/Clientes: Formulário completo: Nome, Telefone, E-mail, Endereço, CPF, Medidas (upload de imagem de medidas).

Métricas Comerciais: Tabela/Gráfico mostrando Taxa de Conversão por etapa e Custo por Lead (CPL) / CAC.

Contratos: Área para gerar contratos automáticos baseados no cadastro. Deve ter integração (ou placeholder para) assinatura digital via iPad.

3. Acervo & Produção (Gestão de Inventário e Atelier)

Catálogo de Vestidos: Visualização em grade (com fotos). Cadastro por Categoria, Cor, Tamanho, Valor de Aluguel, Valor de Venda.

Filtros: Barra de pesquisa e filtros por status (Disponível, Alugado, Em Ajuste).

Tag de Consignado: Exibir um ícone visual em peças consignadas.

Agenda por Peça: Visualização de calendário individual para cada vestido para bloquear datas de aluguel/manutenção.

Produção (Primeiro Aluguel): Tela de gestão de projetos. Checklist de etapas (Tecido > Modelista > Bordadeira > Provas > Entrega). Upload de imagens de referência e campo de detalhes técnicos e prazos.

4. Logística (Entregas & Retiradas)

Painel Operacional: Lista de vestidos agrupada por status: "Para Enviar", "Em Trânsito", "Com Cliente", "Atrasado".

Termos: Botão para gerar e assinar digitalmente o "Termo de Retirada".

5. Financeiro & Controladoria (Gestão de Caixa e Lucro - IMPORTANTE: SEM API BANCÁRIA)

Fluxo de Caixa: Tabela de entradas e saídas.

Lançamentos: Formulário rápido para inserção manual de Despesas/Receitas (Valor, Data, Categoria, Descrição, Upload de Comprovante).

Importação: Criar uma funcionalidade para importar arquivos OFX/CSV de extratos bancários manuais para popular a tabela de lançamentos.

Relatórios (DRE): Gráficos de linha de gastos por categoria e barras comparando Previsão Orçamentária vs. Realizado.

Impostos e Taxas: Tela de configuração para definir alíquotas de impostos e taxas de cartão, que serão aplicadas automaticamente sobre o faturamento manual.

6. Time & Performance

Painel da Equipe: Lista de funcionários com controle de contratos e comissão acumulada.

Performance: Gráficos comparativos mensais de vendas por vendedor e score de atendimento (QR Code de avaliação).

7. Portal de Sócios (Visão Macro Restrita)

Dashboard Executivo: Visão geral do negócio (saúde financeira, DRE simplificado).

Patrimônio & Valuation: Lista de ativos (vestidos, móveis) com deságio automático (regra de depreciação configurável). Cálculo dinâmico de Valuation (Multiplicador de EBITDA).

Lucros: Tela de cálculo de distribuição de lucros.

8. Configurações & Automações

Motor de E-mails: Placeholder para regras de e-mails automáticos (agendamento, venda).

Emissão de NFe: Área para configurar integração com API de terceiros para nota fiscal.

QR Code: Gerador de QR Code para avaliação do cliente.

Comportamento Esperado:

O sistema deve priorizar a integridade dos dados, com tabelas relacionais robustas (ex: Clientes linked a Contratos e Vestidos). Toda a entrada financeira deve ser manual ou via importação de arquivo, sem chamadas de API bancária Open Finance.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mesbelle.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/669181c2-e5b7-4175-af92-320716f0abbf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
