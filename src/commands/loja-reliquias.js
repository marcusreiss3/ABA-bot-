const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const Emojis = require("../config/emojis");

// ── Pacotes fixos de FR ───────────────────────────────────────────────────────
const FR_PACKS = [
  { id: "fr_15",  qty: 15,  price: 40  },
  { id: "fr_50",  qty: 50,  price: 100 },
  { id: "fr_150", qty: 150, price: 250 },
];

// ── Slots rotativos ───────────────────────────────────────────────────────────
const ROTATING_SLOTS = [
  { qty: 10, price: 100 },
  { qty: 20, price: 150 },
  { qty: 35, price: 220 },
];

// ── Pool de fragmentos específicos (todos do !fenda, sem os em destaque) ──────
const SHOP_FRAGMENTS = {
  sharingan:          { itemId: "f_sharingan",      emoji: Emojis.F_SHARINGAN,      name: "Sharingan" },
  haki_do_rei:        { itemId: "f_haki",           emoji: Emojis.F_HAKI,           name: "Haki do Rei" },
  roda_mahoraga:      { itemId: "f_rodamahoraga",   emoji: Emojis.F_RODAMAHORAGA,   name: "Roda de Mahoraga" },
  controle_infinito:  { itemId: "f_infinito",       emoji: Emojis.F_INFINITO,       name: "Controle Infinito" },
  chakra_nova_caudas: { itemId: "f_chakrakurama",   emoji: Emojis.F_CHAKRAKURAMA,   name: "Chakra das 9 Caudas" },
  hogyoku:            { itemId: "f_hogyoku",        emoji: Emojis.F_HOGYOKU,        name: "Hōgyoku" },
  pesos_lee:          { itemId: "f_pesoslee",        emoji: Emojis.F_PESOSLEE,       name: "Pesos de Lee" },
  marca_maldicao:     { itemId: "f_marcamaldi",     emoji: Emojis.F_MARCAMALDI,     name: "Marca da Maldição" },
  dedo_sukuna:        { itemId: "f_sukuna",         emoji: Emojis.F_SUKUNA,         name: "Dedo de Sukuna" },
  pedra_filosofal:    { itemId: "f_pedrafilosofal", emoji: Emojis.F_PEDRAFILOSOFAL, name: "Pedra Filosofal" },
  capsula_curativa:   { itemId: "f_capsula",        emoji: Emojis.F_CAPSULA,        name: "Cápsula Curativa" },
  esfera_4_estrelas:  { itemId: "f_esfera",         emoji: Emojis.F_ESFERA,         name: "Esfera das 4 Estrelas" },
};
const POOL_KEYS = Object.keys(SHOP_FRAGMENTS);

// ── Seed determinístico por hora ──────────────────────────────────────────────
function getStockSeed() {
  const now = new Date();
  return now.getFullYear() * 1000000 +
         (now.getMonth() + 1) * 10000 +
         now.getDate() * 100 +
         now.getHours();
}

function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = ((s * 1103515245) + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getRotatingStock() {
  const seed = getStockSeed();
  const shuffled = seededShuffle(POOL_KEYS, seed);
  return ROTATING_SLOTS.map((slot, i) => ({
    ...SHOP_FRAGMENTS[shuffled[i]],
    qty: slot.qty,
    price: slot.price,
    slot: i,
  }));
}

function minutesToNextRefresh() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return Math.ceil((next - now) / 60000);
}

// ── Embeds ────────────────────────────────────────────────────────────────────
function createFrShopEmbed(userId) {
  const player = playerRepository.getPlayer(userId);
  const zenith = player.zenith_fragments || 0;
  const items = playerRepository.getPlayerItems(userId);
  const fr = items.find(i => i.item_id === "fr")?.quantity || 0;

  const packLines = FR_PACKS.map(p =>
    `${Emojis.ARTIFACT} **${p.qty}x** Fragmento de Relíquia — \`${p.price}\` ${Emojis.ZENITH}`
  );

  return new EmbedBuilder()
    .setTitle(`${Emojis.ARTIFACT} Loja de Relíquias — Pacotes de FR`)
    .setDescription(
      `*Troque seus Fragmentos Zenith por Fragmentos de Relíquia para invocar na Fenda Ancestral.*\n\n` +
      `**Pacotes Disponíveis:**\n` +
      packLines.join("\n") + "\n\n" +
      `> ${Emojis.ZENITH} **Zenith:** \`${zenith}\`   ${Emojis.ARTIFACT} **FR:** \`${fr}\``
    )
    .setColor("#1a0033")
    .setFooter({ text: `Loja de Relíquias · Compra ilimitada · Ver ofertas da hora →` });
}

function createRotatingShopEmbed(userId) {
  const player = playerRepository.getPlayer(userId);
  const zenith = player.zenith_fragments || 0;
  const stock = getRotatingStock();
  const seed = getStockSeed();
  const items = playerRepository.getPlayerItems(userId);
  const fr = items.find(i => i.item_id === "fr")?.quantity || 0;

  const offerLines = stock.map((offer, i) => {
    const bought = items.find(it => it.item_id === `lojar_${seed}_${i}`)?.quantity || 0;
    const mark = bought ? " `✓`" : "";
    const name = bought ? `~~**${offer.name}**~~` : `**${offer.name}**`;
    return `${offer.emoji} ${name} — \`${offer.qty}x\` por \`${offer.price}\` ${Emojis.ZENITH}${mark}`;
  });

  return new EmbedBuilder()
    .setTitle(`${Emojis.ARTIFACT} Loja de Relíquias — Ofertas da Hora`)
    .setDescription(
      `*Fragmentos específicos em oferta. Cada item pode ser comprado **1 vez** por rotação.*\n\n` +
      `**Ofertas Ativas:**\n` +
      offerLines.join("\n") + "\n\n" +
      `> ${Emojis.ZENITH} **Zenith:** \`${zenith}\`   ${Emojis.ARTIFACT} **FR:** \`${fr}\``
    )
    .setColor("#001a33")
    .setFooter({ text: `Loja de Relíquias · Renova em ${minutesToNextRefresh()} min · ← Pacotes de FR` });
}

// ── Botões ────────────────────────────────────────────────────────────────────
function createFrShopButtons(userId) {
  const row1 = new ActionRowBuilder().addComponents(
    ...FR_PACKS.map(p =>
      new ButtonBuilder()
        .setCustomId(`lojar_pack_${p.id}_${userId}`)
        .setLabel(`${p.qty}x FR — ${p.price} Z`)
        .setStyle(ButtonStyle.Success)
    )
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lojar_view_rotating_${userId}`)
      .setLabel("Ofertas da Hora →")
      .setStyle(ButtonStyle.Secondary)
  );
  return [row1, row2];
}

function createRotatingShopButtons(userId) {
  const stock = getRotatingStock();
  const seed = getStockSeed();
  const items = playerRepository.getPlayerItems(userId);

  const row1 = new ActionRowBuilder().addComponents(
    ...stock.map((offer, i) => {
      const bought = !!(items.find(it => it.item_id === `lojar_${seed}_${i}`)?.quantity);
      return new ButtonBuilder()
        .setCustomId(`lojar_slot_${i}_${userId}`)
        .setLabel(`${offer.qty}x ${offer.name} — ${offer.price} Z`)
        .setStyle(bought ? ButtonStyle.Secondary : ButtonStyle.Primary)
        .setDisabled(bought);
    })
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lojar_view_fr_${userId}`)
      .setLabel("← Pacotes de FR")
      .setStyle(ButtonStyle.Secondary)
  );
  return [row1, row2];
}

// ── Handler de interações ────────────────────────────────────────────────────
async function handleInteraction(interaction) {
  const userId = interaction.user.id;
  const id = interaction.customId;

  // Navegação entre telas
  if (id === `lojar_view_fr_${userId}`) {
    return interaction.update({ embeds: [createFrShopEmbed(userId)], components: createFrShopButtons(userId) });
  }
  if (id === `lojar_view_rotating_${userId}`) {
    return interaction.update({ embeds: [createRotatingShopEmbed(userId)], components: createRotatingShopButtons(userId) });
  }

  // Compra de pacote de FR — customId: lojar_pack_fr_{qty}_{userId}
  const packMatch = id.match(/^lojar_pack_fr_(\d+)_(.+)$/);
  if (packMatch && packMatch[2] === userId) {
    const qty = parseInt(packMatch[1]);
    const pack = FR_PACKS.find(p => p.id === `fr_${qty}`);
    if (!pack) return;

    const player = playerRepository.getPlayer(userId);
    const zenith = player.zenith_fragments || 0;
    if (zenith < pack.price) {
      return interaction.reply({ content: `❌ Zenith insuficiente! Precisa de **${pack.price}**, você tem **${zenith}**.`, ephemeral: true });
    }

    playerRepository.updatePlayer(userId, { zenith_fragments: zenith - pack.price });
    playerRepository.addItem(userId, "fr", pack.qty);

    return interaction.update({ embeds: [createFrShopEmbed(userId)], components: createFrShopButtons(userId) });
  }

  // Compra de oferta rotativa
  const slotMatch = id.match(/^lojar_slot_(\d)_(.+)$/);
  if (slotMatch && slotMatch[2] === userId) {
    const slotIndex = parseInt(slotMatch[1]);
    const stock = getRotatingStock();
    const offer = stock[slotIndex];
    if (!offer) return;

    const seed = getStockSeed();
    const boughtKey = `lojar_${seed}_${slotIndex}`;

    const player = playerRepository.getPlayer(userId);
    const zenith = player.zenith_fragments || 0;
    const items = playerRepository.getPlayerItems(userId);
    const alreadyBought = items.find(it => it.item_id === boughtKey)?.quantity || 0;

    if (alreadyBought) {
      return interaction.reply({ content: "❌ Você já comprou esta oferta nesta rotação.", ephemeral: true });
    }
    if (zenith < offer.price) {
      return interaction.reply({ content: `❌ Zenith insuficiente! Precisa de **${offer.price}**, você tem **${zenith}**.`, ephemeral: true });
    }

    playerRepository.updatePlayer(userId, { zenith_fragments: zenith - offer.price });
    playerRepository.addItem(userId, offer.itemId, offer.qty);
    playerRepository.addItem(userId, boughtKey, 1);

    return interaction.update({ embeds: [createRotatingShopEmbed(userId)], components: createRotatingShopButtons(userId) });
  }
}

module.exports = {
  execute: async (message) => {
    const userId = message.author.id;
    await message.reply({ embeds: [createFrShopEmbed(userId)], components: createFrShopButtons(userId) });
  },
  handleInteraction,
};
