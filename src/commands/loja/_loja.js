const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { criarEmbed, erroEphemeral } = require('../../utils/embed');
const fs = require('node:fs');
const path = require('node:path');

// ──────────────────────────────────────────────
//  Banco de dados simples em JSON para cupons
// ──────────────────────────────────────────────
const DB_PATH = path.join(__dirname, '../../..', 'data', 'cupons.json');

function lerCupons() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, '[]');
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function salvarCupons(cupons) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(cupons, null, 2));
}

// ──────────────────────────────────────────────
//  /loja
// ──────────────────────────────────────────────
const loja = {
  data: new SlashCommandBuilder()
    .setName('loja')
    .setDescription('🛒 Veja os produtos disponíveis na loja do servidor'),

  async execute(interaction) {
    const url = process.env.URL_LOJA ?? 'Em Breve!';

    const embed = criarEmbed({
      tipo: 'primaria',
      titulo: '🛒 Loja — Rede Surreal',
      descricao: [
        'Adquira benefícios exclusivos e apoie o servidor!',
        '',
        '**🥉 VIP Bronze** — Acesso a kits exclusivos',
        '**🥈 VIP Prata** — Kits + fly no spawn',
        '**🥇 VIP Ouro** — Todos os benefícios + tag especial',
        '**💎 VIP Diamante** — Máximo: todos os perks + suporte prioritário',
        '',
        `🔗 **Loja:** ${url === 'Em Breve!' ? '`Em Breve!`' : `[Acessar a loja](${url})`}`,
        '',
        '💡 Use **/cupom** para ver descontos disponíveis!',
      ].join('\n'),
    });

    await interaction.reply({ embeds: [embed] });
  },
};

// ──────────────────────────────────────────────
//  /cupom
// ──────────────────────────────────────────────
const cupom = {
  data: new SlashCommandBuilder()
    .setName('cupom')
    .setDescription('🏷️ Gerencia cupons de desconto da loja')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('listar').setDescription('Veja os cupons disponíveis'))
    .addSubcommand(sub =>
      sub.setName('criar')
        .setDescription('Cria um novo cupom (staff)')
        .addStringOption(opt =>
          opt.setName('codigo').setDescription('Código do cupom (ex: SURREAL10)').setRequired(true))
        .addIntegerOption(opt =>
          opt.setName('desconto').setDescription('Porcentagem de desconto (ex: 10 = 10%)').setRequired(true).setMinValue(1).setMaxValue(100))
        .addStringOption(opt =>
          opt.setName('descricao').setDescription('Descrição do cupom').setRequired(false))
        .addStringOption(opt =>
          opt.setName('expira').setDescription('Data de expiração (DD/MM/AAAA) — deixe vazio para sem limite').setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('remover')
        .setDescription('Remove um cupom (staff)')
        .addStringOption(opt =>
          opt.setName('codigo').setDescription('Código do cupom a remover').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'listar') {
      const cupons = lerCupons().filter(c => {
        if (!c.expira) return true;
        const [d, m, a] = c.expira.split('/');
        return new Date(`${a}-${m}-${d}`) >= new Date();
      });

      if (cupons.length === 0) {
        return interaction.reply({
          embeds: [criarEmbed({
            tipo: 'info',
            titulo: '🏷️ Cupons Disponíveis',
            descricao: 'Nenhum cupom ativo no momento. Fique de olho nas novidades!',
          })],
        });
      }

      const lista = cupons.map(c =>
        `**\`${c.codigo}\`** — ${c.desconto}% de desconto${c.descricao ? ` | ${c.descricao}` : ''}${c.expira ? ` *(expira ${c.expira})*` : ''}`,
      ).join('\n');

      await interaction.reply({
        embeds: [criarEmbed({
          tipo: 'primaria',
          titulo: '🏷️ Cupons Disponíveis',
          descricao: `Use esses códigos na loja para ganhar desconto!\n\n${lista}`,
        })],
      });
    }

    if (sub === 'criar') {
      const codigo = interaction.options.getString('codigo').toUpperCase();
      const desconto = interaction.options.getInteger('desconto');
      const descricao = interaction.options.getString('descricao') ?? '';
      const expira = interaction.options.getString('expira') ?? null;

      const cupons = lerCupons();
      if (cupons.find(c => c.codigo === codigo)) {
        return erroEphemeral(interaction, `O cupom \`${codigo}\` já existe.`);
      }

      cupons.push({ codigo, desconto, descricao, expira, criadoPor: interaction.user.tag, criadoEm: new Date().toISOString() });
      salvarCupons(cupons);

      await interaction.reply({
        embeds: [criarEmbed({
          tipo: 'sucesso',
          titulo: '✅ Cupom Criado',
          descricao: `Cupom **\`${codigo}\`** criado com **${desconto}%** de desconto!`,
          fields: expira ? [{ name: '📅 Expira em', value: expira, inline: true }] : [],
          timestamp: false,
        })],
        flags: 64,
      });
    }

    if (sub === 'remover') {
      const codigo = interaction.options.getString('codigo').toUpperCase();
      let cupons = lerCupons();
      const antes = cupons.length;
      cupons = cupons.filter(c => c.codigo !== codigo);

      if (cupons.length === antes) {
        return erroEphemeral(interaction, `Cupom \`${codigo}\` não encontrado.`);
      }

      salvarCupons(cupons);

      await interaction.reply({
        embeds: [criarEmbed({
          tipo: 'sucesso',
          titulo: '✅ Cupom Removido',
          descricao: `Cupom **\`${codigo}\`** removido com sucesso.`,
          timestamp: false,
        })],
        flags: 64,
      });
    }
  },
};

module.exports = { loja, cupom };