module.exports = {
  name: "Torre Infinita",
  floors: [
    {
      floor: 1,
      boss: {
        id: "saibaman",
        name: "Saibaman",
        anime: "Dragon Ball",
        level: 1,
        health: 80,
        energy: 80,
        imageUrl: "https://i.ibb.co/ZzCShXXZ/imagem-2026-04-13-000145492.png",
        skills: [
          { id: "acid", name: "Ácido", description: "Jato de ácido.", type: "attack", cost: 10, damage: 35, elementType: 'escuridao' },
          { id: "self_destruct", name: "Auto-Destruição", description: "Explosão massiva.", type: "attack", cost: 50, damage: 200, elementType: 'escuridao', cooldown: 10 }
        ]
      },
      reward: { zenith: 5, stoneId: "soul_stone_1", stoneQty: 4 }
    },
    {
      floor: 2,
      boss: {
        id: "buggytower",
        name: "Buggy o Palhaço",
        anime: "One Piece",
        level: 5,
        health: 200,
        energy: 90,
        imageUrl: "https://i.ibb.co/W4zbscC8/image.png",
        skills: [
          { id: "bara_bara_hou", name: "Bara Bara Hou", description: "Projétil de partes do corpo.", type: "attack", cost: 15, damage: 55, elementType: 'vento' },
          { id: "muggy_ball", name: "Muggy Ball", description: "Bala explosiva.", type: "attack", cost: 30, damage: 115, elementType: 'vento', cooldown: 2 }
        ]
      },
      reward: { zenith: 5, stoneId: "soul_stone_1", stoneQty: 6 }
    },
    {
      floor: 3,
      boss: {
        id: "team_rocket",
        name: "Equipe Rocket",
        anime: "Pokémon",
        level: 5,
        health: 420,
        energy: 100,
        imageUrl: "https://i.ibb.co/hRnNysMq/image.png",
        skills: [
          { id: "poison_sting", name: "Picada Venenosa", description: "SANGRAMENTO 5% × 2t.", type: "attack", cost: 15, damage: 50, elementType: 'escuridao', effect: { type: "bleed", duration: 2, value: 0.05 } },
          { id: "fury_swipes", name: "Golpes de Fúria", description: "Sequência de arranhões.", type: "attack", cost: 25, damage: 100, elementType: 'escuridao' }
        ]
      },
      reward: { zenith: 5, stoneId: "soul_stone_1", stoneQty: 6 }
    },
    {
      floor: 4,
      boss: {
        id: "zabuza",
        name: "Zabuza Momochi",
        anime: "Naruto",
        level: 8,
        health: 1100,
        energy: 120,
        imageUrl: "https://i.ibb.co/Kx6tpC71/imagem-2026-04-13-000846945.png",
        skills: [
          { id: "water_dragon", name: "Dragão de Água", description: "Dragão de água.", type: "attack", cost: 30, damage: 145, elementType: 'agua' },
          { id: "hidden_mist", name: "Névoa Oculta", description: "-80% dano recebido.", type: "reaction", cost: 20, effect: { type: "damage_reduction", value: 0.2 } }
        ]
      },
      reward: { zenith: 5, stoneId: "soul_stone_1", stoneQty: 7 }
    },
    {
      floor: 5,
      boss: {
        id: "stain",
        name: "Stain (Assassino de Heróis)",
        anime: "My Hero Academia",
        level: 10,
        health: 1600,
        energy: 140,
        imageUrl: "https://i.ibb.co/Y42BcR1m/stain.png",
        skills: [
          { id: "bloodcurdle", name: "Bloodcurdle", description: "ATORDOA 1t.", type: "attack", cost: 35, damage: 85, elementType: 'escuridao', effect: { type: "stun", duration: 1 }, cooldown: 3 },
          { id: "katana_slash", name: "Corte de Katana", description: "Corte preciso.", type: "attack", cost: 15, damage: 120, elementType: 'escuridao' }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 4 }
    },
    {
      floor: 6,
      boss: {
        id: "hisoka",
        name: "Hisoka Morrow",
        anime: "Hunter x Hunter",
        level: 15,
        health: 1500,
        energy: 160,
        imageUrl: "https://i.ibb.co/sJHrDnjk/image.png",
        skills: [
          { id: "bungee_gum", name: "Bungee Gum", description: "SANGRAMENTO 7% × 2t.", type: "attack", cost: 25, damage: 85, elementType: 'escuridao', effect: { type: "bleed", duration: 2, value: 0.07 } },
          { id: "texture_surprise", name: "Texture Surprise", description: "-90% dano recebido.", type: "reaction", cost: 30, effect: { type: "damage_reduction", value: 0.1 }, cooldown: 2 },
          { id: "hisoka_trick", name: "Ilusão Fatal", description: "ATORDOA 1t.", type: "attack", cost: 45, damage: 60, elementType: 'escuridao', cooldown: 3, effect: { type: "stun", duration: 1 } }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 4 }
    },
    {
      floor: 7,
      boss: {
        id: "ulquiorra",
        name: "Ulquiorra Cifer",
        anime: "Bleach",
        level: 20,
        health: 2300,
        energy: 200,
        imageUrl: "https://i.ibb.co/WNfbwhTq/ulquiorra.png",
        skills: [
          { id: "cero", name: "Cero", description: "QUEIMADURA 6% × 2t.", type: "attack", cost: 30, damage: 95, elementType: 'escuridao', effect: { type: "burn", duration: 2, value: 0.06 } },
          { id: "luz_de_la_luna", name: "Luz de la Luna", description: "ATORDOA 1t.", type: "attack", cost: 45, damage: 170, elementType: 'escuridao', cooldown: 3, effect: { type: "stun", duration: 1 } },
          { id: "ulquiorra_regen", name: "Hierro", description: "-85% dano recebido.", type: "reaction", cost: 35, effect: { type: "damage_reduction", value: 0.15 }, cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 5 }
    },
    {
      floor: 8,
      boss: {
        id: "garou",
        name: "Garou",
        anime: "One Punch Man",
        level: 30,
        health: 2800,
        energy: 250,
        imageUrl: "https://i.ibb.co/7NB2B7fd/image.png",
        skills: [
          { id: "water_stream", name: "Water Stream Rock Smashing Fist", description: "SANGRAMENTO 8% × 2t.", type: "attack", cost: 20, damage: 110, elementType: 'terra', effect: { type: "bleed", duration: 2, value: 0.08 } },
          { id: "adaptation", name: "Adaptação", description: "-95% dano recebido.", type: "reaction", cost: 40, effect: { type: "damage_reduction", value: 0.05 }, cooldown: 3 },
          { id: "garou_awakening", name: "Despertar do Monstro", description: "ATORDOA 1t.", type: "attack", cost: 60, damage: 170, elementType: 'terra', cooldown: 4, effect: { type: "stun", duration: 1 } }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 5 }
    },
    {
      floor: 9,
      boss: {
        id: "doflamingo",
        name: "Donquixote Doflamingo",
        anime: "One Piece",
        level: 40,
        health: 3600,
        energy: 300,
        imageUrl: "https://i.ibb.co/LzYz4CfF/donflamingo.png",
        skills: [
          { id: "parasite", name: "Parasite", description: "ATORDOA 1t.", type: "attack", cost: 40, damage: 60, elementType: 'vento', effect: { type: "stun", duration: 1 }, cooldown: 4 },
          { id: "god_thread", name: "God Thread", description: "Dez fios afiados.", type: "attack", cost: 60, damage: 200, elementType: 'vento', cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 3 }
    },
    {
      floor: 10,
      boss: {
        id: "android17",
        name: "Android 17",
        anime: "Dragon Ball Super",
        level: 45,
        health: 5000,
        energy: 400,
        imageUrl: "https://i.ibb.co/CpFBHb9T/image.png",
        skills: [
          { id: "barrier", name: "Barreira de Energia", description: "Anula 100% do dano.", type: "reaction", cost: 30, effect: { type: "damage_reduction", value: 0.0 }, cooldown: 2 },
          { id: "photon_flash", name: "Photon Flash", description: "Rajada de energia.", type: "attack", cost: 50, damage: 300, elementType: 'raio' }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 3 }
    },
    {
      floor: 11,
      boss: {
        id: "npc_shigaraki",
        name: "Tomura Shigaraki",
        anime: "My Hero Academia",
        level: 55,
        health: 6000,
        energy: 450,
        imageUrl: "https://i.ibb.co/MkDR0qfm/shigaraki.png",
        skills: [
          { id: "decay", name: "Decaimento", description: "SANGRAMENTO 8% × 3t.", type: "attack", cost: 35, damage: 170, elementType: 'escuridao', effect: { type: "bleed", duration: 3, value: 0.08 } },
          { id: "tombamento_catastrofico", name: "Tombamento Catastrófico", description: "-20% dano do alvo por 2t.", type: "attack", cost: 50, damage: 260, elementType: 'escuridao', effect: { type: "debuff_damage", value: 0.20, duration: 2 } },
          { id: "apocalipse_total", name: "Apocalipse Total", description: "Destruição em massa.", type: "attack", cost: 70, damage: 460, elementType: 'escuridao', cooldown: 4 },
          { id: "regen_maligna", name: "Regeneração Maligna", description: "-80% dano recebido.", type: "reaction", cost: 35, effect: { type: "damage_reduction", value: 0.20 }, cooldown: 3 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 3 }
    },
    {
      floor: 12,
      boss: {
        id: "npc_alucard",
        name: "Alucard",
        anime: "Hellsing",
        level: 60,
        health: 8000,
        energy: 500,
        imageUrl: "https://i.ibb.co/xVW6J45/alucard.png",
        skills: [
          { id: "dreno_vampirico", name: "Dreno Vampírico", description: "Força vital absorvida.", type: "attack", cost: 30, damage: 200, elementType: 'escuridao' },
          { id: "pesadelo_infernal", name: "Pesadelo Infernal", description: "QUEIMADURA 8% × 3t.", type: "attack", cost: 35, damage: 165, elementType: 'escuridao', effect: { type: "burn", duration: 3, value: 0.08 } },
          { id: "realidade_transcendente", name: "Realidade Transcendente", description: "Poder além da compreensão.", type: "attack", cost: 80, damage: 580, elementType: 'escuridao', cooldown: 4 },
          { id: "regen_nosferatu", name: "Regeneração Nosferatu", description: "-85% dano recebido.", type: "reaction", cost: 40, effect: { type: "damage_reduction", value: 0.15 }, cooldown: 3 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 3 }
    },
    {
      floor: 13,
      boss: {
        id: "npc_kaido",
        name: "Kaido dos Cem Dragões",
        anime: "One Piece",
        level: 65,
        health: 10000,
        energy: 600,
        imageUrl: "https://i.ibb.co/s90gfv7V/kaido.png",
        skills: [
          { id: "boro_breath", name: "Boro Breath", description: "QUEIMADURA 10% × 2t.", type: "attack", cost: 40, damage: 280, elementType: 'fogo', effect: { type: "burn", duration: 2, value: 0.10 } },
          { id: "ragnarok_kaido", name: "Ragnarok", description: "Pancada colossal do dragão.", type: "attack", cost: 45, damage: 360, elementType: 'terra' },
          { id: "forma_dragao", name: "Forma do Dragão", description: "-20% dano do alvo por 2t.", type: "attack", cost: 45, damage: 215, elementType: 'fogo', effect: { type: "debuff_damage", value: 0.20, duration: 2 } },
          { id: "bolo_meteoro", name: "Bolo Meteoro", description: "Meteoro de escamas flamejantes.", type: "attack", cost: 80, damage: 670, elementType: 'fogo', cooldown: 4 },
          { id: "dureza_dragao", name: "Dureza do Dragão", description: "-80% dano recebido.", type: "reaction", cost: 40, effect: { type: "damage_reduction", value: 0.20 }, cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 3 }
    },
    {
      floor: 14,
      boss: {
        id: "npc_kaguya",
        name: "Kaguya Otsutsuki",
        anime: "Naruto",
        level: 70,
        health: 12500,
        energy: 700,
        imageUrl: "https://i.ibb.co/Nd1QSvS8/kaguya.png",
        skills: [
          { id: "ash_killing_bones", name: "Ash Killing Bones", description: "SANGRAMENTO 10% × 3t.", type: "attack", cost: 40, damage: 230, elementType: 'gelo', effect: { type: "bleed", duration: 3, value: 0.10 } },
          { id: "dimensao_divina", name: "Dimensão Divina", description: "Desvio dimensional.", type: "attack", cost: 50, damage: 320, elementType: 'gelo' },
          { id: "chuva_chakra", name: "Chuva de Chakra", description: "QUEIMADURA 8% × 2t.", type: "attack", cost: 35, damage: 200, elementType: 'luz', effect: { type: "burn", duration: 2, value: 0.08 } },
          { id: "hagoromo_nata", name: "Hagoromo no Nata", description: "Corte divino devastador.", type: "attack", cost: 80, damage: 790, elementType: 'gelo', cooldown: 5 },
          { id: "escudo_dimensional", name: "Escudo Dimensional", description: "-90% dano recebido.", type: "reaction", cost: 50, effect: { type: "damage_reduction", value: 0.10 }, cooldown: 3 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 4 }
    },
    {
      floor: 15,
      boss: {
        id: "npc_akaza",
        name: "Akaza (Lua Superior 3)",
        anime: "Demon Slayer",
        level: 80,
        health: 15500,
        energy: 1000,
        imageUrl: "https://i.ibb.co/zVhgzDQ9/akaza.png",
        skills: [
          { id: "tekken_saneku", name: "Tekken Saneku", description: "SANGRAMENTO 10% × 3t.", type: "attack", cost: 40, damage: 320, elementType: 'fogo', effect: { type: "bleed", duration: 3, value: 0.10 } },
          { id: "soryu_kokushi", name: "Soryu Kokushi Juhatsu", description: "QUEIMADURA 10% × 2t.", type: "attack", cost: 60, damage: 530, elementType: 'fogo', effect: { type: "burn", duration: 2, value: 0.10 }, cooldown: 2 },
          { id: "akaza_enfraquece", name: "Arte Sanguínea: Lamento", description: "-25% dano do alvo por 2t.", type: "attack", cost: 50, damage: 410, elementType: 'fogo', effect: { type: "debuff_damage", value: 0.25, duration: 2 } },
          { id: "haja_rengoku", name: "Haja Rengoku", description: "Golpe supremo — devastador.", type: "attack", cost: 80, damage: 940, elementType: 'fogo', cooldown: 4 },
          { id: "regen_demoniaca", name: "Regeneração Demoníaca", description: "-95% dano recebido.", type: "reaction", cost: 60, effect: { type: "damage_reduction", value: 0.05 }, cooldown: 3 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 4 }
    }
  ]
};
