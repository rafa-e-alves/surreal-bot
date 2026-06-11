# ⚔️ Rede Surreal Bot — discord.js v14

Bot oficial do servidor de Minecraft Factions **Rede Surreal**, feito com discord.js v14 e slash commands nativos.

---

## 🚀 Instalação

### 1. Pré-requisitos
- [Node.js 18+](https://nodejs.org/)
- Conta no [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Clone e instale as dependências
```bash
git clone <seu-repo>
cd rede-surreal-bot
npm install
```

### 3. Configure o `.env`
```bash
cp .env.example .env
```
Abra o `.env` e preencha todos os valores:

| Variável | Onde encontrar |
|---|---|
| `BOT_TOKEN` | Developer Portal → Bot → Token |
| `CLIENT_ID` | Developer Portal → Application ID |
| `GUILD_ID` | Discord → clique direito no servidor → Copiar ID |
| `CANAL_ANUNCIOS` | Discord → clique direito no canal → Copiar ID |
| `CANAL_SORTEIOS` | Discord → clique direito no canal → Copiar ID |
| `CANAL_TICKETS` | Discord → clique direito no canal → Copiar ID |
| `CANAL_LOGS` | Discord → clique direito no canal → Copiar ID |
| `CATEGORIA_TICKETS` | Discord → clique direito na categoria → Copiar ID |
| `CARGO_STAFF` | Discord → clique direito no cargo → Copiar ID |

> **Como ativar IDs no Discord:** Configurações → Aparência → Modo Desenvolvedor ✅

### 4. Registre os slash commands
```bash
npm run deploy
```
> Isso registra os comandos no servidor. Execute sempre que adicionar ou modificar comandos.

### 5. Inicie o bot
```bash
# Produção
npm start

# Desenvolvimento (reinicia automaticamente ao salvar)
npm run dev
```

---

## 📋 Comandos

### 📢 Anúncios
| Comando | Descrição | Permissão |
|---|---|---|
| `/anunciar` | Envia um anúncio em embed para um canal | Manage Messages |

### 🎉 Sorteios
| Comando | Descrição | Permissão |
|---|---|---|
| `/sorteio criar` | Cria um sorteio com timer automático | Manage Events |
| `/sorteio encerrar` | Encerra um sorteio antes do tempo | Manage Events |
| `/sorteio resorteio` | Sorteia novamente entre participantes | Manage Events |

### 🎫 Tickets
| Comando | Descrição | Permissão |
|---|---|---|
| `/ticket painel` | Envia o painel de abertura de tickets | Manage Guild |
| `/ticket fechar` | Fecha o ticket atual | Qualquer um |
| `/ticket add` | Adiciona usuário ao ticket | Manage Channels |
| `/ticket remove` | Remove usuário do ticket | Manage Channels |

### 🛒 Loja
| Comando | Descrição | Permissão |
|---|---|---|
| `/loja` | Mostra produtos e link da loja | Qualquer um |
| `/cupom listar` | Lista cupons de desconto ativos | Qualquer um |
| `/cupom criar` | Cria um cupom | Manage Guild |
| `/cupom remover` | Remove um cupom | Manage Guild |

### 🔨 Moderação
| Comando | Descrição | Permissão |
|---|---|---|
| `/ban` | Bane um usuário | Ban Members |
| `/kick` | Expulsa um usuário | Kick Members |
| `/unban` | Remove o ban de um usuário | Ban Members |
| `/clear` | Apaga mensagens do canal | Manage Messages |
| `/lock` | Trava o canal (ninguém pode escrever) | Manage Channels |
| `/unlock` | Destrava o canal | Manage Channels |
| `/slowmode` | Define o modo lento do canal | Manage Channels |

---

## 📁 Estrutura do Projeto

```
rede-surreal-bot/
├── src/
│   ├── index.js               # Entry point
│   ├── deploy-commands.js     # Registra slash commands
│   ├── commands/
│   │   ├── anuncios/
│   │   │   └── anunciar.js
│   │   ├── sorteio/
│   │   │   └── sorteio.js
│   │   ├── ticket/
│   │   │   └── ticket.js
│   │   ├── loja/
│   │   │   ├── loja.js
│   │   │   └── cupom.js
│   │   └── moderacao/
│   │       ├── ban.js
│   │       ├── kick.js
│   │       ├── unban.js
│   │       ├── clear.js
│   │       ├── lock.js
│   │       ├── unlock.js
│   │       └── slowmode.js
│   ├── events/
│   │   ├── ready.js
│   │   └── interactionCreate.js
│   └── utils/
│       └── embed.js           # Helper para embeds padronizados
├── data/
│   └── cupons.json            # Banco de dados de cupons (auto-criado)
├── .env.example
├── package.json
└── README.md
```

---

## ➕ Como adicionar novos comandos

1. Crie um arquivo em `src/commands/<categoria>/nome-comando.js`
2. Exporte `data` (SlashCommandBuilder) e `execute` (função async)
3. Rode `npm run deploy` para registrar o comando
4. O bot carrega automaticamente sem precisar reiniciar

**Exemplo mínimo:**
```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica o ping do bot'),

  async execute(interaction) {
    await interaction.reply(`🏓 Pong! ${interaction.client.ws.ping}ms`);
  },
};
```

---

## 🔧 Permissões necessárias do bot

No Developer Portal → OAuth2 → URL Generator, selecione:
- **Scopes:** `bot`, `applications.commands`
- **Bot Permissions:** `Send Messages`, `Manage Messages`, `Manage Channels`, `Ban Members`, `Kick Members`, `Read Message History`, `View Channels`, `Embed Links`

---

## 📝 Observações
- Sorteios ficam em memória: se o bot reiniciar, os timers se perdem. Para produção, considere salvar em arquivo JSON ou banco de dados.
- Cupons são salvos em `data/cupons.json` e persistem entre reinicializações.
