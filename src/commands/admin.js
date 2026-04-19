const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const EvolutionManager = require("../services/EvolutionManager");
const EmbedManager = require("../services/EmbedManager");
const BattleEngine = require("../services/BattleEngine");
const missionRepository = require("../database/repositories/missionRepository");
const tutorialCommand = require("./tutorial");

const ArtifactManager = require("../services/ArtifactManager");
const { TITLES, addProgress } = require("../database/repositories/titleRepository");
const ADMIN_ROLE_ID = "1485648914068537354";

module.exports = {
  execute: async (message, args) => {
    if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não tem permissão para usar este comando!", false)] });
    }

    const subCommand = args[0]; // add, remove, addxp, additem, addartifact, resetcooldown, resetmissions, completetitle
    
    // O subcomando resetmissions não requer um targetUserId obrigatoriamente como segundo argumento
    if (subCommand === "resetmissions") {
      const type = args[1]; // daily ou weekly
      if (type !== "daily" && type !== "weekly") {
        return message.reply({ embeds: [EmbedManager.createStatusEmbed("Uso: `!setchar resetmissions <daily/weekly>`", false)] });
      }
      missionRepository.forceRotation(type);
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`As missões **${type === "daily" ? "Diárias" : "Semanais"}** foram resetadas e trocadas para todos!`, true)] });
    }

    let targetUserId = args[1];
    if (targetUserId && targetUserId.startsWith('<@') && targetUserId.endsWith('>')) {
      targetUserId = targetUserId.replace(/[<@!>]/g, '');
    }

    if (!subCommand || !targetUserId) {
      return message.reply({
        embeds: [EmbedManager.createStatusEmbed(
          "Uso correto: `!setchar <subcomando> @usuario ...`\n\n" +
          "**Subcomandos disponíveis:**\n" +
          "`!setchar add @player <personagem>` — Adiciona um personagem\n" +
          "`!setchar remove @player <instanceId>` — Remove uma instância\n" +
          "`!setchar addxp @player <instanceId> <xp>` — Adiciona XP\n" +
          "`!setchar additem @player <itemId> <quantidade>` — Adiciona item\n" +
          "`!setchar addartifact @player <artifactId>` — Adiciona uma relíquia\n" +
          "`!setchar addzenit @player <quantidade>` — Adiciona Cristais Zenith.\n" +
          "`!setchar resetcooldown @player` — Remove todos os cooldowns do jogador\n" +
          "`!setchar resetmissions <daily/weekly>` — Troca as missões globais\n" +
          "`!setchar completetitle @player <titleId>` — Marca um título como completo\n" +
          "`!setchar resettutorial @player` — Reseta o tutorial bugado de um jogador.",
          false
        )]
      });
    }

    // Garantir que o jogador existe no banco
    playerRepository.getPlayer(targetUserId);

    // -------------------------------------------------------
    // Subcomando: add
    // -------------------------------------------------------
    if (subCommand === "add") {
      const charId = args[2] ? args[2].toLowerCase() : null;
      if (!charId || !CharacterManager.getCharacter(charId)) {
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(`Personagem \`${charId}\` não encontrado.`, false)] });
      }
      const instanceId = playerRepository.addCharacter(targetUserId, charId);
      if (instanceId && instanceId.error) return message.reply({ embeds: [EmbedManager.createStatusEmbed(instanceId.error, false)] });
      const charData = CharacterManager.getCharacter(charId);
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`Personagem **${charData.name}** adicionado para <@${targetUserId}>. (ID da Instância: ${instanceId})`, true)] });
    }

    // -------------------------------------------------------
    // Subcomando: remove
    // -------------------------------------------------------
    else if (subCommand === "remove") {
      const instanceId = parseInt(args[2]);
      if (isNaN(instanceId)) return message.reply({ embeds: [EmbedManager.createStatusEmbed("ID da instância inválido.", false)] });

      const instance = playerRepository.getCharacterInstance(instanceId);
      if (!instance || instance.player_id !== targetUserId) return message.reply({ embeds: [EmbedManager.createStatusEmbed("Instância não encontrada para este usuário.", false)] });

      playerRepository.removeCharacterInstance(instanceId);

      const player = playerRepository.getPlayer(targetUserId);
      if (player.equipped_instance_id === instanceId) {
        playerRepository.updatePlayer(targetUserId, { equipped_instance_id: null });
      }

      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`Instância **${instanceId}** removida de <@${targetUserId}>.`, true)] });
    }

    // -------------------------------------------------------
    // Subcomando: addxp
    // -------------------------------------------------------
    else if (subCommand === "addxp") {
      const instanceId = parseInt(args[2]);
      const xpAmount = parseInt(args[3]);
      if (isNaN(instanceId) || isNaN(xpAmount)) return message.reply({ embeds: [EmbedManager.createStatusEmbed("Uso: `!setchar addxp @player <instanceId> <xp>`", false)] });

      const result = EvolutionManager.addXP(instanceId, xpAmount);
      if (!result) return message.reply({ embeds: [EmbedManager.createStatusEmbed("Instância não encontrada.", false)] });

      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`Adicionado **${xpAmount} XP** à instância **${instanceId}**. Novo Nível: **${result.level}**.`, true)] });
    }

    // -------------------------------------------------------
    // Subcomando: additem
    // -------------------------------------------------------
    else if (subCommand === "additem") {
      const itemId = args[2];
      const quantity = parseInt(args[3]) || 1;
      if (!itemId) return message.reply({ embeds: [EmbedManager.createStatusEmbed("Uso: `!setchar additem @player <itemId> <quantidade>`", false)] });

      playerRepository.addItem(targetUserId, itemId, quantity);
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`Adicionado **${quantity}x ${itemId}** para <@${targetUserId}>.`, true)] });
    }

    // -------------------------------------------------------
    // Subcomando: addzenit
    // -------------------------------------------------------
    else if (subCommand === "addzenit" || subCommand === "addzenith") {
      const amount = parseInt(args[2]);
      if (isNaN(amount) || amount <= 0) return message.reply({ embeds: [EmbedManager.createStatusEmbed("Uso: `!setchar addzenit @player <quantidade>`", false)] });

      const player = playerRepository.getPlayer(targetUserId);
      const current = player.zenith_fragments || 0;
      playerRepository.updatePlayer(targetUserId, { zenith_fragments: current + amount });
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`💠 Adicionado **${amount} Cristais Zenith** para <@${targetUserId}>. Total: **${current + amount}**.`, true)] });
    }

    // -------------------------------------------------------
    // Subcomando: addartifact
    // -------------------------------------------------------
    else if (subCommand === "addartifact" || subCommand === "addart") {
      const artifactId = args[2] ? args[2].toLowerCase() : null;
      if (!artifactId) return message.reply({ embeds: [EmbedManager.createStatusEmbed("Uso: `!setchar addartifact @player <artifactId>`", false)] });

      const artData = ArtifactManager.getArtifact(artifactId, {});
      if (!artData || artData.name === "Desconhecido") {
        const allIds = ArtifactManager.getAllArtifacts().join(", ");
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(`Relíquia \`${artifactId}\` não encontrada.\n\n**IDs válidos:** ${allIds}`, false)] });
      }

      const result = playerRepository.addArtifact(targetUserId, artifactId);
      if (result && result.error) return message.reply({ embeds: [EmbedManager.createStatusEmbed(result.error, false)] });
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`${artData.emoji} Relíquia **${artData.name}** adicionada para <@${targetUserId}>!`, true)] });
    }

    // -------------------------------------------------------
    // Subcomando: resetcooldown
    // Remove TODOS os cooldowns e bloqueios do jogador:
    //   • Cooldown da Torre Infinita
    //   • Cooldown global do Modo Desafio (todas as dificuldades)
    //   • Progresso individual de desafio (recompensa)
    //   • Fila ranqueada
    //   • Batalha ativa em memória
    // -------------------------------------------------------
    else if (subCommand === "resetcooldown" || subCommand === "rc") {
      const resetLog = [];

      // 1. Cooldown da Torre Infinita
      playerRepository.resetTowerCooldown(targetUserId);
      resetLog.push("🗼 Cooldown da **Torre Infinita** removido");

      // 2. Cooldown global do Modo Desafio (todas as dificuldades)
      playerRepository.resetAllChallengeCooldowns();
      resetLog.push("⚔️ Cooldown global do **Modo Desafio** removido (Fácil, Médio e Difícil)");

      // 3. Progresso individual de desafio (para que o jogador possa receber recompensa novamente)
      playerRepository.resetPlayerChallengeProgress(targetUserId);
      resetLog.push("📋 Progresso individual de **Desafio** resetado");

      // 4. Fila ranqueada
      if (playerRepository.isInQueue(targetUserId)) {
        playerRepository.removeFromQueue(targetUserId);
        resetLog.push("🏆 Removido da **Fila Ranqueada**");
      }

      // 5. Batalha ativa em memória (Torre, PVP, PVE, Boss Rush, etc.)
      let battleRemoved = false;
      for (const [battleId, battle] of BattleEngine.activeBattles.entries()) {
        const isInBattle =
          battle.player1Id === targetUserId ||
          battle.player2Id === targetUserId ||
          (battle.partyMembers && battle.partyMembers.includes(targetUserId)) ||
          (battle.team2 && battle.team2.includes(targetUserId));

        if (isInBattle) {
          battle.state = "finished";
          BattleEngine.activeBattles.delete(battleId);
          battleRemoved = true;
        }
      }
      if (battleRemoved) {
        resetLog.push("⚡ **Batalha ativa** encerrada e removida da memória");
      }

      const description =
        `Todos os cooldowns e bloqueios de <@${targetUserId}> foram removidos com sucesso!\n\n` +
        resetLog.map(line => `• ${line}`).join("\n");

      return message.reply({
        embeds: [EmbedManager.createStatusEmbed(description, true)]
      });
    }

    // -------------------------------------------------------
    // Subcomando: completetitle
    // -------------------------------------------------------
    else if (subCommand === "completetitle" || subCommand === "ct") {
      const titleId = args[2] ? args[2].toLowerCase() : null;
      if (!titleId) {
        const ids = Object.keys(TITLES).join(", ");
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(`Uso: \`!setchar completetitle @player <titleId>\`\n\n**IDs válidos:** ${ids}`, false)] });
      }
      const title = TITLES[titleId];
      if (!title) {
        const ids = Object.keys(TITLES).join(", ");
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(`Título \`${titleId}\` não encontrado.\n\n**IDs válidos:** ${ids}`, false)] });
      }
      if (title.usesTowerRecord) {
        // Torre usa tower_records diretamente — inserir/atualizar
        const db = require("../database/db");
        db.prepare(`INSERT INTO tower_records (player_id, max_floor) VALUES (?, ?) ON CONFLICT(player_id) DO UPDATE SET max_floor = ?`).run(targetUserId, title.goal, title.goal);
      } else {
        addProgress(targetUserId, titleId, title.goal);
      }
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`${title.emoji} Título **${title.name}** marcado como completo para <@${targetUserId}>.\n\nAgora use \`!titulos\` para testar o botão de resgatar.`, true)] });
    }

    // -------------------------------------------------------
    // Subcomando: resettutorial
    // -------------------------------------------------------
    else if (subCommand === "resettutorial" || subCommand === "rt") {
      const result = await tutorialCommand.adminResetTutorial(message.client, targetUserId);
      if (!result.ok) {
        return message.reply({ embeds: [EmbedManager.createStatusEmbed(result.reason, false)] });
      }
      const detail = result.channelDeleted ? "Canal de tutorial deletado." : "Canal já não existia.";
      return message.reply({ embeds: [EmbedManager.createStatusEmbed(`✅ Tutorial de <@${targetUserId}> resetado. ${detail} O jogador pode iniciar o tutorial novamente.`, true)] });
    }

    // -------------------------------------------------------
    // Subcomando inválido
    // -------------------------------------------------------
    else {
      return message.reply({
        embeds: [EmbedManager.createStatusEmbed(
          "Subcomando inválido! Use `add`, `remove`, `addxp`, `additem`, `resetcooldown` ou `resettutorial`.",
          false
        )]
      });
    }
  }
};
