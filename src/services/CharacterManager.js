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
        health: 110,
        maxHealth: 110,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/XZHp3smS/naruto1.png",
        skills: [
          new Skill({ id: "punch", name: "Soco", description: "Um soco básico.", type: "attack", cost: 5, damage: 12, damageType: 'fisico' }),
          new Skill({ id: "kage_bunshin", name: "Kage Bunshin", description: "Cria clones (stack até 3x).", type: "buff", cost: 15, cooldown: 1, gifUrl: "https://i.pinimg.com/originals/35/46/7a/35467acda53a479e31600e1e44181def.gif" }),
          new Skill({ id: "rasengan", name: "Rasengan", description: "Esfera de energia que **ATORDOA**.", type: "attack", cost: 35, damage: 35, damageType: 'elemental', cooldown: 3, effect: { type: "stun", duration: 1 }, gifUrl: "" }),
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
        health: 110,
        maxHealth: 110,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/KcTWLDTB/20260323-1245-Image-Generation-remix-01kmdnwvrmeycbthdrbekys330.png",
        skills: [
          new Skill({ id: "kick", name: "Chute", description: "Um chute rápido.", type: "attack", cost: 8, damage: 12, damageType: 'fisico' }),
          new Skill({ id: "kaioken", name: "Kaioken", description: "Dano +50%, mas sofre 10% de auto-dano.", type: "buff", cost: 20, cooldown: 3, gifUrl: "https://i.pinimg.com/originals/23/a0/41/23a041ae7b7e0e4b4ab41c0c8e3fb67c.gif" }),
          new Skill({ id: "kamehameha", name: "Kamehameha", description: "Rajada de energia que causa **QUEIMADURA**.", type: "attack", cost: 40, damage: 40, damageType: 'elemental', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.03 }, gifUrl: "https://i.pinimg.com/originals/2e/f0/e6/2ef0e6649c833ae65d78e3cab875c4ee.gif" }),
          new Skill({ id: "solar_flare", name: "Solar Flare", description: "Cega o oponente (**ATORDOAMENTO**).", type: "attack", cost: 20, damage: 5, damageType: 'elemental', cooldown: 4, effect: { type: "stun", duration: 1 }, gifUrl: "https://i.pinimg.com/originals/1a/2b/3c/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d.gif" }),
          new Skill({ id: "instant_transmission", name: "Teletransporte", description: "Esquiva completamente do ataque (100% redução).", type: "reaction", cost: 45, cooldown: 3, effect: { type: "damage_reduction", value: 0.0 }, gifUrl: "https://i.pinimg.com/originals/9f/8e/7d/9f8e7d6c5b4a3d2f1e0d9c8b7a6f5e4d.gif" })
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
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/tMk9cXVM/image.png",
        skills: [
          new Skill({ id: "divergent_fist", name: "Punho Divergente", description: "Dano físico duplo com delay.", type: "attack", cost: 10, damage: 15, damageType: 'fisico' }),
          new Skill({ id: "manji_kick", name: "Chute Manji", description: "Chute acrobático rápido.", type: "attack", cost: 12, damage: 12, damageType: 'fisico' }),
          new Skill({ id: "black_flash", name: "Black Flash", description: "30% de chance de causar 3x de dano.", type: "attack", cost: 30, damage: 25, damageType: 'fisico', cooldown: 2, gifUrl: "https://i.pinimg.com/originals/f2/12/83/f21283042ce025fb4fbcc67813bc792a.gif" }),
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
        health: 110,
        maxHealth: 110,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/vxm9dv4V/20260323-1249-Image-Generation-remix-01kmdp30hqf95a44yqpsrdr2mj.png",
        passives: { physicalReduction: 0.3 },
        skills: [
          new Skill({ id: "pistol", name: "Gomu Gomu no Pistol", description: "Soco de longa distância.", type: "attack", cost: 8, damage: 12, damageType: 'fisico' }),
          new Skill({ id: "gatling", name: "Gomu Gomu no Gatling", description: "Sequência de socos que causa **SANGRAMENTO**.", type: "attack", cost: 25, damage: 25, damageType: 'fisico', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.05 } }),
          new Skill({ id: "red_hawk", name: "Red Hawk", description: "Ataque flamejante que causa **QUEIMADURA**.", type: "attack", cost: 40, damage: 35, damageType: 'elemental', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.03 }, gifUrl: "https://i.pinimg.com/originals/2e/f0/e6/2ef0e6649c833ae65d78e3cab875c4ee.gif"  }),
          new Skill({ id: "meat_break", name: "Pausa para Carne", description: "Luffy come carne e recupera 25% de HP.", type: "heal", cost: 35, healPercent: 25, cooldown: 5 }),
          new Skill({ id: "rubber_dodge", name: "Esquiva de Borracha", description: "Esquiva-se esticando o corpo, reduz 80% do dano.", type: "reaction", cost: 25, cooldown: 2, effect: { type: "damage_reduction", value: 0.2 } })
        ]
      });
    }

    if (characterId === "edward") {
      char = new Character({
        id: "edward",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Edward Elric",
        anime: "fullmetalalchemist",
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/R4gVjygQ/image.png",
        skills: [
          new Skill({ id: "alchemy_punch", name: "Soco Alquímico", description: "Soco básico com alquimia.", type: "attack", cost: 5, damage: 12, damageType: 'fisico' }),
          new Skill({ id: "metal_strike", name: "Braço de Metal", description: "Golpe pesado com o automail.", type: "attack", cost: 15, damage: 22, damageType: 'fisico', cooldown: 0 }),
          new Skill({ id: "transmutation", name: "Transmutação", description: "Transforma o chão e ataca com espinhos de terra, causa **SANGRAMENTO**.", type: "attack", cost: 25, damage: 28, damageType: 'fisico', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.08 }, gifUrl: "https://i.pinimg.com/originals/9f/b7/2d/9fb72dba38d3f843d8d3c5e04f9da0a7.gif" }),
          new Skill({ id: "alchemic_reconstruction", name: "Reconstrução Alquímica", description: "Reconstrói o corpo com alquimia e recupera 20% de HP.", type: "heal", cost: 30, healPercent: 20, cooldown: 3 }),
          new Skill({ id: "earth_wall", name: "Muralha de Pedra", description: "Reduz o dano recebido em 50%.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.5 } })
        ]
      });
    }

    if (characterId === "tanjiro") {
      char = new Character({
        id: "tanjiro",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Tanjiro Kamado",
        anime: "demonslayer",
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/S4PKvr3R/image.png",
        skills: [
          new Skill({ id: "water_breathing", name: "Corte de Água Superficial", description: "Corte fluido com respiração da água.", type: "attack", cost: 8, damage: 12, damageType: 'fisico' }),
          new Skill({ id: "water_dragon", name: "Dança do Dragão de Água", description: "Ataque contínuo e fluido, que parece uma grande corrente de água.", type: "attack", cost: 20, damage: 20, damageType: 'fisico', cooldown: 1 }),
          new Skill({ id: "hinokami_kagura", name: "Hinokami Kagura", description: "Dança do Deus do Fogo — causa **QUEIMADURA**.", type: "attack", cost: 35, damage: 32, damageType: 'elemental', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.03 }, gifUrl: "https://i.pinimg.com/originals/88/c4/0f/88c40ff6249496001b1e8794699b0395.gif" }),
          new Skill({ id: "total_concentration", name: "Concentração Total", description: "Aumenta o foco e recupera 50 de energia.", type: "buff", cost: 0, cooldown: 3 }),
          new Skill({ id: "water_guard", name: "Roda de Água", description: "Reduz o dano recebido em 50%.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.5 } })
        ]
      });
    }

    if (characterId === "asta") {
      char = new Character({
        id: "asta",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Asta",
        anime: "blackclover",
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/4gZVSBFY/image.png",
        skills: [
          new Skill({ id: "demon_sword", name: "Espada Demoníaca", description: "Corte com a Espada Matadora de Demônios.", type: "attack", cost: 10, damage: 14, damageType: 'fisico' }),
          new Skill({ id: "black_divider", name: "Black Divider", description: "Corte longo de energia anti-magia.", type: "attack", cost: 20, damage: 22, damageType: 'fisico', cooldown: 1 }),
          new Skill({ id: "black_hurricane", name: "Black Hurricane", description: "Turbilhão de energia anti-magia.", type: "attack", cost: 30, damage: 32, damageType: 'fisico', cooldown: 2 }),
          new Skill({ id: "anti_magic_heal", name: "Vontade Inabalável", description: "Recupera 20% de HP com pura determinação.", type: "heal", cost: 30, healPercent: 20, cooldown: 3 }),
          new Skill({ id: "counter_slash", name: "Contra-Anulação", description: "**Anula ataques elementais** e reduz 50% de **ataques físicos**.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.5, negateElemental: true } })
        ]
      });
    }

    if (characterId === "eva_01") {
      char = new Character({
        id: "eva_01",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "EVA-01",
        anime: "evangelion",
        health: 170,
        maxHealth: 170,
        baseMaxHealth: 170,
        energy: 140,
        maxEnergy: 140,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/4nJkwZ1b/eva.png",
        skills: [
          new Skill({ id: "eva_punch", name: "Golpe do EVA", description: "Soco devastador do Eva-01.", type: "attack", cost: 10, damage: 18, damageType: 'fisico', gifUrl: "https://i.pinimg.com/originals/dd/3d/d3/dd3dd343a80c9014477ebbb7b6d9f067.gif" }),
          new Skill({ id: "charged_strike", name: "Impacto Cargado", description: "Soco carregado que **ATORDOA** o oponente.", type: "attack", cost: 30, damage: 28, damageType: 'fisico', cooldown: 2, effect: { type: "stun", duration: 1 } }),
          new Skill({ id: "positron_beam", name: "Rifle Posítron", description: "Rifle anti-AT Field. Dano escala com a Taxa de Sincronização.", type: "attack", cost: 40, damage: 38, damageType: 'elemental', cooldown: 3 }),
          new Skill({ id: "at_field", name: "Campo AT", description: "Barreira absoluta. Aumenta o dano do próximo ataque em +30%.", type: "buff", cost: 25, cooldown: 2 }),
          new Skill({ id: "at_field_def", name: "Campo AT Defensivo", description: "Barreira de AT Field. Reduz 70% do dano recebido.", type: "reaction", cost: 30, cooldown: 3, effect: { type: "damage_reduction", value: 0.3 } })
        ]
      });
    }

    if (characterId === "shinji") {
      char = new Character({
        id: "shinji",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Shinji Ikari",
        anime: "evangelion",
        health: 5,
        maxHealth: 5,
        baseMaxHealth: 5,
        energy: 5,
        maxEnergy: 5,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/7xd4LLjr/shinji.png",
        skills: [
          new Skill({ id: "determination", name: "Determinação", description: "Não desista! (Usada 3x, **TRANSFORMA** no EVA-01).", type: "buff", cost: 0, cooldown: 0, gifUrl: "https://i.pinimg.com/originals/d8/a5/17/d8a517c5e9b3cb3bd308d8cfc5d25fba.gif" }),
          new Skill({ id: "scream", name: "Correr", description: "Shinji corre para se proteger. Reduz 50% do dano.", type: "reaction", cost: 0, cooldown: 3, effect: { type: "damage_reduction", value: 0.3 } })
        ]
      });
    }

    if (characterId === "dio") {
      char = new Character({
        id: "dio",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Dio Brando",
        anime: "jojo",
        health: 150,
        maxHealth: 150,
        energy: 120,
        maxEnergy: 120,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/JFK9DhNg/20260412-1444-Image-Generation-remix-01kp1cmdbpef89zekdzsg0syme.png",
        skills: [
          new Skill({ id: "muda_muda", name: "Muda Muda!", description: "Sequência de socos rápidos do The World.", type: "attack", cost: 15, damage: 25, damageType: 'fisico' }),
          new Skill({ id: "knife_throw", name: "Lançamento de Facas", description: "Lança facas que causam **SANGRAMENTO**.", type: "attack", cost: 20, damage: 30, damageType: 'fisico', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.08 } }),
          new Skill({ id: "the_world", name: "The World: Toki wo Tomare!", description: "Para o tempo, **ATORDOANDO** o oponente por 2 turnos.", type: "attack", cost: 70, damage: 40, damageType: 'elemental', cooldown: 5, effect: { type: "stun", duration: 2 }, gifUrl: "https://i.pinimg.com/originals/af/c8/7b/afc87b53146aaeaf78eaad0bb50fd8a2.gif" }),
          new Skill({ id: "vampiric_heal", name: "Cura Vampírica", description: "Drena o sangue e recupera 20% de HP.", type: "heal", cost: 30, healPercent: 20, cooldown: 4 }),
          new Skill({ id: "the_world_dodge", name: "Esquiva Temporal", description: "Para o tempo por um instante para desviar (100% redução).", type: "reaction", cost: 40, cooldown: 3, effect: { type: "damage_reduction", value: 0.0 } })
        ]
      });
    }

    if (characterId === "levi") {
      char = new Character({
        id: "levi",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Levi Ackerman",
        anime: "attackontitan",
        health: 120,
        maxHealth: 120,
        energy: 120,
        maxEnergy: 120,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/d0YVsCq8/image.png",
        passives: { executionZone: true },
        skills: [
          new Skill({ id: "corte_horizontal", name: "Corte Horizontal", description: "Corte horizontal usando o DMT. +1 marca.", type: "attack", cost: 15, damage: 30, damageType: 'fisico' }),
          new Skill({ id: "investida_com_dmt", name: "Investida com DMT", description: "Dá uma investida com o DMT. +1 marca", type: "attack", cost: 20, damage: 35, damageType: 'fisico', effect: { type: "bleed", duration: 2, value: 0.05 } }),
          new Skill({ id: "tempestade_de_laminas", name: "Tempestade de Lâminas", description: "Uma sequência de golpes rápidos usando as lâminas.", type: "attack", cost: 35, damage: 55, damageType: 'fisico', cooldown: 2, gifUrl: "https://i.pinimg.com/originals/45/7f/5c/457f5c86d073bcf7c63dbec5eb746376.gif" }),
          new Skill({ id: "foco_do_capitao", name: "Foco do Capitão", description: "Gera +2 marcas e remove sangramento e queimadura de si mesmo.", type: "buff", cost: 20, cooldown: 2 }),
          new Skill({ id: "contra_ataque_perfeito", name: "Contra-Ataque Perfeito", description: "Reação que reduz 70% de dano.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.3 } })
        ]
      });
    }

    if (characterId === "denji") {
      char = new Character({
        id: "denji",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Denji",
        anime: "chainsawman",
        health: 130,
        maxHealth: 130,
        energy: 100,
        maxEnergy: 100,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/G4CVN7Dz/image.png", 
        skills: [
          new Skill({ id: "chainsaw_slash", name: "Corte de Motosserra", description: "Ataque básico que causa dano físico e aplica um pequeno **SANGRAMENTO**.", type: "attack", cost: 10, damage: 20, damageType: 'fisico', effect: { type: "bleed", duration: 2, value: 0.05 } } ),
          new Skill({ id: "reckless_strike", name: "Golpe Imprudente", description: "Ataque pesado que causa alto dano, mas Denji perde **15% do seu HP atual**.", type: "attack", cost: 25, damage: 45, damageType: 'fisico', selfDamage: 0.15 }),
          new Skill({ id: "brutal_evisceration", name: "Evisceração Brutal", description: "Causa dano massivo e aplica um **SANGRAMENTO** forte e duradouro.", type: "attack", cost: 40, damage: 55, damageType: 'fisico', cooldown: 3, effect: { type: "bleed", duration: 4, value: 0.10 }, gifUrl: "https://i.ibb.co/VKYzYn7/Adobe-Express-chainsaw-man-anime.gif"}),
          new Skill({ id: "blood_consumption", name: "Consumo de Sangue", description: "Denji bebe o sangue do inimigo, recuperando **20% de HP**.", type: "heal", cost: 30, healPercent: 20, cooldown: 3 }),
          new Skill({ id: "chainsaw_man_form", name: "Chainsaw Man", description: "O Chainsaw Man desperta sua verdadeira forma! Dano aumenta drasticamente, mas perde HP a cada turno.", type: "buff", cost: 50, cooldown: 5, effect: { type: "transform", duration: 3 } }),
          new Skill({ id: "reckless_defense", name: "Defesa Imprudente", description: "Reduz o dano recebido em **40%**, mas ainda permite que parte do dano passe.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.6 } })
        ]
      });
    }


    if (characterId === "frieren") {
      char = new Character({
        id: "frieren",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Frieren",
        anime: "frieren",
        health: 155,
        maxHealth: 155,
        energy: 130,
        maxEnergy: 130,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/q3Pqj41W/frieren.png",
        skills: [
          new Skill({ id: "basic_magic", name: "Magia Básica", description: "Disparo de mana concentrada.", type: "attack", cost: 10, damage: 22, damageType: 'elemental' }),
          new Skill({ id: "mana_analysis", name: "Análise de Mana", description: "Analisa a mana do alvo por 1 turno. O próximo ataque causa **+50% de dano**.", type: "buff", cost: 10, cooldown: 0 }),
          new Skill({ id: "zoltraak", name: "Zoltraak", description: "Magia de abate — disparo concentrado de mana que perfura defesas.", type: "attack", cost: 35, damage: 65, damageType: 'elemental', cooldown: 3, gifUrl: "https://i.ibb.co/7NKGzDbJ/frieren-zoltraak.gif"}),
          new Skill({ id: "mana_siphon", name: "Sifão de Mana", description: "Drena energia do oponente e transfere para si.", type: "attack", cost: 20, damage: 28, damageType: 'elemental', cooldown: 1, effect: { type: "energy_drain", value: 25 } }),
          new Skill({ id: "barrier", name: "Barreira Mágica", description: "Cria uma barreira que reduz 65% do dano recebido.", type: "reaction", cost: 25, cooldown: 3, effect: { type: "damage_reduction", value: 0.35 } })
        ]
      });
    }

    if (characterId === "itachi_uchiha" || characterId === "itachi") {
      char = new Character({
        id: "itachi_uchiha",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Itachi Uchiha",
        anime: "naruto",
        health: 145,
        maxHealth: 145,
        energy: 130,
        maxEnergy: 130,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/yBRwVXq4/image.png", 
        skills: [
          new Skill({ id: "kunai_throw", name: "Lançamento de Kunai", description: "Arremessa kunais com precisão cirúrgica.", type: "attack", cost: 10, damage: 18, damageType: 'fisico' }),
          new Skill({ id: "genjutsu_shackles", name: "Genjutsu", description: "Aplica um debuff de dano e reduz o dano do inimigo em 15% por 2 turnos.", type: "attack", cost: 25, damage: 20, damageType: 'elemental', cooldown: 2, effect: { type: "debuff_damage", value: 0.15, duration: 2 } }),
          new Skill({ id: "amaterasu", name: "Amaterasu", description: "Chamas negras que causam **QUEIMADURA** por 3 turnos.", type: "attack", cost: 35, damage: 30, damageType: 'elemental', cooldown: 4, effect: { type: "burn", duration: 3, value: 0.08 }, gifUrl: "https://i.pinimg.com/originals/0f/fa/db/0ffadb0006cc5c7293736c224455dbfd.gif"}),
          new Skill({ id: "tsukuyomi", name: "Tsukuyomi", description: "Atordoa o inimigo por 1 turno e aumenta o dano recebido por ele em 25% por 2 turnos.", type: "attack", cost: 50, damage: 15, damageType: 'elemental', cooldown: 5, effect: { type: "stun", duration: 1, debuff_damage_taken: 0.25, debuff_duration: 2 } }),
          new Skill({ id: "susanoo_defense", name: "Susanoo: Defesa Perfeita", description: "Reduz o dano recebido em 75% no próximo ataque.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.25 } })
        ]
      });
    }

    if (characterId === "satoru_gojo") {
      char = new Character({
        id: "satoru_gojo",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Satoru Gojo",
        anime: "jujutsukaisen",
        health: 180,
        maxHealth: 180,
        energy: 150,
        maxEnergy: 150,
        rarity: "EM",
        imageUrl: "https://i.ibb.co/whYQRrDQ/image.png",
        skills: [
          new Skill({ id: "red_attack", name: "Reversão: Vermelho", description: "Ataque padrão de energia amaldiçoada.", type: "attack", cost: 20, damage: 40, damageType: 'elemental', gifUrl: "https://i.pinimg.com/originals/c7/63/19/c76319fb38068493dd49d2229619c0e4.gif"}),
          new Skill({ id: "blue_attack", name: "Convergência: Azul", description: "Causa dano e **ATORDOA** o inimigo por 1 turno.", type: "attack", cost: 40, damage: 50, damageType: 'elemental', cooldown: 3, effect: { type: "stun", duration: 1 }, gifUrl: "https://i.pinimg.com/originals/c5/5e/2f/c55e2f0e85f49c0a1a555ad6f84ef019.gif" }),
          new Skill({ id: "purple_attack", name: "Imaginário: Roxo", description: "Causa dano colossal, **IGNORA REAÇÕES** e aplica **SANGRAMENTO** por 2 turnos.", type: "attack", cost: 80, damage: 100, damageType: 'elemental', cooldown: 5, effect: { type: "ignore_reaction", damage_multiplier: 1.5, bleed: { duration: 2, value: 0.06 } }, gifUrl: "https://i.pinimg.com/originals/22/81/36/228136787949a85c103a630c753726aa.gif"}),
          new Skill({ id: "domain_expansion", name: "Expansão de Domínio: Vazio Ilimitado", description: "**ATORDOA** o inimigo por 2 turnos, ignorando imunidades a atordoamento.", type: "attack", cost: 70, damage: 40, damageType: 'elemental', cooldown: 5, effect: { type: "stun", duration: 2, ignore_immunity: true }, gifUrl: "https://i.pinimg.com/originals/cb/26/25/cb262560dbf553b91deeec5bd35d216b.gif"}),
          new Skill({ id: "infinity_reaction", name: "Infinito", description: "Anula completamente o dano recebido.", type: "reaction", cost: 45, cooldown: 3, effect: { type: "damage_reduction", value: 0.0 } })
        ]
      });
    }

    if (characterId === "sung_jin_woo") {
      // Reação pessoal de Jin-Woo (não pertence a nenhuma sombra — instinto da classe assassino)
      const sjwReaction = new Skill({ id: "sjw_instinto_assassino", name: "Instinto do Assassino", description: "Memória muscular da classe assassino — Jin-Woo recua nas sombras no momento certo, reduzindo **70% do dano**.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.3 } });

      const igrisSkills = [
        new Skill({ id: "sjw_corte_preciso", name: "Corte Preciso", description: "Golpe preciso de Igris. Aplica **1 Marca de Sangue**. Ao atingir 3 marcas, dano bônus automático (+40).", type: "attack", cost: 15, damage: 32, damageType: 'fisico', gifUrl: "https://i.pinimg.com/originals/31/64/72/31647234c454b429d811d8875d5db412.gif" }),
        new Skill({ id: "sjw_investida_cavaleiro", name: "Investida do Cavaleiro", description: "Investida devastadora de Igris. Aplica **2 Marcas de Sangue**.", type: "attack", cost: 25, damage: 45, damageType: 'fisico', cooldown: 2 }),
        new Skill({ id: "sjw_execucao_carmesim", name: "Execução Carmesim", description: "Consome todas as **Marcas de Sangue** (+35 dano/marca). Sem marcas: dano base. Sempre aplica 1 nova marca.", type: "attack", cost: 30, damage: 25, damageType: 'fisico', cooldown: 1 }),
        sjwReaction,
      ];

      const beruSkills = [
        new Skill({ id: "sjw_garras_vorazes", name: "Garras Vorazes", description: "Ataque rápido que drena vitalidade. Cura **6% do HP máximo**. 25% de chance de golpe duplo.", type: "attack", cost: 15, damage: 28, damageType: 'fisico', cooldown: 1}),
        new Skill({ id: "sjw_frenesi_predador", name: "Frenesi do Predador", description: "2 golpes garantidos + 35% de chance de um 3º. Cada hit cura **5% do HP máximo**.", type: "attack", cost: 25, damage: 16, damageType: 'fisico', cooldown: 2, gifUrl: "https://i.pinimg.com/originals/05/62/dc/0562dc48c43421cdf41f1efac5ffe519.gif" }),
        new Skill({ id: "sjw_devorar", name: "Devorar", description: "Golpe devastador com alto dano. 25% de chance de golpe duplo.", type: "attack", cost: 35, damage: 52, damageType: 'fisico', cooldown: 2 }),
        sjwReaction,
      ];

      const tankSkills = [
        new Skill({ id: "sjw_impacto_pesado", name: "Impacto Pesado", description: "Dano médio que reduz o próximo ataque do inimigo em **25%**.", type: "attack", cost: 20, damage: 40, damageType: 'fisico', effect: { type: "debuff_damage", value: 0.25, duration: 1 } }),
        new Skill({ id: "sjw_postura_inabalavel", name: "Postura Inabalável", description: "Reduz o dano recebido em **30%** por 2 turnos (passivo, sem reação).", type: "buff", cost: 20, cooldown: 2 }),
        new Skill({ id: "sjw_contra_ataque_brutal", name: "Contra-Ataque Brutal", description: "Postura de contra-ataque por 2 turnos: quem atacar Sung Jin-Woo sofrerá **10% do HP dele** de dano por turno.", type: "buff", cost: 25, cooldown: 3 }),
        sjwReaction,
      ];

      char = new Character({
        id: "sung_jin_woo",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Sung Jin-Woo",
        anime: "sololeveling",
        health: 185,
        maxHealth: 185,
        energy: 150,
        maxEnergy: 150,
        rarity: "EM",
        imageUrl: "https://i.ibb.co/XZgZVnm8/image.png",
        skills: igrisSkills,
      });

      char.shadowSkillSets = { igris: igrisSkills, beru: beruSkills, tank: tankSkills };
      char.activeShadow = null;
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

        // Escalonar habilidades das sombras de Sung Jin-Woo (beru e tank — igris já é char.skills)
        if (char.id === "sung_jin_woo" && char.shadowSkillSets) {
          ["beru", "tank"].forEach(shadow => {
            char.shadowSkillSets[shadow].forEach(skill => {
              if (skill.damage) skill.damage = Math.floor(skill.damage * levelMult);
            });
          });
        }
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

        if (char.id === "sung_jin_woo" && char.shadowSkillSets) {
          ["beru", "tank"].forEach(shadow => {
            char.shadowSkillSets[shadow].forEach(skill => {
              if (skill.type === "attack" && skill.damage > 0) {
                skill.damage += char.bonusDamage;
              }
            });
          });
        }
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
      baseSkills[1].name = "Explosão Planetária";
      baseSkills.push(new Skill({ id: "boo_regen", name: "Regeneração Infinita", description: "Recupera 30% da vida máxima.", type: "heal", cost: 50, healPercent: 30, cooldown: 5 }));
    } else if (bossId === "orochimaru") {
      baseSkills[0].name = "Kusanagi";
      baseSkills[1].name = "Mãos de Serpente";
      baseSkills.push(new Skill({ id: "oro_poison", name: "Veneno de Cobra", description: "Causa **SANGRAMENTO** contínuo.", type: "attack", cost: 25, damage: 15, damageType: 'fisico', cooldown: 2, effect: { type: "bleed", duration: 3, value: 0.08 } }));
    } else if (bossId === "gaara") {
      baseSkills[0].name = "Caixão de Areia";
      baseSkills[1].name = "Funeral de Areia";
      baseSkills.push(new Skill({ id: "gaara_shield", name: "Escudo de Areia", description: "Defesa absoluta (95% redução).", type: "reaction", cost: 30, cooldown: 3, effect: { type: "damage_reduction", value: 0.05 } }));
    } else if (bossId === "itachi_npc") {
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
      new Skill({ id: "boss_atk_1", name: "Ataque Rápido", description: "Um golpe veloz.", type: "attack", cost: 15, damage: 50, damageType: 'fisico' }),
      new Skill({ id: "boss_atk_2", name: "Explosão de Energia", description: "Dano em área.", type: "attack", cost: 35, damage: 100, damageType: 'elemental' }),
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
      baseSkills.push(new Skill({ id: "pitou_jump", name: "Salto Predador", description: "Ataca e **ATORDOA** o oponente.", type: "attack", cost: 40, damage: 80, damageType: 'fisico', cooldown: 3, effect: { type: "stun", duration: 1 } }));
    } else if (bossId === "rui") {
      baseSkills[0].name = "Fios de Aço";
      baseSkills[1].name = "Prisão de Fios";
      baseSkills.push(new Skill({ id: "rui_blood", name: "Arte de Sangue", description: "Causa **SANGRAMENTO** severo.", type: "attack", cost: 35, damage: 70, damageType: 'elemental', cooldown: 2, effect: { type: "bleed", duration: 3, value: 0.1 } }));
    } else if (bossId === "esdeath") {
      baseSkills[0].name = "Weissschnabel";
      baseSkills[1].name = "Grauphorn";
      baseSkills.push(new Skill({ id: "esdeath_freeze", name: "Mahapadma", description: "Congela o tempo (**ATORDOA** por 2 turnos).", type: "attack", cost: 80, damage: 40, damageType: 'elemental', cooldown: 6, effect: { type: "stun", duration: 2 } }));
    } else if (bossId === "dabi") {
      baseSkills[0].name = "Chamas Azuis";
      baseSkills[1].name = "Prominence Burn";
      baseSkills.push(new Skill({ id: "dabi_burn", name: "Cremação", description: "Causa **QUEIMADURA** massiva.", type: "attack", cost: 50, damage: 110, damageType: 'elemental', cooldown: 3, effect: { type: "burn", duration: 3, value: 0.15 } }));
    }

    return baseSkills;
  }
}

module.exports = CharacterManager;
