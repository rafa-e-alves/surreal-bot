const { SlashCommandBuilder } = require('discord.js');
const { criarEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('👤 Mostra informações sobre um usuário')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('Usuário a consultar (padrão: você mesmo)')
        .setRequired(false)),

  async execute(interaction) {
    const membro = interaction.options.getMember('usuario') ?? interaction.member;
    const usuario = membro.user;

    await interaction.reply({
      embeds: [criarEmbed({
        tipo: 'primaria',
        titulo: `👤 ${usuario.tag}`,
        descricao: null,
        thumbnail: usuario.displayAvatarURL({ dynamic: true }),
        fields: [
          { name: '🆔 ID', value: `\`${usuario.id}\``, inline: true },
          { name: '📅 Conta criada', value: `<t:${Math.floor(usuario.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '📥 Entrou no servidor', value: `<t:${Math.floor(membro.joinedTimestamp / 1000)}:D>`, inline: true },
        ],
      })],
    });
  },
};