const { Events, PermissionFlagsBits } = require('discord.js');
const { enviarLog, embedLog } = require('../utils/logs');

// ──────────────────────────────────────────────
//  Configurações
// ──────────────────────────────────────────────
const CONFIG = {
  antilink: {
    ativo: true,
    regex: /https?:\/\/\S+|discord\.gg\/\S+|www\.\S+\.\S+/gi,
    excecoes: [],
  },
  antispam: {
    ativo: true,
    maxIguais: 3,
    janela: 10_000,
  },
  antiflood: {
    ativo: true,
    maxMensagens: 5,
    janela: 5_000,
  },
  antirepeat: {
    ativo: true,
    maxRepetidos: 15,
  },
  // Timeout ao punir (em segundos)
  timeoutSegundos: 60,
};

// Cache em memória por usuário
const cache = new Map();

function getCache(userId) {
  if (!cache.has(userId)) {
    cache.set(userId, { mensagens: [], ultimasMsgs: [] });
  }
  return cache.get(userId);
}

// Limpa cache antigo a cada 30s
setInterval(() => {
  const agora = Date.now();
  for (const [id, dados] of cache.entries()) {
    dados.mensagens = dados.mensagens.filter(t => agora - t < 30_000);
    dados.ultimasMsgs = dados.ultimasMsgs.filter(m => agora - m.t < 30_000);
    if (dados.mensagens.length === 0 && dados.ultimasMsgs.length === 0) {
      cache.delete(id);
    }
  }
}, 30_000);

// ──────────────────────────────────────────────
async function punir(msg, motivo) {
  try {
    await msg.delete().catch(() => {});

    // Aplica timeout no usuário
    if (msg.member?.moderatable) {
      await msg.member.timeout(CONFIG.timeoutSegundos * 1000, motivo).catch(() => {});
    }

    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('⚠️ AutoMod')
      .setDescription(`${msg.author}, ${motivo}\nVocê foi silenciado por **${CONFIG.timeoutSegundos} segundos**.`)
      .setFooter({ text: '⚔️ Rede Surreal' })
      .setTimestamp();

    const aviso = await msg.channel.send({ embeds: [embed] });
    setTimeout(() => aviso.delete().catch(() => {}), 5000);

    await enviarLog(msg.guild, 'CANAL_LOGS_MODERACAO', {
      embeds: [embedLog({
        cor: 0xFEE75C,
        titulo: '⚠️ AutoMod',
        fields: [
          { name: '👤 Usuário', value: `${msg.author}`, inline: true },
          { name: '📍 Canal', value: `${msg.channel}`, inline: true },
          { name: '📝 Motivo', value: motivo, inline: true },
          { name: '⏱️ Timeout', value: `${CONFIG.timeoutSegundos}s`, inline: true },
          { name: '💬 Mensagem', value: msg.content.slice(0, 512) || '[vazia]', inline: false },
        ],
      })],
    });
  } catch (err) {
    console.error('[automod] Erro ao punir:', err.message);
  }
}

// ──────────────────────────────────────────────
module.exports = {
  name: Events.MessageCreate,
  async execute(msg) {
    // Ignora bots, DMs e quem tem permissão de gerenciar mensagens
    if (!msg.guild) return;
    if (msg.author.bot) return;
    if (msg.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    const conteudo = msg.content;
    if (!conteudo) return;

    const dados = getCache(msg.author.id);
    const agora = Date.now();

    // ── Antirepeat — caracteres repetidos ──────
    if (CONFIG.antirepeat.ativo) {
      const regex = new RegExp(`(.)\\1{${CONFIG.antirepeat.maxRepetidos},}`, 'i');
      if (regex.test(conteudo)) {
        return punir(msg, `sua mensagem contém caracteres excessivamente repetidos.`);
      }
    }

    // ── Antilink ───────────────────────────────
    if (CONFIG.antilink.ativo) {
      const links = conteudo.match(CONFIG.antilink.regex) ?? [];
      const linksBloqueados = links.filter(link =>
        !CONFIG.antilink.excecoes.some(exc => link.includes(exc))
      );
      if (linksBloqueados.length > 0) {
        return punir(msg, `links não são permitidos neste servidor.`);
      }
    }

    // ── Antiflood — muitas mensagens rápido ────
    if (CONFIG.antiflood.ativo) {
      dados.mensagens = dados.mensagens.filter(t => agora - t < CONFIG.antiflood.janela);
      dados.mensagens.push(agora);
      if (dados.mensagens.length > CONFIG.antiflood.maxMensagens) {
        return punir(msg, `você está enviando mensagens muito rápido. Aguarde um momento.`);
      }
    }

    // ── Antispam — mensagens idênticas ─────────
    if (CONFIG.antispam.ativo) {
      dados.ultimasMsgs = dados.ultimasMsgs.filter(m => agora - m.t < CONFIG.antispam.janela);
      dados.ultimasMsgs.push({ t: agora, c: conteudo.toLowerCase().trim() });
      const iguais = dados.ultimasMsgs.filter(m => m.c === conteudo.toLowerCase().trim());
      if (iguais.length >= CONFIG.antispam.maxIguais) {
        dados.ultimasMsgs = []; // reseta pra não punir infinitamente
        return punir(msg, `pare de enviar mensagens repetidas.`);
      }
    }
  },
};