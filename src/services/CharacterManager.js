const Character = require("../models/Character");
const Skill = require("../models/Skill");
const ArtifactManager = require("./ArtifactManager");
const playerRepository = require("../database/repositories/playerRepository");
const storyConfig = require("../config/storyConfig.js");
const towerConfig = require("../config/towerConfig.js");

class CharacterManager {
  static getCharacter(characterId, instanceData = {}) {
    let char = null;

    // --- Personagens Jogáveis ---
    if (characterId === "naruto") {
      char = new Character({
        id: "naruto",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Naruto (Clássico)",
        anime: "naruto",
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/XZHp3smS/naruto1.png",
        skills: [
          new Skill({ id: "punch", name: "Soco", description: "Um soco básico.", type: "attack", cost: 5, damage: 10, damageType: 'fisico' }),
          new Skill({ id: "kage_bunshin", name: "Kage Bunshin", description: "Cria clones (stack até 3x).", type: "buff", cost: 15, cooldown: 1 }),
          new Skill({ id: "rasengan", name: "Rasengan", description: "Esfera de energia que **ATORDOA**.", type: "attack", cost: 35, damage: 40, damageType: 'elemental', cooldown: 3, effect: { type: "stun", duration: 1 } }),
          new Skill({ id: "kyuubi_chakra", name: "Chakra da Kyuubi", description: "Recupera 20% da vida total.", type: "heal", cost: 40, healPercent: 20, cooldown: 4 }),
          new Skill({ id: "substitution", name: "Substituição", description: "Reduz o dano recebido em 50%.", type: "reaction", cost: 15, cooldown: 1, effect: { type: "damage_reduction", value: 0.5 } })
        ]
      });
    }

    if (characterId === "goku") {
      char = new Character({
        id: "goku",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Goku (Base)",
        anime: "dragonball",
        health: 120,
        maxHealth: 120,
        energy: 80,
        maxEnergy: 80,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/KcTWLDTB/20260323-1245-Image-Generation-remix-01kmdnwvrmeycbthdrbekys330.png",
        skills: [
          new Skill({ id: "kick", name: "Chute", description: "Um chute rápido.", type: "attack", cost: 8, damage: 12, damageType: 'fisico' }),
          new Skill({ id: "kaioken", name: "Kaioken", description: "Dano +50%, mas sofre 10% de auto-dano.", type: "buff", cost: 20, cooldown: 3 }),
          new Skill({ id: "kamehameha", name: "Kamehameha", description: "Rajada de energia que causa **QUEIMADURA**.", type: "attack", cost: 40, damage: 45, damageType: 'elemental', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.03 } }),
          new Skill({ id: "solar_flare", name: "Solar Flare", description: "Cega o oponente (**ATORDOAMENTO**).", type: "attack", cost: 20, damage: 5, damageType: 'elemental', cooldown: 4, effect: { type: "stun", duration: 1 } }),
          new Skill({ id: "instant_transmission", name: "Teletransporte", description: "Esquiva completamente do ataque.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.0 } })
        ]
      });
    }

    if (characterId === "itadori") {
      char = new Character({
        id: "itadori",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Itadori Yuji",
        anime: "jujutsukaisen",
        health: 110,
        maxHealth: 110,
        energy: 90,
        maxEnergy: 90,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/dwcbn0Vv/itadori1.png",
        skills: [
          new Skill({ id: "divergent_fist", name: "Punho Divergente", description: "Dano físico duplo com delay.", type: "attack", cost: 10, damage: 18, damageType: 'fisico' }),
          new Skill({ id: "manji_kick", name: "Chute Manji", description: "Chute acrobático rápido.", type: "attack", cost: 12, damage: 15, damageType: 'fisico' }),
          new Skill({ id: "black_flash", name: "Black Flash", description: "30% de chance de causar 3x de dano.", type: "attack", cost: 30, damage: 25, damageType: 'fisico', cooldown: 2 }),
          new Skill({ id: "slaughter_demon", name: "Slaughter Demon", description: "Ataque com adaga que causa **SANGRAMENTO**.", type: "attack", cost: 20, damage: 20, damageType: 'fisico', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.05 } }),
          new Skill({ id: "cursed_guard", name: "Guarda Amaldiçoada", description: "Protege com energia, reduzindo 70% do dano.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.3 } })
        ]
      });
    }

    if (characterId === "luffy") {
      char = new Character({
        id: "luffy",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Monkey D. Luffy",
        anime: "onepiece",
        health: 130,
        maxHealth: 130,
        energy: 70,
        maxEnergy: 70,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/vxm9dv4V/20260323-1249-Image-Generation-remix-01kmdp30hqf95a44yqpsrdr2mj.png",
        passives: { physicalReduction: 0.3 },
        skills: [
          new Skill({ id: "pistol", name: "Gomu Gomu no Pistol", description: "Soco de longa distância.", type: "attack", cost: 8, damage: 15, damageType: 'fisico' }),
          new Skill({ id: "gatling", name: "Gomu Gomu no Gatling", description: "Sequência de socos que causa **SANGRAMENTO**.", type: "attack", cost: 25, damage: 30, damageType: 'fisico', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.05 } }),
          new Skill({ id: "red_hawk", name: "Red Hawk", description: "Ataque flamejante que causa **QUEIMADURA**.", type: "attack", cost: 40, damage: 40, damageType: 'elemental', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.03 } }),
          new Skill({ id: "meat_break", name: "Pausa para Carne", description: "Luffy come carne e recupera 25% de HP.", type: "heal", cost: 35, healPercent: 25, cooldown: 5 }),
          new Skill({ id: "rubber_dodge", name: "Esquiva de Borracha", description: "Esquiva-se esticando o corpo, reduz 80% do dano.", type: "reaction", cost: 25, cooldown: 2, effect: { type: "damage_reduction", value: 0.2 } })
        ]
      });
    }

    // --- Carregamento Dinâmico de Bosses do Modo História ---
    // --- Bosses do Modo Desafio ---
    if (!char) {
      const challengeConfig = require("../config/challengeConfig.js");
      for (const diffKey in challengeConfig.difficulties) {
        const diff = challengeConfig.difficulties[diffKey];
        const bossData = diff.bosses.find(b => b.id === characterId);
        if (bossData) {
          char = new Character({
            id: bossData.id,
            name: bossData.name,
            anime: bossData.anime,
            health: bossData.health,
            maxHealth: bossData.health,
            energy: bossData.energy,
            maxEnergy: bossData.energy,
            rarity: "BOSS",
            level: bossData.level,
            imageUrl: bossData.imageUrl,
            skills: this.generateChallengeBossSkills(bossData.id)
          });
          break;
        }
      }
    }

    if (!char) {
      for (const world of storyConfig.worlds) {
        const bossData = world.bosses.find(b => b.id === characterId);
        if (bossData) {
          char = new Character({
            id: bossData.id,
            name: bossData.name,
            anime: world.id,
            health: bossData.health,
            maxHealth: bossData.health,
            energy: bossData.energy,
            maxEnergy: bossData.energy,
            rarity: "BOSS",
            level: bossData.level,
            imageUrl: bossData.imageUrl,
            skills: this.generateBossSkills(bossData.id, world.id)
          });
          break;
        }
      }
    }

    // --- Bosses da Torre Infinita ---
    if (!char) {
      for (const floor of towerConfig.floors) {
        if (floor.boss.id === characterId) {
          const bossData = floor.boss;
          char = new Character({
            id: bossData.id,
            name: bossData.name,
            anime: bossData.anime,
            health: bossData.health,
            maxHealth: bossData.health,
            energy: bossData.energy,
            maxEnergy: bossData.energy,
            rarity: "BOSS",
            level: bossData.level,
            imageUrl: bossData.imageUrl,
            skills: bossData.skills.map(s => new Skill(s))
          });
          break;
        }
      }
    }

    if (char) {
      // Aplicar bônus de nível se não for boss
      if (char.rarity !== "BOSS") {
        const levelMult = 1 + (char.level - 1) * 0.1;
        char.maxHealth = Math.floor(char.maxHealth * levelMult);
        char.health = char.maxHealth;
        char.maxEnergy = Math.floor(char.maxEnergy * (1 + (char.level - 1) * 0.05));
        char.energy = char.maxEnergy;
        char.skills.forEach(skill => {
          if (skill.damage) skill.damage = Math.floor(skill.damage * levelMult);
        });
      }

      // Carregar artefatos equipados
      const equippedArtifacts = [];
      for (let i = 1; i <= 3; i++) {
        const artifactInstanceId = instanceData[`equipped_artifact_${i}`];
        if (artifactInstanceId) {
          const artifactInstance = playerRepository.getArtifactInstance(artifactInstanceId);
          if (artifactInstance) {
            const artifact = ArtifactManager.getArtifact(artifactInstance.artifact_id, artifactInstance);
            if (artifact) equippedArtifacts.push(artifact);
          }
        }
      }
      char.equippedArtifacts = equippedArtifacts;
      char.applyArtifactEffects();

      if (char.bonusDamage > 0) {
        char.skills.forEach(skill => {
          if (skill.type === "attack" && skill.damage > 0) {
            skill.damage += char.bonusDamage;
          }
        });
      }
    }

    return char;
  }

  static generateBossSkills(bossId, worldId) {
    const baseSkills = [
      new Skill({ id: "boss_atk_1", name: "Ataque Rápido", description: "Um golpe veloz.", type: "attack", cost: 15, damage: 30, damageType: 'fisico' }),
      new Skill({ id: "boss_atk_2", name: "Explosão de Energia", description: "Dano em área.", type: "attack", cost: 35, damage: 60, damageType: 'elemental' }),
      new Skill({ id: "boss_def", name: "Guarda do Boss", description: "Reduz 70% do dano.", type: "reaction", cost: 20, effect: { type: "damage_reduction", value: 0.3 } })
    ];

    if (bossId === "raditz") {
      baseSkills[0].name = "Double Sunday";
      baseSkills[1].name = "Shining Friday";
      baseSkills.push(new Skill({ id: "raditz_tail", name: "Golpe de Cauda", description: "Paralisa o oponente (**ATORDOA**).", type: "attack", cost: 25, damage: 20, damageType: 'fisico', cooldown: 2, effect: { type: "stun", duration: 1 } }));
    } else if (bossId === "vegeta") {
      baseSkills[0].name = "Galick Gun";
      baseSkills[1].name = "Big Bang Attack";
      baseSkills.push(new Skill({ id: "vegeta_pride", name: "Orgulho Saiyajin", description: "Aumenta o dano em 50%.", type: "buff", cost: 30, cooldown: 3, effect: { multiplier: 1.5, duration: 2 } }));
    } else if (bossId === "freeza") {
      baseSkills[0].name = "Death Beam";
      baseSkills[1].name = "Death Ball";
      baseSkills.push(new Skill({ id: "freeza_tele", name: "Teletransporte Cruel", description: "Esquiva-se completamente do ataque.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.0 } }));
    } else if (bossId === "cell") {
      baseSkills[0].name = "Kamehameha Perfeito";
      baseSkills[1].name = "Solar Flare";
      baseSkills.push(new Skill({ id: "cell_regen", name: "Regeneração Celular", description: "Recupera 20% da vida máxima.", type: "heal", cost: 40, healPercent: 20, cooldown: 4 }));
    } else if (bossId === "majin_boo") {
      baseSkills[0].name = "Feixe de Chocolate";
      baseSkills[1].name = "Explosão Majin";
      baseSkills.push(new Skill({ id: "boo_regen", name: "Corpo de Chiclete", description: "Reduz o dano recebido em 90%.", type: "reaction", cost: 25, cooldown: 2, effect: { type: "damage_reduction", value: 0.1 } }));
    } else if (bossId === "orochimaru") {
      baseSkills[0].name = "Kusanagi";
      baseSkills[1].name = "Mãos de Serpente";
      baseSkills.push(new Skill({ id: "oro_poison", name: "Veneno de Cobra", description: "Causa **SANGRAMENTO** contínuo.", type: "attack", cost: 25, damage: 15, damageType: 'fisico', cooldown: 2, effect: { type: "bleed", duration: 3, value: 0.08 } }));
    } else if (bossId === "gaara") {
      baseSkills[0].name = "Caixão de Areia";
      baseSkills[1].name = "Funeral de Areia";
      baseSkills.push(new Skill({ id: "gaara_shield", name: "Escudo de Areia", description: "Defesa absoluta (95% redução).", type: "reaction", cost: 30, cooldown: 3, effect: { type: "damage_reduction", value: 0.05 } }));
    } else if (bossId === "itachi") {
      baseSkills[0].name = "Amaterasu";
      baseSkills[1].name = "Tsukuyomi";
      baseSkills.push(new Skill({ id: "itachi_crow", name: "Genjutsu de Corvos", description: "Oponente fica **ATORDOADO**.", type: "attack", cost: 40, damage: 30, damageType: 'elemental', cooldown: 3, effect: { type: "stun", duration: 1 } }));
    } else if (bossId === "pain") {
      baseSkills[0].name = "Shinra Tensei";
      baseSkills[1].name = "Bansho Ten'in";
      baseSkills.push(new Skill({ id: "pain_absorb", name: "Absorção de Chakra", description: "Recupera 50 de energia.", type: "buff", cost: 0, cooldown: 3 }));
    } else if (bossId === "madara") {
      baseSkills[0].name = "Katon: Goka Mekkyaku";
      baseSkills[1].name = "Susano'o Slash";
      baseSkills.push(new Skill({ id: "madara_meteor", name: "Tengai Shinsei", description: "Dano massivo e **QUEIMADURA**.", type: "attack", cost: 60, damage: 100, damageType: 'elemental', cooldown: 5, effect: { type: "burn", duration: 3, value: 0.1 } }));
    } else if (bossId === "f_titan") {
      baseSkills[0].name = "Soco Endurecido";
      baseSkills[1].name = "Grito de Chamada";
      baseSkills.push(new Skill({ id: "titan_harden", name: "Endurecimento Cristalino", description: "Reduz 80% do dano.", type: "reaction", cost: 25, cooldown: 2, effect: { type: "damage_reduction", value: 0.2 } }));
    } else if (bossId === "colossal_titan") {
      baseSkills[0].name = "Pisada Gigante";
      baseSkills[1].name = "Vapor Escaldante";
      baseSkills.push(new Skill({ id: "titan_steam", name: "Explosão de Vapor", description: "Causa **QUEIMADURA** em todos.", type: "attack", cost: 45, damage: 50, damageType: 'elemental', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.05 } }));
    }

    return baseSkills;
  }

  static generateChallengeBossSkills(bossId) {
    const baseSkills = [
      new Skill({ id: "boss_atk_1", name: "Ataque Rápido", description: "Um golpe veloz.", type: "attack", cost: 15, damage: 30, damageType: 'fisico' }),
      new Skill({ id: "boss_atk_2", name: "Explosão de Energia", description: "Dano em área.", type: "attack", cost: 35, damage: 60, damageType: 'elemental' }),
      new Skill({ id: "boss_def", name: "Guarda do Boss", description: "Reduz 70% do dano.", type: "reaction", cost: 20, effect: { type: "damage_reduction", value: 0.3 } })
    ];

    if (bossId === "buggy") {
      baseSkills[0].name = "Bara Bara Ho";
      baseSkills[1].name = "Bara Bara Festival";
      baseSkills.push(new Skill({ id: "buggy_split", name: "Separação", description: "Esquiva-se completamente do ataque.", type: "reaction", cost: 25, cooldown: 2, effect: { type: "damage_reduction", value: 0.0 } }));
    } else if (bossId === "haruta") {
      baseSkills[0].name = "Corte de Espada";
      baseSkills[1].name = "Técnica Amaldiçoada";
      baseSkills.push(new Skill({ id: "haruta_luck", name: "Sorte Milagrosa", description: "Reduz o dano recebido em 90%.", type: "reaction", cost: 30, cooldown: 3, effect: { type: "damage_reduction", value: 0.1 } }));
    } else if (bossId === "neferpitou") {
      baseSkills[0].name = "Terpsichora";
      baseSkills[1].name = "Garra de Gato";
      baseSkills.push(new Skill({ id: "pitou_jump", name: "Salto Predador", description: "Ataca e **ATORDOA** o oponente.", type: "attack", cost: 40, damage: 50, damageType: 'fisico', cooldown: 3, effect: { type: "stun", duration: 1 } }));
    } else if (bossId === "rui") {
      baseSkills[0].name = "Fios de Aço";
      baseSkills[1].name = "Prisão de Fios";
      baseSkills.push(new Skill({ id: "rui_blood", name: "Arte de Sangue", description: "Causa **SANGRAMENTO** severo.", type: "attack", cost: 35, damage: 40, damageType: 'elemental', cooldown: 2, effect: { type: "bleed", duration: 3, value: 0.1 } }));
    } else if (bossId === "esdeath") {
      baseSkills[0].name = "Weissschnabel";
      baseSkills[1].name = "Grauphorn";
      baseSkills.push(new Skill({ id: "esdeath_freeze", name: "Mahapadma", description: "Congela o tempo (**ATORDOA** por 2 turnos).", type: "attack", cost: 80, damage: 20, damageType: 'elemental', cooldown: 6, effect: { type: "stun", duration: 2 } }));
    } else if (bossId === "dabi") {
      baseSkills[0].name = "Chamas Azuis";
      baseSkills[1].name = "Prominence Burn";
      baseSkills.push(new Skill({ id: "dabi_burn", name: "Cremação", description: "Causa **QUEIMADURA** massiva.", type: "attack", cost: 50, damage: 70, damageType: 'elemental', cooldown: 3, effect: { type: "burn", duration: 3, value: 0.15 } }));
    }

    return baseSkills;
  }
}

module.exports = CharacterManager;
