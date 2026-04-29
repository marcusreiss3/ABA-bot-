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
    this.element = data.element || null;
    this.baseHealth = data.health;
    this.baseMaxHealth = data.maxHealth;
    this.energy = data.energy;
    this.maxEnergy = data.maxEnergy;
    this.skills = data.skills || [];
    this.imageUrl = data.imageUrl || "";
    this.passives = data.passives || {};
    this.rarity = data.rarity || "EC";
    this.level = data.level || 1;
    this.generation = data.generation || 1;

    // Aplicar escalonamento de atributos
    this.applyLevelScaling();

    this.health = this.maxHealth; // Começa com vida cheia
    this.buffs = [];
    this.statusEffects = [];
    this.stacks = {};
    this.isStunned = false;
    this.stunDuration = 0;
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
      } else if (artifact.effectType === "maxEnergy") {
        if (artifact.effectUnit === "percentage") {
          this.maxEnergy += Math.floor(this.maxEnergy * artifact.effectValue);
        }
      } else if (artifact.effectType === "curse_mark") {
        // +30% dano (via multiplicador em calculateDamage), -10% HP máximo
        this.maxHealth = Math.floor(this.maxHealth * 0.90);
      } else if (artifact.effectType === "damage") {
        // dano % tratado no calculateDamage do BattleEngine
      } else if (artifact.effectType === "energyCost") {
        // tratado no BattleEngine
      }

      // Efeito secundário (ex: Knight Killer +maxEnergy, Seis Olhos é damageReduction via BattleEngine)
      if (artifact.secondaryEffect) {
        if (artifact.secondaryEffect.type === "maxEnergy") {
          const conditionOk = !artifact.conditionType ||
            (artifact.conditionType === "character" && this.id === artifact.conditionValue);
          if (conditionOk) {
            this.maxEnergy += Math.floor(this.maxEnergy * artifact.secondaryEffect.value);
          }
        }
      }
    });

    // Resetar a vida e energia para o novo máximo após aplicar os bônus dos artefatos
    this.health = this.maxHealth;
    this.energy = this.maxEnergy;
  }

  applyLevelScaling() {
    const levelBonus = this.level - 1;
    let hpPerLevel = 20;
    let atkPerLevel = 5;

    if (this.id === "naoya_zenin") {
      hpPerLevel = 22;
      atkPerLevel = 7;
    } else if (this.rarity === "EM" && this.generation === 2) {
      hpPerLevel = 30;
      atkPerLevel = 12;
    } else if (this.rarity === "AL" && this.generation === 2) {
      hpPerLevel = 26;
      atkPerLevel = 9;
    } else if (this.rarity === "AL") {
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

  takeDamage(amount, _damageType) {
    let finalDamage = amount;
    if (this.passives.physicalReduction) {
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
