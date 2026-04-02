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
      return message.reply("Ainda não há jogadores no ranking da Torre Infinita.");
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
          const character = CharacterManager.getCharacterById(charInstance.character_id);
          charInfo = `**${character.name}** (Nv. ${charInstance.level})`;

          const equippedArtifacts = [];
          if (charInstance.equipped_artifact_1) {
            const artifact = ArtifactManager.getArtifactById(playerRepository.getArtifactInstance(charInstance.equipped_artifact_1).artifact_id);
            equippedArtifacts.push(artifact.name);
          }
          if (charInstance.equipped_artifact_2) {
            const artifact = ArtifactManager.getArtifactById(playerRepository.getArtifactInstance(charInstance.equipped_artifact_2).artifact_id);
            equippedArtifacts.push(artifact.name);
          }
          if (charInstance.equipped_artifact_3) {
            const artifact = ArtifactManager.getArtifactById(playerRepository.getArtifactInstance(charInstance.equipped_artifact_3).artifact_id);
            equippedArtifacts.push(artifact.name);
          }

          if (equippedArtifacts.length > 0) {
            charInfo += ` com ${equippedArtifacts.join(", ")}`;
          }
        }
      }

      description += `**${i + 1}º Lugar:** <@${rankEntry.player_id}> - Andar **${rankEntry.max_floor}**\n  Personagem: ${charInfo}\n\n`;
    }

    embed.setDescription(description);

    return message.reply({ embeds: [embed] });
  },
};
