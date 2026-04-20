"use strict";
const { EmbedBuilder } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const RankManager = require("../services/RankManager");

const POSITION_MEDAL = ["🥇", "🥈", "🥉"];

module.exports = {
  name: "pvp-rank",
  description: "Mostra o ranking dos jogadores com mais PA no PVP Ranqueado.",
  async execute(message) {
    // Busca os jogadores que já jogaram ranqueado e ordena corretamente:
    // rank mais alto primeiro, depois maior PA dentro do mesmo rank
    const raw = playerRepository.getPvpRanking(100);

    const sorted = raw
      .filter(e => e.rank)
      .sort((a, b) => {
        const idxA = RankManager.getRankIndex(a.rank);
        const idxB = RankManager.getRankIndex(b.rank);
        if (idxB !== idxA) return idxB - idxA;
        return b.pa - a.pa;
      })
      .slice(0, 10);

    if (sorted.length === 0) {
      const EmbedManager = require("../services/EmbedManager");
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Ainda não há jogadores no ranking PVP.", false)] });
    }

    const embed = new EmbedBuilder()
      .setTitle("⚔️ Ranking PVP Ranqueado ⚔️")
      .setColor("#5865F2");

    let description = "";

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      let username = `Jogador (${entry.player_id})`;
      try {
        const user = await message.client.users.fetch(entry.player_id).catch(() => null);
        if (user) username = user.username;
      } catch (_) {}

      let charInfo = "Nenhum personagem equipado";
      if (entry.equipped_instance_id) {
        const inst = playerRepository.getCharacterInstance(entry.equipped_instance_id);
        if (inst) {
          const char = CharacterManager.getCharacter(inst.character_id);
          if (char) charInfo = `**${char.name}** (Nv. ${inst.level})`;
        }
      }

      const pos = i < 3 ? POSITION_MEDAL[i] : `**${i + 1}º**`;
      description += `${pos} <@${entry.player_id}> — ${entry.rank} · **${entry.pa} PA**\n  ${charInfo}\n\n`;
    }

    embed.setDescription(description);
    return message.reply({ embeds: [embed] });
  },
};
