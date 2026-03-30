const playerRepository = require("../database/repositories/playerRepository");
const ArtifactManager = require("../services/ArtifactManager");

module.exports = {
  name: "giveartifact",
  description: "Dá um artefato a um jogador. (Apenas para testes)",
  async execute(message, args) {
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("Você não tem permissão para usar este comando.");
    }

    let targetUserId = args[0];
    const artifactId = args[1];

    if (!targetUserId || !artifactId) {
      return message.reply("Uso: `!giveartifact <user_id> <artifact_id>`");
    }

    // Limpar menção para pegar apenas o ID numérico
    if (targetUserId.startsWith('<@') && targetUserId.endsWith('>')) {
      targetUserId = targetUserId.replace(/[<@!>]/g, '');
    }

    const player = playerRepository.getPlayer(targetUserId);
    if (!player) {
      return message.reply("Jogador não encontrado.");
    }

    const artifact = ArtifactManager.getArtifact(artifactId);
    if (!artifact) {
      return message.reply("Artefato não encontrado. IDs disponíveis: " + ArtifactManager.getAllArtifacts().join(", "));
    }

    const newArtifactInstanceId = playerRepository.addArtifact(targetUserId, artifactId);
    return message.reply(`Artefato **${artifact.name}** (ID de instância: ${newArtifactInstanceId}) dado a ${targetUserId}.`);
  },
};
