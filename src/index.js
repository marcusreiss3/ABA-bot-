require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const profileCommand = require("./commands/profile");
const pvpCommand = require("./commands/pvp");
const equipCommand = require("./commands/equip");
const adminCommand = require("./commands/admin");
const invCommand = require("./commands/inv");
const useCommand = require("./commands/use");
const giveArtifactCommand = require("./commands/giveartifact");
// Comando equipartifact removido em favor da nova interface !equip
const storyModeCommand = require("./commands/modohistoria");
const partyCommand = require("./commands/party");
const kickCommand = require("./commands/kick");
const partyUtils = require("./commands/party_utils");
const bossRushCommand = require("./commands/boss-rush");
const desafioCommand = require("./commands/desafio");
const sairFilaCommand = require("./commands/sairfila");
const torreCommand = require("./commands/torre");
const torreRankCommand = require("./commands/torre-rank");
const missionsCommand = require("./commands/missions");
const interactionCreateEvent = require("./events/interactionCreate");
const BattleEngine = require("./services/BattleEngine");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  console.log("Mensagem recebida:", message.content); // DEBUG

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "!profile") {
    console.log("Comando profile detectado"); // DEBUG
    profileCommand.execute(message);
  }

  if (command === "!pvp") {
    console.log("Comando pvp detectado"); // DEBUG
    pvpCommand.execute(message, args);
  }

  if (command === "!equipar" || command === "!equip") {
    console.log("Comando equip detectado"); // DEBUG
    equipCommand.execute(message, args);
  }

  if (command === "!setchar") {
    console.log("Comando admin detectado"); // DEBUG
    adminCommand.execute(message, args);
  }

  if (command === "!inv" || command === "!inventario") {
    console.log("Comando inv detectado"); // DEBUG
    invCommand.execute(message, args);
  }

  if (command === "!use") {
    console.log("Comando use detectado"); // DEBUG
    useCommand.execute(message, args);
  }

  if (command === "!giveartifact") {
    console.log("Comando giveartifact detectado"); // DEBUG
    giveArtifactCommand.execute(message, args);
  }

  // Comando !equipartifact desativado. Use !equip.
  if (command === "!equipartifact" || command === "!equipart") {
    const EmbedManager = require("./services/EmbedManager");
    message.reply({ embeds: [EmbedManager.createStatusEmbed("Este comando foi movido! Agora use apenas `!equip` e escolha a opção 'Equipar Artefato'.", false)] });
  }

  if (command === "!modo-historia" || command === "!pve" || command === "!historia") {
    console.log("Comando modo-historia detectado"); // DEBUG
    storyModeCommand.execute(message, args);
  }

  if (command === "!party") {
    console.log("Comando party detectado"); // DEBUG
    partyCommand.execute(message, args);
  }

  if (command === "!kick") {
    console.log("Comando kick detectado"); // DEBUG
    kickCommand.execute(message, args);
  }

  if (command === "!party-sair") {
    console.log("Comando party-sair detectado"); // DEBUG
    partyUtils.executeSair(message);
  }

  if (command === "!party-desfazer") {
    console.log("Comando party-desfazer detectado"); // DEBUG
    partyUtils.executeDesfazer(message);
  }

  if (command === "!boss-rush" || command === "!bossrush") {
    console.log("Comando boss-rush detectado"); // DEBUG
    bossRushCommand.execute(message, args);
  }

  if (command === "!desafio" || command === "!challenge") {
    console.log("Comando desafio detectado"); // DEBUG
    desafioCommand.execute(message, args);
  }

  if (command === "!sairfila" || command === "!cancelarfila" || command === "!sf") {
    console.log("Comando sairfila detectado"); // DEBUG
    sairFilaCommand.execute(message);
  }

  if (command === "!torre" || command === "!tower") {
    console.log("Comando torre detectado"); // DEBUG
    torreCommand.execute(message, args);
  }

  if (command === "!torre-rank") {
    console.log("Comando torrerank detectado"); // DEBUG
    torreRankCommand.execute(message, args);
  }

  if (command === "!missões" || command === "!missoes") {
    console.log("Comando missões detectado"); // DEBUG
    missionsCommand.execute(message);
  }
});

client.on("interactionCreate", async (interaction) => {
  console.log("Interação recebida:", interaction.customId); // DEBUG
  interactionCreateEvent.execute(interaction);
});

client.once("ready", () => {
  console.log(`Bot online: ${client.user.tag}`);
  
  // Verificar timeouts de combate a cada minuto
  setInterval(() => {
    BattleEngine.checkTimeouts(client);
  }, 60000);
});

// Check if TOKEN exists in .env
if (!process.env.TOKEN) {
  console.error("ERRO: O TOKEN do Discord não foi encontrado no arquivo .env");
  process.exit(1);
}

client.login(process.env.TOKEN);
