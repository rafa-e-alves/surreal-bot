const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { criarEmbed, erroEphemeral } = require('../../utils/embed');
const fs = require('node:fs');
const path = require('node:path');

// ──────────────────────────────────────────────
//  Persistência em JSON
// ──────────────────────────────────────────────
const DB_PATH = path.join(__dirname, '../../..', 'data', 'sorteios.json');

function lerSorteios() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, '[]');
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch { return []; }
}

function salvarSorteios(sorteios) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  // Converte Set para Array antes de salvar
  const serializados = sorteios.map(s => ({
    ...s,
    participants: [...s.participants],
  }));
  fs.writeFileSync(DB_PATH, JSON.stringify(serializados, null, 2));
}

function carregarSorteios() {
  const dados = lerSorteios();
  return dados.map(s => ({
    ...s,
    participants: new Set(s.participants),
    endsAt: new Date(s.endsAt),
  }));
}

// Map em memória
const sorteiosAtivos = new Map();

// ──────────────────────────────────────────────
//  Comando /sorteio
// ──────────────────────────────────────────────
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
            .setDescription('O que será sorteado? (ex: VIP Gold)')
            .setRequired(true))
        .addStringOption(opt =>
          opt.setName('data')
            .setDescription('Data e hora do sorteio (DD/MM/AAAA HH:MM)')
            .setRequired(true))
        .addIntegerOption(opt =>
          opt.setName('ganhadores')
            .setDescription('Quantos ganhadores? (padrão: 1)')
            .setMinValue(1).setMaxValue(10).setRequired(false))
        .addChannelOption(opt =>
          opt.setName('canal')
            .setDescription('Canal do sorteio')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('encerrar')
        .setDescription('Encerra um sorteio antes do tempo')
        .addStringOption(opt =>
          opt.setName('id_mensagem')
            .setDescription('ID da mensagem do sorteio')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('resorteio')
        .setDescription('Sorteia novamente excluindo ganhadores anteriores')
        .addStringOption(opt =>
          opt.setName('id_mensagem')
            .setDescription('ID da mensagem do sorteio encerrado')
            .setRequired(true))),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'criar')    return criarSorteio(interaction, client);
    if (sub === 'encerrar') return encerrarSorteio(interaction, client);
    if (sub === 'resorteio') return resorteio(interaction, client);
  },

  // Chamado no ready.js para restaurar sorteios após reiniciar
  restaurarSorteios,
};

// ──────────────────────────────────────────────
async function criarSorteio(interaction, client) {
  const premio = interaction.options.getString('premio');
  const dataStr = interaction.options.getString('data');
  const qtdGanhadores = interaction.options.getInteger('ganhadores') ?? 1;
  const canal = interaction.options.getChannel('canal')
    ?? interaction.guild.channels.cache.get(process.env.CANAL_SORTEIOS)
    ?? interaction.channel;

  // Parseia DD/MM/AAAA HH:MM
  const match = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) {
    return erroEphemeral(interaction, '❌ Formato inválido! Use: `DD/MM/AAAA HH:MM`\nEx: `25/06/2026 20:00`');
  }

  const [, d, m, a, h, min] = match;
  const encerraEm = new Date(`${a}-${m}-${d}T${h}:${min}:00`);

  if (isNaN(encerraEm.getTime()) || encerraEm <= new Date()) {
    return erroEphemeral(interaction, '❌ Data inválida ou já passou! Insira uma data futura.');
  }

  await interaction.deferReply({ flags: 64 });

  const embed = criarEmbed({
    tipo: 'primaria',
    titulo: '🎉 SORTEIO',
    descricao: [
      `**Prêmio:** ${premio}`,
      `**Ganhadores:** ${qtdGanhadores}`,
      `**Encerra:** <t:${Math.floor(encerraEm.getTime() / 1000)}:F> (<t:${Math.floor(encerraEm.getTime() / 1000)}:R>)`,
      '',
      'Clique no botão 🎟️ para participar!',
    ].join('\n'),
    fields: [
      { name: '👥 Participantes', value: '0', inline: true },
      { name: '🏆 Criado por', value: `${interaction.user}`, inline: true },
    ],
  });

  const botao = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('sorteio_participar')
      .setLabel('Participar 🎟️')
      .setStyle(ButtonStyle.Primary),
  );

  const msg = await canal.send({ embeds: [embed], components: [botao] });

  const dados = {
    messageId: msg.id,
    channelId: canal.id,
    guildId: interaction.guild.id,
    prize: premio,
    winners: qtdGanhadores,
    endsAt: encerraEm,
    participants: new Set(),
    previousWinners: [],
    createdBy: interaction.user.id,
    active: true,
  };

  sorteiosAtivos.set(msg.id, dados);
  _salvarTodos();
  _agendarSorteio(msg.id, dados, client);

  await interaction.editReply({
    embeds: [criarEmbed({
      tipo: 'sucesso',
      titulo: '✅ Sorteio criado!',
      descricao: `Sorteio de **${premio}** iniciado em ${canal}!\nEncerra <t:${Math.floor(encerraEm.getTime() / 1000)}:F>`,
      timestamp: false,
    })],
  });
}

// ──────────────────────────────────────────────
function _agendarSorteio(messageId, dados, client) {
  const agora = Date.now();
  const encerraEm = new Date(dados.endsAt).getTime();
  const delay = encerraEm - agora;

  if (delay <= 0) {
    // Já passou — sorteia imediatamente
    _executarFinalizacao(messageId, dados, client);
  } else {
    setTimeout(() => _executarFinalizacao(messageId, dados, client), delay);
  }
}

async function _executarFinalizacao(messageId, dados, client) {
  if (!dados.active) return;

  try {
    const guild = client.guilds.cache.get(dados.guildId);
    if (!guild) return;
    const canal = guild.channels.cache.get(dados.channelId);
    if (!canal) return;
    const msg = await canal.messages.fetch(messageId).catch(() => null);
    if (!msg) return;

    await finalizarSorteio(msg, dados);
  } catch (err) {
    console.error('[sorteio] Erro ao finalizar:', err.message);
  }
}

// ──────────────────────────────────────────────
async function encerrarSorteio(interaction, client) {
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
    await erroEphemeral(interaction, 'Não consegui encerrar o sorteio.');
  }
}

// ──────────────────────────────────────────────
async function resorteio(interaction) {
  const msgId = interaction.options.getString('id_mensagem');
  const dados = sorteiosAtivos.get(msgId);

  if (!dados) {
    return erroEphemeral(interaction, 'Sorteio não encontrado. Pode ter sido perdido ao reiniciar o bot.');
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
  dados.previousWinners = [...anteriores, ...ganhadores];
  _salvarTodos();

  const mencoes = ganhadores.map(id => `<@${id}>`).join(', ');
  const canal = interaction.guild.channels.cache.get(dados.channelId);
  await canal.send({ content: `🎊 **RESORTEIO** de **${dados.prize}**!\nParabéns ${mencoes}! 🎉` });

  await interaction.editReply({
    embeds: [criarEmbed({ tipo: 'sucesso', titulo: '✅ Resorteio feito!', descricao: `Ganhadores: ${mencoes}`, timestamp: false })],
  });
}

// ──────────────────────────────────────────────
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
    _salvarTodos();
    return;
  }

  const ganhadores = sortearGanhadores(participantes, dados.winners);
  dados.previousWinners = ganhadores;
  _salvarTodos();

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
  await message.channel.send({ content: `🎊 Parabéns ${mencoes}! Você ganhou **${dados.prize}**! 🎉` });
}

// ──────────────────────────────────────────────
//  Restaura sorteios ao iniciar o bot
// ──────────────────────────────────────────────
async function restaurarSorteios(client) {
  const sorteios = carregarSorteios();
  if (sorteios.length === 0) return;

  console.log(`🎉 Restaurando ${sorteios.length} sorteio(s)...`);

  for (const dados of sorteios) {
    sorteiosAtivos.set(dados.messageId, dados);
    if (dados.active) {
      _agendarSorteio(dados.messageId, dados, client);
      console.log(`  ✅ Sorteio ${dados.messageId} reagendado`);
    }
  }
}

// ──────────────────────────────────────────────
function _salvarTodos() {
  salvarSorteios([...sorteiosAtivos.values()]);
}

function sortearGanhadores(participantes, qtd) {
  const embaralhados = [...participantes].sort(() => Math.random() - 0.5);
  return embaralhados.slice(0, Math.min(qtd, embaralhados.length));
}

module.exports.sorteiosAtivos = sorteiosAtivos;
module.exports.finalizarSorteio = finalizarSorteio;