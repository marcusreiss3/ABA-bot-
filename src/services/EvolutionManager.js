const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("./CharacterManager");

class EvolutionManager {
  static MAX_LEVEL = 30;

  static ITEMS = {
    "soul_stone_1": { name: "Pedra da Alma I",   xp: 50  },
    "soul_stone_2": { name: "Pedra da Alma II",  xp: 150 },
    "soul_stone_3": { name: "Pedra da Alma III", xp: 500 }
  };

  // Retorna o XP necessário para subir DO nível atual para o PRÓXIMO.
  // Curva quadrática: começa em ~77 XP (Lv1→2), termina em ~2597 XP (Lv29→30).
  // Total acumulado Lv1→30 ≈ 29.600 XP — ~6× mais difícil que antes.
  // Níveis iniciais ainda acessíveis; late game exige grind consistente.
  static getXPRequired(currentLevel) {
    if (currentLevel >= this.MAX_LEVEL) return Infinity;
    return Math.floor(60 + currentLevel * 15 + Math.pow(currentLevel, 2) * 2.5);
  }

  static addXP(instanceId, amount) {
    const instance = playerRepository.getCharacterInstance(instanceId);
    if (!instance) return null;

    let { level, xp } = instance;
    if (level >= this.MAX_LEVEL) return { leveledUp: false, level, xp };

    xp += amount;
    let leveledUp = false;

    // Verifica o XP necessário dinamicamente para cada nível
    while (level < this.MAX_LEVEL && xp >= this.getXPRequired(level)) {
      xp -= this.getXPRequired(level);
      level++;
      leveledUp = true;
    }

    if (level >= this.MAX_LEVEL) xp = 0;

    playerRepository.updateCharacterInstance(instanceId, { level, xp });
    return { leveledUp, level, xp, nextLevelXP: this.getXPRequired(level) };
  }

  static useItem(playerId, instanceId, itemId, quantity = 1) {
    const item = this.ITEMS[itemId];
    if (!item) return { success: false, message: "Item inválido." };

    const hasItem = playerRepository.removeItem(playerId, itemId, quantity);
    if (!hasItem) return { success: false, message: "Você não possui pedras suficientes." };

    const totalXP = item.xp * quantity;
    const result = this.addXP(instanceId, totalXP);

    if (!result) return { success: false, message: "Personagem não encontrado." };

    return { 
      success: true, 
      leveledUp: result.leveledUp, 
      newLevel: result.level, 
      xpGained: totalXP 
    };
  }
}

module.exports = EvolutionManager;
