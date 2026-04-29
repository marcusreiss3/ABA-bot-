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
        element: "vento",
        health: 110,
        maxHealth: 110,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/kbDbGYx/imagem-2026-04-16-232348110.png",
        skills: [
          new Skill({ id: "punch", name: "Soco", description: "Soco básico.", type: "attack", cost: 5, damage: 12, elementType: 'vento', gifUrl: "https://i.ibb.co/RGvWK7F6/undefined-Imgur.gifhttps://i.ibb.co/Z1BSgBSs/undefined-Imgur-1.gif" }),
          new Skill({ id: "kage_bunshin", name: "Kage Bunshin", description: "Cria clones (stack até 3x).", type: "buff", cost: 15, cooldown: 1, gifUrl: "https://i.pinimg.com/originals/35/46/7a/35467acda53a479e31600e1e44181def.gif" }),
          new Skill({ id: "rasengan", name: "Rasengan", description: "ATORDOA 1t.", type: "attack", cost: 35, damage: 35, elementType: 'vento', cooldown: 3, effect: { type: "stun", duration: 1 }, gifUrl: "https://i.ibb.co/VY0p4kvw/naruto-rasengan.gif" }),
          new Skill({ id: "kyuubi_chakra", name: "Chakra da Kyuubi", description: "Cura 20% HP.", type: "heal", cost: 40, healPercent: 20, cooldown: 4, gifUrl: "https://i.ibb.co/TD1KKW69/Adobe-Express-y-Bdemv-J.gif" }),
          new Skill({ id: "substitution", name: "Substituição", description: "-50% dano recebido.", type: "reaction", cost: 15, cooldown: 1, effect: { type: "damage_reduction", value: 0.5 }, gifUrl: "https://i.ibb.co/JWsZ0d7S/Adobe-Express-ILD5-E3-A.gif" })
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
        element: "raio",
        health: 110,
        maxHealth: 110,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/Y4gG3XNw/imagem-2026-04-16-231555597.png",
        skills: [
          new Skill({ id: "kick", name: "Chute", description: "Chute rápido.", type: "attack", cost: 8, damage: 12, elementType: 'raio', gifUrl: "https://i.ibb.co/qLnG1fnJ/goku-kick.gif" }),
          new Skill({ id: "kaioken", name: "Kaioken", description: "Dano +50%, sofre 10% de auto-dano.", type: "buff", cost: 20, cooldown: 3, gifUrl: "https://i.pinimg.com/originals/23/a0/41/23a041ae7b7e0e4b4ab41c0c8e3fb67c.gif" }),
          new Skill({ id: "kamehameha", name: "Kamehameha", description: "QUEIMADURA 3% × 2t.", type: "attack", cost: 40, damage: 40, elementType: 'raio', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.03 }, gifUrl: "https://i.ibb.co/hRX5MvwK/kamehameha-goku.gif" }),
          new Skill({ id: "solar_flare", name: "Solar Flare", description: "ATORDOA 1t.", type: "attack", cost: 20, damage: 5, elementType: 'luz', cooldown: 4, effect: { type: "stun", duration: 1 }, gifUrl: "https://i.pinimg.com/originals/1a/2b/3c/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d.gif" }),
          new Skill({ id: "instant_transmission", name: "Teletransporte", description: "Esquiva 100%.", type: "reaction", cost: 45, cooldown: 3, effect: { type: "damage_reduction", value: 0.0 }, gifUrl: "https://i.pinimg.com/originals/9f/8e/7d/9f8e7d6c5b4a3d2f1e0d9c8b7a6f5e4d.gif" })
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
        element: "escuridao",
        health: 110,
        maxHealth: 110,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/tMk9cXVM/image.png",
        skills: [
          new Skill({ id: "divergent_fist", name: "Punho Divergente", description: "Soco com delay de maldição.", type: "attack", cost: 10, damage: 15, elementType: 'escuridao', gifUrl: "https://i.ibb.co/RTDGYbqS/Adobe-Express-ap2-A1-Bd-Imgur.gif" }),
          new Skill({ id: "manji_kick", name: "Chute Manji", description: "Chute acrobático rápido.", type: "attack", cost: 12, damage: 12, elementType: 'escuridao', gifUrl: "https://i.ibb.co/0ySWgLfT/Adobe-Express-B2ye-B1a.gif" }),
          new Skill({ id: "black_flash", name: "Black Flash", description: "30% chance de 3× dano.", type: "attack", cost: 30, damage: 25, elementType: 'escuridao', cooldown: 2, gifUrl: "https://i.pinimg.com/originals/f2/12/83/f21283042ce025fb4fbcc67813bc792a.gif" }),
          new Skill({ id: "slaughter_demon", name: "Slaughter Demon", description: "SANGRAMENTO 5% × 2t.", type: "attack", cost: 20, damage: 20, elementType: 'escuridao', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.05 }, gifUrl: "https://i.ibb.co/sp19bsr6/Adobe-Express-Ru-WXNKo-Imgur-1.gif" }),
          new Skill({ id: "cursed_guard", name: "Guarda Amaldiçoada", description: "-70% dano recebido.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.3 }, gifUrl: "https://i.ibb.co/3yMFqyvs/Adobe-Express-CQpua6-U-Imgur.gif" })
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
        element: "fogo",
        health: 110,
        maxHealth: 110,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/vxm9dv4V/20260323-1249-Image-Generation-remix-01kmdp30hqf95a44yqpsrdr2mj.png",
        passives: { physicalReduction: 0.3 },
        skills: [
          new Skill({ id: "pistol", name: "Gomu Gomu no Pistol", description: "Soco de borracha.", type: "attack", cost: 8, damage: 12, elementType: 'fogo', gifUrl: "https://imgur.com/a/axgCyJd.gif" }),
          new Skill({ id: "gatling", name: "Gomu Gomu no Gatling", description: "SANGRAMENTO 5% × 2t.", type: "attack", cost: 25, damage: 25, elementType: 'fogo', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.05 }, gifUrl: "https://imgur.com/a/9PP9fGm.gif" }),
          new Skill({ id: "red_hawk", name: "Red Hawk", description: "QUEIMADURA 3% × 2t.", type: "attack", cost: 40, damage: 35, elementType: 'fogo', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.03 }, gifUrl: "https://i.pinimg.com/originals/2e/f0/e6/2ef0e6649c833ae65d78e3cab875c4ee.gif" }),
          new Skill({ id: "meat_break", name: "Pausa para Carne", description: "Cura 25% HP.", type: "heal", cost: 35, healPercent: 25, cooldown: 5, gifUrl: "https://imgur.com/a/xMSWOqs.gif" }),
          new Skill({ id: "rubber_dodge", name: "Esquiva de Borracha", description: "-80% dano recebido. Passiva: -30% todo dano.", type: "reaction", cost: 25, cooldown: 2, effect: { type: "damage_reduction", value: 0.2 }, gifUrl: "https://imgur.com/a/zlCtal6.gif" })
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
        element: "terra",
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/R4gVjygQ/image.png",
        skills: [
          new Skill({ id: "alchemy_punch", name: "Soco Alquímico", description: "Soco básico.", type: "attack", cost: 5, damage: 12, elementType: 'terra', gifUrl: "https://i.ibb.co/H5bdF8v/6jtb-ZYL-Imgur-1.gif" }),
          new Skill({ id: "metal_strike", name: "Braço de Metal", description: "Golpe pesado.", type: "attack", cost: 15, damage: 22, elementType: 'terra', cooldown: 0, gifUrl: "https://i.ibb.co/qYq8sHBy/VAV2ssz-Imgur.gif" }),
          new Skill({ id: "transmutation", name: "Transmutação", description: "SANGRAMENTO 8% × 2t.", type: "attack", cost: 25, damage: 28, elementType: 'terra', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.08 }, gifUrl: "https://i.pinimg.com/originals/9f/b7/2d/9fb72dba38d3f843d8d3c5e04f9da0a7.gif" }),
          new Skill({ id: "alchemic_reconstruction", name: "Reconstrução Alquímica", description: "Cura 20% HP.", type: "heal", cost: 30, healPercent: 20, cooldown: 3, gifUrl: "https://i.ibb.co/FkLx1Q1D/Gew-Cdr-I-Imgur.gif" }),
          new Skill({ id: "earth_wall", name: "Muralha de Pedra", description: "-50% dano recebido.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.5 }, gifUrl: "https://i.ibb.co/fzcsCkBv/9p5-HNZs-Imgur.gif" })
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
        element: "agua",
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/S4PKvr3R/image.png",
        skills: [
          new Skill({ id: "water_breathing", name: "Corte de Água Superficial", description: "Corte fluido.", type: "attack", cost: 8, damage: 12, elementType: 'agua', gifUrl: "https://i.ibb.co/7xtZX2C2/l8-Ufd-OX-Imgur.gif" }),
          new Skill({ id: "water_dragon", name: "Dança do Dragão de Água", description: "Corrente contínua.", type: "attack", cost: 20, damage: 20, elementType: 'agua', cooldown: 1, gifUrl: "https://i.ibb.co/bg0MxH5v/Fu-Up-EPq-Imgur.gif" }),
          new Skill({ id: "hinokami_kagura", name: "Hinokami Kagura", description: "QUEIMADURA 3% × 2t.", type: "attack", cost: 35, damage: 32, elementType: 'fogo', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.03 }, gifUrl: "https://i.pinimg.com/originals/88/c4/0f/88c40ff6249496001b1e8794699b0395.gif" }),
          new Skill({ id: "total_concentration", name: "Concentração Total", description: "Recupera 50 de energia.", type: "buff", cost: 0, cooldown: 3, gifUrl: "https://i.ibb.co/CpFhyhmh/bk-Zcthh-Imgur-1.gif" }),
          new Skill({ id: "water_guard", name: "Roda de Água", description: "-50% dano recebido.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.5 }, gifUrl: "https://i.ibb.co/cXstBjCW/lpo-CB7m-Imgur-1.gif" })
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
        element: "escuridao",
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/4gZVSBFY/image.png",
        skills: [
          new Skill({ id: "demon_sword", name: "Espada Demoníaca", description: "Corte anti-magia.", type: "attack", cost: 10, damage: 14, elementType: 'escuridao', gifUrl: "https://i.ibb.co/JRGhqdfC/sword-fighting-asta-black-clover-23u3olzvb103u9zd.gif" }),
          new Skill({ id: "black_divider", name: "Black Divider", description: "Corte longo.", type: "attack", cost: 20, damage: 22, elementType: 'escuridao', cooldown: 1, gifUrl: "https://i.ibb.co/KxdycKmB/yami-noelle.gif" }),
          new Skill({ id: "black_hurricane", name: "Black Hurricane", description: "Turbilhão anti-magia.", type: "attack", cost: 30, damage: 32, elementType: 'escuridao', cooldown: 2, gifUrl: "https://i.ibb.co/bjtKrjjd/black-clover-heart-kingdom-arc.gif" }),
          new Skill({ id: "anti_magic_heal", name: "Vontade Inabalável", description: "Cura 20% HP.", type: "heal", cost: 30, healPercent: 20, cooldown: 3, gifUrl: "https://i.ibb.co/spnRJRXG/asta-black-clover.gif" }),
          new Skill({ id: "counter_slash", name: "Contra-Anulação", description: "Anula ataques com elemento. -50% em ataques sem elemento.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.5, negateElemental: true }, gifUrl: "https://i.ibb.co/231Wrrff/black-clover-asta.gif" })
        ]
      });
    }

    if (characterId === "sasuke") {
      char = new Character({
        id: "sasuke",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Sasuke (Clássico)",
        anime: "naruto",
        element: "fogo",
        health: 110,
        maxHealth: 110,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/fYdfSJps/sasuke.png",
        skills: [
          new Skill({ id: "sasuke_hosenka", name: "Katon: Hōsenka no Jutsu", description: "Múltiplos projéteis de fogo.", type: "attack", cost: 10, damage: 13, elementType: 'fogo' }),
          new Skill({ id: "sasuke_ryuka", name: "Katon: Ryūka no Jutsu", description: "QUEIMADURA 3% × 2t.", type: "attack", cost: 22, damage: 23, elementType: 'fogo', cooldown: 1, effect: { type: "burn", duration: 2, value: 0.03 } }),
          new Skill({ id: "sasuke_gokakyuu", name: "Katon: Gōkakyū no Jutsu", description: "Grande bola de fogo.", type: "attack", cost: 35, damage: 35, elementType: 'fogo', cooldown: 2 }),
          new Skill({ id: "sasuke_chidori", name: "Chidori", description: "ATORDOA 1t.", type: "attack", cost: 45, damage: 42, elementType: 'raio', cooldown: 3, effect: { type: "stun", duration: 1 } }),
          new Skill({ id: "sasuke_substituicao", name: "Substituição", description: "-50% dano recebido.", type: "reaction", cost: 15, cooldown: 1, effect: { type: "damage_reduction", value: 0.5 } })
        ]
      });
    }

    if (characterId === "ichigo") {
      char = new Character({
        id: "ichigo",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Ichigo Kurosaki",
        anime: "bleach",
        element: "escuridao",
        health: 110,
        maxHealth: 110,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/HDtwMcpQ/ichigo.png",
        skills: [
          new Skill({ id: "ichigo_corte", name: "Corte do Zangetsu", description: "Corte com reiatsu.", type: "attack", cost: 10, damage: 13, elementType: 'escuridao' }),
          new Skill({ id: "ichigo_reiatsu", name: "Pressão de Reiatsu", description: "SANGRAMENTO 5% × 2t.", type: "attack", cost: 22, damage: 23, elementType: 'escuridao', cooldown: 1, effect: { type: "bleed", duration: 2, value: 0.05 } }),
          new Skill({ id: "ichigo_getsuga", name: "Getsuga Tenshō", description: "Onda de energia espiritual.", type: "attack", cost: 40, damage: 40, elementType: 'escuridao', cooldown: 2 }),
          new Skill({ id: "ichigo_determinacao", name: "Determinação", description: "Cura 20% HP.", type: "heal", cost: 30, healPercent: 20, cooldown: 3 }),
          new Skill({ id: "ichigo_guarda", name: "Guarda Zangetsu", description: "-50% dano recebido.", type: "reaction", cost: 15, cooldown: 1, effect: { type: "damage_reduction", value: 0.5 } })
        ]
      });
    }

    if (characterId === "meliodas") {
      char = new Character({
        id: "meliodas",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Meliodas",
        anime: "nanatsunotaizai",
        element: "escuridao",
        health: 112,
        maxHealth: 112,
        energy: 100,
        maxEnergy: 100,
        rarity: "EC",
        imageUrl: "https://i.ibb.co/8nrq292k/meliodas.png",
        skills: [
          new Skill({ id: "meliodas_corte", name: "Corte do Dragão", description: "Corte com poder demoníaco.", type: "attack", cost: 10, damage: 13, elementType: 'escuridao' }),
          new Skill({ id: "meliodas_hellblaze", name: "Hell Blaze", description: "Chamas negras demoníacas. QUEIMADURA 3% × 2t.", type: "attack", cost: 25, damage: 27, elementType: 'escuridao', cooldown: 1, effect: { type: "burn", duration: 2, value: 0.03 } }),
          new Skill({ id: "meliodas_taiho", name: "Taiho", description: "Expulsão de poder mágico. 25% chance de ATORDOAR.", type: "attack", cost: 40, damage: 40, elementType: 'escuridao', cooldown: 2, effect: { type: "stun", duration: 1, chance: 0.25 } }),
          new Skill({ id: "meliodas_vitalidade", name: "Vitalidade Demoníaca", description: "Cura 20% HP.", type: "heal", cost: 30, healPercent: 20, cooldown: 3 }),
          new Skill({ id: "meliodas_esquiva", name: "Esquiva Demoníaca", description: "-50% dano recebido.", type: "reaction", cost: 15, cooldown: 1, effect: { type: "damage_reduction", value: 0.5 } })
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
        element: "raio",
        health: 170,
        maxHealth: 170,
        baseMaxHealth: 170,
        energy: 140,
        maxEnergy: 140,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/4nJkwZ1b/eva.png",
        skills: [
          new Skill({ id: "eva_punch", name: "Golpe do EVA", description: "Soco devastador.", type: "attack", cost: 10, damage: 18, elementType: 'raio', gifUrl: "https://i.pinimg.com/originals/dd/3d/d3/dd3dd343a80c9014477ebbb7b6d9f067.gif" }),
          new Skill({ id: "charged_strike", name: "Impacto Cargado", description: "ATORDOA 1t.", type: "attack", cost: 30, damage: 28, elementType: 'raio', cooldown: 2, effect: { type: "stun", duration: 1 }, gifUrl: "https://i.ibb.co/27Xj3nV1/neon-genesis-robot.gif" }),
          new Skill({ id: "positron_beam", name: "Rifle Posítron", description: "QUEIMADURA 3% × 1t. Escala com Taxa de Sincronização.", type: "attack", cost: 40, damage: 38, elementType: 'raio', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.03 }, gifUrl: "https://i.ibb.co/2JxdK2G/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f776174747061642d6d656469612d736572766963652f53746f.gif" }),
          new Skill({ id: "at_field", name: "Avanço Veloz", description: "+30% dano no próximo ataque.", type: "buff", cost: 25, cooldown: 2, gifUrl: "https://i.pinimg.com/originals/91/4c/ea/914cea573a12f795a2ce98b096a570c8.gif" }),
          new Skill({ id: "at_field_def", name: "Campo AT Defensivo", description: "-70% dano recebido.", type: "reaction", cost: 30, cooldown: 3, effect: { type: "damage_reduction", value: 0.3 }, gifUrl: "https://i.ibb.co/XgS0Kcm/0kdoqqyn9rqb1.gif" })
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
        element: "raio",
        health: 5,
        maxHealth: 5,
        baseMaxHealth: 5,
        energy: 5,
        maxEnergy: 5,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/7xd4LLjr/shinji.png",
        skills: [
          new Skill({ id: "determination", name: "Determinação", description: "3× transforma no EVA-01.", type: "buff", cost: 0, cooldown: 0, gifUrl: "https://i.pinimg.com/originals/d8/a5/17/d8a517c5e9b3cb3bd308d8cfc5d25fba.gif" }),
          new Skill({ id: "scream", name: "Correr", description: "-70% dano recebido.", type: "reaction", cost: 0, cooldown: 3, effect: { type: "damage_reduction", value: 0.3 } })
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
        element: "escuridao",
        health: 150,
        maxHealth: 150,
        energy: 120,
        maxEnergy: 120,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/MygrTX2g/Adobe-Express-file.png",
        skills: [
          new Skill({ id: "muda_muda", name: "Muda Muda!", description: "Socos rápidos do The World.", type: "attack", cost: 15, damage: 25, elementType: 'escuridao', gifUrl: "https://i.ibb.co/ccJG0c0Z/jojo-jotaro.gif" }),
          new Skill({ id: "knife_throw", name: "Lançamento de Facas", description: "SANGRAMENTO 8% × 2t.", type: "attack", cost: 20, damage: 30, elementType: 'escuridao', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.08 }, gifUrl: "https://i.ibb.co/C57BXwXw/1mt-Jh-S.gif" }),
          new Skill({ id: "the_world", name: "The World: Toki wo Tomare!", description: "ATORDOA 2t.", type: "attack", cost: 70, damage: 40, elementType: 'escuridao', cooldown: 5, effect: { type: "stun", duration: 2 }, gifUrl: "https://i.pinimg.com/originals/af/c8/7b/afc87b53146aaeaf78eaad0bb50fd8a2.gif" }),
          new Skill({ id: "vampiric_heal", name: "Cura Vampírica", description: "Cura 20% HP.", type: "heal", cost: 30, healPercent: 20, cooldown: 4, gifUrl: "https://i.ibb.co/5XrGrts4/OVn-Wtj8-Imgur.gif" }),
          new Skill({ id: "the_world_dodge", name: "Esquiva Temporal", description: "Esquiva 100%.", type: "reaction", cost: 40, cooldown: 3, effect: { type: "damage_reduction", value: 0.0 }, gifUrl: "https://i.ibb.co/d0gvpRNq/0s2k-Rw5-Imgur.gif" })
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
        element: "vento",
        health: 120,
        maxHealth: 120,
        energy: 120,
        maxEnergy: 120,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/d0YVsCq8/image.png",
        passives: { executionZone: true },
        skills: [
          new Skill({ id: "corte_horizontal", name: "Corte Horizontal", description: "+1 marca.", type: "attack", cost: 15, damage: 30, elementType: 'vento', gifUrl: "https://i.ibb.co/9HGf1cCB/l4g-e.gif" }),
          new Skill({ id: "investida_com_dmt", name: "Investida com DMT", description: "+1 marca. SANGRAMENTO 5% × 2t.", type: "attack", cost: 20, damage: 35, elementType: 'vento', effect: { type: "bleed", duration: 2, value: 0.05 }, gifUrl: "https://i.pinimg.com/originals/42/a2/47/42a247170df602e311f0914ee692da26.gif" }),
          new Skill({ id: "tempestade_de_laminas", name: "Tempestade de Lâminas", description: "Sequência de golpes. +150% se Fury Mode.", type: "attack", cost: 35, damage: 55, elementType: 'vento', cooldown: 2, gifUrl: "https://i.pinimg.com/originals/45/7f/5c/457f5c86d073bcf7c63dbec5eb746376.gif" }),
          new Skill({ id: "foco_do_capitao", name: "Foco do Capitão", description: "+2 marcas, remove status negativos.", type: "buff", cost: 20, cooldown: 2, gifUrl: "https://i.ibb.co/QFKbSrqM/levi-aot.gif" }),
          new Skill({ id: "contra_ataque_perfeito", name: "Contra-Ataque Perfeito", description: "-70% dano recebido.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.3 }, gifUrl: "https://i.ibb.co/d4YfrPSH/aot-levi.gif" })
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
        element: "fogo",
        health: 130,
        maxHealth: 130,
        energy: 100,
        maxEnergy: 100,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/G4CVN7Dz/image.png",
        skills: [
          new Skill({ id: "chainsaw_slash", name: "Corte de Motosserra", description: "SANGRAMENTO 5% × 2t.", type: "attack", cost: 10, damage: 20, elementType: 'fogo', effect: { type: "bleed", duration: 2, value: 0.05 }, gifUrl: "https://i.ibb.co/Mkvzt7B0/chainsaw-man-denji.gif" }),
          new Skill({ id: "reckless_strike", name: "Golpe Imprudente", description: "Alto dano. Denji perde 15% HP.", type: "attack", cost: 25, damage: 45, elementType: 'fogo', selfDamage: 0.15, gifUrl: "https://i.ibb.co/HL1X5TD3/chainsaw-man-denji-1.gif" }),
          new Skill({ id: "brutal_evisceration", name: "Evisceração Brutal", description: "SANGRAMENTO 10% × 4t.", type: "attack", cost: 40, damage: 55, elementType: 'fogo', cooldown: 3, effect: { type: "bleed", duration: 4, value: 0.10 }, gifUrl: "https://i.ibb.co/VKYzYn7/Adobe-Express-chainsaw-man-anime.gif" }),
          new Skill({ id: "blood_consumption", name: "Consumo de Sangue", description: "Cura 20% HP.", type: "heal", cost: 30, healPercent: 20, cooldown: 3, gifUrl: "https://i.ibb.co/KzDVmFWP/denjiblood.gif" }),
          new Skill({ id: "chainsaw_man_form", name: "Chainsaw Man", description: "+80% dano por 3t. TRANSFORMA.", type: "buff", cost: 50, cooldown: 5, effect: { type: "transform", duration: 3 }, gifUrl: "https://i.ibb.co/YJyKjMP/image.png" }),
          new Skill({ id: "reckless_defense", name: "Defesa Imprudente", description: "-40% dano recebido.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.6 }, gifUrl: "https://i.ibb.co/4g8hc08D/chainsaw-man-anime.gif" })
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
        element: "luz",
        health: 155,
        maxHealth: 155,
        energy: 130,
        maxEnergy: 130,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/q3Pqj41W/frieren.png",
        skills: [
          new Skill({ id: "basic_magic", name: "Magia Básica", description: "Disparo de mana.", type: "attack", cost: 10, damage: 22, elementType: 'luz', gifUrl: "https://i.ibb.co/qMc8xhL9/frieren-sousou-no-frieren.gif" }),
          new Skill({ id: "mana_analysis", name: "Análise de Mana", description: "+50% dano no próximo ataque.", type: "buff", cost: 10, cooldown: 0, gifUrl: "https://i.ibb.co/21XGVNgs/frieren-aura.gif" }),
          new Skill({ id: "zoltraak", name: "Zoltraak", description: "Perfura defesas.", type: "attack", cost: 35, damage: 65, elementType: 'luz', cooldown: 3, gifUrl: "https://i.ibb.co/7NKGzDbJ/frieren-zoltraak.gif" }),
          new Skill({ id: "surprise_attack", name: "Ataque Surpresa", description: "ATORDOA 1t.", type: "attack", cost: 25, damage: 40, elementType: 'luz', cooldown: 2, effect: { type: "stun", duration: 1 }, gifUrl: "https://i.ibb.co/fKbNk89/clone-frieren-frieren-attacks-fern.gif" }),
          new Skill({ id: "black_hole", name: "Buraco Negro", description: "QUEIMADURA 7% × 2t. Começa em recarga.", type: "attack", cost: 60, damage: 95, elementType: 'escuridao', cooldown: 3, initialCooldown: 3, effect: { type: "burn", duration: 2, value: 0.07 }, gifUrl: "https://i.ibb.co/jCcyR1L/anime-spell-1.gif" }),
          new Skill({ id: "frieren_counter", name: "Contra-Magia", description: "-30% dano. 50% chance de contra-ataque.", type: "reaction", cost: 15, effect: { type: "damage_reduction", value: 0.7 }, gifUrl: "https://i.ibb.co/21XGVNgs/frieren-aura.gif", counterGifUrl: "https://i.imgur.com/z5TISn2.gif" })
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
        element: "fogo",
        health: 145,
        maxHealth: 145,
        energy: 130,
        maxEnergy: 130,
        rarity: "AL",
        imageUrl: "https://i.ibb.co/yBRwVXq4/image.png",
        skills: [
          new Skill({ id: "kunai_throw", name: "Lançamento de Kunai", description: "Precisão cirúrgica.", type: "attack", cost: 10, damage: 18, elementType: 'fogo', gifUrl: "https://i.ibb.co/gMVqKR4x/c-V6u-M5-L-Imgur.gif" }),
          new Skill({ id: "genjutsu_shackles", name: "Genjutsu", description: "-15% dano inimigo × 2t.", type: "attack", cost: 25, damage: 20, elementType: 'escuridao', cooldown: 2, effect: { type: "debuff_damage", value: 0.15, duration: 2 }, gifUrl: "https://i.ibb.co/MkXh1LBX/f9ap-IJL-Imgur.gif" }),
          new Skill({ id: "amaterasu", name: "Amaterasu", description: "QUEIMADURA 8% × 3t.", type: "attack", cost: 35, damage: 30, elementType: 'fogo', cooldown: 4, effect: { type: "burn", duration: 3, value: 0.08 }, gifUrl: "https://i.pinimg.com/originals/0f/fa/db/0ffadb0006cc5c7293736c224455dbfd.gif" }),
          new Skill({ id: "tsukuyomi", name: "Tsukuyomi", description: "ATORDOA 1t. +25% dano recebido × 2t.", type: "attack", cost: 50, damage: 15, elementType: 'escuridao', cooldown: 5, effect: { type: "stun", duration: 1, debuff_damage_taken: 0.25, debuff_duration: 2 }, gifUrl: "https://i.ibb.co/F46Bz0gG/l7toz-DE-Imgur.gif" }),
          new Skill({ id: "susanoo_defense", name: "Susanoo: Defesa Perfeita", description: "-75% dano recebido.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.25 }, gifUrl: "https://i.ibb.co/RJpgwWW/MVGBCae-Imgur.gif" })
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
        element: "luz",
        health: 180,
        maxHealth: 180,
        energy: 150,
        maxEnergy: 150,
        rarity: "EM",
        imageUrl: "https://i.ibb.co/whYQRrDQ/image.png",
        skills: [
          new Skill({ id: "red_attack", name: "Reversão: Vermelho", description: "Ataque de energia amaldiçoada.", type: "attack", cost: 20, damage: 40, elementType: 'luz', gifUrl: "https://i.pinimg.com/originals/c7/63/19/c76319fb38068493dd49d2229619c0e4.gif" }),
          new Skill({ id: "blue_attack", name: "Convergência: Azul", description: "ATORDOA 1t.", type: "attack", cost: 40, damage: 50, elementType: 'luz', cooldown: 3, effect: { type: "stun", duration: 1 }, gifUrl: "https://i.pinimg.com/originals/c5/5e/2f/c55e2f0e85f49c0a1a555ad6f84ef019.gif" }),
          new Skill({ id: "purple_attack", name: "Imaginário: Roxo", description: "Ignora reações. SANGRAMENTO 6% × 2t.", type: "attack", cost: 80, damage: 100, elementType: 'luz', cooldown: 5, effect: { type: "ignore_reaction", damage_multiplier: 1.5, bleed: { duration: 2, value: 0.06 } }, gifUrl: "https://i.pinimg.com/originals/22/81/36/228136787949a85c103a630c753726aa.gif" }),
          new Skill({ id: "domain_expansion", name: "Expansão de Domínio: Vazio Ilimitado", description: "ATORDOA 2t (ignora imunidade).", type: "attack", cost: 70, damage: 40, elementType: 'luz', cooldown: 5, effect: { type: "stun", duration: 2, ignore_immunity: true }, gifUrl: "https://i.pinimg.com/originals/cb/26/25/cb262560dbf553b91deeec5bd35d216b.gif" }),
          new Skill({ id: "infinity_reaction", name: "Infinito", description: "Anula 100% do dano.", type: "reaction", cost: 45, cooldown: 3, effect: { type: "damage_reduction", value: 0.0 }, gifUrl: "https://i.ibb.co/Y4nk7WV0/gojo-satoru.gif" })
        ]
      });
    }

    if (characterId === "sung_jin_woo") {
      const sjwReaction = new Skill({ id: "sjw_instinto_assassino", name: "Instinto do Assassino", description: "-70% dano recebido.", type: "reaction", cost: 35, cooldown: 2, effect: { type: "damage_reduction", value: 0.3 } });

      const igrisSkills = [
        new Skill({ id: "sjw_corte_preciso", name: "Corte Preciso", description: "+1 Marca de Sangue. 3 marcas = dano bônus.", type: "attack", cost: 20, damage: 25, elementType: 'escuridao', gifUrl: "https://i.pinimg.com/originals/31/64/72/31647234c454b429d811d8875d5db412.gif" }),
        new Skill({ id: "sjw_investida_cavaleiro", name: "Investida do Cavaleiro", description: "+2 Marcas de Sangue.", type: "attack", cost: 30, damage: 38, elementType: 'escuridao', cooldown: 2, gifUrl: "https://i.ibb.co/Tq7PBMMn/BORMfi-J-Imgur.gif" }),
        new Skill({ id: "sjw_execucao_carmesim", name: "Execução Carmesim", description: "Consome marcas (bônus escala com HP). +1 marca.", type: "attack", cost: 35, damage: 20, elementType: 'escuridao', cooldown: 2 }),
        sjwReaction,
      ];

      const beruSkills = [
        new Skill({ id: "sjw_garras_vorazes", name: "Garras Vorazes", description: "Lifesteal 5%. 15% chance golpe duplo.", type: "attack", cost: 20, damage: 22, elementType: 'escuridao', cooldown: 1 }),
        new Skill({ id: "sjw_frenesi_predador", name: "Frenesi do Predador", description: "2 hits + 35% chance 3º. Cada hit cura 2% HP.", type: "attack", cost: 30, damage: 14, elementType: 'escuridao', cooldown: 2, gifUrl: "https://i.pinimg.com/originals/05/62/dc/0562dc48c43421cdf41f1efac5ffe519.gif" }),
        new Skill({ id: "sjw_devorar", name: "Devorar", description: "15% chance golpe duplo.", type: "attack", cost: 40, damage: 42, elementType: 'escuridao', cooldown: 2 }),
        sjwReaction,
      ];

      const tankSkills = [
        new Skill({ id: "sjw_impacto_pesado", name: "Impacto Pesado", description: "-25% dano inimigo × 1t.", type: "attack", cost: 25, damage: 30, elementType: 'escuridao', effect: { type: "debuff_damage", value: 0.25, duration: 1 }, gifUrl: "https://i.ibb.co/nqHmrM0k/sung-jin-woo-vs.gif" }),
        new Skill({ id: "sjw_postura_inabalavel", name: "Postura Inabalável", description: "-30% dano recebido × 2t (passivo).", type: "buff", cost: 20, cooldown: 2 }),
        new Skill({ id: "sjw_contra_ataque_brutal", name: "Contra-Ataque Brutal", description: "Contra-ataque: 10% HP do inimigo por 1t.", type: "buff", cost: 30, cooldown: 3 }),
        sjwReaction,
      ];

      char = new Character({
        id: "sung_jin_woo",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Sung Jin-Woo",
        anime: "sololeveling",
        element: "escuridao",
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

    if (characterId === "yuta_okkotsu") {
      char = new Character({
        id: "yuta_okkotsu",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Yuta Okkotsu",
        anime: "jujutsukaisen",
        element: "escuridao",
        health: 168,
        maxHealth: 168,
        energy: 140,
        maxEnergy: 140,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/1fXYR7ts/yuta.png",
        skills: [
          new Skill({ id: "yuta_corte_espada", name: "Corte com a Espada", description: "Corte rápido com a espada.", type: "attack", cost: 12, damage: 24, elementType: 'escuridao', gifUrl: "https://i.ibb.co/mCwbnF43/theater-sword-fight-yuta-sword-fighting.gif" }),
          new Skill({ id: "yuta_copia", name: "Cópia", description: "Devolve o último ataque +30% dano e efeitos.", type: "attack", cost: 30, damage: 0, elementType: 'escuridao', cooldown: 5, gifUrl: "" }),
          new Skill({ id: "yuta_rika", name: "Rika", description: "Invoca Rika (1x). Dano passivo ao inimigo por turno.", type: "buff", cost: 40, cooldown: 999, gifUrl: "https://i.ibb.co/ZzkHb23j/yuta-okkotsu-yuta.gif" }),
          new Skill({ id: "yuta_energia_reversa", name: "Energia Reversa", description: "Cura 25% HP.", type: "heal", healPercent: 25, cost: 35, cooldown: 3, gifUrl: "" }),
          new Skill({ id: "yuta_amor_puro", name: "Amor Puro", description: "Ignora reações. QUEIMADURA 7% × 2t.", type: "attack", cost: 60, damage: 80, elementType: 'escuridao', cooldown: 4, effect: { type: "ignore_reaction", damage_multiplier: 1.0, burn: { duration: 2, value: 0.07 } }, gifUrl: "https://i.ibb.co/BH1cD8Lf/yuta-yuta-okkotsu.gif" }),
          new Skill({ id: "yuta_bloqueio_espada", name: "Bloqueio com Espada", description: "-60% dano recebido.", type: "reaction", cost: 25, cooldown: 2, effect: { type: "damage_reduction", value: 0.40 }, gifUrl: "https://i.ibb.co/xtBXBLS5/yuji-yuji-itadori.gif" })
        ]
      });
    }

    if (characterId === "naoya_zenin") {
      char = new Character({
        id: "naoya_zenin",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Naoya Zenin",
        anime: "jjk",
        element: "vento",
        health: 160,
        maxHealth: 160,
        energy: 130,
        maxEnergy: 130,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/Q7Nkqr2P/naoya.png",
        skills: [
          new Skill({ id: "naoya_sequencia_socos", name: "Sequência de Socos", description: "Combo de socos rápidos.", type: "attack", cost: 10, damage: 18, elementType: 'vento', gifUrl: "https://i.ibb.co/SDvGrJzq/jjk-maki.gif" }),
          new Skill({ id: "naoya_24_quadros", name: "24 Quadros", description: "Ataque duplo nos próximos 3 turnos.", type: "buff", cost: 20, cooldown: 4, gifUrl: "https://i.ibb.co/8gLkF4dy/flpy7wzyx9jg1.gif" }),
          new Skill({ id: "naoya_frame_lock", name: "Frame Lock", description: "ATORDOA 1t.", type: "attack", cost: 25, damage: 30, elementType: 'vento', cooldown: 3, effect: { type: "stun", duration: 1 }, gifUrl: "https://i.ibb.co/F4Nmq54v/s0qgziazx9jg1.gif" }),
          new Skill({ id: "naoya_expansao_dominio", name: "Expansão de Domínio", description: "Ativa técnica: atacantes sofrem dano e sangramento. (1× por luta)", type: "buff", cost: 50, cooldown: 999, gifUrl: "https://i.ibb.co/Pvv0xJ5C/imagem-2026-04-28-201234238.png" }),
          new Skill({ id: "naoya_esquiva", name: "Esquiva Relâmpago", description: "-50% dano recebido.", type: "reaction", cost: 15, cooldown: 2, effect: { type: "damage_reduction", value: 0.50 }, gifUrl: "https://i.ibb.co/hJYYnThF/naoya-naoya-zenin.gif" })
        ]
      });
    }

    if (characterId === "zoro") {
      char = new Character({
        id: "zoro",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Roronoa Zoro",
        anime: "onepiece",
        element: "vento",
        health: 175,
        maxHealth: 175,
        energy: 135,
        maxEnergy: 135,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/p61FzFSj/zoro.png",
        skills: [
          new Skill({ id: "zoro_oni_giri", name: "Oni Giri", description: "Corte cruzado com três espadas.", type: "attack", cost: 12, damage: 22, elementType: 'vento', gifUrl: "https://i.ibb.co/zVdtdYWk/one-piece-zoro-vs-king.gif" }),
          new Skill({ id: "zoro_tatsu_maki", name: "Tatsu Maki", description: "Tornado de lâminas. 25% chance de ATORDOAR.", type: "attack", cost: 28, damage: 38, elementType: 'vento', cooldown: 2, effect: { type: "stun", duration: 1, chance: 0.25 }, gifUrl: "https://i.ibb.co/k6MZmm8y/zoro-hatchan.gif" }),
          new Skill({ id: "zoro_rengoku_oni_giri", name: "Rengoku Oni Giri", description: "Corte infernal. SANGRAMENTO 6% × 2t.", type: "attack", cost: 38, damage: 55, elementType: 'fogo', cooldown: 3, effect: { type: "bleed", duration: 2, value: 0.06 }, gifUrl: "https://i.ibb.co/27FgHkrY/zoro.gif" }),
          new Skill({ id: "zoro_sanzen_sekai", name: "Santoryu Ogi: Sanzen Sekai", description: "Técnica suprema. ATORDOA 1t.", type: "attack", cost: 55, damage: 72, elementType: 'vento', cooldown: 5, effect: { type: "stun", duration: 1 }, gifUrl: "https://i.ibb.co/6JfbLgjf/sanzensekai.gif" }),
          new Skill({ id: "zoro_parry", name: "Parry", description: "-65% dano recebido.", type: "reaction", cost: 22, cooldown: 2, effect: { type: "damage_reduction", value: 0.35 }, gifUrl: "https://i.ibb.co/PzhPSSvM/one-piece-roronoa-zoro.gif" })
        ]
      });
    }

    if (characterId === "emilia") {
      char = new Character({
        id: "emilia",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Emilia",
        anime: "rezero",
        element: "gelo",
        health: 160,
        maxHealth: 160,
        energy: 145,
        maxEnergy: 145,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/nMTp0stf/emilia.png",
        skills: [
          new Skill({ id: "emilia_gelo_eterno", name: "Martelada de Gelo", description: "Golpe com martelo de gelo.", type: "attack", cost: 12, damage: 18, elementType: 'gelo', gifUrl: "https://i.ibb.co/R4sNDVK3/re-zero-subaru.gif" }),
          new Skill({ id: "emilia_espinhos_gelo", name: "Espinhos de Gelo", description: "Múltiplos espinhos. CONGELADO 2t.", type: "attack", cost: 25, damage: 30, elementType: 'gelo', cooldown: 2, effect: { type: "frozen", duration: 2 }, gifUrl: "https://i.ibb.co/r2RFPmPy/132651.gif" }),
          new Skill({ id: "emilia_tempestade_glacial", name: "Tempestade Glacial", description: "Nevasca intensa. CONGELADO 3t.", type: "attack", cost: 38, damage: 45, elementType: 'gelo', cooldown: 3, effect: { type: "frozen", duration: 3 }, gifUrl: "https://i.ibb.co/mCcc6BRW/emilia-rezero.gif" }),
          new Skill({ id: "emilia_prisao_gelo", name: "Prisão de Gelo", description: "Encarcera no gelo. ATORDOA 1t + CONGELADO 2t.", type: "attack", cost: 50, damage: 20, elementType: 'gelo', cooldown: 4, effect: { type: "stun", duration: 1, frozen: { duration: 2 } }, gifUrl: "" }),
          new Skill({ id: "emilia_barreira_gelo", name: "Esquiva Veloz", description: "-55% dano recebido.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.45 }, gifUrl: "https://i.ibb.co/C5p5psXz/emilia-re-zero.gif" })
        ]
      });
    }

    if (characterId === "gilgamesh") {
      const vimanaSkills = [
        new Skill({ id: "vimana_explosive_shots", name: "Vimana: Tiros Explosivos", description: "Dano médio. ATORDOA 1t.", type: "attack", cost: 20, damage: 45, elementType: 'luz', cooldown: 2, effect: { type: "stun", duration: 1 } }),
        new Skill({ id: "vimana_shields", name: "Vimana: Escudos", description: "-30% dano recebido por 2t.", type: "buff", cost: 15, cooldown: 3 })
      ];

      char = new Character({
        id: "gilgamesh",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Gilgamesh",
        anime: "fate",
        element: "luz",
        health: 195,
        maxHealth: 195,
        energy: 160,
        maxEnergy: 160,
        rarity: "EM",
        generation: 2,
        imageUrl: "https://i.ibb.co/4RPZZtgj/gilgamesh.png",
        skills: [
          new Skill({ id: "gilgamesh_lightwork_beams", name: "Lightwork Beams", description: "Feixe de raio básico.", type: "attack", cost: 12, damage: 22, elementType: 'raio', gifUrl: "https://imgur.com/umiCxCC.gif" }),
          new Skill({ id: "gilgamesh_open_gates", name: "Open Gates", description: "SANGRAMENTO 6% × 2t.", type: "attack", cost: 22, damage: 38, elementType: 'luz', cooldown: 1, effect: { type: "bleed", duration: 2, value: 0.06 }, gifUrl: "https://imgur.com/Sv8Edbn.gif" }),
          new Skill({ id: "gilgamesh_explosive_dome", name: "Explosive Dome", description: "Dano médio.", type: "attack", cost: 40, damage: 58, elementType: 'luz', cooldown: 3, gifUrl: "https://imgur.com/a/Xgtjf4s.gif" }),
          new Skill({ id: "gilgamesh_ea", name: "Sword Of Rupture: Ea", description: "Remove condições negativas e libera Enuma Elish.", type: "buff", cost: 35, cooldown: 5, gifUrl: "https://imgur.com/a/jL06wUE.gif" }),
          new Skill({ id: "gilgamesh_enuma_elish", name: "Enuma Elish", description: "Dano massivo. QUEIMADURA 8% × 3t. (1× por luta, requer Ea)", type: "attack", cost: 0, damage: 120, elementType: 'luz', cooldown: 999, initialCooldown: 999, effect: { type: "burn", duration: 3, value: 0.08 }, gifUrl: "https://imgur.com/a/24ELwkd.gif" }),
          new Skill({ id: "gilgamesh_vimana", name: "Vimana", description: "Invoca a nave (1×). Dois ataques por turno enquanto ativa.", type: "buff", cost: 50, cooldown: 999, gifUrl: "https://imgur.com/a/CZ0NkEE#IjoUWgy.gif" }),
          new Skill({ id: "gilgamesh_enkidu", name: "Enkidu", description: "-70% dano recebido. 40% de chance de ATORDOAR.", type: "reaction", cost: 30, cooldown: 1, effect: { type: "damage_reduction", value: 0.3 }, imageUrl: "https://imgur.com/a/kgtUqYU.gif" })
        ]
      });

      char.vimanaSkills = vimanaSkills;
    }

    if (characterId === "bakugou") {
      char = new Character({
        id: "bakugou",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Bakugou Katsuki",
        anime: "mha",
        element: "fogo",
        health: 165,
        maxHealth: 165,
        energy: 145,
        maxEnergy: 145,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/0y1gJvyT/bakugou.png",
        skills: [
          new Skill({ id: "bakugou_arremesso_explosivo", name: "Arremesso Explosivo", description: "Dano baixo. QUEIMADURA 5% × 2t.", type: "attack", cost: 15, damage: 22, elementType: 'fogo', effect: { type: "burn", duration: 2, value: 0.05 }, gifUrl: "https://imgur.com/a/6OIaIi2.gif" }),
          new Skill({ id: "bakugou_granada_atordoante", name: "Granada Atordoante", description: "Dano baixo. ATORDOA 1t.", type: "attack", cost: 28, damage: 18, elementType: 'luz', cooldown: 2, effect: { type: "stun", duration: 1 }, gifUrl: "https://imgur.com/a/2UPqygQ.gif" }),
          new Skill({ id: "bakugou_manopla_explosiva", name: "Manopla Explosiva", description: "Dano médio. QUEIMADURA 5% × 2t.", type: "attack", cost: 32, damage: 38, elementType: 'fogo', cooldown: 2, effect: { type: "burn", duration: 2, value: 0.05 }, gifUrl: "https://imgur.com/a/6i3we3R.gif" }),
          new Skill({ id: "bakugou_impacto_explosivo", name: "Impacto Explosivo", description: "Dano alto. QUEIMADURA 8% × 2t.", type: "attack", cost: 55, damage: 65, elementType: 'fogo', cooldown: 4, effect: { type: "burn", duration: 2, value: 0.08 }, gifUrl: "https://imgur.com/a/9Zi7Y7Z.gif" }),
          new Skill({ id: "bakugou_devastacao_explosiva", name: "Devastação Explosiva", description: "-70% dano recebido.", type: "reaction", cost: 20, cooldown: 2, effect: { type: "damage_reduction", value: 0.3 }, gifUrl: "https://imgur.com/a/9ZCJ1et.gif" })
        ]
      });
    }

    if (characterId === "enel") {
      char = new Character({
        id: "enel",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Enel",
        anime: "onepiece",
        element: "raio",
        health: 168,
        maxHealth: 168,
        energy: 145,
        maxEnergy: 145,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/fzk4Kn17/enel.png",
        skills: [
          new Skill({ id: "enel_golpe_eletrico", name: "Golpe Elétrico", description: "Dano baixo. 30% chance de ATORDOAR.", type: "attack", cost: 12, damage: 20, elementType: 'raio', effect: { type: "stun", duration: 1, chance: 0.30 }, gifUrl: "https://i.ibb.co/tPc6xXY4/god-enel.gif"}),
          new Skill({ id: "enel_el_thor", name: "El Thor", description: "Dano alto. Ignora 50% da defesa de artefatos.", type: "attack", cost: 35, damage: 58, elementType: 'raio', cooldown: 2, piercesArmor: 0.5, gifUrl: "https://i.ibb.co/LX65Dm9v/eneru-enel.gif" } ),
        new Skill({ id: "enel_raigo", name: "Raigo", description: "Dano muito alto. QUEIMADURA 5% × 3t.", type: "attack", cost: 65, damage: 75, elementType: 'raio', cooldown: 4, effect: { type: "burn", duration: 3, value: 0.05 }, gifUrl: "https://i.ibb.co/tPc6xXY4/god-enel.gifhttps://i.ibb.co/wZTSb1dG/enel-enru-raigo.gif" }),
          new Skill({ id: "enel_mantra", name: "Mantra (Observação Divina)", description: "-50% dano recebido por 2t.", type: "buff", cost: 30, cooldown: 3, gifUrl: "https://i.ibb.co/W40LbtMs/enel-mantra.gif" }),
          new Skill({ id: "enel_corpo_raio", name: "Corpo de Raio", description: "-70% dano recebido.", type: "reaction", cost: 20, cooldown: 1, effect: { type: "damage_reduction", value: 0.30 }, gifUrl: "https://i.ibb.co/ZnjcZNG/qdmkg2buz8tc1.gif" })
        ]
      });
    }

    if (characterId === "zenitsu") {
      char = new Character({
        id: "zenitsu",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Agatsuma Zenitsu",
        anime: "demonslayer",
        element: "raio",
        health: 165,
        maxHealth: 165,
        energy: 140,
        maxEnergy: 140,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/HL9yTPTK/zenitsu.png",
        skills: [
          new Skill({ id: "zenitsu_corte", name: "Corte", description: "Corte rápido.", type: "attack", cost: 12, damage: 22, elementType: 'raio', gifUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2OQrsbJD4F-bH2qhKgVh3xxA3yJDdwnEoEQ&s" }),
          new Skill({ id: "zenitsu_respiracao_trovao", name: "Respiração do Trovão", description: "Dano médio. QUEIMADURA 5% × 2t.", type: "attack", cost: 25, damage: 38, elementType: 'raio', cooldown: 1, effect: { type: "burn", duration: 2, value: 0.05 }, gifUrl: "https://i.pinimg.com/originals/1d/3d/bf/1d3dbf048330590da90564fc6404451a.gif" }),
          new Skill({ id: "zenitsu_deus_trovao", name: "Deus do Trovão", description: "Dano alto. 30% chance de atacar 2×.", type: "attack", cost: 50, damage: 55, elementType: 'raio', cooldown: 2, gifUrl: "https://i.ibb.co/3ycf9FLt/demon-slayer-kimetsu-no-yaiba.gif" }),
          new Skill({ id: "zenitsu_dormir", name: "Dormir", description: "Zenitsu dorme 3 turnos: +80% dano, mas ataca aleatoriamente.", type: "buff", cost: 30, cooldown: 6, gifUrl: "https://i.ibb.co/pBBsSJg6/zenitsu-agatsuma-demon-slayer.gif" }),
          new Skill({ id: "zenitsu_instinto_sobrevivencia", name: "Instinto de Sobrevivência", description: "-60% dano recebido.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.40 }, gifUrl: "https://i.ibb.co/twVzgvKw/zenitsu-dodge.gif" })
        ]
      });
    }

    if (characterId === "naruto_sennin") {
      char = new Character({
        id: "naruto_sennin",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Naruto (Modo Sábio)",
        anime: "naruto",
        element: "vento",
        health: 172,
        maxHealth: 172,
        energy: 148,
        maxEnergy: 148,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/3yShztft/naruto-sennin.png",
        skills: [
          new Skill({ id: "naruto_sennin_rasengan", name: "Rasengan", description: "Golpe com Rasengan.", type: "attack", cost: 15, damage: 26, elementType: 'vento', gifUrl: "https://i.ibb.co/qMydx3Fp/naruto-uzumaki-sage-charging-rasengan-3bb7zyvnkexsunpg.gif" }),
          new Skill({ id: "naruto_sennin_rasenshuriken", name: "Rasenshuriken", description: "Dano alto. SANGRAMENTO 5% × 2t.", type: "attack", cost: 45, damage: 62, elementType: 'vento', cooldown: 2, effect: { type: "bleed", duration: 2, value: 0.05 }, gifUrl: "https://i.pinimg.com/originals/ca/2f/5b/ca2f5badf7e39dcf79c26f1ab8d3e08e.gif" }),
          new Skill({ id: "naruto_sennin_kata", name: "Kata do Sapo", description: "Dano alto. 35% chance de ATORDOAR.", type: "attack", cost: 50, damage: 65, elementType: 'vento', cooldown: 3, effect: { type: "stun", duration: 1, chance: 0.35 }, gifUrl: "https://i.ibb.co/3mQ0QXfh/naruto-naruto-shippuden.gif" }),
          new Skill({ id: "naruto_sennin_invocacao", name: "Invocação: Gamabunta", description: "-35% dano recebido por 3t.", type: "buff", cost: 35, cooldown: 4, effect: { type: "damage_reduction_passive", value: 0.35, duration: 3 }, gifUrl: "https://i.ibb.co/YTtDWRSp/quinehasenteredthediscord.gif" }),
          new Skill({ id: "naruto_sennin_absorcao", name: "Absorção Natural", description: "-50% dano recebido.", type: "reaction", cost: 20, cooldown: 1, effect: { type: "damage_reduction", value: 0.50 } })
        ]
      });
    }

    if (characterId === "goku_ssj3") {
      char = new Character({
        id: "goku_ssj3",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Goku (SSJ3)",
        anime: "dragonball",
        element: "luz",
        health: 175,
        maxHealth: 175,
        energy: 155,
        maxEnergy: 155,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/kgY2hFJ7/goku-ssj3.png",
        skills: [
          new Skill({ id: "goku_ssj3_kamehameha", name: "Kamehameha", description: "Onda de Ki.", type: "attack", cost: 18, damage: 28, elementType: 'luz' }),
          new Skill({ id: "goku_ssj3_super_kamehameha", name: "Super Kamehameha", description: "Dano alto.", type: "attack", cost: 40, damage: 68, elementType: 'luz', cooldown: 2 }),
          new Skill({ id: "goku_ssj3_golpe", name: "Golpe Meteórico", description: "35% chance de ATORDOAR.", type: "attack", cost: 30, damage: 44, elementType: "fogo", cooldown: 1, effect: { type: "stun", duration: 1, chance: 0.35 } }),
          new Skill({ id: "goku_ssj3_rugido", name: "Rugido de Ki", description: "+60% dano por 2t.", type: "buff", cost: 30, cooldown: 3, effect: { multiplier: 1.6, duration: 2 } }),
          new Skill({ id: "goku_ssj3_aura", name: "Aura de Ki", description: "-50% dano recebido.", type: "reaction", cost: 15, cooldown: 1, effect: { type: "damage_reduction", value: 0.50 } })
        ]
      });
    }

    if (characterId === "killua") {
      char = new Character({
        id: "killua",
        instanceId: instanceData.id,
        level: instanceData.level || 1,
        name: "Killua Zoldyck",
        anime: "hxh",
        element: "raio",
        health: 162,
        maxHealth: 162,
        energy: 140,
        maxEnergy: 140,
        rarity: "AL",
        generation: 2,
        imageUrl: "https://i.ibb.co/27SSNwH0/killua.png",
        skills: [
          new Skill({ id: "killua_garra_trovao", name: "Garra do Trovão", description: "Dano baixo. 35% chance de ATORDOAR. +1 Spark.", type: "attack", cost: 12, damage: 22, elementType: 'raio', effect: { type: "stun", duration: 1, chance: 0.35 } }),
          new Skill({ id: "killua_narukami", name: "Narukami", description: "Dano médio. +2 Sparks.", type: "attack", cost: 32, damage: 48, elementType: 'raio', cooldown: 1 }),
          new Skill({ id: "killua_kanmuru", name: "Kanmuru: Godspeed", description: "Consome todos os Sparks. Dano escala com Sparks. Com 5 Sparks: ignora reação.", type: "attack", cost: 55, damage: 55, elementType: 'raio', cooldown: 3 }),
          new Skill({ id: "killua_assassinato", name: "Assassinato Furtivo", description: "Golpe preciso. +50% dano se inimigo < 50% HP. +1 Spark.", type: "attack", cost: 22, damage: 30 }),
          new Skill({ id: "killua_reflexo", name: "Reflexo Assassino", description: "-45% dano recebido. +1 Spark.", type: "reaction", cost: 18, cooldown: 1, effect: { type: "damage_reduction", value: 0.45 } })
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
            element: this.getBossElement(bossData.id),
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
            element: this.getBossElement(bossData.id),
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
            element: this.getBossElement(bossData.id),
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

        // Escalonar habilidades da Vimana de Gilgamesh
        if (char.id === "gilgamesh" && char.vimanaSkills) {
          char.vimanaSkills.forEach(skill => {
            if (skill.damage) skill.damage = Math.floor(skill.damage * levelMult);
          });
        }

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

        if (char.id === "gilgamesh" && char.vimanaSkills) {
          char.vimanaSkills.forEach(skill => {
            if (skill.type === "attack" && skill.damage > 0) {
              skill.damage += char.bonusDamage;
            }
          });
        }
      }
    }

    return char;
  }

  static getBossElement(bossId) {
    const map = {
      // Story bosses
      raditz: 'raio', vegeta: 'raio', freeza: 'gelo', cell: 'escuridao', majin_boo: 'escuridao',
      orochimaru: 'escuridao', gaara: 'terra', itachi_npc: 'fogo', pain: 'vento', madara: 'fogo',
      jaw_titan: 'terra', armored_titan: 'terra', attack_titan: 'escuridao', f_titan: 'terra', colossal_titan: 'fogo',
      cursed_spirit: 'escuridao', aoi_todo: 'terra', mahito: 'escuridao', kenjaku: 'escuridao', sukuna: 'fogo',
      // Challenge bosses
      buggy: 'vento', haruta: 'escuridao', neferpitou: 'vento', rui: 'escuridao', esdeath: 'gelo', dabi: 'fogo',
      // Tower bosses
      saibaman: 'escuridao', buggytower: 'vento', team_rocket: 'escuridao', zabuza: 'agua',
      stain: 'escuridao', hisoka: 'escuridao', ulquiorra: 'escuridao', garou: 'terra',
      doflamingo: 'vento', android17: 'raio',
      npc_shigaraki: 'escuridao', npc_alucard: 'escuridao', npc_kaido: 'fogo',
      npc_kaguya: 'gelo', npc_akaza: 'fogo',
      // Gen2 AL
      yuta_okkotsu: 'escuridao',
      bakugou: 'fogo',
      enel: 'raio',
      zenitsu: 'raio',
      naruto_sennin: 'vento',
      goku_ssj3: 'luz',
      killua: 'raio',
      naoya_zenin: 'vento',
      zoro: 'vento',
      emilia: 'gelo',
      // EC
      sasuke: 'fogo',
      ichigo: 'escuridao',
      meliodas: 'escuridao',
      // Gen2 EM
      gilgamesh: 'luz',
    };
    return map[bossId] || null;
  }

  static generateBossSkills(bossId, worldId) {
    const el = this.getBossElement(bossId) || 'escuridao';
    const baseSkills = [
      new Skill({ id: "boss_atk_1", name: "Ataque Rápido", description: "Golpe veloz.", type: "attack", cost: 15, damage: 30, elementType: el }),
      new Skill({ id: "boss_atk_2", name: "Explosão de Energia", description: "Dano em área.", type: "attack", cost: 35, damage: 60, elementType: el }),
      new Skill({ id: "boss_def", name: "Guarda do Boss", description: "-70% dano recebido.", type: "reaction", cost: 20, effect: { type: "damage_reduction", value: 0.3 } })
    ];

    if (bossId === "raditz") {
      baseSkills[0].name = "Double Sunday";
      baseSkills[1].name = "Shining Friday";
      baseSkills.push(new Skill({ id: "raditz_tail", name: "Golpe de Cauda", description: "ATORDOA 1t.", type: "attack", cost: 25, damage: 20, elementType: 'raio', cooldown: 2, effect: { type: "stun", duration: 1 } }));
    } else if (bossId === "vegeta") {
      baseSkills[0].name = "Galick Gun";
      baseSkills[1].name = "Big Bang Attack";
      baseSkills[1].effect = { type: "burn", duration: 2, value: 0.06 };
      baseSkills[1].description = "QUEIMADURA 6% × 2t.";
      baseSkills.push(new Skill({ id: "vegeta_pride", name: "Orgulho Saiyajin", description: "+50% dano por 2t.", type: "buff", cost: 30, cooldown: 3, effect: { multiplier: 1.5, duration: 2 } }));
    } else if (bossId === "freeza") {
      baseSkills[0].name = "Death Beam";
      baseSkills[0].effect = { type: "bleed", duration: 2, value: 0.05 };
      baseSkills[0].description = "SANGRAMENTO 5% × 2t.";
      baseSkills[1].name = "Death Ball";
      baseSkills[1].effect = { type: "burn", duration: 3, value: 0.08 };
      baseSkills[1].description = "QUEIMADURA 8% × 3t.";
      baseSkills.push(new Skill({ id: "freeza_tele", name: "Teletransporte Cruel", description: "Esquiva 100%.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.0 } }));
    } else if (bossId === "cell") {
      baseSkills[0].name = "Kamehameha Perfeito";
      baseSkills[0].effect = { type: "burn", duration: 2, value: 0.07 };
      baseSkills[0].description = "QUEIMADURA 7% × 2t.";
      baseSkills[1].name = "Absorção Celular";
      baseSkills[1].effect = { type: "bleed", duration: 3, value: 0.06 };
      baseSkills[1].description = "SANGRAMENTO 6% × 3t.";
      baseSkills.push(new Skill({ id: "cell_regen", name: "Regeneração Celular", description: "Cura 20% HP.", type: "heal", cost: 40, healPercent: 20, cooldown: 4 }));
    } else if (bossId === "majin_boo") {
      baseSkills[0].name = "Feixe de Chocolate";
      baseSkills[1].name = "Explosão Planetária";
      baseSkills[1].effect = { type: "burn", duration: 2, value: 0.07 };
      baseSkills[1].description = "QUEIMADURA 7% × 2t.";
      baseSkills.push(new Skill({ id: "boo_regen", name: "Regeneração Infinita", description: "Cura 30% HP.", type: "heal", cost: 50, healPercent: 30, cooldown: 5 }));
    } else if (bossId === "orochimaru") {
      baseSkills[0].name = "Kusanagi";
      baseSkills[0].effect = { type: "bleed", duration: 2, value: 0.05 };
      baseSkills[0].description = "SANGRAMENTO 5% × 2t.";
      baseSkills[1].name = "Mãos de Serpente";
      baseSkills.push(new Skill({ id: "oro_poison", name: "Veneno de Cobra", description: "SANGRAMENTO 8% × 3t.", type: "attack", cost: 25, damage: 15, elementType: 'escuridao', cooldown: 2, effect: { type: "bleed", duration: 3, value: 0.08 } }));
    } else if (bossId === "gaara") {
      baseSkills[0].name = "Caixão de Areia";
      baseSkills[1].name = "Funeral de Areia";
      baseSkills[1].effect = { type: "bleed", duration: 3, value: 0.07 };
      baseSkills[1].description = "SANGRAMENTO 7% × 3t.";
      baseSkills.push(new Skill({ id: "gaara_shield", name: "Escudo de Areia", description: "-95% dano recebido.", type: "reaction", cost: 30, cooldown: 3, effect: { type: "damage_reduction", value: 0.05 } }));
    } else if (bossId === "itachi_npc") {
      baseSkills[0].name = "Amaterasu";
      baseSkills[0].effect = { type: "burn", duration: 3, value: 0.08 };
      baseSkills[0].description = "QUEIMADURA 8% × 3t.";
      baseSkills[1].name = "Tsukuyomi";
      baseSkills[1].effect = { type: "stun", duration: 1 };
      baseSkills[1].description = "ATORDOA 1t.";
      baseSkills.push(new Skill({ id: "itachi_crow", name: "Genjutsu de Corvos", description: "ATORDOA 1t.", type: "attack", cost: 40, damage: 30, elementType: 'escuridao', cooldown: 3, effect: { type: "stun", duration: 1 } }));
    } else if (bossId === "pain") {
      baseSkills[0].name = "Shinra Tensei";
      baseSkills[0].damage = 45;
      baseSkills[0].cooldown = 2;
      baseSkills[0].effect = { type: "stun", duration: 1 };
      baseSkills[0].description = "ATORDOA 1t.";
      baseSkills[1].name = "Chibaku Tensei";
      baseSkills[1].damage = 80;
      baseSkills[1].cooldown = 3;
      baseSkills[1].effect = { type: "stun", duration: 1 };
      baseSkills[1].description = "ATORDOA 1t.";
      baseSkills.push(new Skill({ id: "pain_absorb", name: "Absorção de Chakra", description: "Recupera 50 energia.", type: "buff", cost: 0, cooldown: 3 }));
    } else if (bossId === "madara") {
      baseSkills[0].name = "Katon: Goka Mekkyaku";
      baseSkills[1].name = "Susano'o Slash";
      baseSkills.push(new Skill({ id: "madara_meteor", name: "Tengai Shinsei", description: "QUEIMADURA 10% × 3t.", type: "attack", cost: 60, damage: 100, elementType: 'fogo', cooldown: 5, effect: { type: "burn", duration: 3, value: 0.1 } }));
    } else if (bossId === "jaw_titan") {
      baseSkills[0].name = "Mandíbula de Aço";
      baseSkills[1].name = "Garras Devastadoras";
      baseSkills.push(new Skill({ id: "jaw_frenzy", name: "Fúria Predadora", description: "SANGRAMENTO 9% × 3t.", type: "attack", cost: 35, damage: 60, elementType: 'terra', cooldown: 2, effect: { type: "bleed", duration: 3, value: 0.09 } }));
    } else if (bossId === "armored_titan") {
      baseSkills[0].name = "Carga Blindada";
      baseSkills[1].name = "Impacto de Armadura";
      baseSkills.push(new Skill({ id: "armor_shell", name: "Carapaça de Aço", description: "-90% dano recebido.", type: "reaction", cost: 30, cooldown: 2, effect: { type: "damage_reduction", value: 0.10 } }));
      baseSkills.push(new Skill({ id: "armor_slam", name: "Esmagamento de Titã", description: "ATORDOA 1t.", type: "attack", cost: 50, damage: 90, elementType: 'terra', cooldown: 4, effect: { type: "stun", duration: 1 } }));
    } else if (bossId === "attack_titan") {
      baseSkills[0].name = "Punho do Titã";
      baseSkills[1].name = "Fúria de Eren";
      baseSkills.push(new Skill({ id: "founding_scream", name: "Rugido Fundador", description: "ATORDOA 1t. SANGRAMENTO 5% × 2t.", type: "attack", cost: 65, damage: 80, elementType: 'escuridao', cooldown: 5, effect: { type: "stun", duration: 1, bleed: { duration: 2, value: 0.05 } } }));
      baseSkills.push(new Skill({ id: "titan_regen", name: "Regeneração de Titã", description: "Cura 12% HP.", type: "heal", cost: 45, healPercent: 12, cooldown: 5 }));
    } else if (bossId === "f_titan") {
      baseSkills[0].name = "Soco Endurecido";
      baseSkills[1].name = "Grito de Chamada";
      baseSkills.push(new Skill({ id: "titan_harden", name: "Endurecimento Cristalino", description: "-80% dano recebido.", type: "reaction", cost: 25, cooldown: 2, effect: { type: "damage_reduction", value: 0.2 } }));
    } else if (bossId === "colossal_titan") {
      baseSkills[0].name = "Pisada Gigante";
      baseSkills[1].name = "Vapor Escaldante";
      baseSkills.push(new Skill({ id: "titan_steam", name: "Explosão de Vapor", description: "QUEIMADURA 5% × 2t.", type: "attack", cost: 45, damage: 50, elementType: 'fogo', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.05 } }));
    } else if (bossId === "cursed_spirit") {
      baseSkills[0].name = "Golpe Amaldiçoado";
      baseSkills[0].damage = 95;
      baseSkills[1].name = "Energia Maldita";
      baseSkills[1].damage = 140;
      baseSkills.push(new Skill({ id: "cursed_devour", name: "Devorar Maldição", description: "Cura 6% HP.", type: "heal", cost: 40, healPercent: 6, cooldown: 4 }));
      baseSkills.push(new Skill({ id: "cursed_barrier", name: "Domínio Primitivo", description: "-75% dano recebido.", type: "reaction", cost: 30, cooldown: 3, effect: { type: "damage_reduction", value: 0.25 } }));
    } else if (bossId === "aoi_todo") {
      baseSkills[0].name = "Soco Divergente";
      baseSkills[0].damage = 100;
      baseSkills[1].name = "Boogie Woogie";
      baseSkills[1].damage = 120;
      baseSkills[1].description = "ATORDOA 1t.";
      baseSkills[1].effect = { type: "stun", duration: 1 };
      baseSkills[1].cooldown = 3;
      baseSkills.push(new Skill({ id: "todo_clap", name: "Palma Fantasma", description: "ATORDOA 1t. SANGRAMENTO 7% × 2t.", type: "attack", cost: 55, damage: 110, elementType: 'terra', cooldown: 4, effect: { type: "bleed", duration: 2, value: 0.07 } }));
    } else if (bossId === "mahito") {
      baseSkills[0].name = "Transfiguração Leve";
      baseSkills[0].damage = 110;
      baseSkills[0].description = "Dano interno.";
      baseSkills[1].name = "Transfiguração Ídola";
      baseSkills[1].damage = 150;
      baseSkills[1].description = "Dano massivo.";
      baseSkills.push(new Skill({ id: "mahito_domain", name: "Domínio: Autopersonificação da Perfeição", description: "ATORDOA 1t.", type: "attack", cost: 70, damage: 130, elementType: 'escuridao', cooldown: 5, effect: { type: "stun", duration: 1 } }));
      baseSkills.push(new Skill({ id: "mahito_regen", name: "Forma Perfeita", description: "Cura 20% HP.", type: "heal", cost: 45, healPercent: 20, cooldown: 4 }));
    } else if (bossId === "kenjaku") {
      baseSkills[0].name = "Técnica Roubada";
      baseSkills[0].damage = 120;
      baseSkills[1].name = "Invocação Amaldiçoada";
      baseSkills[1].damage = 160;
      baseSkills[1].description = "Invoca maldições acumuladas.";
      baseSkills.push(new Skill({ id: "kenjaku_absorb", name: "Absorção", description: "QUEIMADURA 6% × 3t.", type: "attack", cost: 60, damage: 100, elementType: 'escuridao', cooldown: 4, effect: { type: "burn", duration: 3, value: 0.06 } }));
      baseSkills.push(new Skill({ id: "kenjaku_barrier", name: "Barreira", description: "-80% dano recebido.", type: "reaction", cost: 35, cooldown: 3, effect: { type: "damage_reduction", value: 0.20 } }));
    } else if (bossId === "sukuna") {
      baseSkills[0].name = "Clivar";
      baseSkills[0].damage = 140;
      baseSkills[0].effect = { type: "bleed", duration: 2, value: 0.08 };
      baseSkills[0].description = "SANGRAMENTO 8% × 2t.";
      baseSkills[1].name = "Flecha de Fogo";
      baseSkills[1].damage = 180;
      baseSkills[1].description = "QUEIMADURA 8% × 3t.";
      baseSkills[1].effect = { type: "burn", duration: 3, value: 0.08 };
      baseSkills.push(new Skill({ id: "sukuna_slash", name: "Desmantelar", description: "SANGRAMENTO 10% × 3t.", type: "attack", cost: 55, damage: 160, elementType: 'escuridao', cooldown: 3, effect: { type: "bleed", duration: 3, value: 0.10 } }));
      baseSkills.push(new Skill({ id: "sukuna_domain", name: "Expansão: Santuário Malevolente", description: "ATORDOA 1t.", type: "attack", cost: 90, damage: 200, elementType: 'fogo', cooldown: 7, effect: { type: "stun", duration: 1 } }));
      baseSkills.push(new Skill({ id: "sukuna_regen", name: "Técnica de Cura Reversa", description: "Cura 15% HP.", type: "heal", cost: 50, healPercent: 15, cooldown: 6 }));
    }

    return baseSkills;
  }

  static generateChallengeBossSkills(bossId) {
    const el = this.getBossElement(bossId) || 'escuridao';
    const baseSkills = [
      new Skill({ id: "boss_atk_1", name: "Ataque Rápido", description: "Golpe veloz.", type: "attack", cost: 15, damage: 50, elementType: el }),
      new Skill({ id: "boss_atk_2", name: "Explosão de Energia", description: "Dano em área.", type: "attack", cost: 35, damage: 100, elementType: el }),
      new Skill({ id: "boss_def", name: "Guarda do Boss", description: "-70% dano recebido.", type: "reaction", cost: 20, effect: { type: "damage_reduction", value: 0.3 } })
    ];

    if (bossId === "buggy") {
      baseSkills[0].name = "Bara Bara Ho";
      baseSkills[0].effect = { type: "bleed", duration: 2, value: 0.05 };
      baseSkills[0].description = "SANGRAMENTO 5% × 2t.";
      baseSkills[1].name = "Bara Bara Festival";
      baseSkills.push(new Skill({ id: "buggy_split", name: "Separação", description: "Esquiva 100%.", type: "reaction", cost: 25, cooldown: 2, effect: { type: "damage_reduction", value: 0.0 } }));
    } else if (bossId === "haruta") {
      baseSkills[0].name = "Corte Maldito";
      baseSkills[0].effect = { type: "bleed", duration: 2, value: 0.06 };
      baseSkills[0].description = "SANGRAMENTO 6% × 2t.";
      baseSkills[1].name = "Técnica Amaldiçoada";
      baseSkills[1].effect = { type: "stun", duration: 1 };
      baseSkills[1].description = "ATORDOA 1t.";
      baseSkills.push(new Skill({ id: "haruta_luck", name: "Sorte Milagrosa", description: "-90% dano recebido.", type: "reaction", cost: 30, cooldown: 3, effect: { type: "damage_reduction", value: 0.1 } }));
    } else if (bossId === "neferpitou") {
      baseSkills[0].name = "Terpsichora";
      baseSkills[1].name = "Garra de Gato";
      baseSkills.push(new Skill({ id: "pitou_jump", name: "Salto Predador", description: "ATORDOA 1t.", type: "attack", cost: 40, damage: 80, elementType: 'vento', cooldown: 3, effect: { type: "stun", duration: 1 } }));
    } else if (bossId === "rui") {
      baseSkills[0].name = "Fios de Aço";
      baseSkills[1].name = "Prisão de Fios";
      baseSkills.push(new Skill({ id: "rui_blood", name: "Arte de Sangue", description: "SANGRAMENTO 10% × 3t.", type: "attack", cost: 35, damage: 70, elementType: 'escuridao', cooldown: 2, effect: { type: "bleed", duration: 3, value: 0.1 } }));
    } else if (bossId === "esdeath") {
      baseSkills[0].name = "Weissschnabel";
      baseSkills[1].name = "Grauphorn";
      baseSkills.push(new Skill({ id: "esdeath_freeze", name: "Mahapadma", description: "ATORDOA 2t.", type: "attack", cost: 80, damage: 40, elementType: 'gelo', cooldown: 6, effect: { type: "stun", duration: 2 } }));
    } else if (bossId === "dabi") {
      baseSkills[0].name = "Chamas Azuis";
      baseSkills[0].effect = { type: "burn", duration: 1, value: 0.03 };
      baseSkills[0].description = "QUEIMADURA 3% × 1t.";
      baseSkills[1].name = "Prominence Burn";
      baseSkills[1].effect = { type: "burn", duration: 2, value: 0.04 };
      baseSkills[1].description = "QUEIMADURA 4% × 2t.";
      baseSkills.push(new Skill({ id: "dabi_burn", name: "Cremação", description: "QUEIMADURA 7% × 2t.", type: "attack", cost: 50, damage: 110, elementType: 'fogo', cooldown: 3, effect: { type: "burn", duration: 2, value: 0.07 } }));
    }

    return baseSkills;
  }
}

module.exports = CharacterManager;
