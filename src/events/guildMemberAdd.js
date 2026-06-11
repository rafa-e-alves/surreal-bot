const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const canalId = process.env.CANAL_BOAS_VINDAS;
    if (!canalId) return;

    const canal = member.guild.channels.cache.get(canalId);
    if (!canal) return;

    const ip = process.env.IP_MINECRAFT ?? 'em breve';
    const urlLoja = process.env.URL_LOJA ?? 'https://loja.surrealfactions.com.br';
    const memberCount = member.guild.memberCount;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('⚔️ Bem-vindo(a) ao Surreal Factions!')
      .setDescription(`Olá ${member}! É muito bom ter você aqui.\nVocê é o **${memberCount}º membro** do servidor!`)
      .addFields(
        {
          name: '📋 Para começar',
          value: [
            '> Leia as regras para não ser punido',
            '> Conecte-se ao servidor Minecraft',
            '> Adquira seu VIP e tenha vantagens exclusivas',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🌐 IP do Servidor',
          value: `\`\`\`${ip}\`\`\``,
          inline: true,
        },
        {
          name: '🛒 Loja',
          value: `[Clique aqui](${urlLoja})`,
          inline: true,
        },
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setTimestamp()
      .setFooter({ text: `Surreal Factions • ${memberCount} membros` });

    await canal.send({ content: `${member}`, embeds: [embed] });
  },
};