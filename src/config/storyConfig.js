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
          level: 1,
          health: 80,
          energy: 100,
          imageUrl: "https://i.ibb.co/7xZgw8Hd/raditz.png",
          dialogue: "[Raditz]- Um verme como você ousa me enfrentar? Prepare-se para ser esmagado!",
          reward: { zenith: 80, stoneId: "soul_stone_1", stoneQty: 5 }
        },
        {
          id: "vegeta",
          name: "Vegeta",
          shortName: "Vegeta",
          level: 5,
          health: 250,
          energy: 120,
          imageUrl: "https://i.ibb.co/PGwNtrsD/image.png",
          dialogue: "[Vegeta]- Eu sou o Príncipe dos Saiyajins! Não permitirei que um estranho interfira nos meus planos!",
          reward: { zenith: 80, stoneId: "soul_stone_1", stoneQty: 8 }
        },
        {
          id: "freeza",
          name: "Freeza",
          shortName: "Freeza",
          level: 7,
          health: 350,
          energy: 150,
          imageUrl: "https://i.ibb.co/b593Fj9p/image.png",
          dialogue: "[Freeza]- O que? Quem é você?! Chegou para morrer aqui também?! Sinta o desespero perante o Imperador do Universo!",
          reward: { zenith: 80, stoneId: "soul_stone_1", stoneQty: 8 }
        },
        {
          id: "cell",
          name: "Cell (Forma Perfeita)",
          shortName: "Cell",
          level: 10,
          health: 500,
          energy: 180,
          imageUrl: "https://i.ibb.co/1YTLCdwK/image.png",
          dialogue: "[Cell]- Um novo espécime apareceu? Espero que você me proporcione o entretenimento que os outros falharam em dar.",
          reward: { zenith: 80, stoneId: "soul_stone_1", stoneQty: 10 }
        },
        {
          id: "majin_boo",
          name: "Majin Boo",
          shortName: "Majin Boo",
          level: 12,
          health: 650,
          energy: 200,
          imageUrl: "https://i.ibb.co/0RHMm9kg/image.png",
          dialogue: "[Majin Boo]- Buu vai te transformar em chocolate! Buu vai te comer!",
          reward: { zenith: 80, stoneId: "soul_stone_1", stoneQty: 12 },
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
          level: 15,
          health: 800,
          energy: 220,
          imageUrl: "https://i.ibb.co/dJJ3xDj2/imagem-2026-04-12-233526593.png",
          dialogue: "[Orochimaru]- Que corpo interessante você tem... Sinto que ele seria um excelente receptáculo para minhas ambições.",
          reward: { zenith: 80, stoneId: "soul_stone_2", stoneQty: 5 }
        },
        {
          id: "gaara",
          name: "Gaara",
          shortName: "Gaara",
          level: 18,
          health: 1100,
          energy: 250,
          imageUrl: "https://i.ibb.co/ymb4c8pH/image.png",
          dialogue: "[Gaara]- Minha areia tem sede de sangue. Você será o próximo sacrifício para provar minha existência.",
          reward: { zenith: 80, stoneId: "soul_stone_2", stoneQty: 5 }
        },
        {
          id: "itachi_npc",
          name: "Itachi Uchiha",
          shortName: "Itachi",
          level: 21,
          health: 1400,
          energy: 280,
          imageUrl: "https://i.ibb.co/yBRwVXq4/image.png",
          dialogue: "[Itachi]- Você já está sob meu genjutsu. Por que lutar contra o inevitável?",
          reward: { zenith: 80, stoneId: "soul_stone_2", stoneQty: 6 }
        },
        {
          id: "pain",
          name: "Pain (Caminho Deva)",
          shortName: "Pain",
          level: 24,
          health: 1700,
          energy: 300,
          imageUrl: "https://i.ibb.co/KY6T2gy/image.png",
          dialogue: "[Pain]- O mundo conhecerá a dor. E você será o primeiro a senti-la neste novo ciclo.",
          reward: { zenith: 80, stoneId: "soul_stone_2", stoneQty: 6 }
        },
        {
          id: "madara",
          name: "Madara Uchiha",
          shortName: "Madara",
          level: 27,
          health: 2100,
          energy: 350,
          imageUrl: "https://i.ibb.co/7dgk4Mw2/imagem-2026-04-12-234440150.png",
          dialogue: "[Madara]- Você quer dançar? Espero que consiga acompanhar o ritmo do meu Susano'o!",
          reward: { zenith: 80, stoneId: "soul_stone_2", stoneQty: 7 },
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
          level: 30,
          health: 2400,
          energy: 400,
          imageUrl: "https://i.ibb.co/xb0ryrG/annie.png",
          dialogue: "[Levi]- Fique atento! Ela é rápida e pode endurecer partes do corpo. Não deixe que ela te esmague!",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 3 }
        },
        {
          id: "jaw_titan",
          name: "Titã Mandíbula",
          shortName: "Mandíbula",
          level: 35,
          health: 2800,
          energy: 450,
          imageUrl: "https://i.ibb.co/Td0Xwgz/image.png",
          dialogue: "[Mikasa]- Esse titã é pequeno, mas suas garras e mandíbula podem destruir qualquer coisa. Cuidado com sua velocidade!",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 4 }
        },
        {
          id: "armored_titan",
          name: "Titã Blindado",
          shortName: "Blindado",
          level: 40,
          health: 3300,
          energy: 500,
          imageUrl: "https://i.ibb.co/LDCL4DSv/imagem-2026-04-12-235141200.png",
          dialogue: "[Hange]- A pele dele é como uma armadura impenetrável! Precisamos encontrar uma brecha ou usar força bruta!",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 4 }
        },
        {
          id: "colossal_titan",
          name: "Titã Colossal",
          shortName: "Colossal",
          level: 45,
          health: 4000,
          energy: 550,
          imageUrl: "https://i.ibb.co/nqL0drt6/image.png",
          dialogue: "[Armin]- Ele é gigante e emite um calor insuportável! Se chegarmos perto demais, seremos queimados vivos!",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 5 }
        },
        {
          id: "attack_titan",
          name: "Titã de Ataque (Eren Yeager)",
          shortName: "Eren",
          level: 50,
          health: 5000,
          energy: 600,
          imageUrl: "https://i.ibb.co/jZvTkPh4/image.png",
          dialogue: "[Eren]- Eu vou continuar avançando... até que todos os meus inimigos sejam destruídos. Nada pode me parar agora!",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 6 },
          unlocksWorld: "jjk"
        }
      ]
    },
    {
      id: "jjk",
      name: "Universo Jujutsu Kaisen",
      emoji: "🩸",
      bosses: [
        {
          id: "cursed_spirit",
          name: "Maldição de Grau Especial",
          shortName: "Maldição",
          level: 55,
          health: 9000,
          energy: 650,
          imageUrl: "https://i.ibb.co/8LqVw0BM/Sem-t-tulo.png",
          dialogue: "[Maldição]- GRAHWNN!",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 3 }
        },
        {
          id: "aoi_todo",
          name: "Aoi Todo",
          shortName: "Todo",
          level: 60,
          health: 9700,
          energy: 700,
          imageUrl: "https://i.ibb.co/rRHWm3g8/Sem-t-tulo-1.png",
          dialogue: "[Todo]- Que tipo de mulher você gosta? Antes de lutar comigo, responda essa pergunta. Ela dirá tudo que preciso saber sobre você.",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 4 }
        },
        {
          id: "mahito",
          name: "Mahito",
          shortName: "Mahito",
          level: 65,
          health: 11300,
          energy: 750,
          imageUrl: "https://i.ibb.co/GfyQtzqp/Sem-t-tulo-2.png",
          dialogue: "[Mahito]- A alma é a verdadeira forma do ser humano. E eu posso moldá-la como argila... Isso não é algo adorável?",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 5 }
        },
        {
          id: "kenjaku",
          name: "Kenjaku",
          shortName: "Kenjaku",
          level: 70,
          health: 12500,
          energy: 800,
          imageUrl: "https://i.ibb.co/q3jgbkf2/Sem-t-tulo-3.png",
          dialogue: "[Kenjaku]- Tenho esperado mil anos por isso. Cada peça foi movida com precisão. Você não passa de mais uma variável no meu grande experimento.",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 6 }
        },
        {
          id: "sukuna",
          name: "Ryomen Sukuna",
          shortName: "Sukuna",
          level: 75,
          health: 13000,
          energy: 850,
          imageUrl: "https://i.ibb.co/1GpPSQSK/Sem-t-tulo-4.png",
          dialogue: "[Sukuna]- Você tem coragem de vir até mim? Então venha... e morra com dignidade.",
          reward: { zenith: 80, stoneId: "soul_stone_3", stoneQty: 8 }
        }
      ]
    }
  ]
};
