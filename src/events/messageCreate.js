const { Events, PermissionFlagsBits } = require('discord.js');
const { enviarLog, embedLog } = require('../utils/logs');

// ──────────────────────────────────────────────
//  Configurações
// ──────────────────────────────────────────────
const CONFIG = {
  // Antilink
  antilink: {
    ativo: true,
    regex: /https?:\/\/\S+|discord\.gg\/\S+|www\.\S+\.\S+/gi,
    excecoes: [], // domínios permitidos (ex: ['redesurreal.com.br'])
  },

  // Antispam — mensagens idênticas repetidas
  antispam: {
    ativo: true,
    maxIguais: 3,      // máximo de mensagens idênticas
    janela: 10_000,    // em ms (10 segundos)
  },

  // Antiflood — muitas mensagens em pouco tempo
  antiflood: {
    ativo: true,
    maxMensagens: 5,   // máximo de mensagens
    janela: 5_000,     // em ms (5 segundos)
  },

  // Antirepeat — caracteres repetidos
  antirepeat: {
    ativo: true,
    maxRepetidos: 15,  // máximo de caracteres iguais seguidos
  },
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
async function punir(msg, motivo, detalhe = '') {
  try {
    await msg.delete().catch(() => {});

    const aviso = await msg.channel.send({
      content: `⚠️ ${msg.author}, ${motivo}${detalhe ? ` ${detalhe}` : ''}`,
    });
    setTimeout(() => aviso.delete().catch(() => {}), 5000);

    await enviarLog(msg.guild, 'CANAL_LOGS_MODERACAO', {
      embeds: [embedLog({
        cor: 0xFEE75C,
        titulo: '⚠️ AutoMod',
        fields: [
          { name: '👤 Usuário', value: `${msg.author}`, inline: true },
          { name: '📍 Canal', value: `${msg.channel}`, inline: true },
          { name: '📝 Motivo', value: motivo, inline: true },
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