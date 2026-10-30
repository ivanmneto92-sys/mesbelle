# Mesbelle WhatsApp Bot

Serviço separado do app principal (não entra no build do Vite/Vercel) que
mantém uma conexão com o WhatsApp via [Baileys](https://github.com/WhiskeySockets/Baileys),
com reconexão automática.

O status da conexão e o QR code pra parear aparecem automaticamente na
**aba "WhatsApp" dentro do CRM** do site — não precisa olhar o terminal
pra escanear.

**Estado atual: só a infraestrutura de conexão.** Ele conecta, mantém a aba
WhatsApp do CRM atualizada e loga as mensagens recebidas no terminal — ainda
não cria nem atualiza leads no Supabase a partir das mensagens. Isso é o
próximo passo, depois de fechar a regra de quando um contato vira lead.

## Risco — leia antes de usar com o número real da loja

O Baileys não é a API oficial do WhatsApp — ele reimplementa o protocolo do
WhatsApp Web. Isso dá mais autonomia (sem depender de outro serviço, sem
custo por conversa), mas existe risco real de o número ser banido, mesmo
respondendo só quem já procurou vocês. Por isso a ideia é testar primeiro
com um número descartável antes de conectar o número principal.

## Configuração

```bash
cd whatsapp-bot
cp .env.example .env
```

Abra o `.env` e preencha `SUPABASE_SERVICE_ROLE_KEY` (pega em Supabase →
Project Settings → API → service_role secret — **não** é a mesma chave
pública que o site usa). Sem isso o bot não consegue atualizar a aba
WhatsApp do CRM e não inicia.

## Rodando localmente

```bash
npm install
npm start
```

Na primeira vez, o QR code aparece tanto no terminal quanto na aba
**WhatsApp** do CRM no site (atualiza sozinho, sem precisar recarregar a
página). No celular: WhatsApp → Aparelhos conectados → Conectar aparelho →
escaneie.

A sessão fica salva em `whatsapp-bot/auth_info_baileys/` — assim não precisa
escanear de novo toda vez que reiniciar. **Essa pasta nunca deve ser
commitada nem compartilhada** (já está no `.gitignore` daqui): quem tiver
esses arquivos tem acesso total à conta do WhatsApp conectada.

Pra desconectar e trocar de conta, apague essa pasta e rode `npm start` de
novo — vai pedir um QR code novo.

## Rodando numa VPS (ficar ligado 24h)

O reconectar automático dentro do script cobre quedas de conexão (internet
cair, WhatsApp derrubar a sessão). Não cobre o processo inteiro morrer
(crash, reboot da VPS) — pra isso, use o [pm2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
cd whatsapp-bot
npm install
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # segue as instruções que ele imprime, pra sobreviver a reboot
```

Comandos úteis depois:

```bash
pm2 logs mesbelle-whatsapp   # ver o QR code / mensagens recebidas
pm2 restart mesbelle-whatsapp
pm2 stop mesbelle-whatsapp
```
