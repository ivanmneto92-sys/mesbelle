# Assinatura Online de Contratos — Canvas + PDF + E-mail

## Objetivo
Permitir que clientes assinem contratos digitalmente — presencialmente no iPad do ateliê ou remotamente via link enviado por e-mail — gerando PDF assinado com trilha de auditoria (IP, data/hora, user-agent).

## O que muda para a usuária
1. Na tela de **Comercial → Contratos**, o card de contrato ganha dois botões novos:
   - **"Assinar no iPad"** — abre o painel atual de assinatura (já funciona).
   - **"Enviar link por e-mail"** — envia link único de assinatura para a cliente.
2. A cliente recebe um e-mail bonito com o resumo do contrato e o botão **"Assinar contrato"**.
3. Ao clicar no link, ela vai para uma página pública (sem login) `/assinar/:token` mostrando o contrato completo + canvas de assinatura responsivo (otimizado para iPad/celular).
4. Após assinar, ela vê confirmação e o ateliê recebe notificação. O contrato no sistema fica marcado como **Assinado** com:
   - Imagem da assinatura
   - Data/hora exata
   - IP de origem
   - Dispositivo (user-agent simplificado)
5. PDF do contrato assinado pode ser **baixado** ou **reenviado por e-mail** a qualquer momento.

## Validade jurídica
Conforme MP 2.200-2/01 art. 10 §2º, assinatura eletrônica simples com prova de autoria (IP + timestamp + token único enviado ao e-mail da cliente) é juridicamente válida no Brasil para contratos privados como locação de vestido. Não substitui ICP-Brasil, mas é suficiente para o caso de uso.

---

## Detalhes técnicos

### 1. Migração de Contratos para o banco
Hoje `contratos` vivem em localStorage no hook `useLeads`. Para o link público funcionar, eles precisam estar no Supabase.

**Nova tabela `contratos`:**
- Campos: `id`, `numero`, `lead_id`, `negocio_id`, `nome_cliente`, `cpf_cliente`, `email_cliente`, `data_evento`, `valor_total`, `termos_texto`, `status_assinatura` (pendente/assinado/cancelado), `assinatura_base64`, `data_assinatura`, `ip_assinatura`, `user_agent_assinatura`, `signing_token` (uuid único), `token_expires_at`, `criado_por` (uuid), `created_at`, `updated_at`.
- RLS: admin/vendedor podem ler/escrever; **leitura pública** liberada via função SECURITY DEFINER `get_contrato_by_token(token)` que retorna apenas se o token for válido e não expirado.
- Função `assinar_contrato_publico(token, assinatura, ip, ua)` SECURITY DEFINER para gravar assinatura sem auth.

### 2. Rota pública
Nova rota em `App.tsx`: `/assinar/:token` (fora do `AppLayout`, sem auth). Componente `AssinaturaPublica.tsx` que:
- Busca contrato via RPC `get_contrato_by_token`.
- Renderiza termos + `SignaturePad` existente.
- No submit, captura IP via header da edge function e chama RPC `assinar_contrato_publico`.

### 3. Edge functions
- **`send-contract-signing-link`**: recebe `contratoId`, gera token, salva no banco, envia e-mail transacional com link `https://<dominio>/assinar/<token>`.
- **`send-contract-signed-confirmation`**: dispara após assinatura — envia PDF para cliente E para o ateliê.
- **`record-signature-metadata`**: captura IP real do cliente (header `x-forwarded-for`) e grava na linha do contrato.

### 4. Geração de PDF
Biblioteca **`@react-pdf/renderer`** no frontend (sem dependência de backend). Componente `ContratoPDF.tsx` reaproveita o HTML de impressão atual. Botão "Baixar PDF" em ambos os lados (ateliê e cliente).

### 5. E-mail (Lovable Emails)
Requer domínio configurado. Vou verificar o status antes de prosseguir. Templates React Email:
- `contract-signing-request.tsx` — link para assinar.
- `contract-signed-confirmation.tsx` — confirmação para cliente com link de download.
- `contract-signed-internal.tsx` — notificação para o ateliê.

### 6. Refatoração do `useLeads`
Os métodos `addContratoFromNegocio`, `assinarContrato`, `updateContratoStatus` passam a usar Supabase ao invés de localStorage. Mantém a mesma API para não quebrar `ContratosTab.tsx`.

---

## Arquivos
**Criar:** `supabase/migrations/<timestamp>_contratos_table.sql`, `src/pages/AssinaturaPublica.tsx`, `src/components/comercial/ContratoPDF.tsx`, `src/components/comercial/EnviarLinkAssinaturaDialog.tsx`, `supabase/functions/send-contract-signing-link/index.ts`, `supabase/functions/send-contract-signed-confirmation/index.ts`, 3 templates em `supabase/functions/_shared/transactional-email-templates/`.

**Editar:** `src/App.tsx` (rota pública), `src/hooks/useLeads.ts` (migrar contratos para DB), `src/components/comercial/ContratosTab.tsx` (botão enviar link + download PDF).

## Pré-requisitos
- Configurar domínio de e-mail Lovable (se ainda não estiver).
- `@react-pdf/renderer` instalado.

## Fora de escopo
- Integração com Clicksign/DocuSign.
- Verificação por SMS/selfie.
- Múltiplos signatários.

## Riscos
- **Migração de contratos**: contratos existentes em localStorage precisarão ser migrados manualmente ou perdidos (provavelmente são apenas mocks).
- **Domínio de e-mail**: se não estiver configurado, vou pedir para configurar antes de seguir.
