module.exports = {
  difficulties: {
    facil: {
      name: "Fácil",
      emoji: "🟢",
      cooldown: 3600000, // 1 hora em ms
      bosses: [
        {
          id: "buggy",
          name: "Buggy",
          anime: "One Piece",
          level: 20,
          health: 2500,
          energy: 150,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png", // Placeholder
          reward: { fr: [5, 10], soul_stone_1: [2, 3] }
        },
        {
          id: "haruta",
          name: "Haruta",
          anime: "Jujutsu Kaisen",
          level: 20,
          health: 2500,
          energy: 150,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png", // Placeholder
          reward: { fr: [5, 10], soul_stone_1: [2, 3] }
        }
      ]
    },
    medio: {
      name: "Médio",
      emoji: "🟡",
      cooldown: 3600000,
      bosses: [
        {
          id: "neferpitou",
          name: "Neferpitou",
          anime: "Hunter x Hunter",
          level: 50,
          health: 8000,
          energy: 300,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          reward: { fr: [10, 15], soul_stone_2: [2, 3] }
        },
        {
          id: "rui",
          name: "Rui",
          anime: "Demon Slayer",
          level: 50,
          health: 8000,
          energy: 300,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          reward: { fr: [10, 15], soul_stone_2: [2, 3] }
        }
      ]
    },
    dificil: {
      name: "Difícil",
      emoji: "🔴",
      cooldown: 3600000,
      bosses: [
        {
          id: "esdeath",
          name: "Esdeath",
          anime: "Akame ga Kill",
          level: 100,
          health: 25000,
          energy: 600,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          reward: { fr: [20, 30], soul_stone_3: [1, 1], soul_stone_2: [1, 2] }
        },
        {
          id: "dabi",
          name: "Dabi",
          anime: "Boku no Hero Academia",
          level: 100,
          health: 25000,
          energy: 600,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          reward: { fr: [20, 30], soul_stone_3: [1, 1], soul_stone_2: [1, 2] }
        }
      ]
    }
  }
};
