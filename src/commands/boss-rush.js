const BattleEngine = require("../services/BattleEngine");
const playerRepository = require("../database/repositories/playerRepository");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  execute: async (message) => {
    const player1Id = message.author.id;
    const mentions = message.mentions.users.filter(u => u.id !== player1Id && !u.bot);

    if (mentions.size !== 3) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você precisa mencionar exatamente **3** outros jogadores para o Boss Rush!", false)] });
    }

    const team2Ids = mentions.map(u => u.id);
    const allPlayers = [player1Id, ...team2Ids];

    for (const pid of allPlayers) {
      const status = BattleEngine.canStartBattle(pid);
      if (!status.can) {
        const reason = status.reason.replace("Você já está", `<@${pid}> já está`).replace("Saia da fila", "Precisa sair da fila");
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(reason, false)] });
      }
    }

    for (const pid of allPlayers) {
      const p = playerRepository.getPlayer(pid);
      if (!p.equipped_instance_id) {
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(`<@${pid}> não tem um personagem equipado!`, false)] });
      }
    }

    const bossName = message.member?.displayName || message.author.username;
    const teamMembers = mentions.map(u => {
      const member = message.guild?.members?.cache?.get(u.id);
      return member?.displayName || u.username;
    });

    const embed = new EmbedBuilder()
      .setTitle("🔥 Boss Rush — Desafio 1v3")
      .setDescription(
        `**${bossName}** está convocando um time de desafiantes para um combate épico!\n\n` +
        `> 👑 **Boss:** ${bossName}\n` +
        `> ⚔️ **Time Desafiante:** ${teamMembers.join(", ")}\n\n` +
        `O Boss receberá **buffs massivos** de Vida, Dano e Energia.\n` +
        `Um dos membros do time deve aceitar para a batalha começar.`
      )
      .setColor("#cc2200")
      .setFooter({ text: "Boss Rush • Modo 1v3 • Um membro do time aceita pelo grupo" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`bossrush_accept_${player1Id}_${team2Ids.join("_")}`)
        .setLabel("⚔️ Aceitar Desafio")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`bossrush_refuse_${player1Id}`)
        .setLabel("Recusar")
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
};
