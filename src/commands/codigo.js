const { EmbedBuilder } = require("discord.js");
const db = require("../database/db");
const playerRepository = require("../database/repositories/playerRepository");
const Emojis = require("../config/emojis");

// ── Códigos disponíveis ───────────────────────────────────────────────────────
const CODES = {
  BETA: {
    rewards: [
      { type: "item",   id: "soul_stone_3", qty: 1   },
      { type: "zenith", qty: 200 },
    ],
    description: "Código de acesso antecipado — Bem-vindo ao ABA!",
  },
};

// ── DB helpers ────────────────────────────────────────────────────────────────
function hasRedeemed(playerId, code) {
  const row = db.prepare("SELECT 1 FROM code_redemptions WHERE player_id = ? AND code = ?").get(playerId, code);
  return !!row;
}

function markRedeemed(playerId, code) {
  db.prepare("INSERT INTO code_redemptions (player_id, code) VALUES (?, ?)").run(playerId, code);
}

// ── Comando ───────────────────────────────────────────────────────────────────
module.exports = {
  execute: async (message, args) => {
    const userId = message.author.id;
    const input = args[0]?.toUpperCase();

    if (!input) {
      const embed = new EmbedBuilder()
        .setColor("#1a0a2e")
        .setTitle("🎟️ Resgatar Código")
        .setDescription(
          "Use `!codigo <CÓDIGO>` para resgatar um código promocional.\n\n" +
          "*Cada código só pode ser usado uma vez por conta.*"
        );
      return message.reply({ embeds: [embed] });
    }

    const code = CODES[input];
    if (!code) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor("#8e0000")
          .setDescription("❌ Código inválido ou expirado.")],
      });
    }

    if (hasRedeemed(userId, input)) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor("#8e0000")
          .setDescription("❌ Você já resgatou este código.")],
      });
    }

    // Aplicar recompensas
    const player = playerRepository.getPlayer(userId);
    let zenithGained = 0;
    const rewardLines = [];

    for (const reward of code.rewards) {
      if (reward.type === "zenith") {
        zenithGained += reward.qty;
        rewardLines.push(`${Emojis.ZENITH} **${reward.qty} Fragmentos Zenith**`);
      } else if (reward.type === "item") {
        playerRepository.addItem(userId, reward.id, reward.qty);
        const labels = {
          soul_stone_1: `${Emojis.SOUL_STONE_1} **${reward.qty}x Pedra da Alma I**`,
          soul_stone_2: `${Emojis.SOUL_STONE_2} **${reward.qty}x Pedra da Alma II**`,
          soul_stone_3: `${Emojis.SOUL_STONE_3} **${reward.qty}x Pedra da Alma III**`,
        };
        rewardLines.push(labels[reward.id] || `**${reward.qty}x ${reward.id}**`);
      }
    }

    if (zenithGained > 0) {
      playerRepository.updatePlayer(userId, {
        zenith_fragments: (player.zenith_fragments || 0) + zenithGained,
      });
    }

    markRedeemed(userId, input);

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("✅ Código Resgatado!")
      .setDescription(
        `*${code.description}*\n\n` +
        `**Recompensas recebidas:**\n` +
        rewardLines.join("\n")
      )
      .setFooter({ text: "Use !inv para ver seus itens · Use !usar para aplicar Pedras da Alma" });

    return message.reply({ embeds: [embed] });
  },
};
