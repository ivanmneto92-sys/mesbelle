// Uso opcional com pm2 na VPS — ver README.md.
// O auto-reconectar do index.ts cobre quedas de conexão com o WhatsApp;
// isso aqui cobre o processo inteiro morrendo (crash, reboot da VPS).
module.exports = {
  apps: [
    {
      name: "mesbelle-whatsapp",
      script: "npx",
      args: "tsx src/index.ts",
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_restarts: 50,
      restart_delay: 3000,
    },
  ],
};
