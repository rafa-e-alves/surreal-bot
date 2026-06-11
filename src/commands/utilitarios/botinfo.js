const { SlashCommandBuilder } = require('discord.js');
const { criarEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('🤖 Mostra informações sobre o bot'),

  async execute(interaction) {
    const client = interaction.client;
    const uptime = process.uptime();
    const horas = Math.floor(uptime / 3600);
    const minutos = Math.floor((uptime % 3600) / 60);
    const segundos = Math.floor(uptime % 60);

    const totalMembros = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

    await interaction.reply({
      embeds: [criarEmbed({
        tipo: 'primaria',
        titulo: `🤖 ${client.user.username}`,
        descricao: `Olá ${interaction.user}, veja minhas informações abaixo:`,
        thumbnail: client.user.displayAvatarURL(),
        fields: [
          { name: '🏷️ Nome', value: `\`${client.user.tag}\``, inline: true },
          { name: '🆔 ID', value: `\`${client.user.id}\``, inline: true },
          { name: '👑 Dono', value: `<@${interaction.guild.ownerId}>`, inline: true },
          { name: '📊 Servidores', value: `\`${client.guilds.cache.size}\``, inline: true },
          { name: '👥 Membros', value: `\`${totalMembros}\``, inline: true },
          { name: '💓 Ping', value: `\`${client.ws.ping}ms\``, inline: true },
          { name: '⏱️ Uptime', value: `\`${horas}h ${minutos}m ${segundos}s\``, inline: true },
          { name: '📅 Criado em', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:D>`, inline: true },
        ],
      })],
    });
  },
};
