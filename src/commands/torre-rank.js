const { EmbedBuilder } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const ArtifactManager = require("../services/ArtifactManager");

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
      const user = await message.client.users.fetch(rankEntry.player_id);
      const playerName = user ? user.username : `Jogador Desconhecido (${rankEntry.player_id})`;

      let charInfo = "Nenhum personagem equipado.";
      if (rankEntry.equipped_instance_id) {
        const charInstance = playerRepository.getCharacterInstance(rankEntry.equipped_instance_id);
        if (charInstance) {
          const character = CharacterManager.getCharacter(charInstance.character_id);
          if (character) {
            charInfo = `**${character.name}** (Nv. ${charInstance.level})`;

            const equippedArtifacts = [];
            for (let slot = 1; slot <= 3; slot++) {
              const artifactInstanceId = charInstance[`equipped_artifact_${slot}`];
              if (artifactInstanceId) {
                const artInstance = playerRepository.getArtifactInstance(artifactInstanceId);
                if (artInstance) {
                  const artifact = ArtifactManager.getArtifact(artInstance.artifact_id);
                  if (artifact) equippedArtifacts.push(artifact.name);
                }
              }
            }

            if (equippedArtifacts.length > 0) {
              charInfo += ` com ${equippedArtifacts.join(", ")}`;
            }
          }
        }
      }

      description += `**${i + 1}º Lugar:** <@${rankEntry.player_id}> - Andar **${rankEntry.max_floor}**\n  Personagem: ${charInfo}\n\n`;
    }

    embed.setDescription(description);

    return message.reply({ embeds: [embed] });
  },
};
