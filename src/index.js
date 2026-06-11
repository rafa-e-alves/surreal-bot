require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// ──────────────────────────────────────────────
//  Cliente Discord
// ──────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();

// ──────────────────────────────────────────────
//  Carrega comandos automaticamente das pastas
// ──────────────────────────────────────────────
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(folderPath, file));
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Comando carregado: /${command.data.name}`);
    } else {
      console.warn(`⚠️  Arquivo ${file} está faltando "data" ou "execute".`);
    }
  }
}

// ──────────────────────────────────────────────
//  Carrega eventos automaticamente
// ──────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`📡 Evento registrado: ${event.name}`);
}

// ──────────────────────────────────────────────
//  Login
// ──────────────────────────────────────────────
client.login(process.env.BOT_TOKEN);
