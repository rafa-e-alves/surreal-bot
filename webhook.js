const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');

// Secret configurado no GitHub Webhooks
const SECRET = process.env.WEBHOOK_SECRET;
const PORT = 9000;
const ALLOWED_IP_RANGES = [
  '192.30.252.0/22',
  '185.199.108.0/22',
  '140.82.112.0/20',
  '143.55.64.0/20',
];

// Verifica se o IP está no range permitido (IPs do GitHub)
function ipToInt(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0;
}

function ipInRange(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const mask = ~((1 << (32 - parseInt(bits))) - 1) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
}

function isGithubIP(ip) {
  return ALLOWED_IP_RANGES.some(range => {
    try { return ipInRange(ip, range); }
    catch { return false; }
  });
}

// Verifica assinatura HMAC-SHA256 do GitHub
function verificarAssinatura(payload, signature) {
  if (!SECRET) return false;
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Rate limiting simples — máximo 10 requisições por minuto por IP
const rateLimitMap = new Map();
function rateLimitOk(ip) {
  const agora = Date.now();
  const entry = rateLimitMap.get(ip) ?? { count: 0, reset: agora + 60000 };
  if (agora > entry.reset) { entry.count = 0; entry.reset = agora + 60000; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= 10;
}

const server = http.createServer((req, res) => {
  const ip = req.socket.remoteAddress?.replace('::ffff:', '') ?? '';

  // Só aceita POST em /webhook
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404);
    return res.end();
  }

  // Rate limiting
  if (!rateLimitOk(ip)) {
    console.warn(`[webhook] Rate limit excedido para IP: ${ip}`);
    res.writeHead(429);
    return res.end('Too Many Requests');
  }

  // Verifica IP do GitHub
  if (!isGithubIP(ip)) {
    console.warn(`[webhook] IP não autorizado: ${ip}`);
    res.writeHead(403);
    return res.end('Forbidden');
  }

  // Coleta o body
  const chunks = [];
  req.on('data', chunk => {
    if (chunks.reduce((acc, c) => acc + c.length, 0) > 1e6) {
      // Payload maior que 1MB — rejeita
      res.writeHead(413);
      res.end('Payload Too Large');
      req.destroy();
    } else {
      chunks.push(chunk);
    }
  });

  req.on('end', () => {
    const payload = Buffer.concat(chunks);
    const signature = req.headers['x-hub-signature-256'];

    // Verifica assinatura HMAC
    if (!verificarAssinatura(payload, signature)) {
      console.warn(`[webhook] Assinatura inválida — IP: ${ip}`);
      res.writeHead(401);
      return res.end('Unauthorized');
    }

    // Só processa eventos de push
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
      res.writeHead(200);
      return res.end('Ignored');
    }

    console.log(`[webhook] Push recebido de ${ip} — atualizando bot...`);

    exec(
      'cd /home/ubuntu/surreal-bot && git pull && pm2 restart rede-surreal-bot',
      { timeout: 30000 },
      (err, stdout, stderr) => {
        if (err) {
          console.error('[webhook] Erro ao atualizar:', stderr);
          res.writeHead(500);
          return res.end('Internal Server Error');
        }
        console.log('[webhook] Bot atualizado com sucesso:\n' + stdout);
        res.writeHead(200);
        res.end('OK');
      }
    );
  });

  req.on('error', err => {
    console.error('[webhook] Erro na requisição:', err.message);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[webhook] Servidor rodando na porta ${PORT}`);
  if (!SECRET) console.warn('[webhook] ⚠️  WEBHOOK_SECRET não configurado — assinatura não será verificada!');
});