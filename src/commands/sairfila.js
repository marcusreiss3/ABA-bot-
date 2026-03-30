const playerRepository = require("../database/repositories/playerRepository");

module.exports = {
  name: "sairfila",
  aliases: ["cancelarfila", "sf"],
  description: "Sai da fila ranqueada de PVP",
  execute: async (message) => {
    const playerId = message.author.id;

    if (!playerRepository.isInQueue(playerId)) {
      return message.reply("Você não está em nenhuma fila no momento!");
    }

    try {
      playerRepository.removeFromQueue(playerId);
      return message.reply("✅ Você saiu da fila ranqueada com sucesso.");
    } catch (error) {
      console.error("Erro ao remover jogador da fila:", error);
      return message.reply("Ocorreu um erro ao tentar sair da fila. Tente novamente mais tarde.");
    }
  }
};
