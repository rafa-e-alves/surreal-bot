const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`\n🤖 Bot online como: ${client.user.tag}`);
    console.log(`📊 Servidores: ${client.guilds.cache.size}`);
    console.log(`👥 Membros: ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}\n`);

    // Status rotativo a cada 30s
    const atividades = [
      { name: '⚔️ Rede Rede Surreal', type: ActivityType.Playing },
      { name: `🏰 ${client.guilds.cache.first()?.memberCount ?? '?'} jogadores`, type: ActivityType.Watching },
      { name: '💎 /loja para VIP', type: ActivityType.Watching },
    ];

    let i = 0;
    const setAtividade = () => {
      client.user.setActivity(atividades[i % atividades.length]);
      i++;
    };

    setAtividade();
    setInterval(setAtividade, 30_000);
  },
};