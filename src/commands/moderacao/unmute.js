const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { criarEmbed, erroEphemeral } = require('../../utils/embed');
const { enviarLog, embedLog } = require('../../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('🔊 Remove o mute de um usuário')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuário a desmutar').setRequired(true))
    .addStringOption(opt =>
      opt.setName('motivo').setDescription('Motivo do unmute').setRequired(false)),

  async execute(interaction) {
    const alvo = interaction.options.getMember('usuario');
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';

    if (!alvo) return erroEphemeral(interaction, 'Usuário não encontrado.');
    if (!alvo.isCommunicationDisabled()) return erroEphemeral(interaction, 'Esse usuário não está mutado.');

    await interaction.deferReply();

    try {
      await alvo.timeout(null, `${interaction.user.tag}: ${motivo}`);

      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'sucesso',
          titulo: '🔊 Usuário Desmutado',
          descricao: `**${alvo.user.tag}** foi desmutado.`,
          fields: [
            { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivo', value: motivo, inline: true },
          ],
        })],
      });

      await enviarLog(interaction.guild, 'CANAL_LOGS_MODERACAO', {
        embeds: [embedLog({
          cor: 0x57F287,
          titulo: '🔊 Usuário Desmutado',
          fields: [
            { name: '👤 Usuário', value: `${alvo.user}`, inline: true },
            { name: '🆔 ID', value: `\`${alvo.id}\``, inline: true },
            { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivo', value: motivo, inline: true },
          ],
        })],
      });

      // Reseta infrações do automod
      const { cache } = require('../../events/messageCreate');
      if (cache?.has(alvo.id)) {
        cache.get(alvo.id).infrações = 0;
      }

    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, 'Não consegui desmutar o usuário.');
    }
  },
};