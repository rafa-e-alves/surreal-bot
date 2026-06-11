const { Events } = require('discord.js');
const { enviarLog, embedLog } = require('../utils/logs');
const { msgsClear } = require('../utils/clearFlag');

module.exports = {
  name: Events.MessageDelete,
  async execute(msg) {
    if (!msg.guild || msg.author?.bot) return;
    if (!msg.content) return;
    if (msgsClear.has(msg.id)) return; // ignora se foi apagada pelo /clear
    // Ignora se faz parte de um bulk delete (clear)
    if (msg.guild._clearInProgress?.has(msg.channelId)) return;

    await enviarLog(msg.guild, 'CANAL_LOGS_MENSAGENS', {
      embeds: [embedLog({
        cor: 0xED4245,
        titulo: '🗑️ Mensagem Apagada',
        fields: [
          { name: '👤 Autor', value: msg.author ? `${msg.author}` : '`Desconhecido`', inline: true },
          { name: '📍 Canal', value: `${msg.channel}`, inline: true },
          { name: '📝 Conteúdo', value: msg.content.slice(0, 1024), inline: false },
        ],
      })],
    });
  },
};