const { EmbedBuilder } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");

const RANK_EMOJI = {
  "Discípulo":    "🩶",
  "Desperto":     "🥉",
  "Vanguardista": "🥈",
  "Lendário":     "🥇",
  "Divino":       "💎",
  "Supremo":      "👑",
};

function rankEmoji(rankName) {
  if (!rankName) return "🩶";
  const key = Object.keys(RANK_EMOJI).find(k => rankName.includes(k));
  return key ? RANK_EMOJI[key] : "🩶";
}

const POSITION_MEDAL = ["🥇", "🥈", "🥉"];

module.exports = {
  name: "pvp-rank",
  description: "Mostra o ranking dos jogadores com mais PA no PVP Ranqueado.",
  async execute(message) {
    const ranking = playerRepository.getPvpRanking(10);

    if (ranking.length === 0) {
      const EmbedManager = require("../services/EmbedManager");
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Ainda não há jogadores no ranking PVP.", false)] });
    }

    const embed = new EmbedBuilder()
      .setTitle("⚔️ Ranking PVP Ranqueado ⚔️")
      .setColor("#5865F2");

    let description = "";

    for (let i = 0; i < ranking.length; i++) {
      const entry = ranking[i];
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
      const emoji = rankEmoji(entry.rank);
      description += `${pos} <@${entry.player_id}> — ${emoji} ${entry.rank} · **${entry.pa} PA**\n  ${charInfo}\n\n`;
    }

    embed.setDescription(description);
    return message.reply({ embeds: [embed] });
  },
};
