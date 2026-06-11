const { SlashCommandBuilder } = require('discord.js');
const { criarEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ip')
    .setDescription('🌐 Mostra o IP do servidor Minecraft'),

  async execute(interaction) {
    const ip = process.env.IP_MINECRAFT ?? 'Não configurado';
    await interaction.reply({
      embeds: [criarEmbed({
        tipo: 'primaria',
        titulo: '🌐 IP do Servidor',
        descricao: `Conecte-se ao nosso servidor Minecraft:\n\n\`\`\`${ip}\`\`\``,
      })],
    });
  },
};
