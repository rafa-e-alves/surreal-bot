const { Events, AttachmentBuilder } = require('discord.js');
const { enviarLog, embedLog } = require('../utils/logs');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    // Procura ticket aberto desse usuário
    const ticket = member.guild.channels.cache.find(
      ch => ch.name === `ticket-${member.id}` ||
            ch.topic?.includes(`(${member.id})`),
    );

    if (!ticket) return;

    try {
      // Gera transcript
      const mensagens = await ticket.messages.fetch({ limit: 100 });
      const sorted = [...mensagens.values()].reverse();

      const linhas = sorted.map(m => {
        const data = new Date(m.createdTimestamp).toLocaleString('pt-BR');
        const conteudo = m.content || (m.embeds.length ? '[Embed]' : '[Arquivo/Mídia]');
        return `[${data}] ${m.author.tag}: ${conteudo}`;
      });

      const transcript = [
        `═══════════════════════════════════`,
        `TRANSCRIPT — ${ticket.name}`,
        `Motivo: Usuário saiu do servidor`,
        `Usuário: ${member.user.tag} (${member.id})`,
        `Data: ${new Date().toLocaleString('pt-BR')}`,
        `═══════════════════════════════════`,
        '', ...linhas,
      ].join('\n');

      const attachment = new AttachmentBuilder(
        Buffer.from(transcript, 'utf-8'),
        { name: `${ticket.name}.txt` }
      );

      // Log de ticket fechado
      await enviarLog(member.guild, 'CANAL_LOGS_TICKETS', {
        embeds: [embedLog({
          cor: 0xED4245,
          titulo: '🚪 Ticket Fechado — Usuário saiu',
          fields: [
            { name: '👤 Usuário', value: `\`${member.user.tag}\` \`(${member.id})\``, inline: true },
            { name: '📋 Canal', value: `\`${ticket.name}\``, inline: true },
            { name: '🕐 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
          ],
        })],
      });

      // Transcript
      await enviarLog(member.guild, 'CANAL_LOGS_TRANSCRIPTS', {
        embeds: [embedLog({
          cor: 0x5865F2,
          titulo: '📄 Transcript',
          fields: [
            { name: '📋 Canal', value: `\`${ticket.name}\``, inline: true },
            { name: '👤 Usuário saiu', value: `\`${member.user.tag}\``, inline: true },
          ],
        })],
        files: [attachment],
      });

      await ticket.delete();
    } catch (err) {
      console.error('[guildMemberRemove] Erro ao fechar ticket:', err.message);
    }
  },
};