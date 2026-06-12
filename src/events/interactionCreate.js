const { Events, InteractionType } = require('discord.js');
const { erroEphemeral } = require('../utils/embed');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {

    // ── Slash Commands ──────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // Verifica se o comando está sendo usado no canal correto
      const { verificarCanal } = require('../utils/canalComandos');
      const podeUsar = await verificarCanal(interaction);
      if (!podeUsar) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`❌ Erro no comando /${interaction.commandName}:`, error);
        await erroEphemeral(interaction, 'Ocorreu um erro ao executar esse comando. Tente novamente.');
      }
    }

    // ── Botões ─────────────────────────────────────────────
    if (interaction.isButton()) {
      // Tickets
      if (interaction.customId.startsWith('ticket_')) {
        const ticketHandler = require('../commands/ticket/ticket');
        await ticketHandler.handleButton(interaction);
      }

      // Sorteios
      if (interaction.customId === 'sorteio_participar') {
        const { sorteiosAtivos } = require('../commands/sorteio/sorteio');
        const messageId = interaction.message.id;
        const dados = sorteiosAtivos.get(messageId);

        if (!dados || !dados.active) {
          return interaction.reply({ content: '❌ Este sorteio já foi encerrado.', flags: 64 });
        }

        if (dados.participants.has(interaction.user.id)) {
          return interaction.reply({ content: '⚠️ Você já está participando deste sorteio!', flags: 64 });
        }

        dados.participants.add(interaction.user.id);

        // Salva participante no JSON
        const { sorteiosAtivos: _map } = require('../commands/sorteio/sorteio');
        const fs = require('node:fs'), path = require('node:path');
        const DB = path.join(__dirname, '../../data/sorteios.json');
        try {
          const todos = [..._map.values()].map(s => ({ ...s, participants: [...s.participants] }));
          fs.writeFileSync(DB, JSON.stringify(todos, null, 2));
        } catch {}

        // Atualiza o embed com a contagem
        const embed = interaction.message.embeds[0].toJSON();
        const fieldIdx = embed.fields?.findIndex(f => f.name === '👥 Participantes');
        if (fieldIdx !== undefined && fieldIdx >= 0) {
          embed.fields[fieldIdx].value = String(dados.participants.size);
        }

        await interaction.update({ embeds: [embed] });
        await interaction.followUp({ content: '✅ Você está participando do sorteio! Boa sorte! 🍀', flags: 64 });
      }
    }

    // ── Modais ─────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'say_modal') {
        const sayHandler = require('../commands/anuncios/say');
        await sayHandler.handleModal(interaction);
      }
    }
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_categoria') {
        const ticketHandler = require('../commands/ticket/ticket');
        await ticketHandler.handleSelect(interaction);
      }
    }
  },
};