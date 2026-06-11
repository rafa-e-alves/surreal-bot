const { SlashCommandBuilder } = require('discord.js');
const { criarEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Mostra o ping do bot'),

  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [criarEmbed({ tipo: 'neutro', titulo: '🏓 Calculando...', descricao: 'Aguarde...', timestamp: false })],
      fetchReply: true,
    });

    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    await interaction.editReply({
      embeds: [criarEmbed({
        tipo: 'sucesso',
        titulo: '🏓 Pong!',
        descricao: 'Latência do bot:',
        fields: [
          { name: '📡 Latência', value: `\`${ping}ms\``, inline: true },
          { name: '💓 WebSocket', value: `\`${wsPing}ms\``, inline: true },
        ],
        timestamp: false,
      })],
    });
  },
};