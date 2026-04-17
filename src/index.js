require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const EmbedManager = require("./services/EmbedManager");
const ButtonManager = require("./services/ButtonManager");
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
const fendaAncestralCommand = require("./commands/fenda-ancestral");
const nexusZenithCommand = require("./commands/nexus-zenith");
const limboCommand = require("./commands/limbo");
const protegerCommand = require("./commands/proteger");
const tutorialCommand = require("./commands/tutorial");
const titulosCommand = require("./commands/titulos");
const ticketCommand = require("./commands/ticket");
const interactionCreateEvent = require("./events/interactionCreate");
const BattleEngine = require("./services/BattleEngine");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Canais onde PVP/desafio/torre funcionam (e todos os outros comandos também)
const BATTLE_CHANNELS = new Set([
  "1494693942896365578",
  "1494693994733633766",
  "1494694032847274074",
  "1494694092309794896",
  "1494694124584960130",
]);

// Canal de comandos gerais (sem PVP/desafio/torre)
const GENERAL_COMMANDS_CHANNEL = "1487204980380274798";

// Canais onde o bot é completamente bloqueado (canais de chat geral, mídias, etc.)
const BLOCKED_CHANNELS = new Set([
  "1485482920008220724",
  "1494689601791463525",
  "1494695065409552466",
  "1494695186251386992",
  "1494698483460866309",
]);

// Comandos exclusivos dos canais de batalha
const BATTLE_ONLY_COMMANDS = new Set([
  "!pvp", "!desafio", "!challenge", "!torre", "!tower",
  "!sair-fila", "!boss-rush", "!bossrush",
  "!modo-historia", "!pve", "!historia"
]);

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  console.log("Mensagem recebida:", message.content); // DEBUG

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Só processa comandos com prefixo !
  if (!command.startsWith("!")) return;

  // Tutorial channel interception — must run before all normal command handlers
  if (tutorialCommand.interceptCommand(message, command, args)) return;

  const channelId = message.channel.id;
  const isBattleChannel = BATTLE_CHANNELS.has(channelId);
  const isGeneralChannel = channelId === GENERAL_COMMANDS_CHANNEL;

  if (BLOCKED_CHANNELS.has(channelId)) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setDescription("❌ Os comandos do bot não funcionam neste canal. Use os canais próprios do bot.");
    return message.reply({ embeds: [errorEmbed] });
  }

  if (!isBattleChannel && !isGeneralChannel && BATTLE_ONLY_COMMANDS.has(command)) {
    const errorEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setDescription("❌ Este comando não está disponível aqui. Use os canais de batalha do bot.");
    return message.reply({ embeds: [errorEmbed] });
  }

  if (command === "!profile" || command === "!perfil") {
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

  if (command === "!use" || command === "!usar") {
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

  if (command === "!sair-fila") {
    console.log("Comando sair-fila detectado"); // DEBUG
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

  if (command === "!fenda-ancestral" || command === "!fenda") {
    console.log("Comando fenda-ancestral detectado"); // DEBUG
    fendaAncestralCommand.execute(message);
  }

  if (command === "!nexus-zenith" || command === "!nexus") {
    console.log("Comando nexus-zenith detectado"); // DEBUG
    nexusZenithCommand.execute(message);
  }

  if (command === "!limbo") {
    console.log("Comando limbo detectado"); // DEBUG
    limboCommand.execute(message);
  }

  if (command === "!proteger" || command === "!protect") {
    console.log("Comando proteger detectado"); // DEBUG
    protegerCommand.execute(message);
  }

  if (command === "!titulos" || command === "!títulos") {
    console.log("Comando titulos detectado"); // DEBUG
    titulosCommand.execute(message);
  }

  if (command === "!tutorial-post") {
    console.log("Comando tutorial-post detectado"); // DEBUG
    tutorialCommand.postTutorialEmbed(message);
  }

  if (command === "!ticket-post") {
    ticketCommand.postTicketEmbed(message);
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

  // Detectar combates PVE travados a cada 2 minutos
  setInterval(async () => {
    const stalledBattles = BattleEngine.getStalledBattles(2 * 60 * 1000);
    for (const battle of stalledBattles) {
      if (battle.stallNotified) continue;
      battle.stallNotified = true;

      try {
        const channel = await client.channels.fetch(battle.channelId).catch(() => null);
        if (!channel) continue;

        const leaderId = (battle.partyMembers && battle.partyMembers[0]) || battle.player1Id;
        const battleEmbed = EmbedManager.createBattleEmbed(battle);
        const stallEmbed = new EmbedBuilder()
          .setColor("#FF6600")
          .setTitle("⚠️ Combate Travado?")
          .setDescription(
            `O combate parece parado há mais de 2 minutos.\n` +
            `<@${leaderId}> pode forçar a retomada ou abandonar.`
          );
        const fixRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`fixcombat_${battle.id}_${leaderId}`)
            .setLabel("🔧 Consertar Combate")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`${battle.id}_abandon`)
            .setLabel("🏳️ Abandonar")
            .setStyle(ButtonStyle.Secondary)
        );

        // Try to edit the last known battle message; fall back to sending a new one
        if (battle.lastMessageId) {
          const msg = await channel.messages.fetch(battle.lastMessageId).catch(() => null);
          if (msg) {
            await msg.edit({ embeds: [battleEmbed, stallEmbed], components: [fixRow] }).catch(() => null);
            continue;
          }
        }
        await channel.send({ embeds: [battleEmbed, stallEmbed], components: [fixRow] }).catch(() => null);
      } catch (e) {
        console.error("[STALL_CHECK] Erro:", e);
      }
    }
  }, 2 * 60 * 1000);
});

// Check if TOKEN exists in .env
if (!process.env.TOKEN) {
  console.error("ERRO: O TOKEN do Discord não foi encontrado no arquivo .env");
  process.exit(1);
}

client.login(process.env.TOKEN);

process.on("unhandledRejection", (err) => {
  if (err?.code === 10062) return; // interação expirada — ignorar silenciosamente
  console.error("[UnhandledRejection]", err);
});

process.on("uncaughtException", (err) => {
  console.error("[UncaughtException]", err);
});
