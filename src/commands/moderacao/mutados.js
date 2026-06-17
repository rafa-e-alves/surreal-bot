const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { criarEmbed, erroEphemeral } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mutados')
    .setDescription('🔇 Lista todos os usuários com timeout ativo')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      await interaction.guild.members.fetch();
      const mutados = interaction.guild.members.cache.filter(m => m.isCommunicationDisabled());

      if (mutados.size === 0) {
        return interaction.editReply({
          embeds: [criarEmbed({
            tipo: 'sucesso',
            titulo: '🔇 Usuários Mutados',
            descricao: 'Nenhum usuário mutado no momento.',
            timestamp: false,
          })],
        });
      }

      const lista = [...mutados.values()].map(m => {
        const expira = m.communicationDisabledUntil;
        const agora = new Date();
        const diffMs = expira - agora;
        const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let tempo = '';
        if (dias > 0) tempo += `${dias}d `;
        if (horas > 0) tempo += `${horas}h `;
        if (minutos > 0) tempo += `${minutos}m`;
        if (!tempo) tempo = 'menos de 1 minuto';

        return `${m.user} — **${tempo.trim()}** restante(s) | expira <t:${Math.floor(expira.getTime() / 1000)}:R>`;
      }).join('\n');

      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'erro',
          titulo: `🔇 Usuários Mutados (${mutados.size})`,
          descricao: lista,
          timestamp: false,
        })],
      });
    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, 'Não consegui buscar os usuários mutados.');
    }
  },
};