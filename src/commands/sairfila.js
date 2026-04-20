const { EmbedBuilder } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const EmbedManager = require("../services/EmbedManager");
const BattleEngine = require("../services/BattleEngine");

const QUEUE_CHANNEL_ID = "1487958808897781780";

module.exports = {
  name: "sair-fila",
  aliases: [],
  description: "Sai da fila ranqueada de PVP",
  execute: async (message) => {
    const playerId = message.author.id;

    const inQueue1v1 = playerRepository.isInQueue(playerId);
    const inQueue3v3 = BattleEngine.isInTeamQueue(playerId);

    if (!inQueue1v1 && !inQueue3v3) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não está em nenhuma fila no momento!", false)] });
    }

    try {
      if (inQueue1v1) playerRepository.removeFromQueue(playerId);
      if (inQueue3v3) BattleEngine.removeFromTeamQueue(playerId);

      const leaveEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🚪 Saiu da Fila")
        .setDescription(`<@${playerId}> saiu da fila ranqueada.`)
        .setThumbnail(message.author.displayAvatarURL())

      const queueChannel = await message.client.channels.fetch(QUEUE_CHANNEL_ID).catch(() => null);
      if (queueChannel) await queueChannel.send({ embeds: [leaveEmbed] }).catch(() => {});

      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você saiu da fila ranqueada com sucesso.", true)] });
    } catch (error) {
      console.error("Erro ao remover jogador da fila:", error);
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Ocorreu um erro ao tentar sair da fila. Tente novamente mais tarde.", false)] });
    }
  }
};
