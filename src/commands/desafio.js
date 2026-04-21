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
      .setTitle("⚔️ Modo Desafio")
      .setDescription(
        "**Provadores de força se reúnem aqui.**\nEscolha uma dificuldade e enfrente um chefe poderoso em combate direto.\n\n" +
        "─────────────────────────\n" +
        "🗓️ O cooldown é por dificuldade e reinicia diariamente.\n" +
        "👥 Pode ser enfrentado em party."
      )
      .setColor("#3B0A45")
      .setThumbnail("https://i.ibb.co/XZgZVnm8/image.png");

    const row = new ActionRowBuilder();

    for (const key in challengeConfig.difficulties) {
      const diff = challengeConfig.difficulties[key];
      const isAvailable = playerRepository.isPlayerChallengeCooledDown(playerId, key);

      let statusText = isAvailable ? "✅ Disponível" : "⏳ Em Cooldown";
      if (!isAvailable) {
        const msLeft = playerRepository.getPlayerChallengeCooldownMs(playerId, key);
        const minLeft = Math.ceil(msLeft / 60000);
        statusText += ` (~${minLeft} min)`;
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

    embed.setFooter({ text: "A glória pertence a quem ousou enfrentar o impossível." });

    await message.reply({ embeds: [embed], components: [row] });
  }
};
