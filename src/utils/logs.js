const { EmbedBuilder } = require('discord.js');
const { CORES } = require('./embed');

/**
 * Envia um log para um canal configurado no .env
 * @param {import('discord.js').Guild} guild
 * @param {string} envKey - chave do .env com o ID do canal
 * @param {object} opcoes - embeds, files, content
 */
async function enviarLog(guild, envKey, opcoes) {
  const canalId = process.env[envKey];
  if (!canalId) return;

  const canal = guild.channels.cache.get(canalId);
  if (!canal) return;

  try {
    await canal.send(opcoes);
  } catch (err) {
    console.error(`[LOG] Erro ao enviar log em ${envKey}:`, err.message);
  }
}

/**
 * Cria um embed de log padronizado
 */
function embedLog({ cor, titulo, fields = [], descricao = null, timestamp = true }) {
  const embed = new EmbedBuilder()
    .setColor(cor)
    .setTitle(titulo);

  if (descricao) embed.setDescription(descricao);
  if (fields.length > 0) embed.addFields(fields);
  if (timestamp) embed.setTimestamp();
  embed.setFooter({ text: '⚔️ Rede Surreal' });

  return embed;
}

module.exports = { enviarLog, embedLog };