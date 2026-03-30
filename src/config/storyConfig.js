module.exports = {
  worlds: [
    {
      id: "dragonball",
      name: "Universo Dragon Ball",
      emoji: "🐉",
      bosses: [
        {
          id: "raditz",
          name: "Raditz",
          shortName: "Raditz",
          level: 15,
          health: 1200,
          energy: 100,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          dialogue: "[Raditz]- Um verme como você ousa me enfrentar? Prepare-se para ser esmagado!",
          reward: { zenith: 250, stoneId: "soul_stone_1", stoneQty: 3 }
        },
        {
          id: "vegeta",
          name: "Vegeta",
          shortName: "Vegeta",
          level: 25,
          health: 2000,
          energy: 120,
          imageUrl: "https://i.imgur.com/7p6m0S0.png",
          dialogue: "[Vegeta]- Eu sou o Príncipe dos Saiyajins! Não permitirei que um estranho interfira nos meus planos!",
          reward: { zenith: 250, stoneId: "soul_stone_1", stoneQty: 5 }
        },
        {
          id: "freeza",
          name: "Freeza",
          shortName: "Freeza",
          level: 35,
          health: 3500,
          energy: 150,
          imageUrl: "https://i.imgur.com/3Fz1k1X.png",
          dialogue: "[Freeza]- O que? Quem é você?! Chegou para morrer aqui também?! Sinta o desespero perante o Imperador do Universo!",
          reward: { zenith: 250, stoneId: "soul_stone_1", stoneQty: 8 }
        },
        {
          id: "cell",
          name: "Cell (Forma Perfeita)",
          shortName: "Cell",
          level: 45,
          health: 5000,
          energy: 180,
          imageUrl: "https://i.imgur.com/xH5Uv7G.png",
          dialogue: "[Cell]- Um novo espécime apareceu? Espero que você me proporcione o entretenimento que os outros falharam em dar.",
          reward: { zenith: 250, stoneId: "soul_stone_1", stoneQty: 10 }
        },
        {
          id: "majin_boo",
          name: "Majin Boo",
          shortName: "Majin Boo",
          level: 55,
          health: 7000,
          energy: 200,
          imageUrl: "https://i.imgur.com/6X2B9Hw.png",
          dialogue: "[Majin Boo]- Buu vai te transformar em chocolate! Buu vai te comer!",
          reward: { zenith: 250, stoneId: "soul_stone_1", stoneQty: 15 },
          unlocksWorld: "naruto"
        }
      ]
    },
    {
      id: "naruto",
      name: "Universo Naruto",
      emoji: "🍃",
      bosses: [
        {
          id: "orochimaru",
          name: "Orochimaru",
          shortName: "Orochimaru",
          level: 65,
          health: 8500,
          energy: 220,
          imageUrl: "https://i.imgur.com/K3G2M1n.png",
          dialogue: "[Orochimaru]- Que corpo interessante você tem... Sinto que ele seria um excelente receptáculo para minhas ambições.",
          reward: { zenith: 250, stoneId: "soul_stone_2", stoneQty: 5 }
        },
        {
          id: "gaara",
          name: "Gaara",
          shortName: "Gaara",
          level: 75,
          health: 10000,
          energy: 250,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          dialogue: "[Gaara]- Minha areia tem sede de sangue. Você será o próximo sacrifício para provar minha existência.",
          reward: { zenith: 250, stoneId: "soul_stone_2", stoneQty: 8 }
        },
        {
          id: "itachi",
          name: "Itachi Uchiha",
          shortName: "Itachi",
          level: 85,
          health: 12000,
          energy: 280,
          imageUrl: "https://i.imgur.com/v8F9X7y.png",
          dialogue: "[Itachi]- Você já está sob meu genjutsu. Por que lutar contra o inevitável?",
          reward: { zenith: 250, stoneId: "soul_stone_2", stoneQty: 12 }
        },
        {
          id: "pain",
          name: "Pain (Caminho Deva)",
          shortName: "Pain",
          level: 95,
          health: 15000,
          energy: 300,
          imageUrl: "https://i.imgur.com/9n9V2Uu.png",
          dialogue: "[Pain]- O mundo conhecerá a dor. E você será o primeiro a senti-la neste novo ciclo.",
          reward: { zenith: 250, stoneId: "soul_stone_2", stoneQty: 15 }
        },
        {
          id: "madara",
          name: "Madara Uchiha",
          shortName: "Madara",
          level: 110,
          health: 20000,
          energy: 350,
          imageUrl: "https://i.imgur.com/L6M7V8W.png",
          dialogue: "[Madara]- Você quer dançar? Espero que consiga acompanhar o ritmo do meu Susano'o!",
          reward: { zenith: 250, stoneId: "soul_stone_2", stoneQty: 20 },
          unlocksWorld: "aot"
        }
      ]
    },
    {
      id: "aot",
      name: "Universo Attack on Titan",
      emoji: "⚔️",
      bosses: [
        {
          id: "f_titan",
          name: "Titã Fêmea",
          shortName: "Fêmea",
          level: 120,
          health: 25000,
          energy: 400,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          dialogue: "[Levi]- Fique atento! Ela é rápida e pode endurecer partes do corpo. Não deixe que ela te esmague!",
          reward: { zenith: 250, stoneId: "soul_stone_3", stoneQty: 10 }
        },
        {
          id: "jaw_titan",
          name: "Titã Mandíbula",
          shortName: "Mandíbula",
          level: 130,
          health: 30000,
          energy: 450,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          dialogue: "[Mikasa]- Esse titã é pequeno, mas suas garras e mandíbula podem destruir qualquer coisa. Cuidado com sua velocidade!",
          reward: { zenith: 250, stoneId: "soul_stone_3", stoneQty: 15 }
        },
        {
          id: "armored_titan",
          name: "Titã Blindado",
          shortName: "Blindado",
          level: 140,
          health: 40000,
          energy: 500,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          dialogue: "[Hange]- A pele dele é como uma armadura impenetrável! Precisamos encontrar uma brecha ou usar força bruta!",
          reward: { zenith: 250, stoneId: "soul_stone_3", stoneQty: 20 }
        },
        {
          id: "colossal_titan",
          name: "Titã Colossal",
          shortName: "Colossal",
          level: 160,
          health: 60000,
          energy: 600,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          dialogue: "[Armin]- Ele é gigante e emite um calor insuportável! Se chegarmos perto demais, seremos queimados vivos!",
          reward: { zenith: 250, stoneId: "soul_stone_3", stoneQty: 30 }
        },
        {
          id: "attack_titan",
          name: "Titã de Ataque (Eren Yeager)",
          shortName: "Eren",
          level: 200,
          health: 100000,
          energy: 1000,
          imageUrl: "https://i.imgur.com/8Q6Z1Z6.png",
          dialogue: "[Eren]- Eu vou continuar avançando... até que todos os meus inimigos sejam destruídos. Nada pode me parar agora!",
          reward: { zenith: 250, stoneId: "soul_stone_3", stoneQty: 50 }
        }
      ]
    }
  ]
};
