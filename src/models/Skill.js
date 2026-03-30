class Skill {
  /**
   * @param {Object} data
   * @param {string} data.id - Identificador único
   * @param {string} data.name - Nome
   * @param {string} data.description - Descrição
   * @param {string} data.type - 'attack', 'buff', 'reaction', 'heal'
   * @param {string} [data.damageType] - 'fisico' ou 'elemental'
   * @param {number} data.cost - Custo de energia
   * @param {number} [data.damage] - Dano base
   * @param {number} [data.cooldown] - Turnos de recarga
   * @param {Object} [data.effect] - Efeito (status, stun, etc)
   * @param {number} [data.healPercent] - Porcentagem de cura
   * @param {string} [data.gifUrl] - URL do GIF da habilidade
   */
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.damageType = data.damageType || 'fisico';
    this.cost = data.cost;
    this.damage = data.damage || 0;
    this.cooldown = data.cooldown || 0;
    this.currentCooldown = 0;
    this.effect = data.effect || null;
    this.healPercent = data.healPercent || 0;
    this.gifUrl = data.gifUrl || "";
  }

  isOnCooldown() {
    return this.currentCooldown > 0;
  }

  startCooldown() {
    this.currentCooldown = this.cooldown;
  }

  reduceCooldown() {
    if (this.currentCooldown > 0) {
      this.currentCooldown--;
    }
  }
}

module.exports = Skill;
