const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const EmbedManager     = require("../services/EmbedManager");

const LIMBO_MAX        = 100;
const RARITY_ICON      = { EM: "👁️", AL: "🌟", EC: "◆" };
const RARITY_EMOJI_OK  = { EM: "👁️", AL: "🌟" }; // ◆ não é emoji válido no Discord

const BULK_FILTERS = [
  { value: "all",   label: "⚠️ Todos",                description: "Remove todos os personagens do Limbo" },
  { value: "ec",    label: "Todos Eco Comum (EC)",    description: "Remove todos EC do Limbo" },
  { value: "al",    label: "Todos Aura Lendária (AL)",description: "Remove todos AL do Limbo" },
  { value: "em",    label: "Todos Essência Mítica (EM)", description: "Remove todos EM do Limbo" },
  { value: "dupes", label: "Duplicatas EC (manter 1)",description: "Mantém 1 de cada EC, remove o restante" },
];
const BULK_NAMES = { all: "Todos", ec: "EC", al: "AL", em: "EM", dupes: "Duplicatas EC" };

function applyLimboBulkFilter(chars, type) {
  if (type === "all")   return chars;
  if (type === "ec")    return chars.filter(r => (CharacterManager.getCharacter(r.character_id, {})?.rarity) === "EC");
  if (type === "al")    return chars.filter(r => (CharacterManager.getCharacter(r.character_id, {})?.rarity) === "AL");
  if (type === "em")    return chars.filter(r => (CharacterManager.getCharacter(r.character_id, {})?.rarity) === "EM");
  if (type === "dupes") {
    const seen = {}, toRemove = [];
    for (const r of chars) {
      const c = CharacterManager.getCharacter(r.character_id, {});
      if (c?.rarity !== "EC") continue;
      if (seen[r.character_id]) toRemove.push(r); else seen[r.character_id] = true;
    }
    return toRemove;
  }
  return [];
}

function buildOption(row) {
  const c = CharacterManager.getCharacter(row.character_id, {});
  const opt = {
    label: c?.name || row.character_id,
    description: `Raridade: ${c?.rarity || "?"} · ID Limbo: ${row.id}`,
    value: row.id.toString(),
  };
  const emoji = RARITY_EMOJI_OK[c?.rarity];
  if (emoji) opt.emoji = emoji;
  return opt;
}

function createLimboEmbed(userId, username, avatarUrl, successMsg = null) {
  const chars  = playerRepository.getLimboCharacters(userId);
  const player = playerRepository.getPlayer(userId);
  const slots  = playerRepository.getSlots(userId);
  const used   = playerRepository.getPlayerCharacters(userId).length;
  const free   = Math.max(0, slots.charSlots - used);
  const isFull = chars.length >= LIMBO_MAX;

  const embed = new EmbedBuilder()
    .setTitle(`🌀 Limbo de ${username}`)
    .setThumbnail(avatarUrl)
    .setColor(isFull ? "#e74c3c" : "#4b0082")
    .setFooter({ text: `Limbo: ${chars.length}/${LIMBO_MAX} · Slots livres no inventário: ${free}/${slots.charSlots}` });

  if (chars.length === 0) {
    embed.setDescription(
      (successMsg ? `> ${successMsg}\n\n` : "") +
      "Seu Limbo está vazio. Personagens que chegarem quando seus slots estiverem cheios aparecerão aqui."
    );
    return { embed, components: [] };
  }

  // Agrupar por raridade para exibição compacta
  const groups = { EM: [], AL: [], EC: [] };
  chars.forEach(row => {
    const c = CharacterManager.getCharacter(row.character_id, {});
    const r = c?.rarity || "EC";
    (groups[r] || groups.EC).push(`${c?.name || row.character_id} \`#${row.id}\``);
  });

  const HEADER = { EM: "👁️ **Essência Mítica**", AL: "🌟 **Aura Lendária**", EC: "◆ **Eco Comum**" };
  const blocks = [];
  for (const r of ["EM", "AL", "EC"]) {
    if (!groups[r].length) continue;
    const lines = [];
    let cur = "";
    for (const e of groups[r]) {
      const sep = cur ? ",  " : "";
      if (cur && (cur + sep + e).length > 60) { lines.push(cur); cur = e; }
      else cur += sep + e;
    }
    if (cur) lines.push(cur);
    blocks.push(`${HEADER[r]} (${groups[r].length})\n${lines.join("\n")}`);
  }

  embed.setDescription(
    (successMsg ? `> ${successMsg}\n\n` : "") +
    (isFull ? `> ⚠️ **Limbo cheio!** Novos personagens serão perdidos.\n\n` : `> Personagens aqui não podem ser usados em batalha.\n\n`) +
    blocks.join("\n\n")
  );

  const components = [];

  // Select de resgate
  if (free > 0) {
    components.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`limbo_rescue_${userId}`)
        .setPlaceholder("Resgatar personagem para o inventário...")
        .addOptions(chars.slice(0, 25).map(buildOption)),
    ));
  }

  // Botões de descarte
  components.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`limbo_discard_${userId}`).setLabel("🗑️ Um por vez").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`limbo_bulk_${userId}`).setLabel("🗑️ Em Massa").setStyle(ButtonStyle.Secondary),
  ));

  return { embed, components };
}

module.exports = {
  LIMBO_MAX,

  execute: async (message) => {
    const userId = message.author.id;
    playerRepository.getPlayer(userId);
    const { embed, components } = createLimboEmbed(userId, message.author.username, message.author.displayAvatarURL());
    return message.reply({ embeds: [embed], components });
  },

  handleInteraction: async (interaction) => {
    const userId = interaction.user.id;

    // ── Resgatar ─────────────────────────────────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("limbo_rescue_")) {
      const ownerId = interaction.customId.split("limbo_rescue_")[1];
      if (userId !== ownerId) return interaction.reply({ content: "Este não é o seu Limbo!", ephemeral: true });

      const limboId = parseInt(interaction.values[0]);
      const row     = playerRepository.removeFromLimbo(limboId);
      if (!row) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Personagem não encontrado no Limbo.", false)], components: [] });

      const result = playerRepository.addCharacter(userId, row.character_id);
      if (result && result.error) {
        playerRepository.addToLimbo(userId, row.character_id);
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`❌ ${result.error}`, false)], components: [] });
      }

      const c = CharacterManager.getCharacter(row.character_id, {});
      const { embed, components } = createLimboEmbed(userId, interaction.user.username, interaction.user.displayAvatarURL(),
        `✅ **${RARITY_ICON[c?.rarity] || "◆"} ${c?.name || row.character_id}** resgatado para o inventário!`);
      return interaction.update({ embeds: [embed], components });
    }

    // ── Descartar individual — passo 1 ────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith("limbo_discard_") &&
        !interaction.customId.startsWith("limbo_discard_select_") &&
        !interaction.customId.startsWith("limbo_discard_confirm_")) {
      const ownerId = interaction.customId.split("limbo_discard_")[1];
      if (userId !== ownerId) return interaction.reply({ content: "Este não é o seu Limbo!", ephemeral: true });

      const chars = playerRepository.getLimboCharacters(userId);
      if (chars.length === 0) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Seu Limbo já está vazio.", false)], components: [] });

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle("🗑️ Descartar do Limbo — Um por vez")
          .setDescription("Selecione qual personagem deseja descartar.\n⚠️ **Esta ação é permanente.**")
          .setColor("#e74c3c")],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`limbo_discard_select_${userId}`)
              .setPlaceholder("Escolha o personagem...")
              .addOptions(chars.slice(0, 25).map(buildOption)),
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`limbo_back_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }

    // ── Descartar individual — passo 2: confirmar ────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("limbo_discard_select_")) {
      const ownerId = interaction.customId.split("limbo_discard_select_")[1];
      if (userId !== ownerId) return interaction.reply({ content: "Este não é o seu Limbo!", ephemeral: true });

      const limboId = parseInt(interaction.values[0]);
      const row     = playerRepository.getLimboCharacters(userId).find(r => r.id === limboId);
      if (!row) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Personagem não encontrado.", false)], components: [] });

      const c = CharacterManager.getCharacter(row.character_id, {});
      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle("⚠️ Confirmar Descarte")
          .setDescription(`Tem certeza que deseja descartar **${RARITY_ICON[c?.rarity] || "◆"} ${c?.name || row.character_id}** do Limbo?\n\n> ❌ Permanentemente removido.`)
          .setColor("#e74c3c").setThumbnail(c?.imageUrl || null)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`limbo_discard_confirm_${userId}_${limboId}`).setLabel("Confirmar — Descartar").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`limbo_discard_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
        )],
      });
    }

    // ── Descartar individual — passo 3: execução ─────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith("limbo_discard_confirm_")) {
      const rest    = interaction.customId.split("limbo_discard_confirm_")[1];
      const idx     = rest.indexOf("_");
      const ownerId = rest.slice(0, idx);
      const limboId = parseInt(rest.slice(idx + 1));
      if (userId !== ownerId) return interaction.reply({ content: "Este não é o seu Limbo!", ephemeral: true });

      const row = playerRepository.removeFromLimbo(limboId);
      const c   = row ? CharacterManager.getCharacter(row.character_id, {}) : null;
      const msg = row
        ? `🗑️ **${RARITY_ICON[c?.rarity] || "◆"} ${c?.name || row.character_id}** descartado.`
        : "Personagem já não estava no Limbo.";

      const { embed, components } = createLimboEmbed(userId, interaction.user.username, interaction.user.displayAvatarURL(), msg);
      return interaction.update({ embeds: [embed], components });
    }

    // ── Descarte em Massa — passo 1: select de filtro ────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith("limbo_bulk_") &&
        !interaction.customId.startsWith("limbo_bulk_confirm_")) {
      const ownerId = interaction.customId.split("limbo_bulk_")[1];
      if (userId !== ownerId) return interaction.reply({ content: "Este não é o seu Limbo!", ephemeral: true });

      const chars = playerRepository.getLimboCharacters(userId);
      if (chars.length === 0) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Seu Limbo já está vazio.", false)], components: [] });

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle("🗑️ Descarte em Massa — Limbo")
          .setDescription("Selecione o filtro abaixo.")
          .setColor("#e74c3c")],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`limbo_bulk_filter_${userId}`)
              .setPlaceholder("Escolha o filtro...")
              .addOptions(BULK_FILTERS),
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`limbo_back_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }

    // ── Descarte em Massa — passo 2: preview + confirmar ─────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("limbo_bulk_filter_")) {
      const ownerId  = interaction.customId.split("limbo_bulk_filter_")[1];
      if (userId !== ownerId) return interaction.reply({ content: "Este não é o seu Limbo!", ephemeral: true });

      const filterType = interaction.values[0];
      const chars      = playerRepository.getLimboCharacters(userId);
      const toRemove   = applyLimboBulkFilter(chars, filterType);

      if (toRemove.length === 0) {
        return interaction.update({
          embeds: [new EmbedBuilder().setTitle("🗑️ Sem Resultados").setDescription(`Nenhum personagem encontrado para **${BULK_NAMES[filterType]}**.`).setColor("#e74c3c")],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`limbo_bulk_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
          )],
        });
      }

      const previewLines = toRemove.slice(0, 15).map(r => {
        const c = CharacterManager.getCharacter(r.character_id, {});
        return `${RARITY_ICON[c?.rarity] || "◆"} ${c?.name || r.character_id}`;
      });
      if (toRemove.length > 15) previewLines.push(`*...e mais ${toRemove.length - 15}*`);

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle(`🗑️ Confirmar Descarte em Massa — ${BULK_NAMES[filterType]}`)
          .setDescription(`**${toRemove.length} personagem(ns)** serão removidos do Limbo.\n\n${previewLines.join("\n")}`)
          .setColor("#e74c3c")
          .setFooter({ text: "Esta ação é permanente e irrecuperável." })],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`limbo_bulk_confirm_${userId}_${filterType}`).setLabel(`Confirmar — Descartar ${toRemove.length}`).setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`limbo_bulk_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
        )],
      });
    }

    // ── Descarte em Massa — passo 3: execução ────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith("limbo_bulk_confirm_")) {
      const rest       = interaction.customId.split("limbo_bulk_confirm_")[1];
      const idx        = rest.indexOf("_");
      const ownerId    = rest.slice(0, idx);
      const filterType = rest.slice(idx + 1);
      if (userId !== ownerId) return interaction.reply({ content: "Este não é o seu Limbo!", ephemeral: true });

      const chars    = playerRepository.getLimboCharacters(userId);
      const toRemove = applyLimboBulkFilter(chars, filterType);

      for (const r of toRemove) playerRepository.removeFromLimbo(r.id);

      const { embed, components } = createLimboEmbed(userId, interaction.user.username, interaction.user.displayAvatarURL(),
        `🗑️ **${toRemove.length} personagem(ns)** removidos do Limbo.`);
      return interaction.update({ embeds: [embed], components });
    }

    // ── Voltar ────────────────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId.startsWith("limbo_back_")) {
      const ownerId = interaction.customId.split("limbo_back_")[1];
      if (userId !== ownerId) return interaction.reply({ content: "Este não é o seu Limbo!", ephemeral: true });
      const { embed, components } = createLimboEmbed(userId, interaction.user.username, interaction.user.displayAvatarURL());
      return interaction.update({ embeds: [embed], components });
    }
  },
};
