const playerRepository = require("../database/repositories/playerRepository");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  name: "sairfila",
  aliases: ["cancelarfila", "sf"],
  description: "Sai da fila ranqueada de PVP",
  execute: async (message) => {
    const playerId = message.author.id;

    if (!playerRepository.isInQueue(playerId)) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não está em nenhuma fila no momento!", false)] });
    }

    try {
      playerRepository.removeFromQueue(playerId);
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você saiu da fila ranqueada com sucesso.", true)] });
    } catch (error) {
      console.error("Erro ao remover jogador da fila:", error);
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Ocorreu um erro ao tentar sair da fila. Tente novamente mais tarde.", false)] });
    }
  }
};
