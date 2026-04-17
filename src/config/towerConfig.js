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
          { id: "acid", name: "Ácido", description: "Cospe um jato de ácido corrosivo.", type: "attack", cost: 10, damage: 25, damageType: 'elemental' },
          { id: "self_destruct", name: "Auto-Destruição", description: "O Saibaman se explode, causando dano massivo.", type: "attack", cost: 50, damage: 160, damageType: 'fisico', cooldown: 10 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_1", stoneQty: 3 }
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
          { id: "bara_bara_hou", name: "Bara Bara Hou", description: "Buggy lança sua mão como um projétil.", type: "attack", cost: 15, damage: 40, damageType: 'fisico' },
          { id: "muggy_ball", name: "Muggy Ball", description: "Uma bala de canhão potente e explosiva.", type: "attack", cost: 30, damage: 80, damageType: 'elemental', cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_1", stoneQty: 5 }
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
          { id: "poison_sting", name: "Picada Venenosa", description: "Ataque venenoso que causa sangramento.", type: "attack", cost: 15, damage: 35, damageType: 'fisico', effect: { type: "bleed", duration: 2, value: 0.05 } },
          { id: "fury_swipes", name: "Golpes de Fúria", description: "Uma sequência de arranhões furiosos.", type: "attack", cost: 25, damage: 70, damageType: 'fisico' }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_1", stoneQty: 6 }
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
          { id: "water_dragon", name: "Dragão de Água", description: "Um dragão de água que esmaga o oponente.", type: "attack", cost: 30, damage: 100, damageType: 'elemental' },
          { id: "hidden_mist", name: "Névoa Oculta", description: "Zabuza se esconde na névoa, reduzindo o dano.", type: "reaction", cost: 20, effect: { type: "damage_reduction", value: 0.2 } }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_1", stoneQty: 6 }
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
          { id: "bloodcurdle", name: "Bloodcurdle", description: "Paralisa o oponente ao lamber seu sangue.", type: "attack", cost: 35, damage: 55, damageType: 'fisico', effect: { type: "stun", duration: 1 }, cooldown: 3 },
          { id: "katana_slash", name: "Corte de Katana", description: "Um corte preciso com sua katana.", type: "attack", cost: 15, damage: 85, damageType: 'fisico' }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 2 }
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
          { id: "bungee_gum", name: "Bungee Gum", description: "Cola o oponente com sua aura — causa **SANGRAMENTO**.", type: "attack", cost: 25, damage: 120, damageType: 'fisico', effect: { type: "bleed", duration: 2, value: 0.07 } },
          { id: "texture_surprise", name: "Texture Surprise", description: "Usa sua técnica para enganar o oponente.", type: "reaction", cost: 30, effect: { type: "damage_reduction", value: 0.1 }, cooldown: 2 },
          { id: "hisoka_trick", name: "Ilusão Fatal", description: "Golpe disfarçado que **ATORDOA** o oponente.", type: "attack", cost: 45, damage: 90, damageType: 'fisico', cooldown: 3, effect: { type: "stun", duration: 1 } }
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
        health: 2400,
        energy: 200,
        imageUrl: "https://i.ibb.co/WNfbwhTq/ulquiorra.png",
        skills: [
          { id: "cero", name: "Cero", description: "Um feixe de energia espiritual massivo.", type: "attack", cost: 30, damage: 170, damageType: 'elemental', effect: { type: "burn", duration: 2, value: 0.06 } },
          { id: "luz_de_la_luna", name: "Luz de la Luna", description: "Lança de energia que **ATORDOA** o oponente.", type: "attack", cost: 45, damage: 270, damageType: 'elemental', cooldown: 3, effect: { type: "stun", duration: 1 } },
          { id: "ulquiorra_regen", name: "Hierro", description: "Reduz drasticamente o dano com pele de aço.", type: "reaction", cost: 35, effect: { type: "damage_reduction", value: 0.15 }, cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 6 }
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
          { id: "water_stream", name: "Water Stream Rock Smashing Fist", description: "Uma técnica marcial que desvia e contra-ataca.", type: "attack", cost: 20, damage: 200, damageType: 'fisico', effect: { type: "bleed", duration: 2, value: 0.08 } },
          { id: "adaptation", name: "Adaptação", description: "Garou se adapta ao estilo do oponente.", type: "reaction", cost: 40, effect: { type: "damage_reduction", value: 0.05 }, cooldown: 3 },
          { id: "garou_awakening", name: "Despertar do Monstro", description: "Golpe avassalador que **ATORDOA** e causa **QUEIMADURA**.", type: "attack", cost: 60, damage: 280, damageType: 'fisico', cooldown: 4, effect: { type: "stun", duration: 1 } }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 6 }
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
          { id: "parasite", name: "Parasite", description: "Doflamingo controla o oponente com fios.", type: "attack", cost: 40, damage: 170, damageType: 'fisico', effect: { type: "stun", duration: 1 }, cooldown: 4 },
          { id: "god_thread", name: "God Thread", description: "Dez fios extremamente afiados e potentes.", type: "attack", cost: 60, damage: 420, damageType: 'fisico', cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 2 }
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
          { id: "barrier", name: "Barreira de Energia", description: "Uma barreira impenetrável que anula o dano.", type: "reaction", cost: 30, effect: { type: "damage_reduction", value: 0.0 }, cooldown: 2 },
          { id: "photon_flash", name: "Photon Flash", description: "Uma rajada de energia concentrada.", type: "attack", cost: 50, damage: 600, damageType: 'elemental' }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 3 }
    }
  ]
};
