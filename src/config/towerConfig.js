module.exports = {
  name: "Torre Infinita",
  floors: [
    {
      floor: 1,
      boss: {
        id: "saibaman",
        name: "Saibaman",
        anime: "Dragon Ball",
        level: 5,
        health: 100,
        energy: 80,
        imageUrl: "https://i.ibb.co/v6YmR0K/saibaman.png",
        skills: [
          { id: "acid", name: "Ácido", type: "attack", cost: 10, damage: 15, damageType: 'elemental' },
          { id: "self_destruct", name: "Auto-Destruição", type: "attack", cost: 50, damage: 100, damageType: 'fisico', cooldown: 10 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_1", stoneQty: 1 }
    },
    {
      floor: 2,
      boss: {
        id: "buggy",
        name: "Buggy o Palhaço",
        anime: "One Piece",
        level: 10,
        health: 300,
        energy: 90,
        imageUrl: "https://i.ibb.co/8Y6yR0K/buggy.png",
        skills: [
          { id: "bara_bara_hou", name: "Bara Bara Hou", type: "attack", cost: 15, damage: 25, damageType: 'fisico' },
          { id: "muggy_ball", name: "Muggy Ball", type: "attack", cost: 30, damage: 50, damageType: 'elemental', cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_1", stoneQty: 2 }
    },
    {
      floor: 3,
      boss: {
        id: "team_rocket",
        name: "Equipe Rocket",
        anime: "Pokémon",
        level: 15,
        health: 600,
        energy: 100,
        imageUrl: "https://i.ibb.co/9Y6yR0K/team_rocket.png",
        skills: [
          { id: "poison_sting", name: "Picada Venenosa", type: "attack", cost: 15, damage: 20, damageType: 'fisico', effect: { type: "bleed", duration: 2, value: 0.05 } },
          { id: "fury_swipes", name: "Golpes de Fúria", type: "attack", cost: 25, damage: 45, damageType: 'fisico' }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_1", stoneQty: 3 }
    },
    {
      floor: 4,
      boss: {
        id: "zabuza",
        name: "Zabuza Momochi",
        anime: "Naruto",
        level: 20,
        health: 1900,
        energy: 120,
        imageUrl: "https://i.ibb.co/AY6yR0K/zabuza.png",
        skills: [
          { id: "water_dragon", name: "Dragão de Água", type: "attack", cost: 30, damage: 60, damageType: 'elemental' },
          { id: "hidden_mist", name: "Névoa Oculta", type: "reaction", cost: 20, effect: { type: "damage_reduction", value: 0.2 } }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_1", stoneQty: 5 }
    },
    {
      floor: 5,
      boss: {
        id: "stain",
        name: "Stain (Assassino de Heróis)",
        anime: "My Hero Academia",
        level: 25,
        health: 3000,
        energy: 140,
        imageUrl: "https://i.ibb.co/BY6yR0K/stain.png",
        skills: [
          { id: "bloodcurdle", name: "Bloodcurdle", type: "attack", cost: 35, damage: 30, damageType: 'fisico', effect: { type: "stun", duration: 1 }, cooldown: 3 },
          { id: "katana_slash", name: "Corte de Katana", type: "attack", cost: 15, damage: 50, damageType: 'fisico' }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 1 }
    },
    {
      floor: 6,
      boss: {
        id: "hisoka",
        name: "Hisoka Morrow",
        anime: "Hunter x Hunter",
        level: 30,
        health: 4000,
        energy: 160,
        imageUrl: "https://i.ibb.co/CY6yR0K/hisoka.png",
        skills: [
          { id: "bungee_gum", name: "Bungee Gum", type: "attack", cost: 25, damage: 70, damageType: 'fisico' },
          { id: "texture_surprise", name: "Texture Surprise", type: "reaction", cost: 30, effect: { type: "damage_reduction", value: 0.1 }, cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 2 }
    },
    {
      floor: 7,
      boss: {
        id: "ulquiorra",
        name: "Ulquiorra Cifer",
        anime: "Bleach",
        level: 35,
        health: 6000,
        energy: 200,
        imageUrl: "https://i.ibb.co/DY6yR0K/ulquiorra.png",
        skills: [
          { id: "cero", name: "Cero", type: "attack", cost: 30, damage: 100, damageType: 'elemental' },
          { id: "luz_de_la_luna", name: "Luz de la Luna", type: "attack", cost: 45, damage: 150, damageType: 'elemental', cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_2", stoneQty: 3 }
    },
    {
      floor: 8,
      boss: {
        id: "garou",
        name: "Garou",
        anime: "One Punch Man",
        level: 40,
        health: 7500,
        energy: 250,
        imageUrl: "https://i.ibb.co/EY6yR0K/garou.png",
        skills: [
          { id: "water_stream", name: "Water Stream Rock Smashing Fist", type: "attack", cost: 20, damage: 120, damageType: 'fisico' },
          { id: "adaptation", name: "Adaptação", type: "reaction", cost: 40, effect: { type: "damage_reduction", value: 0.05 }, cooldown: 3 }
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
        level: 45,
        health: 10000,
        energy: 300,
        imageUrl: "https://i.ibb.co/FY6yR0K/doflamingo.png",
        skills: [
          { id: "parasite", name: "Parasite", type: "attack", cost: 40, damage: 100, damageType: 'fisico', effect: { type: "stun", duration: 1 }, cooldown: 4 },
          { id: "god_thread", name: "God Thread", type: "attack", cost: 60, damage: 250, damageType: 'fisico', cooldown: 2 }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 1 }
    },
    {
      floor: 10,
      boss: {
        id: "android17",
        name: "Android 17",
        anime: "Dragon Ball Super",
        level: 50,
        health: 15000,
        energy: 400,
        imageUrl: "https://i.ibb.co/GY6yR0K/android17.png",
        skills: [
          { id: "barrier", name: "Barreira de Energia", type: "reaction", cost: 30, effect: { type: "damage_reduction", value: 0.0 }, cooldown: 2 },
          { id: "photon_flash", name: "Photon Flash", type: "attack", cost: 50, damage: 350, damageType: 'elemental' }
        ]
      },
      reward: { zenith: 10, stoneId: "soul_stone_3", stoneQty: 3 }
    }
  ]
};
