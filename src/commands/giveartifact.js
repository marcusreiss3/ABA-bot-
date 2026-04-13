const playerRepository = require("../database/repositories/playerRepository");
const ArtifactManager = require("../services/ArtifactManager");
const EmbedManager = require("../services/EmbedManager");

module.exports = {
  name: "giveartifact",
  description: "Dá um artefato a um jogador. (Apenas para testes)",
  async execute(message, args) {
    const err = (msg) => message.reply({ embeds: [EmbedManager.createStatusEmbed(msg, false)] });
    const ok  = (msg) => message.reply({ embeds: [EmbedManager.createStatusEmbed(msg, true)]  });

    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return err("Você não tem permissão para usar este comando.");
    }

    let targetUserId = args[0];
    const artifactId = args[1];

    if (!targetUserId || !artifactId) {
      return err("Uso: `!giveartifact <user_id> <artifact_id>`");
    }

    if (targetUserId.startsWith('<@') && targetUserId.endsWith('>')) {
      targetUserId = targetUserId.replace(/[<@!>]/g, '');
    }

    const player = playerRepository.getPlayer(targetUserId);
    if (!player) {
      return err("Jogador não encontrado.");
    }

    const artifact = ArtifactManager.getArtifact(artifactId);
    if (!artifact) {
      return err("Artefato não encontrado. IDs disponíveis: " + ArtifactManager.getAllArtifacts().join(", "));
    }

    const newArtifactInstanceId = playerRepository.addArtifact(targetUserId, artifactId);
    if (newArtifactInstanceId && newArtifactInstanceId.error) {
      return err(newArtifactInstanceId.error);
    }
    return ok(`Artefato **${artifact.name}** (ID de instância: \`${newArtifactInstanceId}\`) dado a <@${targetUserId}>.`);
  },
};
