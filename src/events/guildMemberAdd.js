const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    // Adiciona cargo de membro automaticamente
    const cargoMembroId = process.env.CARGO_MEMBRO;
    if (cargoMembroId) {
      const cargoMembro = member.guild.roles.cache.get(cargoMembroId);
      if (cargoMembro) {
        await member.roles.add(cargoMembro).catch(err =>
          console.error('[guildMemberAdd] Erro ao adicionar cargo:', err.message)
        );
      }
    }

    const canalId = process.env.CANAL_BOAS_VINDAS;
    if (!canalId) return;

    const canal = member.guild.channels.cache.get(canalId);
    if (!canal) return;

    const ip = process.env.IP_MINECRAFT ?? 'Em Breve!';
    const urlLoja = process.env.URL_LOJA ?? 'https://loja.redesurreal.com.br';
    const memberCount = member.guild.memberCount;
    const lojaTexto = urlLoja ? `**[loja.redesurreal.com](${urlLoja})**` : '**Em Breve!**';

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('Bem Vindo(a)!')
      .setDescription([
        `Olá ${member}, bem vindo ao servidor oficial da **Rede Surreal**!`,
        '',
        '> Fique por dentro das regras para não ser punido.',
        '> Acesse nosso servidor pelo ip abaixo!',
        `> Adquira seu VIP e tenha vantagens exclusivas através do site ${lojaTexto}!`,
      ].join('\n'))
      .addFields(
        { name: '🌐 IP do Servidor', value: `\`\`\`${ip}\`\`\``, inline: true },
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ text: `Rede Surreal | Minecraft Server • ${memberCount} membros` });

    await canal.send({ embeds: [embed] });
  },
};