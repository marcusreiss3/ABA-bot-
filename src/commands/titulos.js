"use strict";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { TITLES, getProgress, isClaimed } = require("../database/repositories/titleRepository");

const TITLE_IDS = Object.keys(TITLES);

function buildPage(userId, page) {
  const titleId = TITLE_IDS[page];
  const title = TITLES[titleId];
  const progress = getProgress(userId, titleId);
  const claimed = isClaimed(userId, titleId);
  const isComplete = progress >= title.goal;
  const capped = Math.min(progress, title.goal);

  const BAR_TOTAL = 10;
  const filled = isComplete ? BAR_TOTAL : Math.floor((capped / title.goal) * BAR_TOTAL);
  const bar = "▰".repeat(filled) + "▱".repeat(BAR_TOTAL - filled);

  const statusLine = claimed
    ? "✅ **Título desbloqueado!**"
    : isComplete
    ? "⭐ **Conquista completa — resgate abaixo!**"
    : "⏳ Em andamento";

  const embed = new EmbedBuilder()
    .setTitle(`${title.emoji} ${title.name}`)
    .setDescription(title.description)
    .setColor(claimed ? "#2ECC71" : isComplete ? "#FFD700" : "#5865F2")
    .addFields(
      { name: "Progresso", value: `\`${bar}\`\n\`${capped} / ${title.goal}\``, inline: true },
      { name: "Recompensa", value: `\`💠 ${title.zenith} Zenith\``, inline: true },
      { name: "Status", value: statusLine, inline: false }
    )
    .setFooter({ text: `Título ${page + 1} de ${TITLE_IDS.length} • Use !equip → Equipar Título para exibir` });

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`titulos_page_${page - 1}_${userId}`)
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`titulos_page_${page + 1}_${userId}`)
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === TITLE_IDS.length - 1)
  );

  const components = [navRow];

  if (isComplete && !claimed) {
    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_title_${titleId}_${userId}`)
        .setLabel("Resgatar Título")
        .setEmoji("🎖️")
        .setStyle(ButtonStyle.Success)
    );
    components.push(claimRow);
  }

  return { embeds: [embed], components };
}

module.exports = {
  buildPage,
  execute: async (message) => {
    const userId = message.author.id;
    await message.reply(buildPage(userId, 0));
  },
};
