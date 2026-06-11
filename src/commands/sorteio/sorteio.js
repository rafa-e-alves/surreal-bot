const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { criarEmbed, erroEphemeral } = require('../../utils/embed');

// Armazena sorteios ativos em memória (reinicia se o bot reiniciar)
// Para persistência, substitua por um JSON ou banco de dados
const sorteiosAtivos = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sorteio')
    .setDescription('🎉 Gerencia sorteios do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addSubcommand(sub =>
      sub.setName('criar')
        .setDescription('Cria um novo sorteio')
        .addStringOption(opt =>
          opt.setName('premio')
            .setDescription('O que será sorteado? (ex: VIP Gold, R$20 no PIX)')
            .setRequired(true))
        .addIntegerOption(opt =>
          opt.setName('duracao')
            .setDescription('Duração em minutos')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10080)) // máx 7 dias
        .addIntegerOption(opt =>
          opt.setName('ganhadores')
            .setDescription('Quantos ganhadores? (padrão: 1)')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false))
        .addChannelOption(opt =>
          opt.setName('canal')
            .setDescription('Canal do sorteio (padrão: canal configurado)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('encerrar')
        .setDescription('Encerra um sorteio antes do tempo e sorteia agora')
        .addStringOption(opt =>
          opt.setName('id_mensagem')
            .setDescription('ID da mensagem do sorteio')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('resorteio')
        .setDescription('Sorteia novamente entre os participantes de um sorteio encerrado')
        .addStringOption(opt =>
          opt.setName('id_mensagem')
            .setDescription('ID da mensagem do sorteio encerrado')
            .setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'criar') await criarSorteio(interaction);
    if (sub === 'encerrar') await encerrarSorteio(interaction);
    if (sub === 'resorteio') await resorteio(interaction);
  },
};

// ────────────────────────────────────────────────────────────────────
async function criarSorteio(interaction) {
  const premio = interaction.options.getString('premio');
  const duracaoMin = interaction.options.getInteger('duracao');
  const qtdGanhadores = interaction.options.getInteger('ganhadores') ?? 1;
  const canal = interaction.options.getChannel('canal')
    ?? interaction.guild.channels.cache.get(process.env.CANAL_SORTEIOS)
    ?? interaction.channel;

  await interaction.deferReply({ flags: 64 });

  const encerraEm = new Date(Date.now() + duracaoMin * 60 * 1000);

  const embed = criarEmbed({
    tipo: 'primaria',
    titulo: '🎉 SORTEIO',
    descricao: [
      `**Prêmio:** ${premio}`,
      `**Ganhadores:** ${qtdGanhadores}`,
      `**Encerra:** <t:${Math.floor(encerraEm.getTime() / 1000)}:R>`,
      '',
      'Clique no botão 🎟️ para participar!',
    ].join('\n'),
  });

  embed.addFields({ name: '👥 Participantes', value: '0', inline: true });
  embed.addFields({ name: '🏆 Criado por', value: `${interaction.user}`, inline: true });

  const botao = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('sorteio_participar')
      .setLabel('Participar 🎟️')
      .setStyle(ButtonStyle.Primary),
  );

  const msg = await canal.send({ embeds: [embed], components: [botao] });

  // Salva dados do sorteio
  const dados = {
    messageId: msg.id,
    channelId: canal.id,
    prize: premio,
    winners: qtdGanhadores,
    endsAt: encerraEm,
    participants: new Set(),
    createdBy: interaction.user.id,
    active: true,
  };

  sorteiosAtivos.set(msg.id, dados);

  // Timer para encerrar automaticamente
  setTimeout(() => finalizarSorteio(msg, dados), duracaoMin * 60 * 1000);

  await interaction.editReply({
    embeds: [criarEmbed({
      tipo: 'sucesso',
      titulo: '✅ Sorteio criado!',
      descricao: `Sorteio de **${premio}** iniciado em ${canal}!\nEncerra <t:${Math.floor(encerraEm.getTime() / 1000)}:R>`,
      timestamp: false,
    })],
  });
}

// ────────────────────────────────────────────────────────────────────
async function encerrarSorteio(interaction) {
  const msgId = interaction.options.getString('id_mensagem');
  const dados = sorteiosAtivos.get(msgId);

  if (!dados || !dados.active) {
    return erroEphemeral(interaction, 'Sorteio não encontrado ou já encerrado.');
  }

  await interaction.deferReply({ flags: 64 });

  try {
    const canal = interaction.guild.channels.cache.get(dados.channelId);
    const msg = await canal.messages.fetch(msgId);
    await finalizarSorteio(msg, dados);

    await interaction.editReply({
      embeds: [criarEmbed({ tipo: 'sucesso', titulo: '✅ Sorteio encerrado!', descricao: 'O sorteio foi finalizado.', timestamp: false })],
    });
  } catch (err) {
    console.error(err);
    await erroEphemeral(interaction, 'Não consegui encerrar o sorteio. Verifique o ID da mensagem.');
  }
}

// ────────────────────────────────────────────────────────────────────
async function resorteio(interaction) {
  const msgId = interaction.options.getString('id_mensagem');
  const dados = sorteiosAtivos.get(msgId);

  if (!dados) {
    return erroEphemeral(interaction, 'Sorteio não encontrado. O bot pode ter reiniciado e perdido os dados.');
  }
  if (dados.active) {
    return erroEphemeral(interaction, 'Esse sorteio ainda está ativo! Use `/sorteio encerrar` primeiro.');
  }

  await interaction.deferReply({ flags: 64 });

  const anteriores = new Set(dados.previousWinners ?? []);
  const participantes = Array.from(dados.participants).filter(id => !anteriores.has(id));

  if (participantes.length === 0) {
    return erroEphemeral(interaction, 'Não há mais participantes elegíveis — todos já ganharam.');
  }

  const ganhadores = sortearGanhadores(participantes, dados.winners);
  dados.previousWinners = [...anteriores, ...ganhadores]; // acumula ganhadores
  const mencoes = ganhadores.map(id => `<@${id}>`).join(', ');

  const canal = interaction.guild.channels.cache.get(dados.channelId);
  await canal.send({
    content: `🎊 **RESORTEIO** de **${dados.prize}**!\nParabéns ${mencoes}! 🎉`,
  });

  await interaction.editReply({
    embeds: [criarEmbed({ tipo: 'sucesso', titulo: '✅ Resorteio feito!', descricao: `Ganhadores: ${mencoes}`, timestamp: false })],
  });
}

// ────────────────────────────────────────────────────────────────────
async function finalizarSorteio(message, dados) {
  if (!dados.active) return;
  dados.active = false;

  const participantes = Array.from(dados.participants);

  if (participantes.length === 0) {
    const embed = criarEmbed({
      tipo: 'erro',
      titulo: '🎉 SORTEIO ENCERRADO',
      descricao: `**Prêmio:** ${dados.prize}\n\n❌ Ninguém participou deste sorteio.`,
    });
    await message.edit({ embeds: [embed], components: [] });
    return;
  }

  const ganhadores = sortearGanhadores(participantes, dados.winners);
  dados.previousWinners = ganhadores; // salva pra excluir no resorteio
  const mencoes = ganhadores.map(id => `<@${id}>`).join(', ');

  const embed = criarEmbed({
    tipo: 'sucesso',
    titulo: '🎉 SORTEIO ENCERRADO',
    descricao: [
      `**Prêmio:** ${dados.prize}`,
      `**Ganhadores:** ${mencoes}`,
      `**Total de participantes:** ${participantes.length}`,
    ].join('\n'),
  });

  await message.edit({ embeds: [embed], components: [] });
  await message.channel.send({
    content: `🎊 Parabéns ${mencoes}! Você ganhou **${dados.prize}**! 🎉`,
  });
}

function sortearGanhadores(participantes, qtd) {
  const embaralhados = [...participantes].sort(() => Math.random() - 0.5);
  return embaralhados.slice(0, Math.min(qtd, embaralhados.length));
}

// Exporta o Map para o handler de botões
module.exports.sorteiosAtivos = sorteiosAtivos;
module.exports.finalizarSorteio = finalizarSorteio;