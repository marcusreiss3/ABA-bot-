const BattleEngine = require("../services/BattleEngine");
const playerRepository = require("../database/repositories/playerRepository");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  execute: async (message, args) => {
    const player1Id = message.author.id;
    const player2User = message.mentions.users.first();

    // Verificação de estado (combate ou fila)
    const status = BattleEngine.canStartBattle(player1Id);
    if (!status.can) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(status.reason, false)] });
    }

    const player1 = playerRepository.getPlayer(player1Id);
    if (!player1.equipped_instance_id) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não tem um personagem equipado! Use `!equipar` para selecionar um.", false)] });
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
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não pode lutar contra bots!", false)] });
    }

    if (player1Id === player2User.id) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não pode lutar contra si mesmo!", false)] });
    }

    const statusP2 = BattleEngine.canStartBattle(player2User.id);
    if (!statusP2.can) {
      const reason = statusP2.reason.replace("Você já está", `<@${player2User.id}> já está`).replace("Saia da fila", "Ele precisa sair da fila");
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(reason, false)] });
    }

    const player2 = playerRepository.getPlayer(player2User.id);
    if (!player2.equipped_instance_id) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`<@${player2User.id}> não tem um personagem equipado e não pode lutar!`, false)] });
    }

    const embed = new EmbedBuilder()
      .setTitle("⚔️ Desafio de PVP Casual")
      .setDescription(`<@${player1Id}> quer desafiar <@${player2User.id}> para um combate casual!\n\nEscolha o modo de batalha:`)
      .setColor("#0099ff")
      .addFields(
        { name: "🥊 1v1", value: "Batalha individual com o personagem equipado.", inline: true },
        { name: "⚔️ 3v3", value: "Batalha em equipe com seu Time 3v3 salvo.", inline: true }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pvp_modesel_1v1_${player1Id}_${player2User.id}`)
        .setLabel("1v1")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🥊"),
      new ButtonBuilder()
        .setCustomId(`pvp_modesel_3v3_${player1Id}_${player2User.id}`)
        .setLabel("3v3")
        .setStyle(ButtonStyle.Success)
        .setEmoji("⚔️")
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
};
