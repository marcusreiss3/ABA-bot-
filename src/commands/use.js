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
      .setColor("#1a0a2e")
      .setAuthor({ name: "⚗️ Câmara de Evolução" })
      .setDescription(
        "*As Pedras da Alma pulsam com energia dimensional, prontas para despertar o potencial adormecido de um guerreiro.*\n\n" +
        "Selecione abaixo qual pedra deseja invocar."
      )
      .setFooter({ text: "Escolha a Pedra da Alma • Próximo: selecionar guerreiro" });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`use_item_select_${playerId}`)
        .setPlaceholder("Qual pedra deseja usar?")
        .addOptions(itemOptions)
    );

    await message.reply({ embeds: [embed], components: [row] });
  }
};
