# ⚔️ Rede Surreal Bot — discord.js v14

Bot oficial do servidor de Minecraft Factions **Rede Surreal**, feito com discord.js v14 e slash commands nativos.

---

## 🚀 Instalação

### 1. Pré-requisitos
- [Node.js 18+](https://nodejs.org/)
- Conta no [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Clone e instale as dependências
```bash
git clone https://github.com/rafa-e-alves/surreal-bot.git
cd surreal-bot
npm install
```

### 3. Configure o `.env`
```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `BOT_TOKEN` | Developer Portal → Bot → Token |
| `CLIENT_ID` | Developer Portal → Application ID |
| `GUILD_ID` | ID do servidor Discord |
| `IP_MINECRAFT` | IP do servidor Minecraft |
| `URL_LOJA` | URL da loja (deixe vazio para "Em Breve!") |
| `CARGO_STAFF` | ID do cargo de staff |
| `CARGO_MEMBRO` | ID do cargo dado automaticamente ao entrar |
| `CANAL_COMANDOS` | ID do canal de comandos |
| `CANAL_BOAS_VINDAS` | ID do canal de boas-vindas |
| `CANAL_ANUNCIOS` | ID do canal de anúncios |
| `CANAL_SORTEIOS` | ID do canal de sorteios |
| `CANAL_LOGS_TICKETS` | ID do canal de logs de tickets |
| `CANAL_LOGS_TRANSCRIPTS` | ID do canal de transcripts |
| `CANAL_LOGS_MODERACAO` | ID do canal de logs de moderação |
| `CANAL_LOGS_MENSAGENS` | ID do canal de logs de mensagens |
| `CATEGORIA_TICKET_COMPRAS` | ID da categoria de tickets de compras |
| `CATEGORIA_TICKET_DUVIDAS` | ID da categoria de tickets de dúvidas |
| `CATEGORIA_TICKET_DENUNCIAS` | ID da categoria de tickets de denúncias |
| `CATEGORIA_TICKET_REVISOES` | ID da categoria de tickets de revisões |
| `CATEGORIA_TICKET_PARCEIROS` | ID da categoria de tickets de parceiros |
| `CATEGORIA_TICKET_BOOST` | ID da categoria de tickets de boost |
| `CATEGORIA_TICKET_OUTROS` | ID da categoria de tickets outros |

### 4. Registre os slash commands
```bash
npm run deploy
```

### 5. Inicie o bot
```bash
# Produção
npm start

# Desenvolvimento
npm run dev
```

---

## 📋 Comandos

### 📢 Comunicação
| Comando | Descrição | Permissão |
|---|---|---|
| `/say` | Envia uma mensagem simples pelo bot | Manage Messages |
| `/anunciar` | Envia um anúncio em embed | Manage Messages |

### 🎉 Sorteios
| Comando | Descrição | Permissão |
|---|---|---|
| `/sorteio criar` | Cria um sorteio com data e hora | Manage Events |
| `/sorteio encerrar` | Encerra um sorteio antes do tempo | Manage Events |
| `/sorteio resorteio` | Sorteia novamente excluindo ganhadores | Manage Events |

### 🎫 Tickets
| Comando | Descrição | Permissão |
|---|---|---|
| `/ticket painel` | Envia o painel de tickets | Manage Channels |
| `/ticket fechar` | Fecha o ticket com transcript | Manage Channels |
| `/ticket add` | Adiciona usuário ao ticket | Manage Channels |
| `/ticket remove` | Remove usuário do ticket | Manage Channels |

### 🛒 Loja
| Comando | Descrição | Permissão |
|---|---|---|
| `/loja` | Mostra produtos disponíveis | Qualquer um |
| `/cupom` | Lista cupons ativos | Qualquer um |
| `/cupom-admin criar` | Cria um cupom | Manage Guild |
| `/cupom-admin remover` | Remove um cupom | Manage Guild |

### 🔨 Moderação
| Comando | Descrição | Permissão |
|---|---|---|
| `/ban` | Bane um usuário | Ban Members |
| `/kick` | Expulsa um usuário | Kick Members |
| `/unban` | Remove o ban | Ban Members |
| `/clear` | Apaga mensagens | Manage Messages |
| `/lock` | Trava o canal | Manage Channels |
| `/unlock` | Destrava o canal | Manage Channels |
| `/slowmode` | Define modo lento | Manage Channels |

### 🔧 Utilitários
| Comando | Descrição | Permissão |
|---|---|---|
| `/ip` | IP do servidor Minecraft | Qualquer um |
| `/mcstatus` | Status do servidor em tempo real | Qualquer um |
| `/ping` | Ping do bot | Qualquer um |
| `/botinfo` | Informações do bot | Qualquer um |
| `/serverinfo` | Informações do servidor | Qualquer um |
| `/userinfo` | Informações de um usuário | Qualquer um |
| `/help` | Lista todos os comandos | Qualquer um |
| `/testar-entrada` | Simula boas-vindas | Manage Guild |

---

## 📁 Estrutura do Projeto

```
surreal-bot/
├── src/
│   ├── index.js
│   ├── deploy-commands.js
│   ├── commands/
│   │   ├── anuncios/        (say, anunciar)
│   │   ├── sorteio/         (sorteio)
│   │   ├── ticket/          (ticket)
│   │   ├── loja/            (loja, cupom, cupom-admin)
│   │   ├── moderacao/       (ban, kick, unban, clear, lock, unlock, slowmode)
│   │   └── utilitarios/     (ip, mcstatus, ping, botinfo, serverinfo, userinfo, help, testar-entrada)
│   ├── events/
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   ├── guildMemberAdd.js
│   │   ├── guildMemberRemove.js
│   │   ├── messageDelete.js
│   │   ├── messageDeleteBulk.js
│   │   └── messageUpdate.js
│   └── utils/
│       ├── embed.js
│       ├── logs.js
│       ├── clearFlag.js
│       └── canalComandos.js
├── data/                    (gerado automaticamente)
│   ├── cupons.json
│   └── sorteios.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```