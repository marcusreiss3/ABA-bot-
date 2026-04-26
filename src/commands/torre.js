const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const BattleEngine = require("../services/BattleEngine");
const EmbedManager = require("../services/EmbedManager");
const CharacterManager = require("../services/CharacterManager");

module.exports = {
  name: "torre",
  description: "Desafie a Torre Infinita!",
  async execute(message, args) {
    const playerId = message.author.id;
    const now = Date.now();

    // 1. Verificar cooldown
    const cooldown = playerRepository.getTowerCooldown(playerId);
    if (cooldown.available_at > now) {
      const remainingMin = Math.ceil((cooldown.available_at - now) / (1000 * 60));
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`Você ainda está em cooldown da torre! Restam **${remainingMin} minutos**.`, false)] });
    }

    // 2. Verificar se está em combate
    const status = BattleEngine.canStartBattle(playerId);
    if (!status.can) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você já está em um combate ativo ou na fila ranqueada!", false)] });
    }

    // 3. Verificar time 3v3
    const teamInstIds = BattleEngine.getRankedTeam(playerId);
    if (!teamInstIds || teamInstIds.length < 3) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("A Torre Infinita exige um **Time de 3 personagens**. Configure em `!equip → Time 3v3`.", false)] });
    }

    // 4. Verificar se as instâncias do time são válidas
    const teamInsts = teamInstIds.map(id => playerRepository.getCharacterInstance(id)).filter(Boolean);
    if (teamInsts.length < 3) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Um ou mais personagens do seu time não foram encontrados. Reconfigure em `!equip → Time 3v3`.", false)] });
    }

    // 5. Montar nomes do time para exibição
    const teamNames = teamInsts.map(inst => {
      const char = CharacterManager.getCharacter(inst.character_id, inst);
      return `**${char.name}** [Lv${inst.level}]`;
    });

    // 6. Criar Embed de Introdução
    const embed = new EmbedBuilder()
      .setTitle("🗼 Torre Infinita")
      .setDescription(
        `Bem-vindo à **Torre Infinita**!\n\n` +
        `**Regras:**\n` +
        `- Você usa seu **Time 3v3** — todos os 3 personagens entram na luta.\n` +
        `- A vida **não recupera** entre os andares.\n` +
        `- Derrota aplica cooldown de **35 minutos**.\n` +
        `- Ganhe Pedras da Alma e Fragmentos Zenith a cada andar.\n\n` +
        `**Seu Time:**\n${teamNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}`
      )
      .setColor("#FFD700")
      .setThumbnail("https://i.ibb.co/v6YmR0K/tower.png")
      .setFooter({ text: "Clique abaixo para começar!" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tower_start_1_${playerId}`)
        .setLabel("Começar Desafio")
        .setStyle(ButtonStyle.Success)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }
};
