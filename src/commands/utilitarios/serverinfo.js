const { SlashCommandBuilder } = require('discord.js');
const { criarEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('🏰 Mostra informações sobre o servidor'),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.fetch();

    await interaction.reply({
      embeds: [criarEmbed({
        tipo: 'primaria',
        titulo: `🏰 ${guild.name}`,
        descricao: null,
        thumbnail: guild.iconURL({ dynamic: true }),
        thumbnail: guild.iconURL({ dynamic: true }),
        fields: [
          { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
          { name: '👥 Membros', value: `\`${guild.memberCount}\``, inline: true },
          { name: '🆔 ID', value: `\`${guild.id}\``, inline: true },
          { name: '📅 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '🚀 Boosts', value: `\`${guild.premiumSubscriptionCount ?? 0}\``, inline: true },
        ],
      })],
    });
  },
};