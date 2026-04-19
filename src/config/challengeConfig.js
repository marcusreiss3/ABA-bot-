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
          level: 5,
          health: 250,
          energy: 150,
          imageUrl: "https://i.ibb.co/W4zbscC8/image.png",
          reward: { fr: [5, 10], soul_stone_1: [2, 3] }
        },
        {
          id: "haruta",
          name: "Haruta",
          anime: "Jujutsu Kaisen",
          level: 5,
          health: 250,
          energy: 150,
          imageUrl: "https://i.ibb.co/1GsJw1MR/imagem-2026-04-13-002851776.png",
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
          level: 20,
          health: 2500,
          energy: 300,
          imageUrl: "https://i.ibb.co/9mr7K4T7/image.png",
          reward: { fr: [10, 15], soul_stone_2: [2, 3] }
        },
        {
          id: "rui",
          name: "Rui",
          anime: "Demon Slayer",
          level: 20,
          health: 2500,
          energy: 300,
          imageUrl: "https://i.ibb.co/7dddgxzF/image.png",
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
          level: 50,
          health: 6000,
          energy: 600,
          imageUrl: "https://i.ibb.co/SXJz76TT/imagem-2026-04-13-003343874.png",
          reward: { fr: [13, 20], soul_stone_3: [1, 1], soul_stone_2: [1, 2] }
        },
        {
          id: "dabi",
          name: "Dabi",
          anime: "Boku no Hero Academia",
          level: 50,
          health: 6000,
          energy: 600,
          imageUrl: "https://i.ibb.co/qMsqzsHB/imagem-2026-04-13-003515489.png",
          reward: { fr: [13, 20], soul_stone_3: [1, 1], soul_stone_2: [1, 2] }
        }
      ]
    }
  }
};
