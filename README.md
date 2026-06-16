<div align="center">

<img src="https://raw.githubusercontent.com/rafa-e-alves/surreal-bot/main/assets/logo.png" alt="Rede Surreal Bot" width="120" />

# Rede Surreal Bot

**Bot do servidor Rede Surreal — Minecraft Factions**

[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-ED4245?style=for-the-badge)](LICENSE)

</div>

---

## Sobre

Bot desenvolvido em **discord.js v14** para o servidor de Minecraft Factions **Rede Surreal**. Construído do zero com slash commands nativos, cobre desde moderação e tickets até sorteios com persistência e logs automáticos por categoria.

---

## Funcionalidades

- **Sistema de Tickets** — painel com sete categorias, geração automática de transcript e logs separados por tipo
- **Sorteios** — data e hora definidas pelo staff, persistência após reinicialização do bot e suporte a resorteio excluindo ganhadores anteriores
- **Logs Automáticos** — mensagens editadas e apagadas, ações de moderação, abertura/fechamento de tickets e transcripts, cada um em seu próprio canal
- **Cupons de Desconto** — criação com validade opcional, remoção e listagem pública
- **Moderação** — ban, kick, unban, clear com backup das mensagens, lock, unlock e slowmode
- **Comunicação** — anúncios em embed e mensagens simples enviadas pelo bot
- **Integração com Minecraft** — status do servidor em tempo real via API mcstatus.io
- **Boas-vindas** — mensagem automática com foto de perfil do usuário e atribuição automática de cargo
- **Restrição de Canal** — comandos de usuário bloqueados fora do canal de comandos configurado

---

## Instalação

### Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- Bot criado no [Discord Developer Portal](https://discord.com/developers/applications)

### Passos

```bash
git clone https://github.com/rafa-e-alves/surreal-bot.git
cd surreal-bot
npm install
cp .env.example .env
```

Preencha o `.env` com os dados do seu servidor. Todas as variáveis estão documentadas no [`.env.example`](.env.example).

```bash
# Registra os slash commands (executar uma vez, ou após mudanças nos comandos)
npm run deploy

# Inicia o bot
npm start
```

---

## Comandos

### Comunicação
| Comando | Descrição |
|---|---|
| `/say` | Envia uma mensagem simples pelo bot |
| `/anunciar` | Envia um anúncio em embed com título, imagem e menção de cargo |

### Sorteios
| Comando | Descrição |
|---|---|
| `/sorteio criar` | Cria um sorteio definindo data e hora exatas |
| `/sorteio encerrar` | Encerra um sorteio antes do tempo |
| `/sorteio resorteio` | Realiza um novo sorteio excluindo ganhadores anteriores |

### Tickets
| Comando | Descrição |
|---|---|
| `/ticket painel` | Envia o painel de abertura de tickets |
| `/ticket fechar` | Fecha o ticket gerando transcript automático |
| `/ticket add` | Adiciona um usuário ao ticket |
| `/ticket remove` | Remove um usuário do ticket |

### Loja
| Comando | Descrição |
|---|---|
| `/loja` | Exibe os produtos disponíveis |
| `/cupom` | Lista os cupons de desconto ativos |
| `/cupom-admin criar` | Cria um cupom com desconto e validade |
| `/cupom-admin remover` | Remove um cupom |

### Moderação
| Comando | Descrição |
|---|---|
| `/ban` | Bane um usuário do servidor |
| `/kick` | Expulsa um usuário do servidor |
| `/unban` | Remove o ban de um usuário |
| `/clear` | Apaga mensagens do canal e registra o conteúdo em log |
| `/lock` | Trava o canal |
| `/unlock` | Destrava o canal |
| `/slowmode` | Define o intervalo do modo lento |

### Utilitários
| Comando | Descrição |
|---|---|
| `/ip` | Exibe o IP do servidor Minecraft |
| `/mcstatus` | Consulta o status do servidor Minecraft em tempo real |
| `/ping` | Exibe a latência do bot |
| `/botinfo` | Exibe informações sobre o bot |
| `/serverinfo` | Exibe informações sobre o servidor Discord |
| `/userinfo` | Exibe informações sobre um usuário |
| `/help` | Lista todos os comandos disponíveis |
| `/testar-entrada` | Simula a mensagem de boas-vindas |

---

## Estrutura do Projeto

```
surreal-bot/
├── src/
│   ├── index.js
│   ├── deploy-commands.js
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
├── data/                         # Gerado automaticamente em runtime
│   ├── cupons.json
│   └── sorteios.json
├── assets/
│   └── logo.png
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Licença

MIT © [Rafael Alves](https://github.com/rafa-e-alves)