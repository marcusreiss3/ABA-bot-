const BattleEngine = require("../services/BattleEngine");
const playerRepository = require("../database/repositories/playerRepository");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
  execute: async (message, args) => {
    const player1Id = message.author.id;
    const player2User = message.mentions.users.first();

    // Verificação de estado (combate ou fila)
    const status = BattleEngine.canStartBattle(player1Id);
    if (!status.can) {
      return message.reply(status.reason);
    }

    const player1 = playerRepository.getPlayer(player1Id);
    if (!player1.equipped_instance_id) {
      return message.reply("Você não tem um personagem equipado! Use `!equipar` para selecionar um.");
    }

    // Se o usuário mencionou alguém, assume-se que ele quer um PVP Casual direto (ou o fluxo antigo)
    // Mas conforme o pedido: "quando usa só !pvp o comando sugere se quer ranqueada ou casual"
    if (!player2User) {
      const embed = new EmbedBuilder()
        .setTitle("⚔️ Arena de Batalha")
        .setDescription("Escolha como você deseja lutar hoje:")
        .setColor("#FF4500")
        .addFields(
          { name: "🏆 Ranqueado", value: "Entre na fila para enfrentar alguém do seu nível e ganhar PA!" },
          { name: "🥊 Casual", value: "Desafie um amigo específico para uma luta amistosa." }
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`pvp_init_ranked_${player1Id}`)
          .setLabel("Modo Ranqueado")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🏆"),
        new ButtonBuilder()
          .setCustomId(`pvp_init_casual_${player1Id}`)
          .setLabel("Modo Casual")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🥊")
      );

      return message.channel.send({
        embeds: [embed],
        components: [row]
      });
    }

    // Se mencionou alguém, segue o fluxo de desafio casual direto
    if (player2User.bot) {
      return message.reply("Você não pode lutar contra bots!");
    }

    if (player1Id === player2User.id) {
      return message.reply("Você não pode lutar contra si mesmo!");
    }

    const statusP2 = BattleEngine.canStartBattle(player2User.id);
    if (!statusP2.can) {
      const reason = statusP2.reason.replace("Você já está", `<@${player2User.id}> já está`).replace("Saia da fila", "Ele precisa sair da fila");
      return message.reply(reason);
    }

    const player2 = playerRepository.getPlayer(player2User.id);
    if (!player2.equipped_instance_id) {
      return message.reply(`<@${player2User.id}> não tem um personagem equipado e não pode lutar!`);
    }

    const embed = new EmbedBuilder()
      .setTitle("⚔️ Desafio de PVP Casual")
      .setDescription(`<@${player1Id}> desafiou <@${player2User.id}> para um combate casual!\n\n<@${player2User.id}>, você aceita?`)
      .setColor("#0099ff");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pvp_accept_casual_${player1Id}_${player2User.id}`)
        .setLabel("Aceitar")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`pvp_refuse_${player1Id}_${player2User.id}`)
        .setLabel("Recusar")
        .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
};
