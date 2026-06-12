const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testar-entrada')
    .setDescription('🧪 Simula a mensagem de boas-vindas (staff)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('Usuário a simular (padrão: você mesmo)')
        .setRequired(false)),

  async execute(interaction) {
    const membro = interaction.options.getMember('usuario') ?? interaction.member;
    const handler = require('../../events/guildMemberAdd');
    await handler.execute(membro);
    await interaction.reply({ content: '✅ Mensagem de entrada simulada!', flags: 64 });
  },
};