const { Events } = require('discord.js');

// Esse evento só existe pra evitar que o discord.js processe bulk deletes
// O log é feito diretamente no comando /clear
module.exports = {
  name: Events.MessageBulkDelete,
  async execute() {
    // Intencionalmente vazio — o log do clear é feito no _moderacao.js
  },
};