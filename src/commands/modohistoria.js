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

    const embed = new EmbedBuilder()
      .setTitle("🌍 Modo História: Seleção de Universo")
      .setDescription("Escolha o universo que deseja explorar. Derrote o boss final de um mundo para desbloquear o próximo!")
      .setColor("#5865F2")
      .setTimestamp();

    const row = new ActionRowBuilder();
    
    // Lista plana de todos os bosses para verificação global
    const allBosses = [];
    storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));

    storyConfig.worlds.forEach((world, index) => {
      let isWorldUnlocked = false;
      
      if (index === 0) {
        isWorldUnlocked = true;
      } else {
        // Um mundo está liberado se o último boss do mundo anterior foi derrotado
        const previousWorld = storyConfig.worlds[index - 1];
        const lastBossOfPrevWorld = previousWorld.bosses[previousWorld.bosses.length - 1].id;
        
        const lastDefeatedIndex = allBosses.findIndex(b => b.id === lastDefeated);
        const prevWorldLastBossIndex = allBosses.findIndex(b => b.id === lastBossOfPrevWorld);
        
        if (lastDefeatedIndex >= prevWorldLastBossIndex) {
          isWorldUnlocked = true;
        }
      }

      const statusEmoji = isWorldUnlocked ? "🔓" : "🔒";
      embed.addFields({
        name: `${world.emoji} ${world.name}`,
        value: isWorldUnlocked ? "✅ Disponível para exploração" : "❌ Bloqueado",
        inline: true
      });

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`story_world_${world.id}_${playerId}`)
          .setLabel(world.name.split(" ")[1] || world.name)
          .setEmoji(world.emoji)
          .setStyle(isWorldUnlocked ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(!isWorldUnlocked)
      );
    });

    embed.setFooter({ text: "Sua jornada começa aqui!" });

    await message.reply({ embeds: [embed], components: [row] });
  }
};
