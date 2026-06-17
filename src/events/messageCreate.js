const { Events, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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
  antimasstext: {
    ativo: true,
    maxCaracteres: 500,
  },
  // Punição progressiva
  punicoes: [
    { timeout: 60,        descricao: '60 segundos' },
    { timeout: 300,       descricao: '5 minutos'   },
    { semFala: true,      descricao: 'permanente — permissão de fala removida' },
  ],
};

// Cache em memória por usuário
const cache = new Map();

function getCache(userId) {
  if (!cache.has(userId)) {
    cache.set(userId, { mensagens: [], ultimasMsgs: [], infrações: 0, ultimaPunicao: 0, ultimaInfracao: 0 });
  }
  return cache.get(userId);
}

// Limpa cache antigo a cada 30s (mas mantém infrações)
setInterval(() => {
  const agora = Date.now();
  for (const [id, dados] of cache.entries()) {
    dados.mensagens = dados.mensagens.filter(t => agora - t < 30_000);
    dados.ultimasMsgs = dados.ultimasMsgs.filter(m => agora - m.t < 30_000);
  }
}, 30_000);

// ──────────────────────────────────────────────
async function punir(msg, motivo) {
  try {
    const dados = getCache(msg.author.id);
    const agora2 = Date.now();

    // Zera infrações se ficou 24h sem punição
    if (dados.ultimaInfracao > 0 && agora2 - dados.ultimaInfracao > 24 * 60 * 60 * 1000) {
      dados.infrações = 0;
    }

    // Evita punir o mesmo usuário duas vezes em menos de 3 segundos
    if (agora2 - dados.ultimaPunicao < 3000) return;
    dados.ultimaPunicao = agora2;
    dados.ultimaInfracao = agora2;

    const nivel = Math.min(dados.infrações, CONFIG.punicoes.length - 1);
    const punicao = CONFIG.punicoes[nivel];
    dados.infrações++;

    // Apaga a mensagem atual + mensagens recentes do usuário no canal (últimas 10)
    const msgs = await msg.channel.messages.fetch({ limit: 50 }).catch(() => null);
    if (msgs) {
      const doUsuario = [...msgs.values()]
        .filter(m => m.author.id === msg.author.id)
        .slice(0, 10);
      for (const m of doUsuario) {
        await m.delete().catch(() => {});
      }
    } else {
      await msg.delete().catch(() => {});
    }

    // Aplica punição
    let descPunicao = '';
    if (punicao.semFala) {
      // Remove permissão de fala permanentemente
      await msg.channel.permissionOverwrites.edit(msg.member, {
        SendMessages: false,
      }).catch(() => {});
      descPunicao = '🔇 Permissão de fala removida permanentemente neste canal.';
    } else {
      await msg.member.timeout(punicao.timeout * 1000, motivo).catch(() => {});
      descPunicao = `⏱️ Silenciado por **${punicao.descricao}**.`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('⚠️ AutoMod')
      .setDescription(`${msg.author}, ${motivo}\n${descPunicao}\n\n*Aviso ${dados.infrações} de ${CONFIG.punicoes.length}*`)
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
          { name: '⚠️ Nível', value: `${dados.infrações}/${CONFIG.punicoes.length}`, inline: true },
          { name: '⏱️ Punição', value: punicao.descricao, inline: true },
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
    if (!msg.guild) return;
    if (msg.author.bot) return;
    if (msg.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    const conteudo = msg.content;
    if (!conteudo) return;

    const dados = getCache(msg.author.id);
    const agora = Date.now();

    // ── Antimasstext — mensagem muito longa ────
    if (CONFIG.antimasstext.ativo) {
      if (conteudo.length > CONFIG.antimasstext.maxCaracteres) {
        return punir(msg, `sua mensagem é muito longa. Limite de ${CONFIG.antimasstext.maxCaracteres} caracteres.`);
      }
    }

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
      if (dados.mensagens.length >= CONFIG.antiflood.maxMensagens) {
        dados.mensagens = [];
        return punir(msg, `você está enviando mensagens muito rápido.`);
      }
    }

    // ── Antispam — mensagens idênticas ─────────
    if (CONFIG.antispam.ativo) {
      dados.ultimasMsgs = dados.ultimasMsgs.filter(m => agora - m.t < CONFIG.antispam.janela);
      dados.ultimasMsgs.push({ t: agora, c: conteudo.toLowerCase().trim() });
      const iguais = dados.ultimasMsgs.filter(m => m.c === conteudo.toLowerCase().trim());
      if (iguais.length >= CONFIG.antispam.maxIguais) {
        dados.ultimasMsgs = [];
        return punir(msg, `pare de enviar mensagens repetidas.`);
      }
    }
  },
};