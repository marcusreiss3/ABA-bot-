const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");

const RARITY_ICON = { EM: "👁️", AL: "🌟", EC: "◆" };

function createProtegerEmbed(userId, username, avatarUrl, successMsg = null) {
  const instances = playerRepository.getPlayerCharacters(userId);
  const player    = playerRepository.getPlayer(userId);

  const lines = instances.map(i => {
    const c       = CharacterManager.getCharacter(i.character_id, i);
    const lock    = i.protected ? " 🔒" : "";
    const equip   = player.equipped_instance_id === i.id ? " ⚔️" : "";
    return `${RARITY_ICON[c.rarity] || "◆"} **${c.name}** \`Lv${i.level}\` \`#${i.id}\`${equip}${lock}`;
  });

  const protectedCount = instances.filter(i => i.protected).length;

  const embed = new EmbedBuilder()
    .setTitle(`🔒 Proteger Personagens — ${username}`)
    .setColor("#5865F2")
    .setThumbnail(avatarUrl)
    .setDescription(
      (successMsg ? `> ${successMsg}\n\n` : "") +
      (lines.length > 0
        ? lines.join("\n")
        : "Você não possui personagens.") +
      `\n\n🔒 **${protectedCount}** protegido(s) — personagens com 🔒 nunca são removidos no descarte em massa.`
    )
    .setFooter({ text: "Selecione um personagem para alternar a proteção." });

  if (instances.length === 0) return { embed, components: [] };

  // Select menu — max 25 por vez
  const options = instances.slice(0, 25).map(i => {
    const c = CharacterManager.getCharacter(i.character_id, i);
    return {
      label: `${i.protected ? "🔒 " : ""}${c.name} [Lv${i.level}]`,
      description: `Raridade: ${c.rarity} · ID: ${i.id} · ${i.protected ? "Clique para desproteger" : "Clique para proteger"}`,
      value: i.id.toString(),
      emoji: i.protected ? "🔓" : "🔒",
    };
  });

  const components = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`proteger_toggle_${userId}`)
        .setPlaceholder("Selecione para alternar proteção...")
        .addOptions(options),
    ),
  ];

  return { embed, components };
}

module.exports = {
  execute: async (message) => {
    const userId = message.author.id;
    playerRepository.getPlayer(userId); // garante que existe
    const { embed, components } = createProtegerEmbed(userId, message.author.username, message.author.displayAvatarURL());
    return message.reply({ embeds: [embed], components });
  },

  handleInteraction: async (interaction) => {
    const userId  = interaction.customId.split("proteger_toggle_")[1];
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: "Este menu não é seu!", ephemeral: true });
    }

    const instanceId = parseInt(interaction.values[0]);
    const instance   = playerRepository.getCharacterInstance(instanceId);
    if (!instance || instance.player_id !== userId) {
      return interaction.reply({ content: "Personagem não encontrado.", ephemeral: true });
    }

    const newVal = playerRepository.toggleCharacterProtection(instanceId);
    const c      = CharacterManager.getCharacter(instance.character_id, instance);
    const msg    = newVal
      ? `🔒 **${c.name}** agora está **protegido** e não será removido no descarte em massa.`
      : `🔓 **${c.name}** agora está **desprotegido**.`;

    const { embed, components } = createProtegerEmbed(userId, interaction.user.username, interaction.user.displayAvatarURL(), msg);
    return interaction.update({ embeds: [embed], components });
  },
};
