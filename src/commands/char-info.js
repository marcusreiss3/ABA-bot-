const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const CharacterManager = require("../services/CharacterManager");
const Emojis = require("../config/emojis");

const ELEMENT_ICONS = {
  vento:     Emojis.ELEMENTO_VENTO,
  agua:      Emojis.ELEMENTO_AGUA,
  fogo:      Emojis.ELEMENTO_FOGO,
  gelo:      Emojis.ELEMENTO_GELO,
  terra:     Emojis.ELEMENTO_TERRA,
  escuridao: Emojis.ELEMENTO_ESCURIDAO,
  raio:      Emojis.ELEMENTO_RAIO,
  luz:       Emojis.ELEMENTO_LUZ,
};
const ELEMENT_NAMES = {
  vento: 'Vento', agua: 'Água', fogo: 'Fogo', gelo: 'Gelo',
  terra: 'Terra', escuridao: 'Escuridão', raio: 'Raio', luz: 'Luz',
};
function elemDisplay(elementType) {
  if (!elementType) return 'N/A';
  const icon = ELEMENT_ICONS[elementType] || '';
  const name = ELEMENT_NAMES[elementType] || elementType;
  return icon ? `${icon} ${name}` : name;
}

// ── Catálogo de personagens jogáveis ─────────────────────────────────────────
const CHARS = {
  EC: [
    { id: "naruto",   name: "Naruto (Clássico)" },
    { id: "goku",     name: "Goku (Base)" },
    { id: "itadori",  name: "Itadori Yuji" },
    { id: "luffy",    name: "Monkey D. Luffy" },
    { id: "edward",   name: "Edward Elric" },
    { id: "tanjiro",  name: "Tanjiro Kamado" },
    { id: "asta",     name: "Asta" },
  ],
  AL: [
    { id: "eva_01",        name: "EVA-01" },
    { id: "shinji",        name: "Shinji Ikari" },
    { id: "dio",           name: "Dio Brando" },
    { id: "levi",          name: "Levi Ackerman" },
    { id: "denji",         name: "Denji" },
    { id: "frieren",       name: "Frieren" },
    { id: "itachi_uchiha", name: "Itachi Uchiha" },
  ],
  EM: [
    { id: "satoru_gojo",  name: "Satoru Gojo" },
    { id: "sung_jin_woo", name: "Sung Jin-Woo" },
  ],
};

const RARITY_LABEL  = { EC: "◆ Eco Comum", AL: "✦ Aura Lendária", EM: "👁️ Essência Mítica" };
const RARITY_COLOR  = { EC: "#4e5058",      AL: "#a78bfa",          EM: "#ffd700" };
const RARITY_DESC   = {
  EC: "Guerreiros comuns, mas com grande potencial. Base de qualquer equipe.",
  AL: "Combatentes lendários com habilidades únicas e kits mais elaborados.",
  EM: "Entidades de poder incomparável. Os mais raros do Nexus Interdimensional.",
};
const TYPE_ICON  = { attack: "⚔️", buff: "💠", heal: "💚", reaction: "🛡️" };

// ── Formata o efeito em texto curto ──────────────────────────────────────────
function fxStr(effect) {
  if (!effect) return "";
  const pct = v => `${Math.round(v * 100)}%`;
  const parts = [];

  switch (effect.type) {
    case "burn":             parts.push(`Queimadura ${pct(effect.value)} × ${effect.duration}t`); break;
    case "bleed":            parts.push(`Sangramento ${pct(effect.value)} × ${effect.duration}t`); break;
    case "stun":             parts.push(`Atordoa ${effect.duration}t${effect.ignore_immunity ? " (ignora imunidade)" : ""}`); break;
    case "damage_reduction": {
      const red = Math.round((1 - effect.value) * 100);
      parts.push(`-${red}% dano${effect.negateElemental ? ", anula elemental" : ""}`);
      break;
    }
    case "debuff_damage":    parts.push(`-${pct(effect.value)} dano inimigo × ${effect.duration}t`); break;
    case "ignore_reaction":  parts.push("Ignora reações"); break;
    case "transform":        parts.push(`Transforma ${effect.duration}t`); break;
  }

  if (effect.bleed)               parts.push(`Sangramento ${pct(effect.bleed.value)} × ${effect.bleed.duration}t`);
  if (effect.debuff_damage_taken)  parts.push(`+${pct(effect.debuff_damage_taken)} dano recebido × ${effect.debuff_duration}t`);

  return parts.join(", ");
}

// ── Formata uma skill em uma linha limpa ─────────────────────────────────────
function skillLine(skill) {
  const parts = [`**${skill.name}**`];

  if (skill.type === "attack" && skill.damage) {
    parts.push(`${skill.damage} dmg`);
    parts.push(elemDisplay(skill.elementType));
  }
  if (skill.type === "heal" && skill.healPercent) {
    parts.push(`Cura ${skill.healPercent}% HP`);
  }

  parts.push(`${skill.cost}E`);
  if (skill.cooldown > 0)        parts.push(`CD ${skill.cooldown}t`);
  if (skill.initialCooldown > 0) parts.push("começa em recarga");

  const fx = fxStr(skill.effect);
  if (fx) parts.push(fx);

  return parts.join(" · ");
}

// ── Embed principal ───────────────────────────────────────────────────────────
function createMainEmbed() {
  const ecNames = CHARS.EC.map(c => c.name).join(", ");
  const alNames = CHARS.AL.map(c => c.name).join(", ");
  const emNames = CHARS.EM.map(c => c.name).join(", ");

  return new EmbedBuilder()
    .setAuthor({ name: "📖 Enciclopédia de Guerreiros" })
    .setTitle("Escolha uma Raridade")
    .setDescription(
      `Consulte as habilidades de todos os personagens jogáveis do Nexus.\n\n` +
      `**◆ Eco Comum**\n${ecNames}\n\n` +
      `**✦ Aura Lendária**\n${alNames}\n\n` +
      `**👁️ Essência Mítica**\n${emNames}`
    )
    .setColor("#1a0a2e")
    .setFooter({ text: "▸ Selecione uma raridade para ver os guerreiros" });
}

function createMainButtons(userId) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ci_rar_EC_${userId}`).setLabel("◆ Eco Comum").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`ci_rar_AL_${userId}`).setLabel("✦ Aura Lendária").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ci_rar_EM_${userId}`).setLabel("👁️ Essência Mítica").setStyle(ButtonStyle.Success),
  )];
}

// ── Embed de lista de personagens por raridade ────────────────────────────────
function createRarityEmbed(rarity) {
  const list = CHARS[rarity];
  const lines = list.map((c, i) => `\`${i + 1}.\` **${c.name}**`);

  return new EmbedBuilder()
    .setAuthor({ name: "📖 Enciclopédia de Guerreiros" })
    .setTitle(RARITY_LABEL[rarity])
    .setDescription(`*${RARITY_DESC[rarity]}*\n\n${lines.join("\n")}\n\n━━━━━━━━━━━━━━━━━━━━\n*Selecione um guerreiro abaixo para ver suas habilidades.*`)
    .setColor(RARITY_COLOR[rarity])
    .setFooter({ text: `${list.length} guerreiro${list.length > 1 ? "s" : ""} disponíve${list.length > 1 ? "is" : "l"}` });
}

function createRarityButtons(rarity, userId) {
  const list = CHARS[rarity];
  const rows = [];

  rows.push(new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`ci_select_${rarity}_${userId}`)
      .setPlaceholder("Selecione um guerreiro...")
      .addOptions(list.map(c => ({ label: c.name, value: c.id })))
  ));

  rows.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ci_main_${userId}`).setLabel("◂ Voltar").setStyle(ButtonStyle.Secondary)
  ));

  return rows;
}

// ── Embed de detalhe de personagem ───────────────────────────────────────────
function createCharEmbed(charId) {
  const char = CharacterManager.getCharacter(charId, {});
  if (!char) return null;

  const rarity = char.rarity;
  const color  = RARITY_COLOR[rarity] || "#1a0a2e";

  const elIcon = char.element ? (ELEMENT_ICONS[char.element] || '') : '';
  const elName = char.element ? (ELEMENT_NAMES[char.element] || char.element) : 'N/A';

  const passiveLines = [];
  if (char.passives?.physicalReduction) passiveLines.push(`Reduz ${Math.round(char.passives.physicalReduction * 100)}% de dano recebido`);
  if (char.passives?.executionZone)      passiveLines.push("Execução: dano dobrado abaixo de 20% HP");

  const descParts = [
    `${elIcon} **Elemento:** ${elName}`,
    `HP: ${char.maxHealth}  ·  Energia: ${char.maxEnergy}`,
  ];
  if (passiveLines.length) descParts.push(`**Passivas**\n${passiveLines.join("\n")}`);

  const embed = new EmbedBuilder()
    .setAuthor({ name: `${RARITY_LABEL[rarity]} — ${char.name}` })
    .setTitle(char.name)
    .setColor(color)
    .setThumbnail(char.imageUrl || null)
    .setDescription(descParts.join("\n"));

  // Sung Jin-Woo: múltiplos sets de sombras
  if (charId === "sung_jin_woo" && char.shadowSkillSets) {
    const igrisLines = char.shadowSkillSets.igris.map(skillLine).join("\n");
    const beruLines  = char.shadowSkillSets.beru.map(skillLine).join("\n");
    const tankLines  = char.shadowSkillSets.tank.map(skillLine).join("\n");

    embed.addFields(
      { name: "Modo Igris — Cavaleiro Negro", value: igrisLines, inline: false },
      { name: "Modo Beru — Rei das Formigas", value: beruLines,  inline: false },
      { name: "Modo Tank — Sombra Tanque",    value: tankLines,  inline: false },
    );
  } else {
    const skills = char.skills;
    const attacks   = skills.filter(s => s.type === "attack");
    const buffs     = skills.filter(s => s.type === "buff");
    const heals     = skills.filter(s => s.type === "heal");
    const reactions = skills.filter(s => s.type === "reaction");

    if (attacks.length)   embed.addFields({ name: "Ataques",  value: attacks.map(skillLine).join("\n"),   inline: false });
    if (buffs.length)     embed.addFields({ name: "Buffs",    value: buffs.map(skillLine).join("\n"),     inline: false });
    if (heals.length)     embed.addFields({ name: "Curas",    value: heals.map(skillLine).join("\n"),     inline: false });
    if (reactions.length) embed.addFields({ name: "Reações",  value: reactions.map(skillLine).join("\n"), inline: false });
  }

  embed.setFooter({ text: `${char.name} · ${RARITY_LABEL[rarity]}` });
  return embed;
}

function createCharButtons(charId, userId) {
  // Descobre a raridade do char para voltar à lista correta
  let backRarity = "EC";
  for (const [rar, list] of Object.entries(CHARS)) {
    if (list.some(c => c.id === charId)) { backRarity = rar; break; }
  }

  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ci_rar_${backRarity}_${userId}`).setLabel("◂ Voltar à Lista").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`ci_main_${userId}`).setLabel("⌂ Menu Principal").setStyle(ButtonStyle.Secondary),
  )];
}

// ── Handler de interações ─────────────────────────────────────────────────────
async function handleInteraction(interaction) {
  const userId = interaction.user.id;
  const id = interaction.customId;

  // Menu principal
  if (id === `ci_main_${userId}`) {
    return interaction.update({ embeds: [createMainEmbed()], components: createMainButtons(userId) });
  }

  // Lista de raridade
  const rarMatch = id.match(/^ci_rar_(EC|AL|EM)_(.+)$/);
  if (rarMatch && rarMatch[2] === userId) {
    const rarity = rarMatch[1];
    return interaction.update({ embeds: [createRarityEmbed(rarity)], components: createRarityButtons(rarity, userId) });
  }

  // Select menu de personagem
  if (interaction.isStringSelectMenu()) {
    const selMatch = id.match(/^ci_select_(EC|AL|EM)_(\d+)$/);
    if (selMatch && selMatch[2] === userId) {
      const charId = interaction.values[0];
      const embed = createCharEmbed(charId);
      if (!embed) return interaction.reply({ content: "Personagem não encontrado.", ephemeral: true });
      return interaction.update({ embeds: [embed], components: createCharButtons(charId, userId) });
    }
  }

  // Detalhe de personagem (botão legado)
  const charMatch = id.match(/^ci_char_([^_]+(?:_[^_]+)*)_(\d+)$/);
  if (charMatch) {
    const charId = charMatch[1];
    const ownerId = charMatch[2];
    if (ownerId !== userId) return interaction.reply({ content: "Esta não é a sua consulta!", ephemeral: true });

    const embed = createCharEmbed(charId);
    if (!embed) return interaction.reply({ content: "Personagem não encontrado.", ephemeral: true });
    return interaction.update({ embeds: [embed], components: createCharButtons(charId, userId) });
  }
}

module.exports = {
  execute: async (message) => {
    await message.reply({ embeds: [createMainEmbed()], components: createMainButtons(message.author.id) });
  },
  handleInteraction,
};
