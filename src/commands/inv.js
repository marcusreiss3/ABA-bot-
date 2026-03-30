const playerRepository = require("../database/repositories/playerRepository");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  name: "inv",
  aliases: ["inventario", "inventory"],
  description: "Mostra o seu inventário de personagens e itens",
  async execute(message, args) {
    const playerId = message.author.id;
    const player = playerRepository.getPlayer(playerId);
    const ownedChars = playerRepository.getPlayerCharacters(playerId);
    const items = playerRepository.getPlayerItems(playerId);

    player.ownedChars = ownedChars;
    player.items = items;
    player.artifacts = playerRepository.getPlayerArtifacts(playerId);

    const result = EmbedManager.createInventoryEmbed(player, message.author, "chars");
    
    await message.reply(result);
  }
};
