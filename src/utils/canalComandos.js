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
  if (!canalComandosId) return true;

  const nomeComando = interaction.commandName;
  if (!COMANDOS_RESTRITOS.includes(nomeComando)) return true;

  if (interaction.channel.id === canalComandosId) return true;

  // Staff passa livre em qualquer canal
  const cargoStaff = interaction.guild.roles.cache.get(process.env.CARGO_STAFF);
  if (cargoStaff && interaction.member.roles.cache.has(cargoStaff.id)) return true;
  if (interaction.member.permissions.has(0x8n)) return true; // Administrador

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