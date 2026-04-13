const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const EvolutionManager = require("../services/EvolutionManager");
const CharacterManager = require("../services/CharacterManager");

module.exports = {
  name: "use",
  description: "Usa um item do inventário",
  async execute(message, args) {
    const playerId = message.author.id;
    const items = playerRepository.getPlayerItems(playerId);

    // Filtrar apenas itens que estão no EvolutionManager (pedras da alma)
    const validItems = items.filter(i => EvolutionManager.ITEMS[i.item_id]);

    if (validItems.length === 0) {
      const EmbedManager = require("../services/EmbedManager");
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não possui itens de evolução (Pedras da Alma).", false)] });
    }

    const itemOptions = validItems.map(i => {
      const itemData = EvolutionManager.ITEMS[i.item_id];
      return {
        label: `${itemData.name} (x${i.quantity})`,
        description: `Concede ${itemData.xp} XP por unidade`,
        value: i.item_id
      };
    });

    const embed = new EmbedBuilder()
      .setTitle("🎒 Usar Item")
      .setDescription("Selecione o item que deseja usar.")
      .setColor("#5865F2");

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`use_item_select_${playerId}`)
        .setPlaceholder("Escolha um item...")
        .addOptions(itemOptions)
    );

    await message.reply({ embeds: [embed], components: [row] });
  }
};
