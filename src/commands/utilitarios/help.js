const { SlashCommandBuilder } = require('discord.js');
const { criarEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Lista todos os comandos disponíveis'),

  async execute(interaction) {
    await interaction.reply({
      embeds: [criarEmbed({
        tipo: 'info',
        titulo: '📖 Comandos — Rede Surreal Bot',
        descricao: 'Todos os comandos disponíveis:',
        fields: [
          {
            name: '📢 Comunicação',
            value: [
              '`/say` — Envia uma mensagem simples pelo bot',
              '`/anunciar` — Envia um anúncio em embed com título e imagem',
            ].join('\n'),
          },
          {
            name: '🎉 Sorteios',
            value: [
              '`/sorteio criar` — Cria um sorteio com data e hora definidos',
              '`/sorteio encerrar` — Encerra um sorteio antes do tempo',
              '`/sorteio resorteio` — Novo sorteio excluindo ganhadores anteriores',
            ].join('\n'),
          },
          {
            name: '🎫 Tickets',
            value: [
              '`/ticket painel` — Envia o painel de abertura de tickets',
              '`/ticket fechar` — Fecha o ticket e gera transcript (staff)',
              '`/ticket add` — Adiciona usuário ao ticket',
              '`/ticket remove` — Remove usuário do ticket',
            ].join('\n'),
          },
          {
            name: '🛒 Loja',
            value: [
              '`/loja` — Mostra os produtos disponíveis',
              '`/cupom` — Lista cupons de desconto ativos',
              '`/cupom-admin criar` — Cria um cupom (staff)',
              '`/cupom-admin remover` — Remove um cupom (staff)',
            ].join('\n'),
          },
          {
            name: '🔨 Moderação',
            value: [
              '`/ban` — Bane um usuário',
              '`/kick` — Expulsa um usuário',
              '`/unban` — Remove o ban de um usuário',
              '`/clear` — Apaga mensagens do canal',
              '`/lock` — Trava o canal',
              '`/unlock` — Destrava o canal',
              '`/slowmode` — Define o modo lento',
            ].join('\n'),
          },
          {
            name: '🔧 Utilitários',
            value: [
              '`/ip` — Mostra o IP do servidor Minecraft',
              '`/mcstatus` — Status do servidor Minecraft em tempo real',
              '`/ping` — Mostra o ping do bot',
              '`/botinfo` — Informações sobre o bot',
              '`/serverinfo` — Informações sobre o servidor Discord',
              '`/userinfo` — Informações sobre um usuário',
            ].join('\n'),
          },
        ],
      })],
      flags: 64,
    });
  },
};