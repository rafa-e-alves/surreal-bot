const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { criarEmbed, erroEphemeral } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anunciar')
    .setDescription('📢 Envia um anúncio em embed para um canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
      opt.setName('titulo')
        .setDescription('Título do anúncio')
        .setRequired(true)
        .setMaxLength(100))
    .addStringOption(opt =>
      opt.setName('mensagem')
        .setDescription('Conteúdo do anúncio (use \\n para quebrar linha)')
        .setRequired(true)
        .setMaxLength(2000))
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal onde o anúncio será enviado (padrão: canal de anúncios configurado)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('imagem')
        .setDescription('URL de uma imagem para o anúncio')
        .setRequired(false))
    .addRoleOption(opt =>
      opt.setName('mencionar')
        .setDescription('Cargo para mencionar junto ao anúncio')
        .setRequired(false)),

  async execute(interaction) {
    const titulo = interaction.options.getString('titulo');
    const mensagem = interaction.options.getString('mensagem').replace(/\\n/g, '\n');
    const canal = interaction.options.getChannel('canal') ?? interaction.guild.channels.cache.get(process.env.CANAL_ANUNCIOS) ?? interaction.channel;
    const imagem = interaction.options.getString('imagem');
    const cargo = interaction.options.getRole('mencionar');

    await interaction.deferReply({ flags: 64 });

    try {
      const embed = criarEmbed({
        tipo: 'primaria',
        titulo: titulo,
        descricao: mensagem,
        imagem: imagem ?? null,
      });

      // allowedMentions garante que @everyone/@here funcionem quando o bot tiver permissão
      await canal.send({
        content: cargo ? `${cargo}` : undefined,
        embeds: [embed],
        allowedMentions: { parse: ['roles', 'everyone'] },
      });

      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'sucesso',
          titulo: '✅ Anúncio enviado!',
          descricao: `Publicado em ${canal}.`,
          timestamp: false,
        })],
      });
    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, `Não consegui enviar em ${canal}. Verifique as permissões.`);
    }
  },
};