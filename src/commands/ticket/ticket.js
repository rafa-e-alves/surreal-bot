const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  AttachmentBuilder,
} = require('discord.js');
const { criarEmbed, erroEphemeral } = require('../../utils/embed');
const { enviarLog, embedLog } = require('../../utils/logs');

const CATEGORIAS = [
  { value: 'compras',  label: '🛒 Compras',             descricao: 'Problemas com a loja ou VIP',      env: 'CATEGORIA_TICKET_COMPRAS'   },
  { value: 'duvidas',  label: '❓ Dúvidas',              descricao: 'Dúvidas gerais sobre o servidor',  env: 'CATEGORIA_TICKET_DUVIDAS'   },
  { value: 'denuncia', label: '🚨 Denúncias',            descricao: 'Denunciar jogadores ou bugs',      env: 'CATEGORIA_TICKET_DENUNCIAS' },
  { value: 'recurso',  label: '⚖️ Revisão de Punição',   descricao: 'Contestar um ban ou mute',         env: 'CATEGORIA_TICKET_REVISOES'  },
  { value: 'parceria', label: '🤝 Programa de Parceiros',descricao: 'Proposta de parceria',             env: 'CATEGORIA_TICKET_PARCEIROS' },
  { value: 'boost',    label: '🚀 Ativação Boost',       descricao: 'Recompensa por boost no servidor', env: 'CATEGORIA_TICKET_BOOST'     },
  { value: 'outros',   label: '📎 Outros',                descricao: 'Outro assunto não listado acima', env: 'CATEGORIA_TICKET_OUTROS'    },
];

const painelAtivo = new Set();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎫 Sistema de tickets do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub.setName('painel')
        .setDescription('Envia o painel de tickets — apenas um por servidor'))
    .addSubcommand(sub =>
      sub.setName('fechar')
        .setDescription('Fecha o ticket gerando transcript (staff)'))
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adiciona um usuário ao ticket')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuário a adicionar').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove um usuário do ticket')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuário a remover').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'painel')  return enviarPainel(interaction);
    if (sub === 'fechar')  return fecharTicket(interaction);
    if (sub === 'add')     return addUsuario(interaction);
    if (sub === 'remove')  return removeUsuario(interaction);
  },

  async handleButton(interaction) {
    if (interaction.customId === 'ticket_fechar_confirmar') {
      await executarFechamento(interaction);
    } else if (interaction.customId === 'ticket_fechar_cancelar') {
      await interaction.update({ content: '❌ Fechamento cancelado.', components: [], embeds: [] });
    }
  },

  async handleSelect(interaction) {
    if (interaction.customId === 'ticket_categoria') {
      await criarCanalTicket(interaction);
    }
  },
};

// ─────────────────────────────────────────────
function buildMenu(placeholder) {
  return new StringSelectMenuBuilder()
    .setCustomId('ticket_categoria')
    .setPlaceholder(placeholder)
    .addOptions(CATEGORIAS.map(c => ({ label: c.label, description: c.descricao, value: c.value })));
}

// ─────────────────────────────────────────────
async function enviarPainel(interaction) {
  const podeGerenciar = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
  if (!podeGerenciar) return erroEphemeral(interaction, 'Apenas administradores podem enviar o painel.');

  if (painelAtivo.has(interaction.guild.id)) {
    return interaction.reply({
      content: '❌ Já existe um painel ativo. Delete-o antes de criar um novo.',
      flags: 64,
    });
  }

  const embed = criarEmbed({
    tipo: 'primaria',
    titulo: '🎫 Central de Atendimento — Surreal Factions',
    descricao: [
      'Olá, seja bem-vindo(a) à central de atendimento do **Surreal Bot**.',
      'Abaixo estão os tipos de atendimento disponíveis.',
      '',
      '**Atendimento via chamado** 📩',
      '• Selecione abaixo qual departamento está relacionado à sua dúvida e será gerado um canal de texto privado.',
      '• Assim que o canal for gerado, já pode informar nossa equipe para agilizarmos seu atendimento 😉.',
    ].join('\n'),
  });

  const row = new ActionRowBuilder().addComponents(buildMenu('Clique aqui!'));
  await interaction.channel.send({ embeds: [embed], components: [row] });
  painelAtivo.add(interaction.guild.id);
  await interaction.reply({ content: '✅ Painel enviado!', flags: 64 });
}

// ─────────────────────────────────────────────
async function criarCanalTicket(interaction) {
  await interaction.deferReply({ flags: 64 });

  const guild = interaction.guild;
  const usuario = interaction.user;
  const catInfo = CATEGORIAS.find(c => c.value === interaction.values[0]);

  // Restaura o menu no painel
  const row = new ActionRowBuilder().addComponents(buildMenu('Clique aqui!'));
  await interaction.message.edit({ components: [row] }).catch(() => {});

  // Verifica ticket existente
  const ticketExistente = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildText &&
          ch.name.startsWith('ticket-') &&
          ch.topic?.includes(usuario.id),
  );

  if (ticketExistente) {
    return interaction.editReply({ content: `❌ Você já tem um ticket aberto: ${ticketExistente}` });
  }

  try {
    const cargoStaff = guild.roles.cache.get(process.env.CARGO_STAFF);
    const categoriaId = process.env[catInfo.env];
    const categoriaCanal = categoriaId ? guild.channels.cache.get(categoriaId) : null;

    const permissoes = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: guild.members.me.id,
        allow: [
          PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages, PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: usuario.id,
        allow: [
          PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
        ],
      },
    ];

    if (cargoStaff) {
      permissoes.push({
        id: cargoStaff.id,
        allow: [
          PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ManageChannels, PermissionFlagsBits.AttachFiles,
        ],
      });
    }

    const canal = await guild.channels.create({
      name: `ticket-${usuario.id}`,
      type: ChannelType.GuildText,
      parent: categoriaCanal ?? null,
      permissionOverwrites: permissoes,
      topic: `Ticket de ${usuario.tag} (${usuario.id}) | Categoria: ${catInfo.label}`,
    });

    const embed = criarEmbed({
      tipo: 'info',
      titulo: catInfo.label,
      descricao: [
        `Olá ${usuario}! Bem-vindo ao seu ticket.`,
        '',
        `**Categoria:** ${catInfo.label}`,
        `**Aberto por:** ${usuario}`,
        '',
        'Descreva seu problema e aguarde um membro da staff.',
        '🔒 Apenas a staff pode fechar este ticket.',
      ].join('\n'),
    });

    const mencao = cargoStaff ? `${cargoStaff} ` : '';

    const botaoFechar = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_fechar_confirmar')
        .setLabel('Fechar Ticket 🔒')
        .setStyle(ButtonStyle.Danger),
    );

    await canal.send({ content: `${mencao}${usuario}`, embeds: [embed], components: [botaoFechar] });
    await interaction.editReply({ content: `✅ Ticket criado: ${canal}` });

    // Log de ticket aberto
    await enviarLog(interaction.guild, 'CANAL_LOGS_TICKETS', {
      embeds: [embedLog({
        cor: 0x5865F2,
        titulo: '🎫 Ticket Aberto',
        fields: [
          { name: '👤 Usuário', value: `${usuario}`, inline: true },
          { name: '📂 Categoria', value: catInfo.label, inline: true },
          { name: '📍 Canal', value: `${canal}`, inline: true },
        ],
      })],
    });
  } catch (err) {
    console.error(err);
    await interaction.editReply({ content: '❌ Erro ao criar o ticket. Fale com a staff.' });
  }
}

// ─────────────────────────────────────────────
async function fecharTicket(interaction) {
  if (!interaction.channel.name.startsWith('ticket-')) {
    return erroEphemeral(interaction, 'Use dentro de um canal de ticket.');
  }

  const botoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_fechar_confirmar').setLabel('Confirmar ✅').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_fechar_cancelar').setLabel('Cancelar ❌').setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({
    embeds: [criarEmbed({
      tipo: 'aviso',
      titulo: '⚠️ Fechar Ticket',
      descricao: 'Tem certeza? Um transcript será gerado e o canal será deletado.',
      timestamp: false,
    })],
    components: [botoes],
  });
}

async function executarFechamento(interaction) {
  const cargoStaff = interaction.guild.roles.cache.get(process.env.CARGO_STAFF);
  const temPermissao = !cargoStaff ||
    interaction.member.roles.cache.has(cargoStaff.id) ||
    interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!temPermissao) {
    return interaction.reply({ content: '❌ Apenas a staff pode fechar tickets.', flags: 64 });
  }

  await interaction.update({ content: '📝 Gerando transcript...', components: [], embeds: [] });

  try {
    const mensagens = await interaction.channel.messages.fetch({ limit: 100 });
    const sorted = [...mensagens.values()].reverse();

    const linhas = sorted.map(m => {
      const data = new Date(m.createdTimestamp).toLocaleString('pt-BR');
      const conteudo = m.content || (m.embeds.length ? '[Embed]' : '[Arquivo/Mídia]');
      return `[${data}] ${m.author.tag}: ${conteudo}`;
    });

    const transcript = [
      `═══════════════════════════════════`,
      `TRANSCRIPT — ${interaction.channel.name}`,
      `Fechado por: ${interaction.user.tag}`,
      `Data: ${new Date().toLocaleString('pt-BR')}`,
      `═══════════════════════════════════`,
      '', ...linhas,
    ].join('\n');

    const attachment = new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), {
      name: `${interaction.channel.name}.txt`,
    });

    // Log de ticket fechado (resumo)
    await enviarLog(interaction.guild, 'CANAL_LOGS_TICKETS', {
      embeds: [embedLog({
        cor: 0xED4245,
        titulo: '🔒 Ticket Fechado',
        fields: [
          { name: '📋 Canal', value: `\`${interaction.channel.name}\``, inline: true },
          { name: '👮 Fechado por', value: `${interaction.user}`, inline: true },
          { name: '🕐 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        ],
      })],
    });

    // Transcript em canal separado
    await enviarLog(interaction.guild, 'CANAL_LOGS_TRANSCRIPTS', {
      embeds: [embedLog({
        cor: 0x5865F2,
        titulo: '📄 Transcript',
        fields: [
          { name: '📋 Canal', value: `\`${interaction.channel.name}\``, inline: true },
          { name: '👮 Fechado por', value: `${interaction.user}`, inline: true },
        ],
      })],
      files: [attachment],
    });

    await interaction.channel.send({ content: '✅ Transcript gerado. Fechando em 5 segundos...' });
    setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
  } catch (err) {
    console.error(err);
    setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
  }
}

// Cooldown para add/remove (por usuário)
const cooldowns = new Map();
function checarCooldown(userId, segundos = 5) {
  const agora = Date.now();
  const expira = cooldowns.get(userId) ?? 0;
  if (agora < expira) return Math.ceil((expira - agora) / 1000);
  cooldowns.set(userId, agora + segundos * 1000);
  return 0;
}

function temPermissaoStaff(interaction) {
  const cargoStaff = interaction.guild.roles.cache.get(process.env.CARGO_STAFF);
  return !cargoStaff ||
    interaction.member.roles.cache.has(cargoStaff.id) ||
    interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
}

// ─────────────────────────────────────────────
async function addUsuario(interaction) {
  if (!interaction.channel.name.startsWith('ticket-')) return erroEphemeral(interaction, 'Use dentro de um ticket.');
  if (!temPermissaoStaff(interaction)) return erroEphemeral(interaction, '❌ Apenas a staff pode adicionar membros ao ticket.');

  const espera = checarCooldown(interaction.user.id);
  if (espera > 0) return erroEphemeral(interaction, `⏳ Aguarde ${espera}s antes de usar este comando novamente.`);

  const usuario = interaction.options.getMember('usuario');

  const permissaoAtual = interaction.channel.permissionOverwrites.cache.get(usuario.id);
  if (permissaoAtual?.allow.has(PermissionFlagsBits.ViewChannel)) {
    return erroEphemeral(interaction, `${usuario} já está neste ticket.`);
  }

  await interaction.channel.permissionOverwrites.edit(usuario, {
    ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
  });
  await interaction.reply({ embeds: [criarEmbed({ tipo: 'sucesso', titulo: '✅ Adicionado', descricao: `${usuario} adicionado ao ticket.`, timestamp: false })] });
}

async function removeUsuario(interaction) {
  if (!interaction.channel.name.startsWith('ticket-')) return erroEphemeral(interaction, 'Use dentro de um ticket.');
  if (!temPermissaoStaff(interaction)) return erroEphemeral(interaction, '❌ Apenas a staff pode remover membros do ticket.');

  const espera = checarCooldown(interaction.user.id);
  if (espera > 0) return erroEphemeral(interaction, `⏳ Aguarde ${espera}s antes de usar este comando novamente.`);

  const usuario = interaction.options.getMember('usuario');

  const permissaoAtual = interaction.channel.permissionOverwrites.cache.get(usuario.id);
  if (!permissaoAtual || permissaoAtual.deny.has(PermissionFlagsBits.ViewChannel) || !permissaoAtual.allow.has(PermissionFlagsBits.ViewChannel)) {
    return erroEphemeral(interaction, `${usuario} não está neste ticket.`);
  }

  await interaction.channel.permissionOverwrites.edit(usuario, { ViewChannel: false });
  await interaction.reply({ embeds: [criarEmbed({ tipo: 'aviso', titulo: '🚫 Removido', descricao: `${usuario} removido do ticket.`, timestamp: false })] });
}