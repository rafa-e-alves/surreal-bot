const { criarEmbed } = require('./embed');

// Comandos que precisam estar no canal de comandos
const COMANDOS_RESTRITOS = [
  'loja', 'cupom', 'ip', 'mcstatus', 'ping',
  'botinfo', 'serverinfo', 'userinfo', 'help',
];

/**
 * Verifica se o comando pode ser usado no canal atual
 * Retorna true se pode prosseguir, false se foi bloqueado
 */
async function verificarCanal(interaction) {
  const canalComandosId = process.env.CANAL_COMANDOS;
  if (!canalComandosId) return true; // se não configurado, libera tudo

  const nomeComando = interaction.commandName;
  if (!COMANDOS_RESTRITOS.includes(nomeComando)) return true; // staff commands passam livre

  if (interaction.channel.id === canalComandosId) return true; // canal certo, pode usar

  // Canal errado — avisa e bloqueia
  const canalComandos = interaction.guild.channels.cache.get(canalComandosId);
  await interaction.reply({
    embeds: [criarEmbed({
      tipo: 'erro',
      titulo: '❌ Canal incorreto',
      descricao: `Este comando só pode ser usado em ${canalComandos ?? '`#comandos`'}.`,
      timestamp: false,
    })],
    flags: 64,
  });
  return false;
}

module.exports = { verificarCanal };