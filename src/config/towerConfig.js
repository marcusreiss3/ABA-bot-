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
        health: 60,
        energy: 80,
        imageUrl: "https://i.ibb.co/ZzCShXXZ/imagem-2026-04-13-000145492.png",
        skills: [
          { id: "acid", name: "Ácido", description: "Jato de ácido.", type: "attack", cost: 10, damage: 25, elementType: 'escuridao' },
          { id: "self_destruct", name: "Auto-Destruição", description: "Explosão massiva.", type: "attack", cost: 50, damage: 160, elementType: 'escuridao', cooldown: 10 }
        ]
      },
      reward: { zenith: 5, stoneId: "soul_stone_1", stoneQty: 5 }
    },
    {
      floor: 2,
      boss: {
        id: "buggytower",
        name: "Buggy o Palhaço",
        anime: "One Piece",
        level: 5,
        health: 150,
        energy: 90,
        imageUrl: "https://i.ibb.co/W4zbscC8/image.png",
        skills: [
          { id: "bara_bara_hou", name: "Bara Bara Hou", description: "Projétil de partes do corpo.", type: "attack", cost: 15, damage: 40, elementType: 'vento' },
          { id: "muggy_ball", name: "Muggy Ball", description: "Bala explosiva.", type: "attack", cost: 30, damage: 80, elementType: 'vento', cooldown: 2 }
        ]
      },
      reward: { zenith: 5, stoneId: "soul_stone_1", stoneQty: 7 }
    },
    {
      floor: 3,
      boss: {
        id: "team_rocket",
        name: "Equipe Rocket",
        anime: "Pokémon",
        level: 5,
        health: 300,
        energy: 100,
        imageUrl: "https://i.ibb.co/hRnNysMq/image.png",
        skills: [
          { id: "poison_sting", name: "Picada Venenosa", description: "SANGRAMENTO 5% × 2t.", type: "attack", cost: 15, damage: 35, elementType: 'escuridao', effect: { type: "bleed", duration: 2, value: 0.05 } },
          { id: "fury_swipes", name: "Golpes de Fúria", description: "Sequência de arranhões.", type: "attack", cost: 25, damage: 70, elementType: 'escuridao' }
        ]
      },
      reward: { zenith: 5, stoneId: "soul_stone_1", stoneQty: 8 }
    },
    {
      floor: 4,
      boss: {
        id: "zabuza",
        name: "Zabuza Momochi",
        anime: "Naruto",
        level: 8,
        health: 800,
        energy: 120,
        imageUrl: "https://i.ibb.co/Kx6tpC71/imagem-2026-04-13-000846945.png",
        skills: [
          { id: "water_dragon", name: "Dragão de Água", description: "Dragão de água.", type: "attack", cost: 30, damage: 100, elementType: 'agua' },
          { id: "hidden_mist", name: "Névoa Oculta", description: "-80% dano recebido.", type: "reaction", cost: 20, effect: { type: "damage_reduction", value: 0.2 } }
        ]
      },
      reward: { zenith: 5, stoneId: "soul_stone_1", stoneQty: 10 }
    },
    {
      floor: 5,
      boss: {
        id: "stain",
        name: "Stain (Assassino de Heróis)",
        anime: "My Hero Academia",
        level: 10,
        health: 1200,
        energy: 140,
        imageUrl: "https://i.ibb.co/Y42BcR1m/stain.png",
        skills: [
          { id: "bloodcurdle", name: "Bloodcurdle", description: "ATORDOA 1t.", type: "attack", cost: 35, damage: 55, elementType: 'escuridao', effect: { type: "stun", duration: 1 }, cooldown: 3 },
          { id: "katana_slash", name: "Corte de Katana", description: "Corte preciso.", type: "attack", cost: 15, damage: 85, elementType: 'escuridao' }
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
        health: 1600,
        energy: 160,
        imageUrl: "https://i.ibb.co/sJHrDnjk/image.png",
        skills: [
          { id: "bungee_gum", name: "Bungee Gum", description: "SANGRAMENTO 7% × 2t.", type: "attack", cost: 25, damage: 120, elementType: 'escuridao', effect: { type: "bleed", duration: 2, value: 0.07 } },
          { id: "texture_surprise", name: "Texture Surprise", description: "-90% dano recebido.", type: "reaction", cost: 30, effect: { type: "damage_reduction", value: 0.1 }, cooldown: 2 },
          { id: "hisoka_trick", name: "Ilusão Fatal", description: "ATORDOA 1t.", type: "attack", cost: 45, damage: 90, elementType: 'escuridao', cooldown: 3, effect: { type: "stun", duration: 1 } }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 6 }
    },
    {
      floor: 7,
      boss: {
        id: "ulquiorra",
        name: "Ulquiorra Cifer",
        anime: "Bleach",
        level: 20,
        health: 2400,
        energy: 200,
        imageUrl: "https://i.ibb.co/WNfbwhTq/ulquiorra.png",
        skills: [
          { id: "cero", name: "Cero", description: "QUEIMADURA 6% × 2t.", type: "attack", cost: 30, damage: 170, elementType: 'escuridao', effect: { type: "burn", duration: 2, value: 0.06 } },
          { id: "luz_de_la_luna", name: "Luz de la Luna", description: "ATORDOA 1t.", type: "attack", cost: 45, damage: 270, elementType: 'escuridao', cooldown: 3, effect: { type: "stun", duration: 1 } },
          { id: "ulquiorra_regen", name: "Hierro", description: "-85% dano recebido.", type: "reaction", cost: 35, effect: { type: "damage_reduction", value: 0.15 }, cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 8 }
    },
    {
      floor: 8,
      boss: {
        id: "garou",
        name: "Garou",
        anime: "One Punch Man",
        level: 30,
        health: 3000,
        energy: 250,
        imageUrl: "https://i.ibb.co/7NB2B7fd/image.png",
        skills: [
          { id: "water_stream", name: "Water Stream Rock Smashing Fist", description: "SANGRAMENTO 8% × 2t.", type: "attack", cost: 20, damage: 200, elementType: 'terra', effect: { type: "bleed", duration: 2, value: 0.08 } },
          { id: "adaptation", name: "Adaptação", description: "-95% dano recebido.", type: "reaction", cost: 40, effect: { type: "damage_reduction", value: 0.05 }, cooldown: 3 },
          { id: "garou_awakening", name: "Despertar do Monstro", description: "ATORDOA 1t.", type: "attack", cost: 60, damage: 280, elementType: 'terra', cooldown: 4, effect: { type: "stun", duration: 1 } }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 8 }
    },
    {
      floor: 9,
      boss: {
        id: "doflamingo",
        name: "Donquixote Doflamingo",
        anime: "One Piece",
        level: 40,
        health: 4000,
        energy: 300,
        imageUrl: "https://i.ibb.co/LzYz4CfF/donflamingo.png",
        skills: [
          { id: "parasite", name: "Parasite", description: "ATORDOA 1t.", type: "attack", cost: 40, damage: 170, elementType: 'vento', effect: { type: "stun", duration: 1 }, cooldown: 4 },
          { id: "god_thread", name: "God Thread", description: "Dez fios afiados.", type: "attack", cost: 60, damage: 420, elementType: 'vento', cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 4 }
    },
    {
      floor: 10,
      boss: {
        id: "android17",
        name: "Android 17",
        anime: "Dragon Ball Super",
        level: 45,
        health: 6000,
        energy: 400,
        imageUrl: "https://i.ibb.co/CpFBHb9T/image.png",
        skills: [
          { id: "barrier", name: "Barreira de Energia", description: "Anula 100% do dano.", type: "reaction", cost: 30, effect: { type: "damage_reduction", value: 0.0 }, cooldown: 2 },
          { id: "photon_flash", name: "Photon Flash", description: "Rajada de energia.", type: "attack", cost: 50, damage: 600, elementType: 'raio' }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 6 }
    }
  ]
};
