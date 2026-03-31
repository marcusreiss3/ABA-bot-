const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const challengeConfig = require("../config/challengeConfig.js");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  name: "desafio",
  aliases: ["challenge"],
  description: "Abre o menu do Modo Desafio para enfrentar bosses poderosos",
  async execute(message, args) {
    const playerId = message.author.id;
    const BattleEngine = require("../services/BattleEngine");
    const status = BattleEngine.canStartBattle(playerId);
    if (!status.can) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(status.reason, false)] });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎮 Modo Desafio")
      .setDescription("Escolha uma dificuldade para enfrentar um boss aleatório. O cooldown é global e compartilhado entre todos!")
      .setColor("#FF4500")
      .setTimestamp();

    const row = new ActionRowBuilder();
    const now = Date.now();

    for (const key in challengeConfig.difficulties) {
      const diff = challengeConfig.difficulties[key];
      const globalCooldown = playerRepository.getGlobalChallengeCooldown(key);
      const isAvailable = now >= globalCooldown.available_at;

      let statusText = isAvailable ? "✅ Disponível" : "⏳ Em Cooldown";
      if (!isAvailable) {
        const timeLeft = Math.ceil((globalCooldown.available_at - now) / 60000);
        statusText += ` (${timeLeft} min)`;
      }

      embed.addFields({
        name: `${diff.emoji} ${diff.name}`,
        value: statusText,
        inline: true
      });

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`challenge_diff_${key}_${playerId}`)
          .setLabel(diff.name)
          .setEmoji(diff.emoji)
          .setStyle(isAvailable ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(!isAvailable)
      );
    }

    embed.setFooter({ text: "Pode ser jogado solo ou em party!" });

    await message.reply({ embeds: [embed], components: [row] });
  }
};
