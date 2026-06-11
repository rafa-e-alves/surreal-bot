const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { criarEmbed, erroEphemeral } = require('../../utils/embed');
const { enviarLog, embedLog } = require('../../utils/logs');
const { msgsClear } = require('../../utils/clearFlag');

// ──────────────────────────────────────────────
//  /ban
// ──────────────────────────────────────────────
const ban = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Bane um usuário do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuário a ser banido').setRequired(true))
    .addStringOption(opt =>
      opt.setName('motivo').setDescription('Motivo do ban').setRequired(false))
    .addIntegerOption(opt =>
      opt.setName('apagar_dias')
        .setDescription('Apagar mensagens dos últimos X dias (0–7)')
        .setMinValue(0).setMaxValue(7).setRequired(false)),

  async execute(interaction) {
    const alvo = interaction.options.getMember('usuario');
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';
    const apagar = interaction.options.getInteger('apagar_dias') ?? 0;

    if (!alvo) return erroEphemeral(interaction, 'Usuário não encontrado neste servidor.');
    if (!alvo.bannable) return erroEphemeral(interaction, 'Não consigo banir esse usuário. Ele pode ter cargo superior ao meu.');

    await interaction.deferReply();

    try {
      await alvo.ban({ deleteMessageDays: apagar, reason: `${interaction.user.tag}: ${motivo}` });

      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'erro',
          titulo: '🔨 Usuário Banido',
          descricao: `**${alvo.user.tag}** foi banido do servidor.`,
          fields: [
            { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivo', value: motivo, inline: true },
            { name: '🗑️ Mensagens apagadas', value: `${apagar} dia(s)`, inline: true },
          ],
        })],
      });

      await enviarLog(interaction.guild, 'CANAL_LOGS_MODERACAO', {
        embeds: [embedLog({
          cor: 0xED4245,
          titulo: '🔨 Usuário Banido',
          fields: [
            { name: '👤 Usuário', value: `${alvo.user}`, inline: true },
            { name: '🆔 ID', value: `\`${alvo.user.id}\``, inline: true },
            { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivo', value: motivo, inline: true },
            { name: '🗑️ Mensagens apagadas', value: `${apagar} dia(s)`, inline: true },
          ],
        })],
      });
    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, 'Não consegui banir o usuário.');
    }
  },
};

// ──────────────────────────────────────────────
//  /kick
// ──────────────────────────────────────────────
const kick = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Expulsa um usuário do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuário a ser expulso').setRequired(true))
    .addStringOption(opt =>
      opt.setName('motivo').setDescription('Motivo do kick').setRequired(false)),

  async execute(interaction) {
    const alvo = interaction.options.getMember('usuario');
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';

    if (!alvo) return erroEphemeral(interaction, 'Usuário não encontrado.');
    if (!alvo.kickable) return erroEphemeral(interaction, 'Não consigo expulsar esse usuário.');

    await interaction.deferReply();

    try {
      await alvo.kick(`${interaction.user.tag}: ${motivo}`);

      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'aviso',
          titulo: '👢 Usuário Expulso',
          descricao: `**${alvo.user.tag}** foi expulso do servidor.`,
          fields: [
            { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivo', value: motivo, inline: true },
          ],
        })],
      });

      await enviarLog(interaction.guild, 'CANAL_LOGS_MODERACAO', {
        embeds: [embedLog({
          cor: 0xFEE75C,
          titulo: '👢 Usuário Expulso',
          fields: [
            { name: '👤 Usuário', value: `${alvo.user}`, inline: true },
            { name: '🆔 ID', value: `\`${alvo.user.id}\``, inline: true },
            { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivo', value: motivo, inline: true },
          ],
        })],
      });
    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, 'Não consegui expulsar o usuário.');
    }
  },
};

// ──────────────────────────────────────────────
//  /unban
// ──────────────────────────────────────────────
const unban = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('✅ Remove o ban de um usuário')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(opt =>
      opt.setName('id_usuario').setDescription('ID do usuário banido').setRequired(true))
    .addStringOption(opt =>
      opt.setName('motivo').setDescription('Motivo do unban').setRequired(false)),

  async execute(interaction) {
    const userId = interaction.options.getString('id_usuario');
    const motivo = interaction.options.getString('motivo') ?? 'Sem motivo informado';

    await interaction.deferReply();

    try {
      const banInfo = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!banInfo) return erroEphemeral(interaction, 'Esse usuário não está banido ou o ID é inválido.');

      await interaction.guild.members.unban(userId, `${interaction.user.tag}: ${motivo}`);

      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'sucesso',
          titulo: '✅ Ban Removido',
          descricao: `**${banInfo.user.tag}** foi desbanido.`,
          fields: [
            { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivo', value: motivo, inline: true },
          ],
        })],
      });

      await enviarLog(interaction.guild, 'CANAL_LOGS_MODERACAO', {
        embeds: [embedLog({
          cor: 0x57F287,
          titulo: '✅ Ban Removido',
          fields: [
            { name: '👤 Usuário', value: `\`${banInfo.user.tag}\``, inline: true },
            { name: '🆔 ID', value: `\`${banInfo.user.id}\``, inline: true },
            { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
            { name: '📝 Motivo', value: motivo, inline: true },
          ],
        })],
      });
    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, 'ID inválido ou usuário não encontrado nos bans.');
    }
  },
};

// ──────────────────────────────────────────────
//  /clear
// ──────────────────────────────────────────────
const clear = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🗑️ Apaga mensagens do canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('quantidade')
        .setDescription('Quantas mensagens apagar (1–100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Apagar apenas mensagens deste usuário').setRequired(false)),

  async execute(interaction) {
    const qtd = interaction.options.getInteger('quantidade');
    const alvo = interaction.options.getUser('usuario');

    await interaction.deferReply({ flags: 64 });

    try {
      let msgs = await interaction.channel.messages.fetch({ limit: qtd });

      if (alvo) msgs = msgs.filter(m => m.author.id === alvo.id);
      msgs = msgs.filter(m => Date.now() - m.createdTimestamp <= 14 * 24 * 60 * 60 * 1000);

      if (msgs.size === 0) {
        return interaction.editReply({ content: '⚠️ Nenhuma mensagem encontrada para apagar (mensagens > 14 dias não podem ser apagadas em bulk).' });
      }

      // Marca os IDs das mensagens antes de apagar
      msgs.forEach(m => msgsClear.add(m.id));
      const apagadas = await interaction.channel.bulkDelete(msgs, true);
      // Limpa os IDs após 3s (tempo suficiente pro evento disparar)
      setTimeout(() => msgs.forEach(m => msgsClear.delete(m.id)), 3000);

      await interaction.deleteReply().catch(() => {});
      const confirmacao = await interaction.channel.send({
        embeds: [criarEmbed({
          tipo: 'sucesso',
          titulo: '🗑️ Canal Limpo',
          descricao: `**${apagadas.size}** mensagem(ns) apagada(s)${alvo ? ` de ${alvo.tag}` : ''} por ${interaction.user}.`,
          timestamp: false,
        })],
      });
      setTimeout(() => confirmacao.delete().catch(() => {}), 5000);

      const { AttachmentBuilder } = require('discord.js');
      const validas = [...apagadas.values()]
        .reverse()
        .filter(m => !m.author?.bot);

      if (validas.length > 0) {
        const linhas = validas
          .map(m => `[${new Date(m.createdTimestamp).toLocaleString('pt-BR')}] (${m.author?.id ?? '?'}) ${m.author?.tag ?? 'Desconhecido'}: ${m.content || '[Embed/Mídia]'}`)
          .join('\n');

        const arquivo = new AttachmentBuilder(
          Buffer.from(linhas, 'utf-8'),
          { name: `clear-${interaction.channel.name}-${Date.now()}.txt` }
        );

        await enviarLog(interaction.guild, 'CANAL_LOGS_MENSAGENS', {
          embeds: [embedLog({
            cor: 0xED4245,
            titulo: '🗑️ Mensagens Apagadas',
            fields: [
              { name: '👮 Executado por', value: `${interaction.user}`, inline: true },
              { name: '📍 Canal', value: `${interaction.channel}`, inline: true },
              { name: '🔢 Quantidade', value: `\`${validas.length}\``, inline: true },
              { name: '🆔 ID do executor', value: `\`${interaction.user.id}\``, inline: true },
              { name: '🕐 Horário', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
            ],
          })],
          files: [arquivo],
        });
      }
    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, 'Erro ao apagar mensagens.');
    }
  },
};

// ──────────────────────────────────────────────
//  /lock
// ──────────────────────────────────────────────
const lock = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Trava o canal atual (ninguém pode enviar mensagens)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(opt =>
      opt.setName('motivo').setDescription('Motivo do lock').setRequired(false)),

  async execute(interaction) {
    const motivo = interaction.options.getString('motivo') ?? 'Canal travado pela staff';
    const everyone = interaction.guild.roles.everyone;
    await interaction.deferReply();
    try {
      await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: false });
      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'erro',
          titulo: '🔒 Canal Travado',
          descricao: `Este canal foi travado.\n\n**Motivo:** ${motivo}`,
          fields: [{ name: '👮 Por', value: `${interaction.user}`, inline: true }],
        })],
      });
    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, 'Não consegui travar o canal.');
    }
  },
};

// ──────────────────────────────────────────────
//  /unlock
// ──────────────────────────────────────────────
const unlock = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Destrava o canal atual')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const everyone = interaction.guild.roles.everyone;
    await interaction.deferReply();
    try {
      await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: null });
      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'sucesso',
          titulo: '🔓 Canal Destravado',
          descricao: 'O canal foi desbloqueado. Todos podem enviar mensagens novamente.',
          fields: [{ name: '👮 Por', value: `${interaction.user}`, inline: true }],
        })],
      });
    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, 'Não consegui destravar o canal.');
    }
  },
};

// ──────────────────────────────────────────────
//  /slowmode
// ──────────────────────────────────────────────
const slowmode = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('🐌 Define o modo lento do canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(opt =>
      opt.setName('segundos')
        .setDescription('Intervalo em segundos (0 = desativar, max 21600 = 6h)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)),

  async execute(interaction) {
    const segundos = interaction.options.getInteger('segundos');
    await interaction.deferReply();
    try {
      await interaction.channel.setRateLimitPerUser(segundos);
      const descricao = segundos === 0
        ? 'Modo lento **desativado** neste canal.'
        : `Modo lento definido para **${segundos} segundo(s)** neste canal.`;
      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: segundos === 0 ? 'sucesso' : 'aviso',
          titulo: '🐌 Modo Lento',
          descricao,
          fields: [{ name: '👮 Por', value: `${interaction.user}`, inline: true }],
        })],
      });
    } catch (err) {
      console.error(err);
      await erroEphemeral(interaction, 'Não consegui alterar o modo lento.');
    }
  },
};

module.exports = { ban, kick, unban, clear, lock, unlock, slowmode };