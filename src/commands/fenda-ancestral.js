const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const ArtifactManager = require("../services/ArtifactManager");
const Emojis = require("../config/emojis");

// ── Banner alternado por hora: par = gojo, ímpar = sung ────────────────────
function getActiveBannerId() {
  return new Date().getHours() % 2 === 1 ? "sung" : "gojo";
}

// ── Pools fixos de cada banner ──────────────────────────────────────────────
const FIXED_POOLS = {
  sung: ["hogyoku", "pesos_lee", "chakra_nova_caudas", "marca_maldicao", "capsula_curativa", "esfera_4_estrelas"],
  gojo: ["sharingan", "haki_do_rei", "dedo_sukuna", "pedra_filosofal", "controle_infinito", "roda_mahoraga"],
};


function minutesToNextBanner() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return Math.ceil((next - now) / 60000);
}

// ── Configuração dos Banners ────────────────────────────────────────────────
const BANNER_BASE = {
  sung: {
    id: "sung",
    name: "Rei das Sombras",
    subtitle: "Sung Jin-Woo",
    description: "Das profundezas da masmorra mais sombria, o Monarca das Sombras convoca suas relíquias para o plano mortal.",
    color: "#1a0033",
    featuredId: "knight_killer",
    featuredEmoji: Emojis.KNIGHT_KILLER,
    featuredName: "Knight Killer",
    thumbnail: "https://i.ibb.co/XZgZVnm8/image.png",
  },
  gojo: {
    id: "gojo",
    name: "O Mais Forte",
    subtitle: "Satoru Gojo",
    description: "No âmago do Infinito Ilimitado, o feiticeiro mais poderoso libera as relíquias seladas há milênios.",
    color: "#001a33",
    featuredId: "seis_olhos",
    featuredEmoji: Emojis.SEIS_OLHOS,
    featuredName: "Seis Olhos",
    thumbnail: "https://i.ibb.co/whYQRrDQ/image.png",
  },
};

function getBanner(bannerId) {
  return { ...BANNER_BASE[bannerId], pool: FIXED_POOLS[bannerId] };
}

// ── Fragmentos de cada relíquia ─────────────────────────────────────────────
const FRAGMENTS = {
  knight_killer:     { itemId: "f_knightkiller",    emoji: Emojis.F_KNIGHTKILLER,   minQty: 12, maxQty: 20 },
  seis_olhos:        { itemId: "f_seisolhos",        emoji: Emojis.F_SEISOLHOS,      minQty: 12, maxQty: 20 },
  hogyoku:           { itemId: "f_hogyoku",          emoji: Emojis.F_HOGYOKU,        minQty: 10, maxQty: 18 },
  pesos_lee:         { itemId: "f_pesoslee",         emoji: Emojis.F_PESOSLEE,       minQty: 10, maxQty: 18 },
  controle_infinito: { itemId: "f_infinito",         emoji: Emojis.F_INFINITO,       minQty: 10, maxQty: 18 },
  chakra_nova_caudas:{ itemId: "f_chakrakurama",     emoji: Emojis.F_CHAKRAKURAMA,   minQty: 10, maxQty: 18 },
  haki_do_rei:       { itemId: "f_haki",             emoji: Emojis.F_HAKI,           minQty: 10, maxQty: 18 },
  capsula_curativa:  { itemId: "f_capsula",          emoji: Emojis.F_CAPSULA,        minQty: 10, maxQty: 18 },
  sharingan:         { itemId: "f_sharingan",        emoji: Emojis.F_SHARINGAN,      minQty: 10, maxQty: 18 },
  roda_mahoraga:     { itemId: "f_rodamahoraga",     emoji: Emojis.F_RODAMAHORAGA,   minQty: 10, maxQty: 18 },
  marca_maldicao:    { itemId: "f_marcamaldi",       emoji: Emojis.F_MARCAMALDI,     minQty: 10, maxQty: 18 },
  dedo_sukuna:       { itemId: "f_sukuna",           emoji: Emojis.F_SUKUNA,         minQty: 10, maxQty: 18 },
  pedra_filosofal:   { itemId: "f_pedrafilosofal",   emoji: Emojis.F_PEDRAFILOSOFAL, minQty: 10, maxQty: 18 },
  esfera_4_estrelas: { itemId: "f_esfera",           emoji: Emojis.F_ESFERA,         minQty: 10, maxQty: 18 },
};

const COST_1  = 25;
const COST_10 = 240;
const FRAGMENTS_NEEDED = 100;

// ── Lógica de Pull ──────────────────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedPick(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Pity de fragmento em destaque: a cada 20 pulls sem ganhar frag. do featured, garante 1
const FRAG_PITY_LIMIT = 20;

function singlePull(bannerId) {
  const banner = getBanner(bannerId);
  const roll = Math.random() * 100;

  // 0.2% relíquia em destaque
  if (roll < 0.20) return { type: "artifact", artifactId: banner.featuredId, featured: true };
  // 0.8% relíquia do pool (total 1%)
  if (roll < 1.00) {
    const id = banner.pool[Math.floor(Math.random() * banner.pool.length)];
    return { type: "artifact", artifactId: id, featured: false };
  }

  // 94% fragmentos — featured com peso 1, outros com peso 5
  const pool    = [banner.featuredId, ...banner.pool];
  const weights = pool.map(id => id === banner.featuredId ? 1 : 5);
  const picked  = weightedPick(pool, weights);
  const frag    = FRAGMENTS[picked];
  const qty     = randInt(frag.minQty, frag.maxQty);
  const isFeaturedFrag = picked === banner.featuredId;
  return { type: "fragment", artifactId: picked, itemId: frag.itemId, emoji: frag.emoji, qty, isFeaturedFrag };
}

function updatePityItem(userId, key, oldVal, newVal) {
  const diff = newVal - oldVal;
  if (diff > 0) playerRepository.addItem(userId, key, diff);
  else if (diff < 0) playerRepository.removeItem(userId, key, -diff);
}

function doPulls(bannerId, count, userId) {
  const banner = getBanner(bannerId);
  const items  = playerRepository.getPlayerItems(userId);

  // Pity por banner — persiste entre restarts via player_items
  const pityKey = `fenda_pity_${bannerId}`;
  let fragPity    = items.find(i => i.item_id === pityKey)?.quantity || 0;
  const oldFragPity = fragPity;

  const results = [];
  for (let i = 0; i < count; i++) {
    fragPity++;

    // Pity de fragmento em destaque ativado
    if (fragPity >= FRAG_PITY_LIMIT) {
      const frag = FRAGMENTS[banner.featuredId];
      const qty  = randInt(frag.minQty, frag.maxQty);
      results.push({ type: "fragment", artifactId: banner.featuredId, itemId: frag.itemId, emoji: frag.emoji, qty, isFeaturedFrag: true });
      fragPity = 0;
      continue;
    }

    const result = singlePull(bannerId);
    results.push(result);

    // Resetar pity se ganhou fragmento ou relíquia em destaque
    if ((result.type === "fragment" && result.isFeaturedFrag) ||
        (result.type === "artifact" && result.artifactId === banner.featuredId)) {
      fragPity = 0;
    }
  }

  // Persistir pity no banco
  updatePityItem(userId, pityKey, oldFragPity, fragPity);

  return results;
}

// ── Detectar tipo de animação ───────────────────────────────────────────────
// "artifact" → raridade máxima | "featured" → fragmento em destaque | "normal" → padrão
function detectAnimationType(results) {
  if (results.some(r => r.type === "artifact")) return "artifact";
  if (results.some(r => r.type === "fragment" && r.isFeaturedFrag)) return "featured";
  return "normal";
}

// ── Frames de animação ──────────────────────────────────────────────────────
function getAnimationFrames(animType) {
  if (animType === "artifact") {
    return [
      {
        title: "🌌 A Fenda Ancestral treme...",
        desc: "🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑\n\n*Algo... imensurável... se aproxima das trevas.*",
        delay: 1200,
      },
      {
        title: "⚡ As dimensões colidem!",
        desc: "🌑 🌑 ⭐ 🌟 ⭐ 🌑 🌑 🌑 🌑 🌑\n\n*O espaço entre os mundos oscila de forma violenta...*",
        delay: 1200,
      },
      {
        title: "🔥 O portal se rasga!",
        desc: "✨ 🌟 💫 🔥 ✨ 💥 🌟 ⚡ 💫 🔥\n\n*Uma força ancestral de proporções inimagináveis emerge!*",
        delay: 1100,
      },
      {
        title: "💥 Uma Relíquia Ancestral se manifesta!",
        desc: "🌠 🔥 ⚡ 💥 🌟 ✨ 💫 🔥 ⚡ 🌠\n\n*O poder é inegável. A relíquia aguardava por você.*",
        delay: 1100,
      },
      {
        title: "🌟 A Fenda revela seu tesouro!",
        desc: "✨ 💥 🌟 🌠 ⚡ 🔥 💫 🌟 ✨ 💥\n\n*Tudo se acalma. Algo extraordinário jaz diante de seus olhos.*",
        delay: 900,
      },
    ];
  }

  if (animType === "featured") {
    return [
      {
        title: "🌀 A Fenda Ancestral se abre...",
        desc: "🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑\n\n*O espaço entre as dimensões começa a rasgar...*",
        delay: 1300,
      },
      {
        title: "✨ Uma ressonância especial...",
        desc: "🌑 🌑 ✨ 💫 ✨ 🌑 🌑 💫 🌑 🌑\n\n*Uma energia diferente pulsa — reconhecível, poderosa.*",
        delay: 1300,
      },
      {
        title: "🌟 Um fragmento raro emerge!",
        desc: "✨ 🌟 💫 🌠 ⭐ 💫 🌟 ✨ ⭐ 🌠\n\n*O brilho inconfundível de uma relíquia em destaque!*",
        delay: 1000,
      },
      {
        title: "🌠 A Fenda entrega seu presente!",
        desc: "🌟 ✨ 💫 🌠 ⭐ 🌌 💫 🌟 ✨ ⭐\n\n*O fragmento se solidifica. Você está mais perto do que imagina.*",
        delay: 900,
      },
    ];
  }

  // normal
  return [
    {
      title: "🌀 A Fenda Ancestral se abre...",
      desc: "🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑 🌑\n\n*O espaço entre as dimensões começa a rasgar...*",
      delay: 1300,
    },
    {
      title: "🌠 Energias ancestrais convergem...",
      desc: "✨ 💫 🌟 ⭐ 🌠 🌑 🌑 🌑 🌑 🌑\n\n*Uma força desconhecida atravessa o portal das sombras...*",
      delay: 1300,
    },
    {
      title: "🌌 As relíquias emergem das trevas!",
      desc: "🌟 ✨ 💫 🌠 ⭐ 🌌 💫 🌟 ✨ ⭐\n\n*O portal se fecha. As relíquias surgem diante de você!*",
      delay: 900,
    },
  ];
}

function makeAnimEmbed(bannerId, frame) {
  const b = BANNER_BASE[bannerId];
  return new EmbedBuilder()
    .setTitle(frame.title)
    .setDescription(frame.desc)
    .setColor(b.color);
}

// ── Embeds ──────────────────────────────────────────────────────────────────
function createBannerEmbed(bannerId, userId) {
  const b = getBanner(bannerId);
  const items = playerRepository.getPlayerItems(userId);
  const fr    = items.find(i => i.item_id === "fr")?.quantity || 0;
  const pity  = items.find(i => i.item_id === `fenda_pity_${bannerId}`)?.quantity || 0;

  const poolSize = b.pool.length;
  const perPool  = (0.80 / poolSize).toFixed(2);

  const poolLines = b.pool.map(id => {
    const art = ArtifactManager.getArtifact(id, {});
    return art ? `${art.emoji} ${art.name} — \`${perPool}%\`` : id;
  });

  return new EmbedBuilder()
    .setTitle(`${b.featuredEmoji} ${b.name} — ${b.subtitle}`)
    .setDescription(
      `*${b.description}*\n\n` +
      `**Relíquia em Destaque:**\n` +
      `${b.featuredEmoji} **${b.featuredName}** ✦ \`0.20%\`\n\n` +
      `**Relíquias do Pool:**\n${poolLines.join("\n")}\n\n` +
      `> ${Emojis.ARTIFACT} **FR disponíveis:** \`${fr}\``
    )
    .setColor(b.color)
    .setThumbnail(b.thumbnail)
    .setFooter({ text: `Fenda Ancestral · 1x ${COST_1} FR · 10x ${COST_10} FR · Troca de banner em: ${minutesToNextBanner()}min · Pity frag.: ${pity}/${FRAG_PITY_LIMIT}` });
}

function createResultEmbed(bannerId, results, userId) {
  const b = BANNER_BASE[bannerId];
  const items = playerRepository.getPlayerItems(userId);
  const fr = items.find(i => i.item_id === "fr")?.quantity || 0;

  const artifacts = results.filter(r => r.type === "artifact");
  const fragMap = {};
  results.filter(r => r.type === "fragment").forEach(r => {
    if (!fragMap[r.artifactId]) fragMap[r.artifactId] = { emoji: r.emoji, qty: 0, featured: r.isFeaturedFrag };
    fragMap[r.artifactId].qty += r.qty;
  });

  const lines = [];

  if (artifacts.length > 0) {
    artifacts.forEach(a => {
      const art = ArtifactManager.getArtifact(a.artifactId, {});
      const star = a.featured ? "✦✦✦" : "✦";
      lines.push(`${star} **RELÍQUIA OBTIDA!** ${art?.emoji || ""} **${art?.name || a.artifactId}** ${star}`);
    });
    lines.push("");
  }

  Object.entries(fragMap).forEach(([artId, data]) => {
    const frag = FRAGMENTS[artId];
    const art = ArtifactManager.getArtifact(artId, {});
    const artName = art?.name || artId;
    // stored já é o total atualizado (salvo antes de chamar esta função)
    const newTotal = items.find(i => i.item_id === frag?.itemId)?.quantity || 0;
    const featMark = data.featured ? " ✦" : "";
    lines.push(`${data.emoji}${featMark} **${artName}** +${data.qty} \`${Math.min(newTotal, FRAGMENTS_NEEDED)}\``);
  });

  return new EmbedBuilder()
    .setTitle(`${b.featuredEmoji} Relíquias da Fenda — ${b.name}`)
    .setDescription(lines.join("\n") || "Nenhum resultado.")
    .setColor(b.color)
    .setThumbnail(b.thumbnail)
    .setFooter({ text: `FR restantes: ${fr} · Use !inv para ver seus fragmentos` });
}

// ── Descrição legível de cada efeito ────────────────────────────────────────
const ANIME_LABELS = {
  dragonball: "Dragon Ball",
  naruto: "Naruto",
  bleach: "Bleach",
  jjk: "Jujutsu Kaisen",
  onepiece: "One Piece",
};

const CHAR_LABELS = {
  itadori: "Itadori",
  satoru_gojo: "Gojo",
  sung_jin_woo: "Sung Jin-Woo",
  naruto: "Naruto",
  ichigo: "Ichigo",
};

function describeArtifact(art) {
  if (!art) return "*Sem descrição disponível.*";
  const lines = [];

  switch (art.effectType) {
    case "maxHealth":
      lines.push(`→ +${Math.round(art.effectValue * 100)}% de HP máximo`);
      break;
    case "maxEnergy":
      lines.push(`→ +${Math.round(art.effectValue * 100)}% de energia máxima`);
      break;
    case "energyCost":
      lines.push(`→ -${art.effectValue} de custo de energia em todas as habilidades`);
      break;
    case "damageReduction":
      lines.push(`→ -${Math.round(art.effectValue * 100)}% de dano recebido`);
      break;
    case "damage": {
      let cond = "";
      if (art.conditionType === "anime")       cond = ` *(personagens do universo ${ANIME_LABELS[art.conditionValue] || art.conditionValue})*`;
      if (art.conditionType === "character")   cond = ` *(apenas ${CHAR_LABELS[art.conditionValue] || art.conditionValue})*`;
      if (art.conditionType === "hpAdvantage") cond = " *(quando com mais HP que o oponente)*";
      if (art.conditionType === "damageType")  cond = ` *(apenas ataques físicos)*`;
      lines.push(`→ +${Math.round(art.effectValue * 100)}% de dano${cond}`);
      break;
    }
    case "stacking_damage":
      lines.push(`→ +${Math.round(art.effectValue * 100)}% de dano a cada ataque *(acumula, máx ${Math.round(art.effectValue * 100 * 6)}%)*`);
      break;
    case "stacking_defense":
      lines.push(`→ +${Math.round(art.effectValue * 100)}% redução de dano ao levar dano *(acumula, máx ${Math.round(art.effectValue * 100 * 5)}%)*`);
      break;
    case "curse_mark":
      lines.push(`→ +${Math.round(art.effectValue * 100)}% de dano`);
      lines.push(`→ -10% de HP máximo`);
      break;
    default:
      lines.push("→ Efeito especial");
  }

  if (art.secondaryEffect) {
    const sec = art.secondaryEffect;
    if (sec.type === "damageReduction") lines.push(`→ +${Math.round(sec.value * 100)}% redução de dano recebido`);
    if (sec.type === "maxEnergy")       lines.push(`→ +${Math.round(sec.value * 100)}% de energia máxima`);
    if (sec.type === "maxHealth")       lines.push(`→ +${Math.round(sec.value * 100)}% de HP máximo`);
  }

  return lines.join("\n");
}

function createRelicsInfoEmbed(bannerId) {
  const b = getBanner(bannerId);

  const featured = ArtifactManager.getArtifact(b.featuredId, {});
  const poolArts = b.pool.map(id => ArtifactManager.getArtifact(id, {})).filter(Boolean);

  const lines = [
    `${b.featuredEmoji} **${featured?.name || b.featuredName}** ✦ *Em Destaque*`,
    describeArtifact(featured),
    "",
  ];

  poolArts.forEach(art => {
    lines.push(`${art.emoji} **${art.name}**`);
    lines.push(describeArtifact(art));
    lines.push("");
  });

  return new EmbedBuilder()
    .setTitle(`📖 Relíquias do Banner — ${b.name}`)
    .setDescription(lines.join("\n").trimEnd())
    .setColor(b.color)
    .setThumbnail(b.thumbnail)
    .setFooter({ text: "Fenda Ancestral · Efeitos passivos — aplicados automaticamente na batalha" });
}

// ── Botões ───────────────────────────────────────────────────────────────────
function createPullButtons(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fenda_pull_1_${userId}`)
        .setLabel(`1x Invocação (${COST_1} FR)`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`fenda_pull_10_${userId}`)
        .setLabel(`10x Invocações (${COST_10} FR)`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`fenda_info_${userId}`)
        .setLabel("📖 Ver Relíquias")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function createAfterPullButtons(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fenda_pull_1_${userId}`)
        .setLabel(`1x Novamente (${COST_1} FR)`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`fenda_pull_10_${userId}`)
        .setLabel(`10x Novamente (${COST_10} FR)`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`fenda_view_${userId}`)
        .setLabel("← Ver Banner")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`fenda_info_${userId}`)
        .setLabel("📖 Ver Relíquias")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

// ── Handler de interações ────────────────────────────────────────────────────
async function handleInteraction(interaction) {
  const userId = interaction.user.id;
  const id = interaction.customId;

  // Ver banner atual (determinado pela hora)
  if (id.startsWith("fenda_view_")) {
    const bannerId = getActiveBannerId();
    return interaction.update({
      embeds: [createBannerEmbed(bannerId, userId)],
      components: createPullButtons(userId),
    });
  }

  // Ver descrição das relíquias do banner
  if (id.startsWith("fenda_info_")) {
    const bannerId = getActiveBannerId();
    return interaction.update({
      embeds: [createRelicsInfoEmbed(bannerId)],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`fenda_view_${userId}`)
            .setLabel("← Voltar ao Banner")
            .setStyle(ButtonStyle.Secondary),
        ),
      ],
    });
  }

  // Executar pull
  if (id.startsWith("fenda_pull_")) {
    const parts  = id.split("_");   // fenda_pull_{count}_{userId}
    const count  = parseInt(parts[2]);
    if (![1, 10].includes(count)) return;

    const bannerId = getActiveBannerId();
    const cost  = count === 1 ? COST_1 : COST_10;
    const items = playerRepository.getPlayerItems(userId);
    const fr    = items.find(i => i.item_id === "fr")?.quantity || 0;

    if (fr < cost) {
      return interaction.reply({
        content: `❌ Você não tem FR suficientes! Precisa de **${cost} FR**, você tem **${fr}**.`,
        ephemeral: true,
      });
    }

    playerRepository.removeItem(userId, "fr", cost);
    const results = doPulls(bannerId, count, userId);

    // Salvar no banco
    const fragTotals = {};
    results.forEach(r => {
      if (r.type === "fragment") {
        fragTotals[r.itemId] = (fragTotals[r.itemId] || 0) + r.qty;
      } else if (r.type === "artifact") {
        playerRepository.addArtifact(userId, r.artifactId);
      }
    });
    Object.entries(fragTotals).forEach(([itemId, qty]) => {
      playerRepository.addItem(userId, itemId, qty);
    });

    // Detectar tipo de animação
    const animType = detectAnimationType(results);
    const frames = getAnimationFrames(animType);

    // Rodar animação
    await interaction.update({ embeds: [makeAnimEmbed(bannerId, frames[0])], components: [] });
    for (let i = 1; i < frames.length; i++) {
      await new Promise(r => setTimeout(r, frames[i - 1].delay));
      await interaction.editReply({ embeds: [makeAnimEmbed(bannerId, frames[i])], components: [] });
    }
    await new Promise(r => setTimeout(r, frames[frames.length - 1].delay));

    // Resultado final
    return interaction.editReply({
      embeds: [createResultEmbed(bannerId, results, userId)],
      components: createAfterPullButtons(userId),
    });
  }
}

// ── Exportações ───────────────────────────────────────────────────────────────
module.exports = {
  execute: async (message) => {
    const userId = message.author.id;
    const bannerId = getActiveBannerId();
    await message.reply({
      embeds: [createBannerEmbed(bannerId, userId)],
      components: createPullButtons(userId),
    });
  },
  handleInteraction,
  COST_1,
  COST_10,
  FRAGMENTS,
  FRAGMENTS_NEEDED,
};
