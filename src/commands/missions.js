const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const missionRepository = require("../database/repositories/missionRepository");
const playerRepository = require("../database/repositories/playerRepository");

// Função auxiliar para criar o embed de missões diárias
function createDailyMissionsEmbed(userId) {
  const missions = missionRepository.getGlobalMissions();
  const player = playerRepository.getPlayer(userId);

  const embed = new EmbedBuilder()
    .setTitle("☀️ Missões Diárias")
    .setDescription("Complete os desafios diários para ganhar recompensas! As missões mudam à meia-noite.")
    .setColor("#F1C40F")
    .setThumbnail(player.avatarURL || null);

  const dailyRows = new ActionRowBuilder();
  missions.daily.forEach(m => {
    const progress = missionRepository.getProgress(userId, m.id);
    const claimed = missionRepository.isClaimed(userId, m.id);
    const isDone = progress >= m.goal;
    
    embed.addFields({ 
      name: `☀️ ${m.label}`, 
      value: `Progresso: \`${progress}/${m.goal}\`\nRecompensa: \`${m.reward.zenith} Fragmentos Zenith\` | \`${m.reward.soulStone.qty}x Pedra da Alma ${m.reward.soulStone.id.split('_')[2].toUpperCase()}\`\nStatus: ${claimed ? "✅ Resgatado" : (isDone ? "⭐ Pronto para resgatar!" : "⏳ Em andamento")}` 
    });

    dailyRows.addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_mission_${m.id}`)
        .setLabel(m.label.split(" ")[0] + "...")
        .setStyle(claimed ? ButtonStyle.Secondary : (isDone ? ButtonStyle.Success : ButtonStyle.Primary))
        .setDisabled(claimed || !isDone)
    );
  });

  const backButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`missions_main_menu_${userId}`).setLabel("Voltar ao Menu Principal").setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [dailyRows, backButton] };
}

// Função auxiliar para criar o embed de missões semanais
function createWeeklyMissionsEmbed(userId) {
  const missions = missionRepository.getGlobalMissions();
  const player = playerRepository.getPlayer(userId);

  const embed = new EmbedBuilder()
    .setTitle("📅 Missões Semanais")
    .setDescription("Complete os desafios semanais para ganhar recompensas! As missões mudam aos sábados à meia-noite.")
    .setColor("#5865F2")
    .setThumbnail(player.avatarURL || null);

  const weeklyRows = new ActionRowBuilder();
  missions.weekly.forEach(m => {
    const progress = missionRepository.getProgress(userId, m.id);
    const claimed = missionRepository.isClaimed(userId, m.id);
    const isDone = progress >= m.goal;

    embed.addFields({ 
      name: `📅 ${m.label}`, 
      value: `Progresso: \`${progress}/${m.goal}\`\nRecompensa: \`${m.reward.zenith} Fragmentos Zenith\` | \`${m.reward.soulStone.qty}x Pedra da Alma ${m.reward.soulStone.id.split('_')[2].toUpperCase()}\`\nStatus: ${claimed ? "✅ Resgatado" : (isDone ? "⭐ Pronto para resgatar!" : "⏳ Em andamento")}` 
    });

    weeklyRows.addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_mission_${m.id}`)
        .setLabel(m.label.split(" ")[0] + "...")
        .setStyle(claimed ? ButtonStyle.Secondary : (isDone ? ButtonStyle.Success : ButtonStyle.Primary))
        .setDisabled(claimed || !isDone)
    );
  });

  const backButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`missions_main_menu_${userId}`).setLabel("Voltar ao Menu Principal").setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [weeklyRows, backButton] };
}

module.exports = {
  execute: async (message) => {
    const userId = message.author.id;

    const embed = new EmbedBuilder()
      .setTitle("📜 Menu de Missões")
      .setDescription("Selecione o tipo de missão que deseja visualizar.")
      .setColor("#2ECC71")
      .setThumbnail(message.author.displayAvatarURL());

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`show_daily_missions_${userId}`)
          .setLabel("Missões Diárias")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`show_weekly_missions_${userId}`)
          .setLabel("Missões Semanais")
          .setStyle(ButtonStyle.Primary)
      );

    return message.reply({ embeds: [embed], components: [row] });
  },
  createDailyMissionsEmbed,
  createWeeklyMissionsEmbed
};
