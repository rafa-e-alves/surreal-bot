const { Events } = require('discord.js');
const { enviarLog, embedLog } = require('../utils/logs');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMsg, newMsg) {
    // Ignora bots e mensagens sem conteúdo de texto
    if (!oldMsg.guild || newMsg.author?.bot) return;
    if (!oldMsg.content || !newMsg.content) return;
    if (oldMsg.content === newMsg.content) return;

    await enviarLog(oldMsg.guild, 'CANAL_LOGS_MENSAGENS', {
      embeds: [embedLog({
        cor: 0xFEE75C,
        titulo: '✏️ Mensagem Editada',
        fields: [
          { name: '👤 Autor', value: `${newMsg.author}`, inline: true },
          { name: '📍 Canal', value: `${newMsg.channel}`, inline: true },
          { name: '🔗 Link', value: `[Ir à mensagem](${newMsg.url})`, inline: true },
          { name: '📝 Antes', value: oldMsg.content.slice(0, 1024) || '`vazio`', inline: false },
          { name: '📝 Depois', value: newMsg.content.slice(0, 1024) || '`vazio`', inline: false },
        ],
      })],
    });
  },
};