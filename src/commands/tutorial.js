"use strict";
const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits,
} = require("discord.js");
const playerRepository   = require("../database/repositories/playerRepository");
const BattleEngine       = require("../services/BattleEngine");
const EmbedManager       = require("../services/EmbedManager");
const ButtonManager      = require("../services/ButtonManager");
const CharacterManager   = require("../services/CharacterManager");
const ArtifactManager    = require("../services/ArtifactManager");
const Emojis             = require("../config/emojis");

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const OKABE_THUMB      = "https://i.ibb.co/VYjyT66s/image.png";
const OKABE_COLOR      = "#1a1a2e";
const WIN_COLOR        = "#FFD700";
const LOSS_COLOR       = "#8e0000";
const GACHA_COLOR      = "#4a0080";
const TUTORIAL_CHAN_ID = "1493710875230732459";
const TUTORIAL_BOSS_ID = "raditz"; // Easier story boss — enough for a tutorial fight

// Pool do Nexus tutorial (apenas 3 personagens)
const TUTORIAL_NEXUS_POOL = ["goku", "naruto", "itadori"];
const TUTORIAL_NEXUS_DATA = {
  goku:    { name: "Goku (Base)",        rarity: "EC", anime: "Dragon Ball Z"  },
  naruto:  { name: "Naruto (Clássico)",  rarity: "EC", anime: "Naruto"         },
  itadori: { name: "Itadori Yuji",       rarity: "EC", anime: "Jujutsu Kaisen" },
};

// Pool da Fenda tutorial (artefatos simples)
const TUTORIAL_FENDA_POOL = ["capsula_curativa", "esfera_4_estrelas"];

// Comandos bloqueados no canal de tutorial
const BLOCKED_COMMANDS = new Set([
  "!pvp", "!boss-rush", "!bossrush",
  "!desafio", "!challenge",
  "!torre", "!tower", "!torre-rank",
  "!modo-historia", "!pve", "!historia",
  "!party", "!kick", "!party-sair", "!party-desfazer",
  "!sairfila", "!cancelarfila", "!sf",
]);

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
// Map<userId,   { channelId, step, tutorialGojoInstanceId, battleId, ... }>
const activeTutorials = new Map();

// Map<channelId, userId>  — para interceptCommand e hooks
const tutorialChannels = new Map();

function getTutorialUserByChannel(channelId) {
  return tutorialChannels.get(channelId) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function nextBtn(userId, label = "Continuar →") {
  return new ButtonBuilder()
    .setCustomId(`tutorial_next_${userId}`)
    .setLabel(label)
    .setStyle(ButtonStyle.Primary);
}

function okabeEmbed(title, desc, color = OKABE_COLOR, footer = "") {
  const e = new EmbedBuilder()
    .setColor(color)
    .setThumbnail(OKABE_THUMB)
    .setTitle(title)
    .setDescription(desc);
  if (footer) e.setFooter({ text: footer });
  return e;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildIntro(userId) {
  const embed = okabeEmbed(
    "📡 Laboratório de Gadgets do Futuro",
    `*Máquinas piscam, telas holográficas mapeiam linhas temporais e o cheiro de café velho domina o ar. ` +
    `Um jovem de jaleco se vira para você, olhos arregalados.*\n\n` +
    `**[Okabe]** — Ah... então você chegou. Excelente. *Minha intuição científica raramente falha.*\n\n` +
    `Eu sou **Okabe Rintaro**, também conhecido como *Hououin Kyouma* — cientista louco, pioneiro da ciência ` +
    `temporal e fundador deste laboratório.\n\n` +
    `Você deve ser o **Invocador Dimensional** que a Organização enviou. Antes de explicar tudo... o que você quer saber primeiro?`,
    OKABE_COLOR, "Tutorial • Início"
  );
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`tutorial_reply_${userId}_onde`).setLabel("💬 Onde estou?").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tutorial_reply_${userId}_quem`).setLabel("💬 Quem é você?").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`tutorial_reply_${userId}_acontecendo`).setLabel("💬 O que está acontecendo?").setStyle(ButtonStyle.Secondary),
  );
  return { embeds: [embed], components: [row] };
}

function buildReplyResponse(userId, replyId) {
  const lines = {
    onde:
      `**[Você]** — *...Onde estou?*\n\n` +
      `**[Okabe]** — *Muhahaha!* Que pergunta deliciosa para começar.\n\n` +
      `Você está no **Laboratório de Gadgets do Futuro**, em Akihabara — ou melhor, numa versão dimensional dela. ` +
      `Este laboratório existe em um ponto de convergência entre múltiplos universos. Nenhum governo sabe que estamos aqui. ` +
      `*Exatamente como planejei.*`,
    quem:
      `**[Você]** — *...Quem é você?*\n\n` +
      `**[Okabe]** — *Hah! Finalmente alguém com bom gosto em perguntas.*\n\n` +
      `Sou **Okabe Rintaro** — gênio incompreendido, pioneiro da ciência temporal e o único ser humano capaz de perceber ` +
      `as *Linhas do Mundo* se alterando ao redor dele. Ah, e fundador deste laboratório. ` +
      `*Não me confunda com alguém comum. El Psy Kongroo.*`,
    acontecendo:
      `**[Você]** — *O que está acontecendo?*\n\n` +
      `**[Okabe]** — *[pausa dramática, olha para a janela]* Uma crise. A maior que o multiverso já enfrentou.\n\n` +
      `Mas não se preocupe — eu, Okabe Rintaro, já vislumbrei a solução. ` +
      `E essa solução... *[aponta para você]* ...é você.`,
  };
  const text = lines[replyId] || lines.onde;
  const embed = okabeEmbed(
    "📡 Laboratório de Gadgets do Futuro",
    text + `\n\n*Okabe ajusta o jaleco e gesticula em direção às telas holográficas.*`,
    OKABE_COLOR, "Tutorial • Início"
  );
  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(nextBtn(userId, "Entender mais →"))],
  };
}

function buildLore(userId) {
  const embed = okabeEmbed(
    "🌌 A Divergência Multiversal",
    `**[Okabe]** — Deixe-me explicar a situação. *[Clica em algo; um mapa holográfico de linhas temporais se expande pela sala.]*\n\n` +
    `Existem **infinitos universos paralelos** — cada decisão, cada batalha, cada momento cria uma nova linha do mundo. ` +
    `Na maioria delas, os heróis vencem. O equilíbrio é mantido.\n\n` +
    `Mas algo mudou.\n\n` +
    `Uma entidade que chamamos de **O Corruptor** começou a invadir linhas frágeis e *reescrever seus resultados*. ` +
    `O herói perde. O vilão vence. O universo entra em colapso.\n\n` +
    `**Exemplos de linhas temporais corrompidas que já detectamos:**\n` +
    `> 🔴 **Linha Delta-7** — Vegeta mata Goku em Namek. Sem Goku, os Androides destroem a Terra.\n` +
    `> 🔴 **Linha Sigma-3** — Madara Uchiha vence a 4ª Grande Guerra Ninja. O Tsuki no Me prevalece.\n` +
    `> 🔴 **Linha Omega-1** — Aizen nunca é derrotado. Soul Society cai. Os Hollows dominam.\n` +
    `> 🔴 **Linha Xi-9** — Sukuna desperta sem oposição. A humanidade é dizimada em dias.\n\n` +
    `*Okabe fecha o punho, olhos sérios pela primeira vez.*\n\n` +
    `**[Okabe]** — Se não agirmos, o colapso se espalhará para todas as linhas. Incluindo a nossa.`,
    OKABE_COLOR, "Tutorial • Etapa 2"
  );
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(nextBtn(userId))] };
}

function buildLore2(userId) {
  const embed = okabeEmbed(
    "⚗️ Sua Missão — O Invocador Dimensional",
    `**[Okabe]** — É aqui que você entra.\n\n` +
    `Nossas pesquisas descobriram que certos indivíduos possuem a capacidade de **invocar heróis de suas dimensões de origem** ` +
    `e enviá-los às linhas corrompidas para *restaurar o resultado correto*.\n\n` +
    `Você não luta diretamente. Você é o **estrategista dimensional** — seleciona os guerreiros, os equipa com ` +
    `artefatos de poder e os guia em batalha contra as anomalias do Corruptor.\n\n` +
    `Os personagens que você invocar chegam através de dois canais:\n` +
    `> ${Emojis.ARTIFACT} **Fenda Ancestral** \`!fenda\` — Abre portais dimensionais que trazem fragmentos de relíquias e raridades.\n` +
    `> ${Emojis.ZENITH} **Nexus Zenith** \`!nexus\` — Usa Fragmentos Zenith para invocar guerreiros das dimensões.\n\n` +
    `**[Okabe]** — *[baixa a voz]* Vamos ao **treinamento**. Primeiro, você precisa equipar um guerreiro.`,
    OKABE_COLOR, "Tutorial • Etapa 3"
  );
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(nextBtn(userId, "Ir ao treinamento →"))] };
}

function buildEquipPrompt(userId) {
  const embed = okabeEmbed(
    "⚔️ Etapa 1 — Equipe seu Guerreiro",
    `**[Okabe]** — Antes de qualquer batalha, você precisa de um guerreiro de combate ativo.\n\n` +
    `*Um holograma de **Satoru Gojo** se materializa — venda branca, sorriso arrogante — emprestado do laboratório.*\n\n` +
    `**[Gojo]** — Só vou precisar de um aperitivo pra esquentar.\n\n` +
    `**[Okabe]** — Gojo foi adicionado **temporariamente** ao seu inventário apenas para este treinamento. ` +
    `**Agora use \`!equip\` neste canal para equipá-lo como seu guerreiro ativo.**\n\n` +
    `> 💡 Digite \`!equip\` → clique em **Equipar Personagem** → selecione **Satoru Gojo**\n\n` +
    `> ⚠️ **Atenção:** Não use Pedras da Alma no Gojo — ele será removido ao fim do tutorial. Guarde suas pedras para seus guerreiros definitivos!\n\n` +
    `*O canal detectará automaticamente quando você equipar e avançará o tutorial.*`,
    OKABE_COLOR, "Tutorial • Use !equip"
  );
  return { embeds: [embed], components: [] };
}

function buildBattleIntroContent(userId) {
  const embed = okabeEmbed(
    "⚔️ Treinamento de Combate",
    `**[Okabe]** — *[olha para as telas]* Sensores detectaram uma **anomalia dimensional** na Linha Beta-4.\n\n` +
    `*Uma fissura se abre no laboratório. Do outro lado, uma forma hostil emerge — um Saiyajin corrompido, ` +
    `olhos cheios de agressividade.*\n\n` +
    `**[Okabe]** — O combate funciona **exatamente** igual a qualquer batalha neste servidor. ` +
    `Use suas habilidades sabiamente — cada skill tem custo de energia e tempo de recarga.\n\n` +
    `Confie no seu guerreiro. *El Psy Kongroo.*`,
    OKABE_COLOR, "Tutorial • Prepare-se!"
  );
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tutorial_start_battle_${userId}`)
      .setLabel("⚔️ Entrar no Combate!")
      .setStyle(ButtonStyle.Danger)
  );
  return { embeds: [embed], components: [row] };
}

function buildFendaPrompt(userId) {
  const embed = okabeEmbed(
    `${Emojis.ARTIFACT} Etapa 2 — Fenda Ancestral`,
    `**[Okabe]** — Excelente combate! Agora vou te mostrar como funciona a **Fenda Ancestral**.\n\n` +
    `A Fenda é o principal sistema de invocação do laboratório. Cada pull traz **Fragmentos de Relíquia** — ` +
    `e eventualmente, com chance baixa, uma relíquia completa.\n\n` +
    `> ${Emojis.ARTIFACT} Colete **100 fragmentos** do mesmo tipo para **forjar um Artefato**\n` +
    `> Artefatos são equipados nos guerreiros via \`!equip\` → **Equipar Artefato**\n` +
    `> Fragmentos de Relíquia (FR) são obtidos principalmente no **\`!desafio\`**\n\n` +
    `**[Okabe]** — Ativei uma invocação de demonstração. **Use \`!fenda\` agora!**`,
    OKABE_COLOR, "Tutorial • Use !fenda"
  );
  return { embeds: [embed], components: [] };
}

function buildNexusPrompt(userId) {
  const embed = okabeEmbed(
    `${Emojis.ZENITH} Etapa 3 — Nexus Zenith`,
    `**[Okabe]** — Impressionante! Agora o segundo método de invocação.\n\n` +
    `O **Nexus Zenith** usa **Fragmentos Zenith** para invocar novos guerreiros dimensionais.\n\n` +
    `> ${Emojis.ZENITH} Fragmentos Zenith são obtidos vencendo o **Modo História** (\`!modo-historia\`) e subindo a **Torre Infinita** (\`!torre\`)\n` +
    `> Diferente da Fenda no Nexus você invoca guerreiros!\n\n` +
    `**[Okabe]** — Preparei uma invocação de demonstração. **Use \`!nexus\` agora!**`,
    OKABE_COLOR, "Tutorial • Use !nexus"
  );
  return { embeds: [embed], components: [] };
}

function buildSoulStone(userId) {
  const embed = okabeEmbed(
    `${Emojis.SOUL_STONE_1} Pedras da Alma — Evoluindo seus Guerreiros`,
    `**[Okabe]** — Você ganhou uma **Pedra da Alma I** ao vencer o combate. Deixe-me explicar como usá-la.\n\n` +
    `As Pedras da Alma são fragmentos de energia dimensional que **evoluem seus personagens**, ` +
    `aumentando nível, HP e poder.\n\n` +
    `**Como usar:**\n` +
    `\`\`\`\n!usar\n\`\`\`\n` +
    `Uma interface abrirá. Você seleciona o personagem e quantas pedras quer aplicar.\n\n` +
    `**Tipos de Pedras:**\n` +
    `> ${Emojis.SOUL_STONE_1} **Pedra da Alma I** — XP básico. A mais comum, obtida em combates e missões.\n` +
    `> ${Emojis.SOUL_STONE_2} **Pedra da Alma II** — XP médio. Obtida em missões semanais e desafios.\n` +
    `> ${Emojis.SOUL_STONE_3} **Pedra da Alma III** — XP avançado. Rara, grandes marcos de progressão.\n\n` +
    `**[Okabe]** — Um guerreiro mais forte sobrevive mais. Priorize evoluir seu personagem principal!\n\n` +
    `> ⚠️ **Lembre-se:** Não aplique as pedras no Gojo — ele é temporário e será removido ao encerrar o tutorial!`,
    OKABE_COLOR, "Tutorial • Etapa 4"
  );
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(nextBtn(userId, "📜 Sistema de Missões →"))] };
}

function buildMissions(userId) {
  const embed = okabeEmbed(
    "📜 Sistema de Missões",
    `**[Okabe]** — Use \`!missoes\` para acessar o sistema de missões — sua principal fonte de progressão regular.\n\n` +
    `**Missões Diárias** *(reiniciam todo dia)*\n` +
    `> Objetivos rápidos como *"Vença 3 batalhas PVE"* ou *"Use 5 Pedras da Alma"*.\n` +
    `> Recompensas: Pedras da Alma e Fragmentos Zenith.\n\n` +
    `**Missões Semanais** *(reiniciam toda semana)*\n` +
    `> Objetivos maiores como *"Alcance Nível 30 com um personagem"* ou *"Vença 3 partidas ranqueadas"*.\n` +
    `> Recompensas: quantidades maiores de Fragmentos Zenith e Pedras avançadas.\n\n` +
    `**[Okabe]** — As missões são como experimentos científicos — precisam de *consistência e disciplina*. ` +
    `Faça-as todo dia e sua progressão será muito mais rápida.\n\n` +
    `*[Okabe olha para o relógio e franze o cenho]*\n\n` +
    `**[Okabe]** — Falando em recursos, deixe-me explicar as duas moedas principais deste laboratório.`,
    OKABE_COLOR, "Tutorial • Etapa 5"
  );
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(nextBtn(userId, "💠 Recursos do Servidor →"))] };
}

function buildZenith(userId) {
  const embed = okabeEmbed(
    `${Emojis.ZENITH} Fragmentos Zenith & Fragmentos de Relíquia`,
    `**[Okabe]** — Dois recursos fundamentais para sua progressão:\n\n` +
    `**${Emojis.ZENITH} Fragmentos Zenith**\n` +
    `> A moeda de alto valor do laboratório. Usos principais:\n` +
    `> • Realizar invocações no **Nexus Zenith** (\`!nexus\`) — invoca novos guerreiros\n` +
    `> • Desbloquear mais **slots de inventário** em \`!inv\`\n` +
    `> Obtidos vencendo o **Modo História** (\`!modo-historia\`), subindo a **Torre Infinita** (\`!torre\`) e em missões.\n\n` +
    `**${Emojis.ARTIFACT} Fragmentos de Relíquia (FR)**\n` +
    `> Cada invocação na **Fenda Ancestral** gera fragmentos aleatórios de artefatos.\n` +
    `> Colete **100 fragmentos** do mesmo tipo para **forjar um Artefato**.\n` +
    `> Artefatos são equipados nos seus guerreiros — bônus de dano, HP, energia e muito mais.\n` +
    `> FR são obtidos principalmente no **\`!desafio\`** — faça-o com frequência!\n` +
    `> Veja seus fragmentos em \`!inv\` → aba **Fragmentos**.\n\n` +
    `**[Okabe]** — Artefatos são o que separa um invocador mediano de um estrategista dimensional de verdade. ` +
    `*Não os ignore.*`,
    OKABE_COLOR, "Tutorial • Etapa 6"
  );
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(nextBtn(userId, "🎮 Modos de Jogo →"))] };
}

function buildGameModes(userId) {
  const embed = okabeEmbed(
    "🎮 Modos de Jogo — O Que Fazer no Servidor",
    `**[Okabe]** — Existem **5 formas** de combate neste servidor:\n\n` +
    `**📖 Modo História** \`!modo-historia\`\n` +
    `> Entre nas linhas temporais corrompidas e derrote os bosses em sequência.\n` +
    `> Recompensas: ${Emojis.ZENITH} Fragmentos Zenith, XP e progressão narrativa.\n` +
    `> 💡 *Melhor modo para iniciantes! Comece aqui.*\n\n` +
    `**🗼 Torre Infinita** \`!torre\`\n` +
    `> Suba andares progressivamente mais difíceis, com recompensas crescentes.\n` +
    `> Recompensas: ${Emojis.ZENITH} Fragmentos Zenith e itens de progressão.\n` +
    `> 💡 *Faça após o Modo História para upar seus personagens antes dos desafios mais difíceis.*\n\n` +
    `**🏆 Modo Desafio** \`!desafio\`\n` +
    `> Bosses com 3 dificuldades. Cooldown por hora BRT.\n` +
    `> Recompensas: ${Emojis.ARTIFACT} **Fragmentos de Relíquia (FR)** — essenciais para forjar Artefatos na Fenda!\n` +
    `> 💡 *Faça ao menos uma vez por hora para acumular FR e completar missões.*\n\n` +
    `**⚔️ PVP Casual / Ranqueado** \`!pvp @jogador\`\n` +
    `> Desafie outros Invocadores. O ranqueado tem sistema de PA e ranks. Recompensa: Zenith e PA.\n` +
    `> 💡 *Evite o ranqueado no começo — evolua seus personagens primeiro.*\n\n` +
    `**🔥 Boss Rush** \`!boss-rush\`\n` +
    `> Um jogador vira o Boss (com buffs massivos) e enfrenta um trio. Modo cooperativo e caótico.`,
    OKABE_COLOR, "Tutorial • Etapa 7"
  );
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tutorial_reply_${userId}_modo_pergunta`)
      .setLabel("🤔 Qual modo farmar primeiro?")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`tutorial_reply_${userId}_modo_continuar`)
      .setLabel("Entendido! Encerrar →")
      .setStyle(ButtonStyle.Primary),
  );
  return { embeds: [embed], components: [row] };
}

function buildModoDica(userId) {
  const embed = okabeEmbed(
    "💡 Dica — A Rota Científica Ideal",
    `**[Okabe]** — Boa pergunta. A resposta mais eficiente:\n\n` +
    `**1️⃣ Modo História** \`!modo-historia\`\n` +
    `> Comece aqui. Boa narrativa, progressão natural, ${Emojis.ZENITH} Fragmentos Zenith e XP para crescimento inicial.\n\n` +
    `**2️⃣ Torre Infinita** \`!torre\`\n` +
    `> Suba os andares para upar seus personagens e ganhar mais ${Emojis.TODAS_PEDRAS} Pedras da Alma. ` +
    `Faça isso antes do Desafio — personagens mais fortes vencem mais fácil.\n\n` +
    `**3️⃣ Modo Desafio** \`!desafio\` *(a partir da dificuldade Fácil)*\n` +
    `> A principal fonte de ${Emojis.ARTIFACT} **Fragmentos de Relíquia** para forjar Artefatos na Fenda. ` +
    `Faça pelo menos uma vez por hora — é rápido e recompensador.\n\n` +
    `**4️⃣ PVP e Boss Rush**\n` +
    `> Quando sentir que está preparado. Ambos exigem alguma experiência em combate.\n\n` +
    `**[Okabe]** — *El Psy Kongroo. Agora vá — o multiverso não pode esperar por mais análises.*`,
    OKABE_COLOR
  );
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(nextBtn(userId, "Encerrar Tutorial →"))] };
}

function buildEnd(userId) {
  const state = activeTutorials.get(userId);
  const embed = new EmbedBuilder()
    .setColor(WIN_COLOR)
    .setThumbnail(OKABE_THUMB)
    .setTitle("⚗️ Tutorial Concluído — El Psy Kongroo")
    .setDescription(
      `**[Okabe]** — *[vira-se para você com um sorriso — algo genuinamente raro para ele]*\n\n` +
      `Você completou o treinamento básico do Laboratório de Gadgets do Futuro.\n\n` +
      `Muitos Invocadores chegam aqui perdidos e confusos. Você chegou... bem, também perdido. ` +
      `Mas aprendeu rápido. *A ciência aprova.*\n\n` +
      `**Resumo do que você ganhou:**\n` +
      `> ${Emojis.SOUL_STONE_1} **4x Pedra da Alma I** — use \`!usar\` para evoluir seus guerreiros\n` +
      `> ${Emojis.ZENITH} **Personagem do Nexus** — seu mais novo guerreiro dimensional\n` +
      `> ${Emojis.F_CAPSULA} **Fragmentos da Fenda** — acumule 100 para forjar um Artefato via \`!fenda\`\n\n` +
      `**Próximos passos:**\n` +
      `> 1. \`!equip\` → equipe um guerreiro para combate\n` +
      `> 2. \`!usar\` → aplique a Pedra da Alma\n` +
      `> 3. \`!modo-historia\` → entre na sua primeira linha corrompida\n` +
      `> 4. \`!missoes\` → confira suas missões ativas\n\n` +
      `**[Okabe]** — O multiverso depende de você, Invocador. Eu continuarei aqui, monitorando as linhas do mundo. ` +
      `Se um dia perceber que algo está errado ao seu redor... confie na sua intuição. *El Psy Kongroo.*\n\n` +
      `*Este canal será excluído em 30 segundos.*`
    )
    .setFooter({ text: "Tutorial completo • Laboratório de Gadgets do Futuro" });
  return { embeds: [embed], components: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// TUTORIAL MINI-GACHA — FENDA
// ─────────────────────────────────────────────────────────────────────────────
function buildTutorialFendaPanel(userId) {
  const embed = new EmbedBuilder()
    .setColor("#001a33")
    .setTitle(`${Emojis.ARTIFACT} Fenda Ancestral — Demonstração`)
    .setDescription(
      `*A Fenda Ancestral se abre — um portal dimensional instável, pulsando com energia de relíquias antigas.*\n\n` +
      `**[Okabe]** — Uma invocação gratuita está disponível. O portal revelará o que as dimensões têm guardado para você.`
    )
    .setFooter({ text: "Tutorial • Fenda Ancestral — 1x Invocação Gratuita" });
  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tutorial_fenda_pull_${userId}`)
        .setLabel("🌀 1x Invocação Gratuita!")
        .setStyle(ButtonStyle.Primary)
    )],
  };
}

async function handleFendaPull(interaction, userId) {
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "Este não é o seu tutorial!", ephemeral: true });
  }
  const state = activeTutorials.get(userId);
  if (!state || state.step !== "fenda_prompt") {
    return interaction.reply({ content: "Este botão não está disponível agora.", ephemeral: true });
  }

  // Give fragments of capsula_curativa (not the full artifact)
  const fragItemId = "f_capsula";
  const fragEmoji  = Emojis.F_CAPSULA;
  const fragQty    = Math.floor(Math.random() * 11) + 20; // 20–30
  try { playerRepository.addItem(userId, fragItemId, fragQty); } catch (e) { console.error("[TUTORIAL] addItem fenda:", e); }

  // Animation frames (normal pull)
  const frames = [
    { title: "🌀 A Fenda Ancestral se abre...",       desc: "🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑\n\n*O espaço entre as dimensões começa a rasgar...*",    delay: 1300 },
    { title: "🌠 Energias ancestrais convergem...",    desc: "✨ 💫 🌟 ⭐ 🌠 🌑 🌑 🌑 🌑 🌑\n\n*Uma força desconhecida atravessa o portal das sombras...*", delay: 1300 },
    { title: "🌌 As relíquias emergem das trevas!",    desc: "🌟 ✨ 💫 🌠 ⭐ 🌌 💫 🌟 ✨ ⭐\n\n*O portal se fecha. As relíquias surgem diante de você!*", delay: 900  },
  ];

  await interaction.update({ embeds: [new EmbedBuilder().setColor("#001a33").setTitle(frames[0].title).setDescription(frames[0].desc)], components: [] });
  for (let i = 1; i < frames.length; i++) {
    await new Promise(r => setTimeout(r, frames[i - 1].delay));
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor("#001a33").setTitle(frames[i].title).setDescription(frames[i].desc)], components: [] });
  }
  await new Promise(r => setTimeout(r, frames[frames.length - 1].delay));

  const resultEmbed = new EmbedBuilder()
    .setColor("#001a33")
    .setTitle(`${Emojis.ARTIFACT} Fragmentos Obtidos!`)
    .setDescription(
      `*A fenda dimensional se fecha. Fragmentos de relíquia cristalizam diante de você.*\n\n` +
      `${fragEmoji} **Cápsula Curativa** +${fragQty} fragmentos\n\n` +
      `**[Okabe]** — Fragmentos são acumulados até atingir **100** — aí você pode forjar a relíquia completa.\n` +
      `Veja seus fragmentos em \`!inv\` → aba **Fragmentos**.`
    )
    .setFooter({ text: "Tutorial • Fenda Ancestral — Use !inv para ver seus fragmentos" });

  state.step = "fenda_done";
  state.fendaDone = true;

  await interaction.editReply({
    embeds: [resultEmbed],
    components: [new ActionRowBuilder().addComponents(nextBtn(userId, "💠 Próximo: Nexus Zenith →"))],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TUTORIAL MINI-GACHA — NEXUS
// ─────────────────────────────────────────────────────────────────────────────
function buildTutorialNexusPanel(userId) {
  const embed = new EmbedBuilder()
    .setColor(GACHA_COLOR)
    .setTitle(`${Emojis.ZENITH} Nexus Zenith — Demonstração`)
    .setDescription(
      `*O Nexus Zenith está ativo! O portal interdimensional aguarda o comando.*\n\n` +
      `**[Okabe]** — 1 invocação gratuita está disponível. O multiverso decidirá qual guerreiro virá até você!`
    )
    .setFooter({ text: "Tutorial • Nexus Zenith — 1x Invocação Gratuita" });
  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tutorial_nexus_pull_${userId}`)
        .setLabel("💠 1x Invocação Gratuita!")
        .setStyle(ButtonStyle.Success)
    )],
  };
}

async function handleNexusPull(interaction, userId) {
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "Este não é o seu tutorial!", ephemeral: true });
  }
  const state = activeTutorials.get(userId);
  if (!state || state.step !== "nexus_prompt") {
    return interaction.reply({ content: "Este botão não está disponível agora.", ephemeral: true });
  }

  // Give random char from tutorial nexus pool
  const charId = TUTORIAL_NEXUS_POOL[Math.floor(Math.random() * TUTORIAL_NEXUS_POOL.length)];
  const charData = TUTORIAL_NEXUS_DATA[charId];
  try { playerRepository.addCharacter(userId, charId, 1); } catch (e) { console.error("[TUTORIAL] addCharacter nexus:", e); }

  // Animation frames (ec pull)
  const frames = [
    { title: "🌀 O Nexus se ativa...",    desc: "⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛\n\n*O portal interdimensional começa a vibrar...*",      delay: 1200 },
    { title: "💠 O portal se abre!",       desc: "💠 ⬛ 🌀 ⬛ 💠 ⬛ 🌀 ⬛ 💠 ⬛\n\n*Uma presença atravessa as dimensões...*",          delay: 1200 },
    { title: "✨ O guerreiro emerge!",     desc: "💠 🌀 ✨ 💠 🌀 ✨ 💠 🌀 ✨ 💠\n\n*O portal se fecha. O guerreiro está do seu lado.*", delay: 900  },
  ];

  await interaction.update({ embeds: [new EmbedBuilder().setColor(GACHA_COLOR).setTitle(frames[0].title).setDescription(frames[0].desc)], components: [] });
  for (let i = 1; i < frames.length; i++) {
    await new Promise(r => setTimeout(r, frames[i - 1].delay));
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(GACHA_COLOR).setTitle(frames[i].title).setDescription(frames[i].desc)], components: [] });
  }
  await new Promise(r => setTimeout(r, frames[frames.length - 1].delay));

  const resultEmbed = new EmbedBuilder()
    .setColor(GACHA_COLOR)
    .setTitle("✨ Guerreiro Invocado!")
    .setDescription(
      `*O Nexus Zenith se fecha. Um guerreiro dimensional aceitou seu chamado.*\n\n` +
      `**◆ ${charData.name}** — EC · ${charData.anime}\n\n` +
      `**[Okabe]** — ${charData.name} agora faz parte do seu plantel permanente.\n` +
      `Use \`!inv\` para vê-lo e \`!equip\` para equipá-lo em combate.`
    )
    .setFooter({ text: "Tutorial • Nexus Zenith — Use !inv para ver seu inventário" });

  state.step = "nexus_done";
  state.nexusDone = true;

  await interaction.editReply({
    embeds: [resultEmbed],
    components: [new ActionRowBuilder().addComponents(nextBtn(userId, "🔮 Pedras da Alma →"))],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BATTLE
// ─────────────────────────────────────────────────────────────────────────────
async function startTutorialBattle(interaction, userId, state) {
  try {
    const player = playerRepository.getPlayer(userId);
    if (!player.equipped_instance_id) {
      return interaction.reply({
        content: "❌ Equipe um personagem primeiro! Use `!equip`.",
        ephemeral: true,
      });
    }

    const charInstance = playerRepository.getCharacterInstance(player.equipped_instance_id);
    if (!charInstance) {
      return interaction.reply({ content: "❌ Personagem equipado não encontrado.", ephemeral: true });
    }

    // Start real battle — no channelId so the auto-delete logic won't trigger
    const battle = BattleEngine.startBattle(
      userId, TUTORIAL_BOSS_ID, charInstance,
      { character_id: TUTORIAL_BOSS_ID, level: 1 },
      true, null, false, null
    );
    battle.isTutorial = true;
    battle.tutorialUserId = userId;

    state.battleId = battle.id;
    state.step = "in_battle";

    const battleEmbed = EmbedManager.createBattleEmbed(battle);
    const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);

    // Update the button message to show "battle started"
    await interaction.update({
      embeds: [okabeEmbed(
        "⚔️ Batalha Iniciada!",
        `**[Okabe]** — A batalha começou! Derrote a anomalia usando suas habilidades.\n` +
        `*O combate aparece abaixo — use os botões para atacar, recuperar energia ou reagir!*`,
        OKABE_COLOR
      )],
      components: [],
    });

    // Send battle as a new message so it scrolls naturally
    const channel = await interaction.client.channels.fetch(state.channelId);
    const battleMsg = await channel.send({ embeds: [battleEmbed], components });
    battle.lastMessageId = battleMsg.id;

  } catch (e) {
    console.error("[TUTORIAL] startTutorialBattle error:", e);
    try { await interaction.reply({ content: "❌ Erro ao iniciar batalha. Tente novamente.", ephemeral: true }); } catch (_) {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTERNAL HOOKS (called from interactionCreate.js)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Called after equip_select fires in a tutorial channel.
 * Sends the battle intro embed to the tutorial channel.
 */
async function onEquipComplete(userId, client, channelId) {
  const state = activeTutorials.get(userId);
  if (!state || state.step !== "equip_prompt") return;

  state.step = "battle_intro";

  setTimeout(async () => {
    try {
      const channel = await client.channels.fetch(channelId || state.channelId).catch(() => null);
      if (!channel) return;
      await channel.send(buildBattleIntroContent(userId));
    } catch (e) { console.error("[TUTORIAL] onEquipComplete:", e); }
  }, 1500);
}

/**
 * Called when a tutorial battle finishes (victory or defeat).
 * Sends the result embed to the tutorial channel.
 */
async function onBattleEnd(battle, client) {
  const userId = battle.tutorialUserId;
  const state = activeTutorials.get(userId);
  if (!state) return;

  const playerWon = battle.winnerId === "players" || battle.winnerId === userId;
  state.step = playerWon ? "battle_win" : "battle_loss";
  state.battleId = null;

  if (playerWon) {
    try { playerRepository.addItem(userId, "soul_stone_1", 4); } catch (e) {}
  }

  setTimeout(async () => {
    try {
      const channel = await client.channels.fetch(state.channelId).catch(() => null);
      if (!channel) return;

      let desc;
      if (!playerWon) {
        desc =
          `**[Okabe]** — *[ajeita os óculos]* Derrota. Mas não se preocupe — cada batalha perdida é um dado a ser analisado.\n\n` +
          `A anomalia ainda está ativa. Tente novamente com uma estratégia diferente!`;
      } else {
        // Check what skill ended the battle
        const lastSkillId = battle.lastPlayerSkillId || "";
        const player      = playerRepository.getPlayer(userId);
        const instId      = player.equipped_instance_id;
        const inst        = instId ? playerRepository.getCharacterInstance(instId) : null;
        const char        = inst ? CharacterManager.getCharacter(inst.character_id, inst) : null;
        const skill       = char?.skills.find(s => s.id === lastSkillId);
        const isPowerFinish = skill && (skill.cost || 0) >= 30;

        if (isPowerFinish) {
          desc =
            `*O ataque final ressoa pelo laboratório. A anomalia se dissolve em fragmentos de energia dimensional.*\n\n` +
            `**[Okabe]** — *bate palmas lentamente* Impressionante. Você usou seu ataque mais potente ` +
            `no momento decisivo. *A ciência aprova esta demonstração de força.*\n\n` +
            `**Recompensa:** ${Emojis.SOUL_STONE_1} **4x Pedra da Alma I** adicionada ao seu inventário!\n\n` +
            `**[Okabe]** — *[sussurra anotando algo]* Poder bruto... mas eficiente.`;
        } else {
          desc =
            `*A anomalia cai derrotada. O portal dimensional se fecha atrás dela.*\n\n` +
            `**[Okabe]** — Vitória metodológica! Você controlou a batalha com precisão cirúrgica. ` +
            `*Um estrategista verdadeiro não desperdiça recursos.*\n\n` +
            `**Recompensa:** 🔮 **4x Pedra da Alma I** adicionada ao seu inventário!\n\n` +
            `**[Okabe]** — *[anota no diário]* Eficiência energética perfeita.`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(playerWon ? WIN_COLOR : LOSS_COLOR)
        .setThumbnail(OKABE_THUMB)
        .setTitle(playerWon ? "🏆 Vitória!" : "💀 Derrota — Tente Novamente")
        .setDescription(desc)
        .setFooter({ text: "Tutorial • Combate concluído" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`tutorial_next_${userId}`)
          .setLabel(playerWon ? "✨ Próximo Passo →" : "🔄 Tentar Novamente →")
          .setStyle(playerWon ? ButtonStyle.Success : ButtonStyle.Danger)
      );

      await channel.send({ embeds: [embed], components: [row] });
    } catch (e) { console.error("[TUTORIAL] onBattleEnd send:", e); }
  }, 2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND INTERCEPTOR (called from index.js messageCreate)
// Returns true if the command was handled by the tutorial (caller should skip normal handling)
// ─────────────────────────────────────────────────────────────────────────────
function interceptCommand(message, command, args) {
  const userId = tutorialChannels.get(message.channel.id);
  if (!userId || message.author.id !== userId) return false;

  const state = activeTutorials.get(userId);
  if (!state) return false;

  // Block commands that conflict with tutorial
  if (BLOCKED_COMMANDS.has(command)) {
    message.reply({ content: "❌ Este comando não está disponível durante o tutorial. Siga as instruções do Okabe!" }).catch(() => {});
    return true;
  }

  // Intercept !fenda only during fenda_prompt step
  if (command === "!fenda" || command === "!fenda-ancestral") {
    if (state.step === "fenda_prompt") {
      message.reply(buildTutorialFendaPanel(userId)).catch(() => {});
    } else {
      message.reply({ content: "⏳ A Fenda Ancestral estará disponível no momento certo do tutorial!" }).catch(() => {});
    }
    return true;
  }

  // Intercept !nexus only during nexus_prompt step
  if (command === "!nexus-zenith" || command === "!nexus") {
    if (state.step === "nexus_prompt") {
      message.reply(buildTutorialNexusPanel(userId)).catch(() => {});
    } else {
      message.reply({ content: "⏳ O Nexus Zenith estará disponível no momento certo do tutorial!" }).catch(() => {});
    }
    return true;
  }

  // Allow !equip, !inv, !profile, !use, !missoes, !giveartifact through normally
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP ROUTER
// ─────────────────────────────────────────────────────────────────────────────
const NEXT_STEP = {
  intro_replied:       "lore",
  lore:                "lore2",
  lore2:               "equip_prompt",
  battle_win:          "fenda_prompt",
  fenda_done:          "nexus_prompt",
  nexus_done:          "soul_stone",
  soul_stone:          "missions",
  missions:            "zenith",
  zenith:              "game_modes",
  game_modes:          "end",
  game_modes_answered: "end",
};

function buildStep(step, userId) {
  switch (step) {
    case "lore":         return buildLore(userId);
    case "lore2":        return buildLore2(userId);
    case "equip_prompt": return buildEquipPrompt(userId);
    case "fenda_prompt": return buildFendaPrompt(userId);
    case "nexus_prompt": return buildNexusPrompt(userId);
    case "soul_stone":   return buildSoulStone(userId);
    case "missions":     return buildMissions(userId);
    case "zenith":       return buildZenith(userId);
    case "game_modes":   return buildGameModes(userId);
    case "modo_dica":    return buildModoDica(userId);
    case "end":          return buildEnd(userId);
    default:             return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANNEL CLEANUP
// ─────────────────────────────────────────────────────────────────────────────
const TUTORIAL_ROLE_REMOVE = "1494488843221598329";
const TUTORIAL_ROLE_ADD_1  = "1494492810190262272";
const TUTORIAL_ROLE_ADD_2  = "1494488914499469563";

async function cleanupTutorial(client, state, userId, grantRoles = false) {
  try {
    const ch = await client.channels.fetch(state.channelId).catch(() => null);

    // Gerenciar cargos na conclusão bem-sucedida (antes de deletar o canal)
    if (grantRoles && ch) {
      try {
        const member = await ch.guild.members.fetch(userId).catch(() => null);
        if (member) {
          await member.roles.remove(TUTORIAL_ROLE_REMOVE).catch(() => {});
          await member.roles.add(TUTORIAL_ROLE_ADD_1).catch(() => {});
          await member.roles.add(TUTORIAL_ROLE_ADD_2).catch(() => {});
        }
      } catch (e) { console.error("[TUTORIAL] Erro ao gerenciar cargos:", e); }
    }

    // Remove tutorial Gojo if we gave it
    if (state.tutorialGojoInstanceId) {
      try {
        const player = playerRepository.getPlayer(userId);
        if (player && player.equipped_instance_id === state.tutorialGojoInstanceId) {
          playerRepository.updatePlayer(userId, { equipped_instance_id: null });
        }
        playerRepository.removeCharacterInstance(state.tutorialGojoInstanceId);
      } catch (e) { console.error("[TUTORIAL] Erro ao remover Gojo:", e); }
    }

    if (ch) await ch.delete("Tutorial encerrado");
  } catch (e) { console.error("[TUTORIAL] Erro ao deletar canal:", e); }
  activeTutorials.delete(userId);
  tutorialChannels.delete(state.channelId);
}

function scheduleChannelDelete(client, state, userId, delayMs = 30000) {
  // Cancel the inactivity timeout since the tutorial completed normally
  if (state.inactivityTimeoutId) clearTimeout(state.inactivityTimeoutId);
  setTimeout(() => cleanupTutorial(client, state, userId, true), delayMs);
}

function scheduleInactivityTimeout(client, state, userId) {
  const THIRTY_MIN = 30 * 60 * 1000;
  state.inactivityTimeoutId = setTimeout(async () => {
    // Check that the tutorial is still active (not completed)
    if (!activeTutorials.has(userId)) return;
    try {
      const ch = await client.channels.fetch(state.channelId).catch(() => null);
      if (ch) {
        const warnEmbed = new EmbedBuilder()
          .setColor("#FF6600")
          .setTitle("⏰ Tutorial Expirado")
          .setDescription(
            `**[Okabe]** — *[suspiro]* Parece que você... foi embora sem avisar.\n\n` +
            `O tutorial ficou inativo por **30 minutos** e será encerrado automaticamente.\n` +
            `Se quiser recomeçar, use o botão de tutorial no canal principal.\n\n` +
            `*Este canal será deletado em instantes.*`
          )
          .setFooter({ text: "Tutorial • Expirado por inatividade" });
        await ch.send({ embeds: [warnEmbed] }).catch(() => {});
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (e) { console.error("[TUTORIAL] Erro no aviso de expiração:", e); }
    await cleanupTutorial(client, state, userId);
  }, THIRTY_MIN);
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

async function handleStart(interaction) {
  const userId = interaction.user.id;

  if (activeTutorials.has(userId)) {
    return interaction.reply({ content: "Você já tem um tutorial ativo! Verifique o canal criado para você.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = interaction.guild;
    const safeName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "invocador";

    // Sempre adiciona um Gojo novo para o tutorial — assim sempre temos o ID para remover no cleanup,
    // independentemente de o jogador já ter um Gojo antes de começar.
    let tutorialGojoInstanceId = null;
    const result = playerRepository.addCharacter(userId, "satoru_gojo", 1);
    if (typeof result === "number") tutorialGojoInstanceId = result;

    const channel = await guild.channels.create({
      name:  `tutorial-${safeName}`,
      type:  ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.id, deny:  [PermissionFlagsBits.ViewChannel] },
        {
          id: userId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessages,
          ],
        },
        {
          // Bot needs VIEW_CHANNEL + SEND_MESSAGES to edit battle messages in this channel
          id: interaction.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
          ],
        },
      ],
    });

    const tutorialState = {
      channelId:              channel.id,
      step:                   "intro",
      tutorialGojoInstanceId: tutorialGojoInstanceId,
      battleId:               null,
      fendaDone:              false,
      nexusDone:              false,
      inactivityTimeoutId:    null,
    };
    activeTutorials.set(userId, tutorialState);
    tutorialChannels.set(channel.id, userId);
    scheduleInactivityTimeout(interaction.client, tutorialState, userId);

    await channel.send(buildIntro(userId));
    await interaction.editReply({ content: `✅ Seu tutorial foi criado! Acesse ${channel}.` });
  } catch (e) {
    console.error("[TUTORIAL] Erro ao criar canal:", e);
    activeTutorials.delete(interaction.user.id);
    await interaction.editReply({ content: "❌ Erro ao criar o canal de tutorial. Tente novamente." });
  }
}

async function handleNext(interaction, userId) {
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "Este não é o seu tutorial!", ephemeral: true });
  }

  const state = activeTutorials.get(userId);
  if (!state) {
    return interaction.reply({ content: "Tutorial não encontrado. Use o botão no canal de boas-vindas.", ephemeral: true });
  }

  // Retry battle after loss
  if (state.step === "battle_loss") {
    state.step = "battle_intro";
    return interaction.update(buildBattleIntroContent(userId));
  }

  const nextStep = NEXT_STEP[state.step];
  if (!nextStep) {
    return interaction.reply({ content: "Passo de tutorial inválido. Tente reiniciar.", ephemeral: true });
  }

  state.step = nextStep;
  const content = buildStep(nextStep, userId);
  if (!content) return;

  await interaction.update(content);

  if (nextStep === "end") {
    scheduleChannelDelete(interaction.client, state, userId);
  }
}

async function handleReply(interaction, userId, replyId) {
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "Este não é o seu tutorial!", ephemeral: true });
  }

  const state = activeTutorials.get(userId);
  if (!state) return interaction.reply({ content: "Tutorial não encontrado.", ephemeral: true });

  if (replyId === "modo_pergunta") {
    state.step = "game_modes_answered";
    return interaction.update(buildModoDica(userId));
  }
  if (replyId === "modo_continuar") {
    state.step = "end";
    await interaction.update(buildEnd(userId));
    scheduleChannelDelete(interaction.client, state, userId);
    return;
  }

  // Initial dialogue replies (onde / quem / acontecendo)
  state.step = "intro_replied";
  await interaction.update(buildReplyResponse(userId, replyId));
}

async function handleStartBattle(interaction, userId) {
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "Este não é o seu tutorial!", ephemeral: true });
  }
  const state = activeTutorials.get(userId);
  if (!state || state.step !== "battle_intro") {
    return interaction.reply({ content: "Este botão não está disponível agora.", ephemeral: true });
  }
  await startTutorialBattle(interaction, userId, state);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INTERACTION ROUTER
// ─────────────────────────────────────────────────────────────────────────────
async function handleInteraction(interaction) {
  const id = interaction.customId;

  try {
    if (id === "tutorial_start") return await handleStart(interaction);

    if (id.startsWith("tutorial_next_")) {
      const userId = id.slice("tutorial_next_".length);
      return await handleNext(interaction, userId);
    }

    if (id.startsWith("tutorial_start_battle_")) {
      const userId = id.slice("tutorial_start_battle_".length);
      return await handleStartBattle(interaction, userId);
    }

    if (id.startsWith("tutorial_fenda_pull_")) {
      const userId = id.slice("tutorial_fenda_pull_".length);
      return await handleFendaPull(interaction, userId);
    }

    if (id.startsWith("tutorial_nexus_pull_")) {
      const userId = id.slice("tutorial_nexus_pull_".length);
      return await handleNexusPull(interaction, userId);
    }

    if (id.startsWith("tutorial_reply_")) {
      const rest       = id.slice("tutorial_reply_".length);
      const firstUnder = rest.indexOf("_");
      const userId     = rest.slice(0, firstUnder);
      const replyId    = rest.slice(firstUnder + 1);
      return await handleReply(interaction, userId, replyId);
    }
  } catch (e) {
    console.error("[TUTORIAL] handleInteraction error:", e);
    try { await interaction.reply({ content: "❌ Erro interno no tutorial.", ephemeral: true }); } catch (_) {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: POSTAR EMBED NO CANAL DE TUTORIAL
// ─────────────────────────────────────────────────────────────────────────────
async function postTutorialEmbed(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply("❌ Apenas administradores podem usar este comando.");
  }
  try {
    const channel = await message.client.channels.fetch(TUTORIAL_CHAN_ID).catch(() => null);
    if (!channel) return message.reply(`❌ Canal \`${TUTORIAL_CHAN_ID}\` não encontrado.`);

    const embed = new EmbedBuilder()
      .setColor(OKABE_COLOR)
      .setThumbnail(OKABE_THUMB)
      .setTitle("⚗️ Laboratório de Gadgets do Futuro")
      .setDescription(
        `*"Eu, Okabe Rintaro, convoco você para a maior aventura da história do multiverso."*\n\n` +
        `**Linhas temporais dos seus animes favoritos estão sendo corrompidas.**\n` +
        `Heróis perdem batalhas que nunca deveriam perder. Universos inteiros entram em colapso.\n\n` +
        `Você é um **Invocador Dimensional** — capaz de chamar guerreiros de outras dimensões, ` +
        `equipá-los com artefatos e enviá-los para restaurar o equilíbrio do multiverso.\n\n` +
        `**Invoque. Evolua. Conquiste.**\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Clique no botão abaixo para iniciar o tutorial com o próprio Okabe Rintaro.*\n` +
        `*O tutorial cria um canal privado exclusivo para você.*`
      )
      .setFooter({ text: "El Psy Kongroo • Laboratório de Gadgets do Futuro" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("tutorial_start")
        .setLabel("🧪 Iniciar Tutorial com Okabe")
        .setStyle(ButtonStyle.Success),
    );

    await channel.send({ embeds: [embed], components: [row] });
    await message.reply(`✅ Embed de tutorial postado em ${channel}!`);
  } catch (e) {
    console.error("[TUTORIAL] postTutorialEmbed:", e);
    await message.reply("❌ Erro ao postar o embed.");
  }
}

module.exports = {
  handleInteraction,
  postTutorialEmbed,
  interceptCommand,
  onEquipComplete,
  onBattleEnd,
  getTutorialUserByChannel,
};
