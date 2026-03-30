const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const EvolutionManager = require("../services/EvolutionManager");

const ADMIN_ROLE_ID = "1485648914068537354";

module.exports = {
  execute: async (message, args) => {
    if (!message.member.roles.cache.has(ADMIN_ROLE_ID)) {
      return message.reply("Você não tem permissão para usar este comando!");
    }

    const subCommand = args[0]; // add, remove, addxp, additem
    let targetUserId = args[1];
    if (targetUserId && targetUserId.startsWith('<@') && targetUserId.endsWith('>')) {
      targetUserId = targetUserId.replace(/[<@!>]/g, '');
    }

    if (!subCommand || !targetUserId) {
      return message.reply("Uso correto: `!setchar <add|remove|addxp|additem> @usuario ...`\nExemplos:\n`!setchar add @player naruto`\n`!setchar addxp @player <instanceId> <xp>`\n`!setchar additem @player <itemId> <quantidade>`");
    }

    // Garantir que o jogador existe no banco
    playerRepository.getPlayer(targetUserId);

    if (subCommand === "add") {
      const charId = args[2] ? args[2].toLowerCase() : null;
      if (!charId || !CharacterManager.getCharacter(charId)) {
        return message.reply(`Personagem \`${charId}\` não encontrado.`);
      }
      const instanceId = playerRepository.addCharacter(targetUserId, charId);
      const charData = CharacterManager.getCharacter(charId);
      return message.reply(`✅ Personagem **${charData.name}** adicionado para <@${targetUserId}>. (ID da Instância: ${instanceId})`);
    } 
    
    else if (subCommand === "remove") {
      const instanceId = parseInt(args[2]);
      if (isNaN(instanceId)) return message.reply("ID da instância inválido.");
      
      const instance = playerRepository.getCharacterInstance(instanceId);
      if (!instance || instance.player_id !== targetUserId) return message.reply("Instância não encontrada para este usuário.");

      playerRepository.removeCharacterInstance(instanceId);
      
      const player = playerRepository.getPlayer(targetUserId);
      if (player.equipped_instance_id === instanceId) {
        playerRepository.updatePlayer(targetUserId, { equipped_instance_id: null });
      }

      return message.reply(`🗑️ Instância **${instanceId}** removida de <@${targetUserId}>.`);
    } 
    
    else if (subCommand === "addxp") {
      const instanceId = parseInt(args[2]);
      const xpAmount = parseInt(args[3]);
      if (isNaN(instanceId) || isNaN(xpAmount)) return message.reply("Uso: `!setchar addxp @player <instanceId> <xp>`");

      const result = EvolutionManager.addXP(instanceId, xpAmount);
      if (!result) return message.reply("Instância não encontrada.");

      return message.reply(`✨ Adicionado **${xpAmount} XP** à instância **${instanceId}**. Novo Nível: **${result.level}**.`);
    } 
    
    else if (subCommand === "additem") {
      const itemId = args[2];
      const quantity = parseInt(args[3]) || 1;
      if (!itemId) return message.reply("Uso: `!setchar additem @player <itemId> <quantidade>`");

      playerRepository.addItem(targetUserId, itemId, quantity);
      return message.reply(`📦 Adicionado **${quantity}x ${itemId}** para <@${targetUserId}>.`);
    } 
    
    else {
      return message.reply("Subcomando inválido! Use `add`, `remove`, `addxp` ou `additem`.");
    }
  }
};
