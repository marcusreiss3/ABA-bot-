const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const storyConfig = require("../config/storyConfig.js");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  name: "modo-historia",
  aliases: ["pve", "historia"],
  description: "Abre o menu do modo história para enfrentar bosses",
  async execute(message, args) {
    const playerId = message.author.id;
    const BattleEngine = require("../services/BattleEngine");
    const status = BattleEngine.canStartBattle(playerId);
    if (!status.can) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(status.reason, false)] });
    }

    const progress = playerRepository.getStoryProgress(playerId);
    const lastDefeated = progress.last_boss_defeated;

    const embed = EmbedManager.createStoryWorldSelectEmbed(lastDefeated);

    const allBosses = [];
    storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
    const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);

    const row = new ActionRowBuilder();
    storyConfig.worlds.forEach((world, index) => {
      let isWorldUnlocked = index === 0;
      if (index > 0) {
        const prevWorld = storyConfig.worlds[index - 1];
        const lastBossPrev = prevWorld.bosses[prevWorld.bosses.length - 1].id;
        const prevWorldLastIdx = allBosses.findIndex(b => b.id === lastBossPrev);
        if (lastDefeatedIdx >= prevWorldLastIdx) isWorldUnlocked = true;
      }
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`story_world_${world.id}_${playerId}`)
          .setLabel(world.name.split(" ")[1] || world.name)
          .setEmoji(world.emoji)
          .setStyle(isWorldUnlocked ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(!isWorldUnlocked)
      );
    });

    await message.reply({ embeds: [embed], components: [row] });
  }
};
