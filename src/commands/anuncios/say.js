const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
} = require('discord.js');

// Cores disponíveis para embed
const CORES = {
  'vermelho':  0xED4245,
  'laranja':   0xE8A317,
  'amarelo':   0xFEE75C,
  'verde':     0x57F287,
  'azul':      0x5865F2,
  'roxo':      0x9B59B6,
  'branco':    0xFFFFFF,
  'preto':     0x23272A,
};

// Armazena configurações temporárias por usuário (antes de abrir o modal)
const pendentes = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('💬 Envia uma mensagem pelo bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
      opt.setName('tipo')
        .setDescription('Tipo de mensagem')
        .setRequired(true)
        .addChoices(
          { name: '💬 Mensagem normal', value: 'normal' },
          { name: '📋 Embed', value: 'embed' },
        ))
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal de destino (padrão: canal atual)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('cor')
        .setDescription('Cor da embed (padrão: vermelho do servidor)')
        .setRequired(false)
        .addChoices(
          { name: '🔴 Vermelho', value: 'vermelho' },
          { name: '🟠 Laranja', value: 'laranja' },
          { name: '🟡 Amarelo', value: 'amarelo' },
          { name: '🟢 Verde', value: 'verde' },
          { name: '🔵 Azul', value: 'azul' },
          { name: '🟣 Roxo', value: 'roxo' },
          { name: '⚪ Branco', value: 'branco' },
          { name: '⚫ Preto', value: 'preto' },
        )),

  async execute(interaction) {
    const tipo = interaction.options.getString('tipo');
    const canal = interaction.options.getChannel('canal') ?? interaction.channel;
    const cor = interaction.options.getString('cor') ?? 'vermelho';

    // Salva configs antes de abrir o modal
    pendentes.set(interaction.user.id, { tipo, canal, cor });

    // Abre o modal com campo de texto grande
    const modal = new ModalBuilder()
      .setCustomId('say_modal')
      .setTitle(tipo === 'embed' ? '📋 Nova Embed' : '💬 Nova Mensagem');

    const campoMensagem = new TextInputBuilder()
      .setCustomId('say_conteudo')
      .setLabel('Mensagem')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Digite sua mensagem aqui...\nUse Enter para pular linhas.')
      .setRequired(true)
      .setMaxLength(2000);

    // Se for embed, adiciona campo de título
    if (tipo === 'embed') {
      const campoTitulo = new TextInputBuilder()
        .setCustomId('say_titulo')
        .setLabel('Título (opcional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Título da embed')
        .setRequired(false)
        .setMaxLength(100);

      modal.addComponents(
        new ActionRowBuilder().addComponents(campoTitulo),
        new ActionRowBuilder().addComponents(campoMensagem),
      );
    } else {
      modal.addComponents(new ActionRowBuilder().addComponents(campoMensagem));
    }

    await interaction.showModal(modal);
  },

  // Handler do modal — chamado pelo interactionCreate
  async handleModal(interaction) {
    const config = pendentes.get(interaction.user.id);
    pendentes.delete(interaction.user.id);

    if (!config) {
      return interaction.reply({ content: '❌ Sessão expirada. Use o comando novamente.', flags: 64 });
    }

    const { tipo, canal, cor } = config;
    const conteudo = interaction.fields.getTextInputValue('say_conteudo');
    const titulo = tipo === 'embed'
      ? interaction.fields.getTextInputValue('say_titulo') || null
      : null;

    await interaction.deferReply({ flags: 64 });

    try {
      if (tipo === 'embed') {
        const embed = new EmbedBuilder()
          .setColor(CORES[cor])
          .setDescription(conteudo)
          .setTimestamp()
          .setFooter({ text: '⚔️ Rede Surreal' });

        if (titulo) embed.setTitle(titulo);

        await canal.send({ embeds: [embed] });
      } else {
        await canal.send({ content: conteudo });
      }

      await interaction.editReply({ content: `✅ Mensagem enviada em ${canal}.` });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `❌ Não consegui enviar em ${canal}.` });
    }
  },
};