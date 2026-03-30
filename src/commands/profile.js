const playerRepository = require("../database/repositories/playerRepository");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  execute: async (message) => {
    const player = playerRepository.getPlayer(message.author.id);
    const ownedChars = playerRepository.getPlayerCharacters(message.author.id);
    
    player.ownedChars = ownedChars;

    const embed = EmbedManager.createProfileEmbed(player);
    message.channel.send({ embeds: [embed] });
  }
};
