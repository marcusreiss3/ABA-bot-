const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const EvolutionManager = require("../services/EvolutionManager");
const EmbedManager = require("../services/EmbedManager");
const BattleEngine = require("../services/BattleEngine");

const ADMIN_ROLE_ID = "1485648914068537354";

module.exports = {
  execute: async (message, args) => {
    if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
      return message.reply({ embeds: [EmbedManager.createStatusEmbed("Você não tem permissão para usar este comando!", false)] });
    }

    const subCommand = args[0]; // add, remove, addxp, additem, resetcooldown
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
          "`!setchar resetcooldown @player` — Remove todos os cooldowns do jogador",
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
    // Subcomando inválido
    // -------------------------------------------------------
    else {
      return message.reply({
        embeds: [EmbedManager.createStatusEmbed(
          "Subcomando inválido! Use `add`, `remove`, `addxp`, `additem` ou `resetcooldown`.",
          false
        )]
      });
    }
  }
};
