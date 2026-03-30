class Character {
  /**
   * @param {Object} data
   * @param {string} data.id - Identificador único do tipo de personagem
   * @param {number} [data.instanceId] - ID único da instância no banco de dados
   * @param {string} data.name - Nome visível
   * @param {string} data.anime - Anime de origem
   * @param {number} data.health - Vida base
   * @param {number} data.maxHealth - Vida máxima base
   * @param {number} data.energy - Energia atual
   * @param {number} data.maxEnergy - Energia máxima
   * @param {Array<import('./Skill')>} data.skills - Habilidades
   * @param {string} [data.imageUrl] - URL da imagem/GIF
   * @param {Object} [data.passives] - Habilidades passivas
   * @param {string} [data.rarity] - Raridade (EC, AL, EM)
   * @param {number} [data.level] - Nível atual (1-30)
   */
  constructor(data) {
    this.id = data.id;
    this.instanceId = data.instanceId || null;
    this.name = data.name;
    this.anime = data.anime;
    this.baseHealth = data.health;
    this.baseMaxHealth = data.maxHealth;
    this.energy = data.energy;
    this.maxEnergy = data.maxEnergy;
    this.skills = data.skills || [];
    this.imageUrl = data.imageUrl || "";
    this.passives = data.passives || {};
    this.rarity = data.rarity || "EC";
    this.level = data.level || 1;
    
    // Aplicar escalonamento de atributos
    this.applyLevelScaling();

    this.health = this.maxHealth; // Começa com vida cheia
    this.buffs = [];
    this.statusEffects = [];
    this.stacks = {};
    this.isStunned = false;
    this.equippedArtifacts = data.equippedArtifacts || [];
  }

  applyArtifactEffects() {
    this.equippedArtifacts.forEach(artifact => {
      if (artifact.conditionType) {
        if (artifact.conditionType === "anime" && this.anime !== artifact.conditionValue) {
          return; // Condição de anime não atendida
        }
        if (artifact.conditionType === "character" && this.id !== artifact.conditionValue) {
          return; // Condição de personagem não atendida
        }
      }

      if (artifact.effectType === "maxHealth") {
        if (artifact.effectUnit === "percentage") {
          this.maxHealth += Math.floor(this.baseMaxHealth * artifact.effectValue);
        } else if (artifact.effectUnit === "flat") {
          this.maxHealth += artifact.effectValue;
        }
      } else if (artifact.effectType === "damage") {
        if (artifact.effectUnit === "percentage") {
          this.bonusDamage += Math.floor((this.level * 10) * artifact.effectValue);
        } else if (artifact.effectUnit === "flat") {
          this.bonusDamage += artifact.effectValue;
        }
      } else if (artifact.effectType === "energyCost") {
        // Este efeito será aplicado no BattleEngine, mas o Character precisa saber que tem
        // Por enquanto, apenas registramos que o artefato está equipado
      }
      // Adicionar outros tipos de efeito aqui
    });
    
    // ✅ Correção: Resetar a vida para o novo máximo após aplicar os bônus dos artefatos
    this.health = this.maxHealth;
  }

  applyLevelScaling() {
    const levelBonus = this.level - 1;
    let hpPerLevel = 20;
    let atkPerLevel = 5;

    if (this.rarity === "AL") {
      hpPerLevel = 24;
      atkPerLevel = 8;
    } else if (this.rarity === "EM") {
      hpPerLevel = 27;
      atkPerLevel = 10;
    }

    this.maxHealth = this.baseMaxHealth + (levelBonus * hpPerLevel);
    this.bonusDamage = levelBonus * atkPerLevel;
  }

  get activeSkills() {
    return this.skills.filter(s => s.type !== 'reaction');
  }

  get reactions() {
    return this.skills.filter(s => s.type === 'reaction');
  }

  isAlive() {
    return this.health > 0;
  }

  takeDamage(amount, damageType = 'fisico') {
    let finalDamage = amount;
    
    if (damageType === 'fisico' && this.passives.physicalReduction) {
      finalDamage *= (1 - this.passives.physicalReduction);
    }

    this.health = Math.max(0, this.health - Math.floor(finalDamage));
    return Math.floor(finalDamage);
  }

  heal(percent) {
    const amount = Math.floor(this.maxHealth * (percent / 100));
    this.health = Math.min(this.maxHealth, this.health + amount);
    return amount;
  }

  consumeEnergy(amount) {
    this.energy = Math.max(0, this.energy - amount);
  }

  recoverEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  addBuff(buff) {
    this.buffs.push(buff);
  }

  addStatusEffect(effect) {
    this.statusEffects.push(effect);
  }

  addStack(key, max) {
    if (!this.stacks[key]) this.stacks[key] = 0;
    if (this.stacks[key] < max) {
      this.stacks[key]++;
    }
  }

  resetStacks(key) {
    this.stacks[key] = 0;
  }

  updateCooldowns() {
    this.skills.forEach(s => s.reduceCooldown());
  }

  updateBuffsAndStatus() {
    this.buffs = this.buffs.map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);
    this.statusEffects = this.statusEffects.map(s => ({ ...s, duration: s.duration - 1 })).filter(s => s.duration > 0);
  }
}

module.exports = Character;
