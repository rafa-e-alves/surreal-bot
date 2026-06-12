const { EmbedBuilder } = require('discord.js');

// Cores padrão do servidor
const CORES = {
  primaria: 0xE8A317,   // laranja/ouro — identidade do servidor
  sucesso:  0x57F287,   // verde Discord
  erro:     0xFF0000,   // vermelho Discord
  aviso:    0xFEE75C,   // amarelo Discord
  info:     0x5865F2,   // roxo blurple Discord
  neutro:   0x2B2D31,   // cinza escuro
};

/**
 * Cria um embed padronizado do servidor
 * @param {object} opcoes
 * @param {'primaria'|'sucesso'|'erro'|'aviso'|'info'|'neutro'} opcoes.tipo
 * @param {string} opcoes.titulo
 * @param {string} opcoes.descricao
 * @param {object[]} [opcoes.fields]
 * @param {string} [opcoes.thumbnail]
 * @param {string} [opcoes.imagem]
 * @param {boolean} [opcoes.timestamp]
 */
function criarEmbed({ tipo = 'primaria', titulo, descricao, fields = [], thumbnail, imagem, timestamp = true }) {
  const embed = new EmbedBuilder()
    .setColor(CORES[tipo])
    .setTitle(titulo);

  if (descricao != null) embed.setDescription(descricao);
  if (fields.length > 0) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (imagem) embed.setImage(imagem);
  if (timestamp) embed.setTimestamp();

  embed.setFooter({ text: '⚔️ Rede Surreal' });

  return embed;
}

/**
 * Resposta de erro padronizada (ephemeral)
 */
async function erroEphemeral(interaction, mensagem) {
  const metodo = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
  return interaction[metodo]({
    embeds: [criarEmbed({ tipo: 'erro', titulo: '❌ Erro', descricao: mensagem, timestamp: false })],
    flags: 64,
  });
}

module.exports = { criarEmbed, erroEphemeral, CORES };