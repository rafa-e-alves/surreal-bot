const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`\n🤖 Bot online como: ${client.user.tag}`);
    console.log(`📊 Servidores: ${client.guilds.cache.size}`);
    console.log(`👥 Membros: ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}\n`);

    // Restaura sorteios salvos
    const { restaurarSorteios } = require('../commands/sorteio/sorteio');
    restaurarSorteios(client);

    // Status rotativo a cada 30s
    const ip = process.env.IP_MINECRAFT ?? 'Em Breve!';
    const loja = process.env.URL_LOJA ? process.env.URL_LOJA.replace('https://', '').replace('http://', '') : 'loja.redesurreal.com.br';
    const atividades = [
      { name: `⚔️ Rede Surreal`, type: ActivityType.Playing },
      { name: `🌐 ${ip}`, type: ActivityType.Watching },
      { name: `💎 ${loja}`, type: ActivityType.Watching },
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