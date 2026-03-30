const BattleEngine = require("../services/BattleEngine");
const playerRepository = require("../database/repositories/playerRepository");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  execute: async (message) => {
    const player1Id = message.author.id;
    const mentions = message.mentions.users.filter(u => u.id !== player1Id && !u.bot);
    
    if (mentions.size !== 3) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você precisa mencionar exatamente 3 outros jogadores para o Boss Rush!", false)] });
    }

    const team2Ids = mentions.map(u => u.id);
    const allPlayers = [player1Id, ...team2Ids];

    // Verificar se alguém já está em combate ou na fila
    for (const pid of allPlayers) {
      const status = BattleEngine.canStartBattle(pid);
      if (!status.can) {
        const reason = status.reason.replace("Você já está", `<@${pid}> já está`).replace("Saia da fila", "Precisa sair da fila");
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(reason, false)] });
      }
    }

    // Verificar se todos têm personagens equipados
    for (const pid of allPlayers) {
      const p = playerRepository.getPlayer(pid);
      if (!p.equipped_instance_id) {
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(`<@${pid}> não tem um personagem equipado!`, false)] });
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`bossrush_accept_${player1Id}_${team2Ids.join("_")}`)
        .setLabel("Aceitar Desafio")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`bossrush_refuse_${player1Id}`)
        .setLabel("Recusar")
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({
      content: `🔥 **BOSS RUSH INICIADO!** 🔥\n<@${player1Id}> desafiou <@${team2Ids[0]}>, <@${team2Ids[1]}> e <@${team2Ids[2]}> para um combate 1v3!\n\n**O Boss receberá buffs massivos de Vida, Dano e Energia!**\n\nTodos os desafiados precisam aceitar? Não, basta um aceitar em nome do time ou podemos exigir que todos aceitem. Para simplificar e garantir que todos estão prontos, vamos pedir que os 3 cliquem em aceitar.`,
      components: [row]
    });
  }
};
