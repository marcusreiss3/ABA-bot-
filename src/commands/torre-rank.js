const { EmbedBuilder } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const ArtifactManager = require("../services/ArtifactManager");

function getCharLine(instanceId) {
  if (!instanceId) return null;
  const inst = playerRepository.getCharacterInstance(instanceId);
  if (!inst) return null;
  const character = CharacterManager.getCharacter(inst.character_id);
  if (!character) return null;

  let line = `**${character.name}** Nv.${inst.level}`;

  const artifactEmojis = [];
  for (let slot = 1; slot <= 3; slot++) {
    const artInstId = inst[`equipped_artifact_${slot}`];
    if (artInstId) {
      const artInst = playerRepository.getArtifactInstance(artInstId);
      if (artInst) {
        const artifact = ArtifactManager.getArtifact(artInst.artifact_id);
        if (artifact?.emoji) artifactEmojis.push(artifact.emoji);
      }
    }
  }

  if (artifactEmojis.length > 0) line += ` ${artifactEmojis.join("")}`;
  return line;
}

module.exports = {
  name: "torre-rank",
  description: "Mostra o ranking dos jogadores que foram mais longe na Torre Infinita.",
  async execute(message, args) {
    const ranking = playerRepository.getTowerRanking();

    if (ranking.length === 0) {
      const EmbedManager = require("../services/EmbedManager");
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Ainda não há jogadores no ranking da Torre Infinita.", false)] });
    }

    const embed = new EmbedBuilder()
      .setTitle("🏆 Ranking da Torre Infinita 🏆")
      .setColor("#FFD700");

    let description = "";

    for (let i = 0; i < ranking.length; i++) {
      const rankEntry = ranking[i];
      const user = await message.client.users.fetch(rankEntry.player_id).catch(() => null);
      const playerName = user ? user.username : `Jogador (${rankEntry.player_id})`;

      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `**${i + 1}º**`;

      const teamLines = [
        getCharLine(rankEntry.team_char_1),
        getCharLine(rankEntry.team_char_2),
        getCharLine(rankEntry.team_char_3),
      ].filter(Boolean);

      let teamText;
      if (teamLines.length > 0) {
        teamText = teamLines.map(l => `  ↳ ${l}`).join("\n");
      } else {
        const fallback = getCharLine(rankEntry.equipped_instance_id);
        teamText = fallback ? `  ↳ ${fallback}` : "  ↳ Sem informações do time";
      }

      description += `${medal} <@${rankEntry.player_id}> — Andar **${rankEntry.max_floor}**\n${teamText}\n\n`;
    }

    embed.setDescription(description);

    return message.reply({ embeds: [embed] });
  },
};
