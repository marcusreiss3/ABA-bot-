const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const Emojis = require("../config/emojis");

const RARITY_LABEL = { EM: "Essência Mítica", AL: "Aura Lendária", EC: "Eco Comum" };
const RARITY_ICON  = { EM: "👁️", AL: "🌟", EC: "◆" };

// ── Custos ────────────────────────────────────────────────────────────────────
const COST_1  = 25;
const COST_10 = 240;

// ── Pity AL: a cada 30 pulls sem AL/EM, garante 1 AL ─────────────────────────
const AL_PITY_LIMIT = 30;

// ── Banner alternado por hora ─────────────────────────────────────────────────
function getActiveBannerId() {
  return new Date().getHours() % 2 === 1 ? "sung" : "gojo";
}

function minutesToNextBanner() {
  const now  = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return Math.ceil((next - now) / 60000);
}

// ── Pools fixos por banner (não mudam com restart) ────────────────────────────
const BANNER_CONFIG = {
  sung: {
    id: "sung",
    name: "Monarca das Sombras",
    subtitle: "Sung Jin-Woo",
    description: "O caçador que transcendeu todos os limites abre o Nexus para recrutar guerreiros das trevas para seu exército eterno.",
    color: "#1a0033",
    featuredId: "sung_jin_woo",
    featuredName: "Sung Jin-Woo",
    thumbnail: "https://i.ibb.co/XZgZVnm8/image.png",
    bannerImage: "https://i.ibb.co/Z6KdsfyX/Chat-GPT-Image-21-de-abr-de-2026-17-11-32.png",
    alPool: ["itachi_uchiha", "denji", "levi", "shinji", "yuta_okkotsu"],
    ecPool: ["goku", "naruto", "luffy", "tanjiro", "asta"],
    otherEm: ["satoru_gojo"],
  },
  gojo: {
    id: "gojo",
    name: "O Mais Forte",
    subtitle: "Satoru Gojo",
    description: "No cerne do Infinito Ilimitado, o feiticeiro mais poderoso de todos os tempos convoca almas lendárias para a sua batalha.",
    color: "#001a33",
    featuredId: "satoru_gojo",
    featuredName: "Satoru Gojo",
    thumbnail: "https://i.ibb.co/whYQRrDQ/image.png",
    bannerImage: "https://i.ibb.co/Fj0j5HW/Chat-GPT-Image-21-de-abr-de-2026-16-52-20.png",
    alPool: ["frieren", "dio", "levi", "yuta_okkotsu"],
    ecPool: ["itadori", "edward", "naruto", "goku", "tanjiro"],
    otherEm: ["sung_jin_woo"],
  },
};

// ── Taxas ─────────────────────────────────────────────────────────────────────
// EM destaque: 0.65% | EM outros: 0.25% | AL total: 5.25% | EC: 93.85%
const RATE_EM_FEAT  = 0.65;
const RATE_EM_OTHER = 0.25;
const RATE_AL       = 5.25;

// ── Lógica de Pull ────────────────────────────────────────────────────────────
function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function singlePull(bannerId) {
  const b    = BANNER_CONFIG[bannerId];
  const roll = Math.random() * 100;

  if (roll < RATE_EM_FEAT)                          return { rarity: "EM", characterId: b.featuredId, featured: true };
  if (roll < RATE_EM_FEAT + RATE_EM_OTHER)          return { rarity: "EM", characterId: randFrom(b.otherEm), featured: false };
  if (roll < RATE_EM_FEAT + RATE_EM_OTHER + RATE_AL) return { rarity: "AL", characterId: randFrom(b.alPool), featured: false };
  return { rarity: "EC", characterId: randFrom(b.ecPool), featured: false };
}

function updatePityItem(userId, key, oldVal, newVal) {
  const diff = newVal - oldVal;
  if (diff > 0) playerRepository.addItem(userId, key, diff);
  else if (diff < 0) playerRepository.removeItem(userId, key, -diff);
}

function doPulls(bannerId, count, userId) {
  const pityKey = `nexus_pity_${bannerId}`;
  const items   = playerRepository.getPlayerItems(userId);
  let   alPity  = items.find(i => i.item_id === pityKey)?.quantity || 0;
  const oldPity = alPity;

  const results = [];
  for (let i = 0; i < count; i++) {
    alPity++;

    if (alPity >= AL_PITY_LIMIT) {
      results.push({ rarity: "AL", characterId: randFrom(BANNER_CONFIG[bannerId].alPool), featured: false, pity: true });
      alPity = 0;
      continue;
    }

    const result = singlePull(bannerId);
    results.push(result);
    if (result.rarity === "AL" || result.rarity === "EM") alPity = 0;
  }

  updatePityItem(userId, pityKey, oldPity, alPity);
  return results;
}

// ── Tipo de animação ──────────────────────────────────────────────────────────
function detectAnimType(results) {
  if (results.some(r => r.rarity === "EM")) return "em";
  if (results.some(r => r.rarity === "AL")) return "al";
  return "ec";
}

function getAnimFrames(animType) {
  if (animType === "em") {
    return [
      {
        title: "⬛ O Nexus desperta das trevas...",
        desc: "⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛\n\n*Uma frequência impossível ressoa entre as dimensões...*",
        delay: 1200,
      },
      {
        title: "💠 A barreira dimensional racha!",
        desc: "⬛ ⬛ ⬛ 💠 ⬛ ⬛ 💠 ⬛ ⬛ ⬛\n\n*Algo que não deveria existir começa a atravessar o véu...*",
        delay: 1200,
      },
      {
        title: "⚡ O Nexus colapsa sobre si mesmo!",
        desc: "💠 ⚡ 🌀 💠 ⬛ ⚡ 🌀 💠 ⚡ ⬛\n\n*A realidade se curva. Uma presença imensurável emerge das sombras.*",
        delay: 1200,
      },
      {
        title: "👁️ Uma sombra absoluta toma forma...",
        desc: "🌟 ⚡ 💠 🌀 👁️ 🌀 💠 ⚡ 🌟 💫\n\n*Os olhos se abrem. Não há como medir este poder.*",
        delay: 1100,
      },
      {
        title: "✦✦✦ UMA ENTIDADE LENDÁRIA SURGE DO NEXUS!",
        desc: "✨ 🌟 ⚡ 💫 👁️ 💫 ⚡ 🌟 ✨ 💠\n\n*O Nexus se fecha. O lendário está diante de você.*",
        delay: 1000,
      },
    ];
  }

  if (animType === "al") {
    return [
      {
        title: "🌀 O Nexus se ativa...",
        desc: "⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛\n\n*O portal interdimensional começa a vibrar com energia.*",
        delay: 1200,
      },
      {
        title: "💠 Energia atravessa o véu dimensional!",
        desc: "⬛ ⬛ 💠 ⬛ 🌀 ⬛ 💠 ⬛ ⬛ ⬛\n\n*Uma aura poderosa pressiona de outro lado...*",
        delay: 1200,
      },
      {
        title: "⚡ A silhueta se manifesta!",
        desc: "💠 🌀 ⚡ 💠 🌟 💠 ⚡ 🌀 💠 ⬛\n\n*A forma se solidifica. Um guerreiro emerge do portal.*",
        delay: 1100,
      },
      {
        title: "✦ O Nexus entrega seu campeão!",
        desc: "🌟 ✨ 💫 ⚡ 💠 ⚡ 💫 ✨ 🌟 💠\n\n*A conexão é forjada. Um poder raro aguarda por você.*",
        delay: 900,
      },
    ];
  }

  // ec
  return [
    {
      title: "🌀 O Nexus se ativa...",
      desc: "⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛ ⬛\n\n*O portal interdimensional começa a vibrar...*",
      delay: 1200,
    },
    {
      title: "💠 O portal se abre!",
      desc: "💠 ⬛ 🌀 ⬛ 💠 ⬛ 🌀 ⬛ 💠 ⬛\n\n*Uma presença atravessa as dimensões...*",
      delay: 1200,
    },
    {
      title: "✨ O guerreiro emerge!",
      desc: "💠 🌀 ✨ 💠 🌀 ✨ 💠 🌀 ✨ 💠\n\n*O portal se fecha. O guerreiro está do seu lado.*",
      delay: 900,
    },
  ];
}

// ── Embeds ────────────────────────────────────────────────────────────────────
function createBannerEmbed(bannerId, userId) {
  const b      = BANNER_CONFIG[bannerId];
  const player = playerRepository.getPlayer(userId);
  const zenith = player.zenith_fragments || 0;
  const items  = playerRepository.getPlayerItems(userId);
  const pity   = items.find(i => i.item_id === `nexus_pity_${bannerId}`)?.quantity || 0;

  return new EmbedBuilder()
    .setTitle(`✦ Nexus Zenith — ${b.name}`)
    .setDescription(
      `${Emojis.ZENITH} Você possui **${zenith}** Zenith\n` +
      `🎯 Pity AL: **${pity}/${AL_PITY_LIMIT}** · ⏱️ Troca em **${minutesToNextBanner()}min**`
    )
    .setColor(b.color)
    .setImage(b.bannerImage);
}

function makeAnimEmbed(bannerId, frame) {
  const b = BANNER_CONFIG[bannerId];
  return new EmbedBuilder()
    .setTitle(frame.title)
    .setDescription(frame.desc)
    .setColor(b.color);
}

function createResultEmbed(bannerId, results, userId) {
  const b      = BANNER_CONFIG[bannerId];
  const player = playerRepository.getPlayer(userId);
  const zenith = player.zenith_fragments || 0;
  const items  = playerRepository.getPlayerItems(userId);
  const pity   = items.find(i => i.item_id === `nexus_pity_${bannerId}`)?.quantity || 0;

  const order = { EM: 0, AL: 1, EC: 2 };
  const sorted = [...results].sort((a, bx) => order[a.rarity] - order[bx.rarity]);

  // Agrupar por raridade
  const groups = { EM: [], AL: [], EC: [] };
  for (const r of sorted) {
    const c    = CharacterManager.getCharacter(r.characterId, {});
    const name = c?.name || r.characterId;
    const tags = [];
    if (r.featured) tags.push("✦ *Destaque*");
    if (r.pity)    tags.push("*(pity)*");
    groups[r.rarity].push(name + (tags.length ? ` — ${tags.join(" ")}` : ""));
  }

  // Cor pelo melhor resultado
  const bestColor = groups.EM.length ? "#ffd700" : groups.AL.length ? "#a78bfa" : b.color;

  const embed = new EmbedBuilder()
    .setTitle(`💠 Nexus Zenith — ${b.name}`)
    .setColor(bestColor)
    .setThumbnail(b.thumbnail)
    .setFooter({ text: `💠 Zenith restante: ${zenith}  ·  Pity AL: ${pity}/${AL_PITY_LIMIT}` });

  // Bloco de descrição: resumo em uma linha
  const countEM = groups.EM.length, countAL = groups.AL.length, countEC = groups.EC.length;
  const summaryParts = [];
  if (countEM) summaryParts.push(`**${countEM}** Essência Mítica`);
  if (countAL) summaryParts.push(`**${countAL}** Aura Lendária`);
  if (countEC) summaryParts.push(`**${countEC}** Eco Comum`);
  embed.setDescription(`> **${results.length} invocaç${results.length > 1 ? "ões" : "ão"}** — ${summaryParts.join(" · ")}`);

  // Field EM
  if (groups.EM.length) {
    const lines = groups.EM.map(n => `👁️ **${n}**`);
    embed.addFields({ name: "✦✦✦  ESSÊNCIA MÍTICA  ✦✦✦", value: lines.join("\n"), inline: false });
  }

  // Field AL
  if (groups.AL.length) {
    const lines = groups.AL.map(n => `🌟 ${n}`);
    embed.addFields({ name: "✦  Aura Lendária", value: lines.join("\n"), inline: false });
  }

  // Field EC
  if (groups.EC.length) {
    const ecText = groups.EC.join("  ·  ");
    embed.addFields({ name: "◆  Eco Comum", value: ecText.length > 1020 ? ecText.slice(0, 1017) + "..." : ecText, inline: false });
  }

  return embed;
}

function createInfoEmbed(bannerId) {
  const b = BANNER_CONFIG[bannerId];

  const ratePerAL = (RATE_AL / b.alPool.length).toFixed(2);
  const ratePerEC = ((100 - RATE_EM_FEAT - RATE_EM_OTHER - RATE_AL) / b.ecPool.length).toFixed(2);
  const ratePerOtherEM = b.otherEm.length ? (RATE_EM_OTHER / b.otherEm.length).toFixed(2) : "0.00";

  const emFeatLine = `👁️ **${b.featuredName}** — \`${RATE_EM_FEAT.toFixed(2)}%\` ✦ *Destaque*`;
  const emOtherLines = b.otherEm.map(id => {
    const c = CharacterManager.getCharacter(id, {});
    return `👁️ ${c?.name || id} — \`${ratePerOtherEM}%\``;
  });
  const alLines = b.alPool.map(id => {
    const c = CharacterManager.getCharacter(id, {});
    return `🌟 ${c?.name || id} — \`${ratePerAL}%\``;
  });
  const ecLines = b.ecPool.map(id => {
    const c = CharacterManager.getCharacter(id, {});
    return `◆ ${c?.name || id} — \`${ratePerEC}%\``;
  });

  return new EmbedBuilder()
    .setTitle(`📖 Guerreiros do Nexus — ${b.name}`)
    .setDescription(
      `**✦✦✦  Essência Mítica**\n${emFeatLine}\n${emOtherLines.join("\n")}\n\n` +
      `**✦  Aura Lendária**\n${alLines.join("\n")}\n\n` +
      `**◆  Eco Comum**\n${ecLines.join("\n")}\n\n` +
      `> 🎯 Pity AL garantida a cada **${AL_PITY_LIMIT}** invocações sem AL/EM`
    )
    .setColor(b.color)
    .setThumbnail(b.thumbnail);
}

// ── Botões ────────────────────────────────────────────────────────────────────
function createPullButtons(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`nexus_pull_1_${userId}`).setLabel(`1x Invocação (${COST_1} Zenith)`).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`nexus_pull_10_${userId}`).setLabel(`10x Invocações (${COST_10} Zenith)`).setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`nexus_info_${userId}`).setLabel("📖 Ver Guerreiros").setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function createAfterPullButtons(userId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`nexus_pull_1_${userId}`).setLabel(`1x Novamente (${COST_1} Zenith)`).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`nexus_pull_10_${userId}`).setLabel(`10x Novamente (${COST_10} Zenith)`).setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`nexus_view_${userId}`).setLabel("← Ver Banner").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`nexus_info_${userId}`).setLabel("📖 Ver Guerreiros").setStyle(ButtonStyle.Secondary),
    ),
  ];
}

// ── Handler de interações ─────────────────────────────────────────────────────
async function handleInteraction(interaction) {
  const userId = interaction.user.id;
  const id     = interaction.customId;

  if (id.startsWith("nexus_view_")) {
    const bannerId = getActiveBannerId();
    return interaction.update({
      embeds: [createBannerEmbed(bannerId, userId)],
      components: createPullButtons(userId),
    });
  }

  if (id.startsWith("nexus_info_")) {
    const bannerId = getActiveBannerId();
    return interaction.update({
      embeds: [createInfoEmbed(bannerId)],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`nexus_view_${userId}`).setLabel("← Voltar ao Banner").setStyle(ButtonStyle.Secondary),
      )],
    });
  }

  if (id.startsWith("nexus_pull_")) {
    const parts  = id.split("_");
    const count  = parseInt(parts[2]);
    if (![1, 10].includes(count)) return;

    const bannerId = getActiveBannerId();
    const cost     = count === 1 ? COST_1 : COST_10;
    const player   = playerRepository.getPlayer(userId);
    const zenith   = player.zenith_fragments || 0;

    if (zenith < cost) {
      return interaction.reply({
        content: `❌ Zenith insuficiente! Precisa de **${cost}**, você tem **${zenith}**.`,
        ephemeral: true,
      });
    }

    playerRepository.updatePlayer(userId, { zenith_fragments: zenith - cost });
    const results = doPulls(bannerId, count, userId);

    // Adicionar personagens ao jogador (slots cheios → Limbo)
    const limboNames = [];
    const lostNames  = [];
    for (const r of results) {
      const res = playerRepository.addCharacter(userId, r.characterId);
      if (res && res.error) {
        const limboRes = playerRepository.addToLimbo(userId, r.characterId);
        const name = CharacterManager.getCharacter(r.characterId, {})?.name || r.characterId;
        if (limboRes && limboRes.error === "limbo_full") lostNames.push(name);
        else limboNames.push(name);
      }
    }

    // Animação
    const animType = detectAnimType(results);
    const frames   = getAnimFrames(animType);

    await interaction.update({ embeds: [makeAnimEmbed(bannerId, frames[0])], components: [] });
    for (let i = 1; i < frames.length; i++) {
      await new Promise(r => setTimeout(r, frames[i - 1].delay));
      await interaction.editReply({ embeds: [makeAnimEmbed(bannerId, frames[i])], components: [] });
    }
    await new Promise(r => setTimeout(r, frames[frames.length - 1].delay));

    const resultEmbed = createResultEmbed(bannerId, results, userId);
    const desc = resultEmbed.data.description || "";
    const notes = [];
    if (limboNames.length > 0) notes.push(`🌀 *Slots cheios — ${limboNames.join(", ")} ${limboNames.length > 1 ? "foram enviados" : "foi enviado"} para o **Limbo** (\`!limbo\` para resgatar).*`);
    if (lostNames.length > 0)  notes.push(`⚠️ *Limbo cheio — ${lostNames.join(", ")} ${lostNames.length > 1 ? "foram perdidos" : "foi perdido"}. Libere espaço no \`!limbo\`.*`);
    if (notes.length > 0) resultEmbed.setDescription(desc + "\n\n" + notes.join("\n"));

    return interaction.editReply({ embeds: [resultEmbed], components: createAfterPullButtons(userId) });
  }
}

module.exports = { execute: async (message) => {
  const bannerId = getActiveBannerId();
  await message.reply({ embeds: [createBannerEmbed(bannerId, message.author.id)], components: createPullButtons(message.author.id) });
}, handleInteraction };
