const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const missionRepository = require("../database/repositories/missionRepository");
const playerRepository = require("../database/repositories/playerRepository");
const Emojis = require("../config/emojis");

const LEVEL_MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const LEVEL_REWARD_ZENITH = 150;

// ── Missões Diárias ───────────────────────────────────────────────────────────
function createDailyMissionsEmbed(userId) {
  const missions = missionRepository.getGlobalMissions();
  const player = playerRepository.getPlayer(userId);

  const lines = missions.daily.map(m => {
    const progress = missionRepository.getProgress(userId, m.id);
    const claimed = missionRepository.isClaimed(userId, m.id);
    const isDone = progress >= m.goal;
    const bar = buildBar(progress, m.goal);
    const status = claimed ? "✅" : isDone ? "⭐" : "⏳";
    const rewardText = `${Emojis.ZENITH} ${m.reward.zenith} · 🪨 ${m.reward.soulStone.qty}x Pedra ${m.reward.soulStone.id.split('_')[2].toUpperCase()}`;
    return `${status} **${m.label}**\n${bar} \`${progress}/${m.goal}\`\n↳ ${rewardText}`;
  }).join("\n\n");

  const claimRow = new ActionRowBuilder();
  missions.daily.forEach(m => {
    const progress = missionRepository.getProgress(userId, m.id);
    const claimed = missionRepository.isClaimed(userId, m.id);
    const isDone = progress >= m.goal;
    claimRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_mission_${m.id}`)
        .setLabel(claimed ? "✅ Resgatado" : isDone ? "⭐ Resgatar" : "⏳ Pendente")
        .setStyle(claimed ? ButtonStyle.Secondary : isDone ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(claimed || !isDone)
    );
  });

  const embed = new EmbedBuilder()
    .setTitle("☀️  Missões Diárias")
    .setDescription(
      `*Desafios que renovam toda madrugada. Complete-os para ganhar recompensas!*\n\u200b\n${lines}\n\u200b`
    )
    .setColor("#e8a020")
    .setFooter({ text: "⚔️ Renova à meia-noite • Complete e resgate abaixo" });

  const backRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`missions_main_menu_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [claimRow, backRow] };
}

// ── Missões Semanais ──────────────────────────────────────────────────────────
function createWeeklyMissionsEmbed(userId) {
  const missions = missionRepository.getGlobalMissions();

  const lines = missions.weekly.map(m => {
    const progress = missionRepository.getProgress(userId, m.id);
    const claimed = missionRepository.isClaimed(userId, m.id);
    const isDone = progress >= m.goal;
    const bar = buildBar(progress, m.goal);
    const status = claimed ? "✅" : isDone ? "⭐" : "⏳";
    const rewardText = `${Emojis.ZENITH} ${m.reward.zenith} · 🪨 ${m.reward.soulStone.qty}x Pedra ${m.reward.soulStone.id.split('_')[2].toUpperCase()}`;
    return `${status} **${m.label}**\n${bar} \`${progress}/${m.goal}\`\n↳ ${rewardText}`;
  }).join("\n\n");

  const claimRow = new ActionRowBuilder();
  missions.weekly.forEach(m => {
    const progress = missionRepository.getProgress(userId, m.id);
    const claimed = missionRepository.isClaimed(userId, m.id);
    const isDone = progress >= m.goal;
    claimRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_mission_${m.id}`)
        .setLabel(claimed ? "✅ Resgatado" : isDone ? "⭐ Resgatar" : "⏳ Pendente")
        .setStyle(claimed ? ButtonStyle.Secondary : isDone ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(claimed || !isDone)
    );
  });

  const embed = new EmbedBuilder()
    .setTitle("📅  Missões Semanais")
    .setDescription(
      `*Desafios maiores que renovam todo sábado. Valem mais recompensas!*\n\u200b\n${lines}\n\u200b`
    )
    .setColor("#5865F2")
    .setFooter({ text: "⚔️ Renova todo sábado • Complete e resgate abaixo" });

  const backRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`missions_main_menu_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [claimRow, backRow] };
}

// ── Missões de Nível ──────────────────────────────────────────────────────────
function createLevelMissionsEmbed(userId) {
  const player = playerRepository.getPlayer(userId);
  const playerLevel = player.level || 1;

  const lines = LEVEL_MILESTONES.map(lvl => {
    const missionId = `level_milestone_${lvl}`;
    const claimed = missionRepository.isClaimed(userId, missionId);
    const reached = playerLevel >= lvl;
    const status = claimed ? "✅" : reached ? "⭐" : "🔒";
    const progressText = reached ? `Nível atingido!` : `Nível ${playerLevel}/${lvl}`;
    return `${status} **Nível ${lvl}** — ${progressText}\n↳ ${Emojis.ZENITH} **${LEVEL_REWARD_ZENITH} Fragmentos Zenith**`;
  }).join("\n\n");

  const claimRows = [];
  const chunks = [];
  for (let i = 0; i < LEVEL_MILESTONES.length; i += 4) chunks.push(LEVEL_MILESTONES.slice(i, i + 4));

  for (const chunk of chunks) {
    const row = new ActionRowBuilder();
    chunk.forEach(lvl => {
      const missionId = `level_milestone_${lvl}`;
      const claimed = missionRepository.isClaimed(userId, missionId);
      const reached = playerLevel >= lvl;
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_level_milestone_${lvl}_${userId}`)
          .setLabel(claimed ? `✅ Nv.${lvl}` : reached ? `⭐ Nv.${lvl}` : `🔒 Nv.${lvl}`)
          .setStyle(claimed ? ButtonStyle.Secondary : reached ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(claimed || !reached)
      );
    });
    claimRows.push(row);
  }

  const embed = new EmbedBuilder()
    .setTitle("🏅  Missões de Nível")
    .setDescription(
      `*A cada 10 níveis alcançados, você recebe uma recompensa permanente!*\n\u200b\n${lines}\n\u200b`
    )
    .setColor("#a855f7")
    .setFooter({ text: `⚔️ Nível atual: ${playerLevel} • Recompensas permanentes` });

  const backRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`missions_main_menu_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [...claimRows, backRow] };
}

// ── Menu Principal ────────────────────────────────────────────────────────────
function createMainMenuEmbed(userId) {
  const player = playerRepository.getPlayer(userId);
  const embed = new EmbedBuilder()
    .setTitle("📜  Diário do Aventureiro")
    .setDescription(
      `*Bem-vindo, <@${userId}>. Seu chamado aguarda.*\n\u200b\n` +
      `☀️ **Missões Diárias** — Desafios que renovam toda madrugada\n` +
      `📅 **Missões Semanais** — Grandes conquistas que renovam todo sábado\n` +
      `🏅 **Missões de Nível** — Recompensas permanentes a cada 10 níveis\n\u200b`
    )
    .setColor("#1a0a2e")
    .setThumbnail("https://i.ibb.co/XZgZVnm8/image.png")
    .setFooter({ text: `⚔️ Nível ${player.level || 1} · ${player.pa || 0} PA · Complete missões para avançar` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`show_daily_missions_${userId}`).setLabel("☀️ Diárias").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`show_weekly_missions_${userId}`).setLabel("📅 Semanais").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`show_level_missions_${userId}`).setLabel("🏅 Nível").setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

// ── Barra de progresso ────────────────────────────────────────────────────────
function buildBar(current, goal, size = 8) {
  const filled = Math.min(Math.round((current / goal) * size), size);
  return "█".repeat(filled) + "░".repeat(size - filled);
}

// ── Export ────────────────────────────────────────────────────────────────────
module.exports = {
  execute: async (message) => {
    const userId = message.author.id;
    const { embeds, components } = createMainMenuEmbed(userId);
    return message.reply({ embeds, components });
  },
  createDailyMissionsEmbed,
  createWeeklyMissionsEmbed,
  createLevelMissionsEmbed,
  createMainMenuEmbed,
  LEVEL_REWARD_ZENITH,
};
