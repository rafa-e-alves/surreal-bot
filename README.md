<div align="center">

<img src="https://raw.githubusercontent.com/rafa-e-alves/surreal-bot/main/assets/logo.png" alt="Rede Surreal Bot" width="120" />

# Rede Surreal Bot

**Bot oficial do servidor Rede Surreal — Minecraft Factions**

[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-ED4245?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Sobre

Bot desenvolvido com **discord.js v14** para o servidor de Minecraft Factions **Rede Surreal**. Conta com sistema completo de tickets, sorteios persistentes, logs automáticos, sistema de cupons, moderação e muito mais — tudo via slash commands nativos do Discord.

---

## ✨ Funcionalidades

- 🎫 **Sistema de Tickets** — painel com categorias, transcript automático e logs separados
- 🎉 **Sorteios** — com data/hora definida, persistência após reinicialização e resorteio
- 📋 **Logs Automáticos** — mensagens editadas/apagadas, moderação, tickets e transcripts em canais separados
- 🏷️ **Cupons de Desconto** — criação, remoção e listagem com data de expiração
- 🔨 **Moderação** — ban, kick, unban, clear, lock, unlock e slowmode
- 📢 **Comunicação** — anúncios em embed e mensagens simples pelo bot
- ⛏️ **Integração Minecraft** — status do servidor em tempo real via mcstatus.io
- 👋 **Boas-vindas** — mensagem automática com foto do usuário e cargo automático
- 🔒 **Segurança** — comandos restritos por canal e permissões nativas do Discord

---

## 🚀 Instalação

### Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- Conta no [Discord Developer Portal](https://discord.com/developers/applications)

### 1. Clone o repositório

```bash
git clone https://github.com/rafa-e-alves/surreal-bot.git
cd surreal-bot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com seus dados. Veja o [`.env.example`](.env.example) para referência completa.

### 4. Registre os slash commands

```bash
npm run deploy
```

> ⚠️ Execute este comando apenas uma vez, ou quando adicionar/modificar comandos.

### 5. Inicie o bot

```bash
# Produção
npm start

# Desenvolvimento (reinicia automaticamente ao salvar)
npm run dev
```

---

## 📋 Comandos

### 📢 Comunicação
| Comando | Descrição |
|---|---|
| `/say` | Envia uma mensagem simples pelo bot |
| `/anunciar` | Envia um anúncio em embed com título, imagem e menção de cargo |

### 🎉 Sorteios
| Comando | Descrição |
|---|---|
| `/sorteio criar` | Cria um sorteio com data e hora exatas |
| `/sorteio encerrar` | Encerra um sorteio antes do tempo |
| `/sorteio resorteio` | Sorteia novamente excluindo ganhadores anteriores |

### 🎫 Tickets
| Comando | Descrição |
|---|---|
| `/ticket painel` | Envia o painel de abertura de tickets |
| `/ticket fechar` | Fecha o ticket gerando transcript automático |
| `/ticket add` | Adiciona um usuário ao ticket |
| `/ticket remove` | Remove um usuário do ticket |

### 🛒 Loja
| Comando | Descrição |
|---|---|
| `/loja` | Exibe os produtos disponíveis |
| `/cupom` | Lista os cupons de desconto ativos |
| `/cupom-admin criar` | Cria um cupom com desconto e validade |
| `/cupom-admin remover` | Remove um cupom |

### 🔨 Moderação
| Comando | Descrição |
|---|---|
| `/ban` | Bane um usuário do servidor |
| `/kick` | Expulsa um usuário do servidor |
| `/unban` | Remove o ban de um usuário |
| `/clear` | Apaga mensagens do canal |
| `/lock` | Trava o canal (ninguém pode enviar mensagens) |
| `/unlock` | Destrava o canal |
| `/slowmode` | Define o modo lento do canal |

### 🔧 Utilitários
| Comando | Descrição |
|---|---|
| `/ip` | Exibe o IP do servidor Minecraft |
| `/mcstatus` | Status do servidor Minecraft em tempo real |
| `/ping` | Latência do bot |
| `/botinfo` | Informações sobre o bot |
| `/serverinfo` | Informações sobre o servidor Discord |
| `/userinfo` | Informações sobre um usuário |
| `/help` | Lista todos os comandos disponíveis |
| `/testar-entrada` | Simula a mensagem de boas-vindas |

---

## 📁 Estrutura

```
surreal-bot/
├── src/
│   ├── index.js                  # Entry point
│   ├── deploy-commands.js        # Registro de slash commands
│   ├── commands/
│   │   ├── anuncios/             # say, anunciar
│   │   ├── sorteio/              # sorteio
│   │   ├── ticket/               # ticket
│   │   ├── loja/                 # loja, cupom, cupom-admin
│   │   ├── moderacao/            # ban, kick, unban, clear, lock, unlock, slowmode
│   │   └── utilitarios/          # ip, mcstatus, ping, botinfo, serverinfo, userinfo, help, testar-entrada
│   ├── events/
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   ├── guildMemberAdd.js     # Boas-vindas + cargo automático
│   │   ├── guildMemberRemove.js  # Fecha ticket ao sair do servidor
│   │   ├── messageDelete.js      # Log de mensagens apagadas
│   │   ├── messageDeleteBulk.js  # Log de clear
│   │   └── messageUpdate.js      # Log de mensagens editadas
│   └── utils/
│       ├── embed.js              # Helper de embeds padronizados
│       ├── logs.js               # Helper de logs
│       ├── clearFlag.js          # Controle de bulk delete
│       └── canalComandos.js      # Restrição de canal por comando
├── data/                         # Gerado automaticamente
│   ├── cupons.json
│   └── sorteios.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔧 Deploy com Auto-Update

O projeto está configurado para deploy automático via **webhook do GitHub + PM2** em uma VM Oracle Cloud Always Free.

Ao dar `git push`, o servidor recebe o sinal instantaneamente, faz `git pull` e reinicia o bot automaticamente.

```bash
# Gerenciar o bot na VM
pm2 status                        # Ver status
pm2 logs rede-surreal-bot         # Ver logs em tempo real
pm2 restart rede-surreal-bot      # Reiniciar manualmente
```

---

## 📄 Licença

MIT © [Rafael Alves](https://github.com/rafa-e-alves)