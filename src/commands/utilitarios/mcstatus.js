const { SlashCommandBuilder } = require('discord.js');
const { criarEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mcstatus')
    .setDescription('⛏️ Mostra o status atual do servidor Minecraft'),

  async execute(interaction) {
    await interaction.deferReply();

    const ip = process.env.IP_MINECRAFT;
    if (!ip) {
      return interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'erro',
          titulo: '❌ IP não configurado',
          descricao: 'Configure a variável `IP_MINECRAFT` no `.env`.',
          timestamp: false,
        })],
      });
    }

    try {
      const res = await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(ip)}`, {
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!data.online) {
        return interaction.editReply({
          embeds: [criarEmbed({
            tipo: 'erro',
            titulo: '🔴 Servidor Offline',
            descricao: 'Não foi possível conectar ao servidor. Ele pode estar offline ou em manutenção.',
            fields: [{ name: '🌐 IP', value: `\`${ip}\``, inline: true }],
            timestamp: false,
          })],
        });
      }

      const players = data.players;
      const listaPlayers = players.list?.length
        ? players.list.map(p => `\`${p.name_clean ?? p.name}\``).join(', ')
        : null;

      const fields = [
        { name: '🌐 IP', value: `\`${ip}\``, inline: true },
        { name: '👥 Players', value: `\`${players.online}/${players.max}\``, inline: true },
        { name: '📶 Latência', value: `\`${data.latency}ms\``, inline: true },
        { name: '🎮 Versão', value: `\`${data.version?.name_clean ?? data.version?.name ?? 'Desconhecida'}\``, inline: true },
      ];

      if (listaPlayers) {
        fields.push({ name: `👤 Online agora`, value: listaPlayers, inline: false });
      }

      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'sucesso',
          titulo: '🟢 Servidor Online!',
          descricao: data.motd?.clean ? `> ${data.motd.clean}` : null,
          fields,
        })],
      });
    } catch (err) {
      console.error('[mcstatus]', err.message);
      await interaction.editReply({
        embeds: [criarEmbed({
          tipo: 'erro',
          titulo: '⚠️ Erro ao consultar',
          descricao: 'Não foi possível obter o status do servidor agora. Tente novamente em instantes.',
          fields: [{ name: '🌐 IP', value: `\`${ip}\``, inline: true }],
          timestamp: false,
        })],
      });
    }
  },
};
