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

  // Administrador passa em qualquer canal
  if (interaction.member.permissions.has(0x8n)) return true;

  const canalAtualId = interaction.channel.id;
  const canalStaffId = process.env.CANAL_COMANDOS_STAFF;

  // Cargo staff pode usar no canal de comandos ou no canal de comandos-staff
  const cargoStaff = interaction.guild.roles.cache.get(process.env.CARGO_STAFF);
  const ehStaff = cargoStaff && interaction.member.roles.cache.has(cargoStaff.id);

  if (ehStaff) {
    if (canalAtualId === canalComandosId || canalAtualId === canalStaffId) return true;
    const canalComandos = interaction.guild.channels.cache.get(canalComandosId);
    const canalStaff = canalStaffId ? interaction.guild.channels.cache.get(canalStaffId) : null;
    const canaisPermitidos = [canalComandos, canalStaff].filter(Boolean).join(' ou ');
    await interaction.reply({
      embeds: [criarEmbed({
        tipo: 'erro',
        titulo: '❌ Canal incorreto',
        descricao: `Este comando só pode ser usado em ${canaisPermitidos}.`,
        timestamp: false,
      })],
      flags: 64,
    });
    return false;
  }

  // Usuário comum — só canal de comandos
  if (canalAtualId === canalComandosId) return true;

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