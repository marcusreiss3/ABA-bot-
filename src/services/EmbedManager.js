const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const CharacterManager = require("./CharacterManager");
const Emojis = require("../config/emojis");
const FragmentMap = require("../config/fragmentMap");
const storyConfig = require("../config/storyConfig");
const FRAGMENTS_NEEDED = 100;

function elementIcon(element) {
  const map = {
    vento:     Emojis.ELEMENTO_VENTO,
    agua:      Emojis.ELEMENTO_AGUA,
    fogo:      Emojis.ELEMENTO_FOGO,
    gelo:      Emojis.ELEMENTO_GELO,
    terra:     Emojis.ELEMENTO_TERRA,
    escuridao: Emojis.ELEMENTO_ESCURIDAO,
    raio:      Emojis.ELEMENTO_RAIO,
    luz:       Emojis.ELEMENTO_LUZ,
  };
  return element ? (map[element] || '') : '';
}

const WORLD_COLORS = {
  dragonball: "#FF6B00",
  naruto:     "#4A90D9",
  aot:        "#8B1A1A",
  jjk:        "#5C00CC"
};

class EmbedManager {
  static createBattleEmbed(battle) {
    const char1 = battle.character1;
    const char2 = battle.character2;
    const currentPlayer = battle.getCurrentPlayer();
    const opponentPlayer = battle.getOpponentPlayer();

    let title = battle.isPve ? `🌍 Batalha PVE: Contra o Boss` : `⚔️ Duelo PvP: ${char1.name} vs ${char2.name}`;
    if (battle.type === "boss-rush") title = `🔥 BOSS RUSH: ${char1.name} (BOSS) vs Trio`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(battle.lastActionMessage)
      .setColor(battle.state === "finished" ? "#FFD700" : "#0099ff")
;

    if (battle.type === "boss-rush") {
      // No Boss Rush, char1 é o Boss (P1)
      embed.addFields({
        name: `🔥 ${elementIcon(char1.element)} ${char1.name} (BOSS) [Lvl ${char1.level}]`,
        value: this.formatCharStats(char1),
        inline: false
      });
      // Mostrar o trio desafiante
      battle.partyCharacters.forEach((char, index) => {
        embed.addFields({
          name: `👤 ${elementIcon(char.element)} ${char.name} (P${index + 1}) [Lvl ${char.level}]`,
          value: this.formatCharStats(char),
          inline: true
        });
      });
    } else if (battle.isPve && battle.partyCharacters) {
      // No PVE normal, char2 é o Boss
      battle.partyCharacters.forEach((char, index) => {
        embed.addFields({
          name: `${index === 0 ? "👑" : "👤"} ${elementIcon(char.element)} ${char.name} (P${index + 1}) [Lvl ${char.level}]`,
          value: this.formatCharStats(char),
          inline: true
        });
      });
      embed.addFields({
        name: `👾 ${elementIcon(char2.element)} ${char2.name} (BOSS) [Lvl ${char2.level}]`,
        value: this.formatCharStats(char2),
        inline: true
      });
    } else {
      const p1Label = battle.isTeamPvp
        ? `🥋 ${elementIcon(char1.element)} ${char1.name} (${battle.p1DisplayName || battle.player1Id}) [Lvl ${char1.level}]`
        : `🥋 ${elementIcon(char1.element)} ${char1.name} (P1) [Lvl ${char1.level}]`;
      const p2Label = battle.isTeamPvp
        ? `🥋 ${elementIcon(char2.element)} ${char2.name} (${battle.p2DisplayName || battle.player2Id}) [Lvl ${char2.level}]`
        : `🥋 ${elementIcon(char2.element)} ${char2.name} (P2) [Lvl ${char2.level}]`;
      embed.addFields(
        { name: p1Label, value: this.formatCharStats(char1), inline: true },
        { name: p2Label, value: this.formatCharStats(char2), inline: true }
      );
    }

    if (battle.state === "choosing_reaction" && battle.lastPendingSkill && battle.lastPendingSkill.gifUrl) {
      embed.setImage(battle.lastPendingSkill.gifUrl);
    } else if (battle.state === "finished") {
      if (battle.winnerId === "players") {
        if (char2.imageUrl) embed.setThumbnail(char2.imageUrl); // Mostrar boss derrotado
      } else {
        const winner = battle.winnerId === battle.player1Id ? char1 : char2;
        if (winner.imageUrl) embed.setImage(winner.imageUrl);
      }
    } else {
      if (currentPlayer.imageUrl) embed.setThumbnail(currentPlayer.imageUrl);
    }

    const bugNote = "⚠️ Se a batalha travar, aguarde 2-3 min — uma mensagem para retomar aparecerá automaticamente.";
    if (battle.state === "choosing_action") {
        const turnText = (battle.isPve && battle.currentPlayerTurnId === battle.player2Id) ? `Turno de: ${currentPlayer.name} (Boss pensando...)` : `Turno de: ${currentPlayer.name} | Escolha uma habilidade!`;
        embed.setFooter({ text: `${turnText}\n${bugNote}` });
    } else if (battle.state === "choosing_reaction") {
      const damage = battle.lastPendingDamage || 0;
      const turnText = (battle.isPve && battle.getOpponentId() === battle.player2Id) ? `Turno de: ${opponentPlayer.name} (Boss reagindo...)` : `Turno de: ${opponentPlayer.name} | Dano Previsto: ${damage} HP | Reaja ou Pule!`;
      embed.setFooter({ text: `${turnText}\n${bugNote}` });
    }

    return embed;
  }

  static formatCharStats(char) {
    let stats = `❤️ HP: \`${char.health}/${char.maxHealth}\`\n⚡ Energia: \`${char.energy}/${char.maxEnergy}\``;
    
    // Lógica para exibir os stacks do Levi
    if (char.id === "levi") {
      const marks = char.stacks["marks"] || 0;
      let markDisplay = "";
      for (let i = 0; i < marks; i++) {
        markDisplay += "⚔️";
      }
      // Adiciona um placeholder opcional se não houver stacks, conforme solicitado
      if (marks === 0) {
        markDisplay = "(Nenhum stack)"; // Ou deixe vazio se preferir
      }
      stats += `\n🗡️ Stacks: ${markDisplay}`;

      if (char.furyModeArmado) {
        stats += `\n⚡ **FURY MODE PRONTO!**\nPróximo ataque: **+150% Dano**`;
      }
    }

    if (char.id === "sung_jin_woo") {
      const shadowEmojis = { igris: "⚔️", beru: "🐜", tank: "🛡️" };
      const shadowNames = { igris: "Igris", beru: "Beru", tank: "Tank" };
      const shadowName = char.activeShadow
        ? `${shadowEmojis[char.activeShadow]} ${shadowNames[char.activeShadow]}`
        : "❓ Nenhuma (selecione no turno)";
      stats += `\n👥 **Sombra:** ${shadowName}`;

      if (char.activeShadow === "igris") {
        const marks = char.stacks["blood_marks"] || 0;
        let markDisplay = marks > 0 ? "🗡️".repeat(marks) : "(nenhuma)";
        stats += `\n🩸 **Marcas de Sangue:** ${markDisplay} \`${marks}/3\``;
      }

      const posBuff = char.buffs.find(b => b.id === "sjw_postura_inabalavel");
      if (posBuff) stats += `\n🛡️ **Postura Inabalável** (\`${posBuff.duration}\` turno(s)) — 30% redução`;

      const counterBuff = char.buffs.find(b => b.id === "sjw_contra_ataque_brutal");
      if (counterBuff) stats += `\n⚔️ **Contra-Ataque Brutal** (\`${counterBuff.duration}\` turno(s))`;
    }

    if (char.statusEffects.length > 0) {
      const statusStr = char.statusEffects.map(s => {
        const name = s.type === "burn" ? "Queimadura" : "Sangramento";
        const emoji = s.type === "burn" ? "🔥" : "🩸";
        return `${emoji} ${name} (\`${s.duration} turno(s)\`)`;
      }).join("\n");
      stats += `\n**Status:**\n${statusStr}`;
    }

    if (char.id === "naruto" && char.stacks["kage_bunshin"] > 0) {
      stats += `\n👥 **Clones:** \`${char.stacks["kage_bunshin"]}/3\``;
    }
    
    if (char.id === "eva_01") {
      const sync = char.stacks["sync"] || 0;
      stats += `\n🧬 **Sincronização:** \`${sync * 10}%\``;
    }

    if (char.buffs.some(b => b.id === "kaioken")) {
      stats += `\n🔴 **Kaioken Ativo!**`;
    }

    if (char.buffs.some(b => b.id === "chainsaw_man")) {
      stats += `\n🪚 **MODO VERDADEIRO CHAINSAW MAN ATIVO!** (+80% Dano)`;
    }

    if (char.isStunned) {
      stats += `\n💤 **ATORDOADO!**`;
    }

    return stats;
  }

  static createStoryWorldSelectEmbed(lastDefeated) {
    const allBosses = [];
    storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
    const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);

    const embed = new EmbedBuilder()
      .setAuthor({ name: "📜 Nexus Interdimensional — Modo História" })
      .setTitle("✦ Escolha seu Destino")
      .setDescription(
        "*Portais dimensionais se abrem diante de você...*\n" +
        "Cada universo guarda segredos e perigos únicos. Derrote o guardião final de cada mundo para avançar à próxima dimensão.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━"
      )
      .setColor("#1a0a2e")
      .setFooter({ text: "▸ Derrote o boss final de cada mundo para desbloquear o próximo" });

    storyConfig.worlds.forEach((world, index) => {
      let isWorldUnlocked = index === 0;
      if (index > 0) {
        const prevWorld = storyConfig.worlds[index - 1];
        const lastBossPrev = prevWorld.bosses[prevWorld.bosses.length - 1].id;
        const prevWorldLastIdx = allBosses.findIndex(b => b.id === lastBossPrev);
        if (lastDefeatedIdx >= prevWorldLastIdx) isWorldUnlocked = true;
      }

      const defeatedInWorld = world.bosses.filter(boss => {
        const idx = allBosses.findIndex(b => b.id === boss.id);
        return lastDefeatedIdx >= idx;
      }).length;
      const total = world.bosses.length;

      let statusLine;
      if (!isWorldUnlocked) {
        statusLine = `\`🔒 Bloqueado\``;
      } else if (defeatedInWorld >= total) {
        statusLine = `\`✅ Concluído — ${total}/${total}\``;
      } else {
        statusLine = `\`⚔️ Em progresso — ${defeatedInWorld}/${total}\``;
      }

      embed.addFields({ name: `${world.emoji} ${world.name}`, value: statusLine, inline: true });
    });

    return embed;
  }

  static createStoryBossSelectEmbed(world, lastDefeated) {
    const allBosses = [];
    storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
    const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);

    const bossLines = world.bosses.map(boss => {
      const globalIdx = allBosses.findIndex(b => b.id === boss.id);
      const isDefeated = lastDefeatedIdx >= globalIdx;
      const isUnlocked = globalIdx === 0 || lastDefeatedIdx >= globalIdx - 1;
      const icon = isDefeated ? "☑" : (isUnlocked ? "⚔️" : "🔒");
      const nameStr = isDefeated ? `~~**${boss.name}**~~` : `**${boss.name}**`;
      return `${icon} ${nameStr} — Lv.\`${boss.level}\``;
    }).join("\n");

    return new EmbedBuilder()
      .setAuthor({ name: `${world.emoji} ${world.name}` })
      .setTitle("Escolha seu Adversário")
      .setDescription(
        `*Os guardiões deste mundo aguardam seu desafio...*\n\n` +
        bossLines +
        `\n\n━━━━━━━━━━━━━━━━━━━━`
      )
      .setColor(WORLD_COLORS[world.id] || "#5865F2")
      .setFooter({ text: "☑ Derrotado  ⚔️ Disponível  🔒 Bloqueado" });
  }

  static createStoryIntroEmbed(world, boss, playerChar) {
    return new EmbedBuilder()
      .setAuthor({ name: `${world.emoji} ${world.name} — Encontro Iminente` })
      .setTitle(`⚔️ ${boss.name}`)
      .setDescription(
        `*Um silêncio pesado toma conta do ar. A presença do inimigo é inconfundível...*\n\n` +
        `> ${boss.dialogue}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━`
      )
      .setColor(WORLD_COLORS[world.id] || "#E74C3C")
      .setImage(boss.imageUrl)
      .addFields(
        { name: "👹 Nível", value: `\`${boss.level}\``, inline: true },
        { name: "❤️ Vitalidade", value: `\`${boss.health} HP\``, inline: true },
        { name: "🥋 Seu Guerreiro", value: `${playerChar.name} — Lv.\`${playerChar.level}\``, inline: true }
      )
      .setFooter({ text: "Pressione o botão abaixo para iniciar o combate. Não há volta!" });
  }

  static createProfileEmbed(player, user) {
    const playerRepository = require("../database/repositories/playerRepository");
    const titleRepository = require("../database/repositories/titleRepository");
    const instances = player.ownedChars || [];

    const equippedInstance = instances.find(i => i.id === player.equipped_instance_id);
    let equippedValue = "*Nenhum personagem equipado.*";
    let artifactsValue = "*Nenhum artefato equipado.*";
    if (equippedInstance) {
      const charData = CharacterManager.getCharacter(equippedInstance.character_id, equippedInstance);
      const rarityIcon = charData.rarity === "EM" ? "👁️" : charData.rarity === "AL" ? "🌟" : "◆";
      equippedValue = `${rarityIcon} **${charData.name}** — Nível \`${charData.level}\``;
      if (charData.equippedArtifacts && charData.equippedArtifacts.length > 0) {
        artifactsValue = charData.equippedArtifacts.map(a => `${a.emoji} **${a.name}**`).join("\n");
      }
    }

    // Nível de conta
    const accountLevel = player.level || 1;
    const accountXP    = player.xp    || 0;
    const xpNeeded     = playerRepository.getAccountLevelXPRequired(accountLevel);
    const isMaxLevel   = accountLevel >= playerRepository.ACCOUNT_MAX_LEVEL;
    const BAR_TOTAL    = 12;
    const filled       = isMaxLevel ? BAR_TOTAL : Math.floor((accountXP / xpNeeded) * BAR_TOTAL);
    const bar          = "▰".repeat(filled) + "▱".repeat(BAR_TOTAL - filled);
    const xpLine       = isMaxLevel ? "`✨ NÍVEL MÁXIMO`" : `\`${bar}\`\n\`${accountXP} / ${xpNeeded} XP\``;

    // Título equipado
    const equippedTitleId = player.equipped_title;
    const titleData = equippedTitleId ? titleRepository.TITLES[equippedTitleId] : null;
    const titleLine = titleData ? `${titleData.emoji} *${titleData.name}*` : "*Sem título*";

    const username = user ? user.username : "Jogador";
    const avatarURL = user ? user.displayAvatarURL() : null;

    // Rank color mapping
    const rankColors = {
      "Lenda": "#FF6B35", "Mestre": "#9B59B6", "Diamante": "#5DADE2",
      "Platina": "#76B7D9", "Ouro": "#F1C40F", "Prata": "#BDC3C7", "Bronze": "#CD7F32"
    };
    const rank = player.rank || "Discípulo I";
    const rankKey = Object.keys(rankColors).find(k => rank.includes(k));
    const embedColor = rankKey ? rankColors[rankKey] : "#5865F2";

    return new EmbedBuilder()
      .setAuthor({ name: username, iconURL: avatarURL })
      .setColor(embedColor)
      .setThumbnail(avatarURL)
      .setDescription(`${titleLine}`)
      .addFields(
        { name: "🏆 Rank",             value: `\`${rank}\``,                                       inline: true },
        { name: "📈 Pontos de Arena",  value: `\`${player.pa || 0} PA\``,                           inline: true },
        { name: `${Emojis.ZENITH} Zenith`, value: `\`${player.zenith_fragments || 0}\``,           inline: true },
        { name: "🌟 Nível de Conta",   value: `\`Nível ${accountLevel}\`\n${xpLine}`,              inline: false },
        { name: "🥋 Personagem Equipado", value: equippedValue,                                    inline: false },
        { name: `${Emojis.ARTIFACT} Artefatos Equipados`, value: artifactsValue,                   inline: false }
      )
      .setFooter({ text: "Anime Battle Arena • Use !titulos para ver conquistas" });
  }

  static createInventoryEmbed(player, user, type = "chars") {
    const playerRepository = require("../database/repositories/playerRepository");
    const slots = playerRepository.getSlots(user.id);
    const charSlots = slots.charSlots;
    const artifactSlots = slots.artifactSlots;

    const embed = new EmbedBuilder()
      .setTitle(`🎒 Inventário de ${user.username}`)
      .setThumbnail(user.displayAvatarURL());

    if (type === "chars") {
      embed.setColor("#9B59B6");
      const instances = player.ownedChars || [];
      const displayedInstances = instances.slice(0, charSlots);

      // Agrupar por raridade na ordem EM → AL → EC
      const RARITY_ORDER = ["EM", "AL", "EC"];
      const RARITY_LABEL = { EM: "👁️ Essência Mítica", AL: "🌟 Aura Lendária", EC: "◆ Eco Comum" };
      const rarityGroups = { EM: [], AL: [], EC: [] };

      displayedInstances.forEach(inst => {
        const charData = CharacterManager.getCharacter(inst.character_id, inst);
        const rarity   = charData.rarity || "EC";
        const artIcons = charData.equippedArtifacts?.length
          ? " " + charData.equippedArtifacts.map(a => a.emoji).join("")
          : "";
        const isEquipped  = player.equipped_instance_id === inst.id ? " ⚔️" : "";
        const isProtected = inst.protected ? " 🔒" : "";

        const elIcon = charData.element ? elementIcon(charData.element) + ' ' : '';
        const entry = `${elIcon}${charData.name} \`Lv${inst.level}\` \`#${inst.id}\`${artIcons}${isEquipped}${isProtected}`;
        rarityGroups[rarity]?.push(entry);
        if (!rarityGroups[rarity]) rarityGroups.EC.push(entry);
      });

      const usedSlots = instances.length;
      const slotsFull = usedSlots >= charSlots;
      const slotsMaxed = charSlots >= playerRepository.SLOT_MAX;
      const slotDesc = slotsMaxed
        ? `✅ **Personagens:** \`${usedSlots}/${charSlots}\` — Slots máximos atingidos!`
        : slotsFull
          ? `⚠️ **Personagens:** \`${usedSlots}/${charSlots}\` — Slots cheios! 🔓 +5 por ${Emojis.ZENITH} **${playerRepository.SLOT_COST}**`
          : `🥋 **Personagens:** \`${usedSlots}/${charSlots}\` — 🔓 +5 slots por ${Emojis.ZENITH} **${playerRepository.SLOT_COST}**`;
      embed.setDescription(slotDesc);

      const hasAny = RARITY_ORDER.some(r => rarityGroups[r].length > 0);
      if (!hasAny) {
        embed.addFields({ name: "Personagens", value: "Seu inventário de personagens está vazio.", inline: false });
      } else {
        for (const rarity of RARITY_ORDER) {
          const entries = rarityGroups[rarity];
          if (entries.length === 0) continue;

          const label = `${RARITY_LABEL[rarity]} — ${entries.length}`;

          if (rarity === "EC") {
            // EC: agrupar vários por linha separados por " · "
            const lines = [];
            let currentLine = "";
            for (const entry of entries) {
              const sep = currentLine ? "  ·  " : "";
              if ((currentLine + sep + entry).length > 80) {
                if (currentLine) lines.push(currentLine);
                currentLine = entry;
              } else {
                currentLine += sep + entry;
              }
            }
            if (currentLine) lines.push(currentLine);

            let chunk = "";
            let firstChunk = true;
            for (const line of lines) {
              if ((chunk + line + "\n").length > 1020) {
                embed.addFields({ name: firstChunk ? label : `${RARITY_LABEL[rarity]} (cont.)`, value: chunk.trimEnd(), inline: false });
                chunk = line + "\n";
                firstChunk = false;
              } else {
                chunk += line + "\n";
              }
            }
            if (chunk.trim()) {
              embed.addFields({ name: firstChunk ? label : `${RARITY_LABEL[rarity]} (cont.)`, value: chunk.trimEnd(), inline: false });
            }
          } else {
            // EM/AL: uma entrada por linha
            let chunk = "";
            let firstChunk = true;
            for (const entry of entries) {
              const line = entry + "\n";
              if ((chunk + line).length > 1020) {
                embed.addFields({ name: firstChunk ? label : `${RARITY_LABEL[rarity]} (cont.)`, value: chunk.trimEnd(), inline: false });
                chunk = line;
                firstChunk = false;
              } else {
                chunk += line;
              }
            }
            if (chunk.trim()) {
              embed.addFields({ name: firstChunk ? label : `${RARITY_LABEL[rarity]} (cont.)`, value: chunk.trimEnd(), inline: false });
            }
          }
        }
      }

      if (instances.length > charSlots) {
        embed.addFields({ name: "⚠️ Slots Cheios!", value: `Você tem **${instances.length - charSlots}** personagem(ns) além do limite que não aparecem. Desbloqueie mais slots!`, inline: false });
      }

      embed.setFooter({ text: `Total: ${instances.length}/${charSlots} slots · ⚔️ = equipado · Use !inv para alternar` });
    } else if (type === "items") {
      embed.setColor("#E67E22");
      const items = player.items || [];
      const playerChars = player.ownedChars || [];
      const equippedArtifactIds = playerChars.reduce((acc, char) => {
        if (char.equipped_artifact_1) acc.push(char.equipped_artifact_1);
        if (char.equipped_artifact_2) acc.push(char.equipped_artifact_2);
        if (char.equipped_artifact_3) acc.push(char.equipped_artifact_3);
        return acc;
      }, []);

      const allArtifacts = player.artifacts || [];
      const artifacts = allArtifacts.filter(a => !equippedArtifactIds.includes(a.id));
      const usedArtSlots = allArtifacts.length;

      // ── Recursos (moedas) ─────────────────────────────────────
      const zenithQty = player.zenith_fragments || 0;
      const frQty     = items.find(i => i.item_id === "fr")?.quantity || 0;
      const recursosValue = [
        `${Emojis.ZENITH} **Fragmentos Zenith:** \`${zenithQty}\``,
        `${Emojis.ARTIFACT} **Fragmentos de Relíquia:** \`${frQty}\``,
      ].join("\n");

      // ── Pedras da Alma (sempre exibe as 3 linhas) ────────────
      const stoneMap = [
        { id: "soul_stone_1", label: "Pedra da Alma I",   emoji: Emojis.SOUL_STONE_1 },
        { id: "soul_stone_2", label: "Pedra da Alma II",  emoji: Emojis.SOUL_STONE_2 },
        { id: "soul_stone_3", label: "Pedra da Alma III", emoji: Emojis.SOUL_STONE_3 },
      ];
      const pedrasValue = stoneMap.map(s => {
        const qty = items.find(i => i.item_id === s.id)?.quantity || 0;
        return `${s.emoji} **${s.label}:** \`${qty}\``;
      }).join("\n");

      // ── Artefatos ─────────────────────────────────────────────
      const ArtifactManager = require("./ArtifactManager");
      const artifactLines = artifacts.slice(0, artifactSlots);
      const artifactValue = artifactLines.length > 0
        ? artifactLines.map(a => {
            const d = ArtifactManager.getArtifact(a.artifact_id, a);
            return `${d.emoji} **${d.name}** — ID: \`${a.id}\``;
          }).join("\n")
        : "*Nenhum artefato no inventário.*";

      const artSlotsMaxed = artifactSlots >= playerRepository.SLOT_MAX;
      const artSlotsFull  = usedArtSlots >= artifactSlots;
      const artSlotSuffix = artSlotsMaxed
        ? "✅ Máximo atingido"
        : `🔓 +5 por ${Emojis.ZENITH} **${playerRepository.SLOT_COST}**`;

      embed.setDescription(`> Use \`!use\` para consumir Pedras da Alma e evoluir seus personagens.`);
      embed.addFields(
        { name: `${Emojis.MOCHILA} Recursos`,           value: recursosValue, inline: true },
        { name: `${Emojis.TODAS_PEDRAS} Pedras da Alma`, value: pedrasValue,  inline: true },
        { name: `\u200b`, value: `\u200b`, inline: false },
        {
          name: `${Emojis.ARTIFACT} Artefatos — \`${usedArtSlots}/${artifactSlots}\` ${artSlotsFull && !artSlotsMaxed ? "⚠️ " : ""}${artSlotSuffix}`,
          value: artifactValue,
          inline: false
        },
      );
    }

    const canUnlockChar = charSlots < playerRepository.SLOT_MAX;
    const canUnlockArt = artifactSlots < playerRepository.SLOT_MAX;

    if (type === "fragments") {
      embed.setColor("#4a0080");
      const items = player.items || [];
      const fragSlots   = slots.fragmentSlots;
      const fragSlotsMax = playerRepository.FRAG_SLOT_MAX;
      const canUnlockFrag = fragSlots < fragSlotsMax;

      // Coletar todos os fragmentos que o jogador possui, limitado pelos slots
      const allFrags = Object.entries(FragmentMap)
        .map(([itemId, data]) => {
          const qty = items.find(i => i.item_id === itemId)?.quantity || 0;
          return { itemId, qty, ...data };
        })
        .filter(f => f.qty > 0)
        .sort((a, b) => b.qty - a.qty);

      const ownedFrags = allFrags.slice(0, fragSlots);
      const hiddenCount = allFrags.length - ownedFrags.length;

      if (ownedFrags.length === 0) {
        embed.setDescription(
          `> Você ainda não possui fragmentos de relíquias.\n> Use \`!fenda\` para invocar e acumular fragmentos!\n\n` +
          `**Slots de Fragmentos:** \`0/${fragSlots}\``
        );
      } else {
        const lines = ownedFrags.map(f => {
          const filled = Math.min(f.qty, FRAGMENTS_NEEDED);
          const pct = Math.floor((filled / FRAGMENTS_NEEDED) * 100);
          const status = f.qty >= FRAGMENTS_NEEDED ? "✅" : `${pct}%`;
          return `${f.emoji} **${f.name}** — \`${filled}/${FRAGMENTS_NEEDED}\` ${status}`;
        });

        const slotLine = canUnlockFrag
          ? `**Tipos visíveis:** \`${ownedFrags.length}/${fragSlots}\` — 🔓 +5 por ${Emojis.ZENITH} **${playerRepository.SLOT_COST}**`
          : `**Tipos visíveis:** \`${ownedFrags.length}/${fragSlots}\` — ✅ Máximo atingido`;

        embed.setDescription(
          `> Junte **100 fragmentos** de uma relíquia para forjá-la!\n${slotLine}\n\n` +
          lines.join("\n") +
          (hiddenCount > 0 ? `\n\n*+${hiddenCount} tipo(s) oculto(s). Desbloqueie mais slots para exibir.*` : "")
        );
      }

      // Select menu de forja — apenas fragmentos com ≥ 100
      const craftable = ownedFrags.filter(f => f.qty >= FRAGMENTS_NEEDED);
      const rows = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_chars_${user.id}`)
            .setLabel("Personagens")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`inv_items_${user.id}`)
            .setLabel("Itens e Artefatos")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`inv_fragments_${user.id}`)
            .setLabel("Fragmentos")
            .setStyle(ButtonStyle.Primary),
        ),
      ];

      if (canUnlockFrag) {
        rows.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_unlock_fragment_${user.id}`)
            .setLabel(`🔓 +5 Slots de Fragmentos (${playerRepository.SLOT_COST} Zenith)`)
            .setStyle(ButtonStyle.Success),
        ));
      }

      if (craftable.length > 0) {
        const options = craftable.map(f => {
          const emojiIdMatch  = f.emoji.match(/<:[^:]+:(\d+)>/);
          const emojiNameMatch = f.emoji.match(/<:([^:]+):\d+>/);
          const opt = {
            label: f.name,
            description: `Você tem ${f.qty} fragmentos — custa 100`,
            value: f.itemId,
          };
          if (emojiIdMatch && emojiNameMatch) {
            opt.emoji = { id: emojiIdMatch[1], name: emojiNameMatch[1] };
          }
          return opt;
        });
        rows.push(
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`inv_craft_select_${user.id}`)
              .setPlaceholder("⚒️ Forjar relíquia — selecione o fragmento")
              .addOptions(options),
          ),
        );
      }

      // Botão de descarte — sempre visível se tiver algum fragmento
      if (ownedFrags.length > 0) {
        rows.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`inv_discard_frag_${user.id}`)
              .setLabel("🗑️ Descartar Fragmento")
              .setStyle(ButtonStyle.Danger),
          ),
        );
      }

      return { embeds: [embed], components: rows };
    }

    const rows = [];
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`inv_chars_${user.id}`)
        .setLabel("Personagens")
        .setStyle(type === "chars" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`inv_items_${user.id}`)
        .setLabel("Itens e Artefatos")
        .setStyle(type === "items" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`inv_fragments_${user.id}`)
        .setLabel("Fragmentos")
        .setStyle(ButtonStyle.Secondary),
    ));

    if (type === "chars") {
      const charInstances = player.ownedChars || [];
      const discardable = charInstances.filter(i => i.id !== player.equipped_instance_id);
      if (discardable.length > 0) {
        const discardRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_discard_char_${user.id}`)
            .setLabel("🗑️ Descartar")
            .setStyle(ButtonStyle.Danger),
        );
        if (canUnlockChar) {
          discardRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`inv_unlock_char_${user.id}`)
              .setLabel(`🔓 +5 Slots (${playerRepository.SLOT_COST} Zenith)`)
              .setStyle(ButtonStyle.Success)
          );
        }
        rows.push(discardRow);
      } else if (canUnlockChar) {
        rows.push(new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_unlock_char_${user.id}`)
            .setLabel(`🔓 +5 Slots Personagem (${playerRepository.SLOT_COST} Zenith)`)
            .setStyle(ButtonStyle.Success)
        ));
      }
    }
    if (type === "items") {
      const allArtifacts = player.artifacts || [];
      // Artifacts equipped on any character cannot be discarded
      const equippedArtIds = (player.ownedChars || []).reduce((acc, c) => {
        if (c.equipped_artifact_1) acc.push(c.equipped_artifact_1);
        if (c.equipped_artifact_2) acc.push(c.equipped_artifact_2);
        if (c.equipped_artifact_3) acc.push(c.equipped_artifact_3);
        return acc;
      }, []);
      const discardableArtifacts = allArtifacts.filter(a => !equippedArtIds.includes(a.id));

      const artRow = new ActionRowBuilder();
      if (discardableArtifacts.length > 0) {
        artRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_discard_art_${user.id}`)
            .setLabel("🗑️ Descartar Artefato")
            .setStyle(ButtonStyle.Danger)
        );
      }
      if (canUnlockArt) {
        artRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_unlock_artifact_${user.id}`)
            .setLabel(`🔓 +5 Slots Artefato (${playerRepository.SLOT_COST} Zenith)`)
            .setStyle(ButtonStyle.Success)
        );
      }
      if (artRow.components.length > 0) rows.push(artRow);
    }

    return { embeds: [embed], components: rows };
  }

  static createLevelUpEmbed(charData, oldLevel, newLevel, xpGained) {
    const levelsGained = newLevel - oldLevel;
    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setAuthor({ name: "⬆️ Guerreiro Evoluído!" })
      .setDescription(
        `*O ritual foi um sucesso. O poder de **${charData.name}** transcendeu seus limites anteriores.*\n\n` +
        `**Nível:** \`${oldLevel}\` → \`${newLevel}\`${levelsGained > 1 ? ` *(+${levelsGained} níveis!)*` : ""}\n` +
        `**XP absorvido:** +${xpGained}`
      )
      .addFields(
        { name: "❤️ Vida Máxima", value: `\`${charData.maxHealth}\``, inline: true },
        { name: "⚔️ Dano Bônus", value: `\`+${charData.bonusDamage}\``, inline: true },
      )
      .setFooter({ text: "Câmara de Evolução • Continue evoluindo seu guerreiro" });

    if (charData.imageUrl) embed.setThumbnail(charData.imageUrl);
    return embed;
  }

  static createXPGainEmbed(charData, xpGained, currentXP, requiredXP, quantity, itemName) {
    const filled = Math.min(12, Math.floor((currentXP / requiredXP) * 12));
    const bar = "▰".repeat(filled) + "▱".repeat(12 - filled);
    const pct = Math.floor((currentXP / requiredXP) * 100);

    const embed = new EmbedBuilder()
      .setColor("#2b0a4e")
      .setAuthor({ name: "✨ Energia Absorvida" })
      .setDescription(
        `*As pedras se dissolvem, e a energia flui pelo corpo de **${charData.name}**...*\n\n` +
        `**Pedras usadas:** ${quantity}x ${itemName}\n` +
        `**XP absorvido:** +${xpGained}`
      )
      .addFields(
        { name: "Progresso para o próximo nível", value: `${bar} **${pct}%**\n\`${Math.floor(currentXP)} / ${Math.floor(requiredXP)} XP\``, inline: false }
      )
      .setFooter({ text: "Câmara de Evolução • Continue para evoluir de nível" });

    if (charData.imageUrl) embed.setThumbnail(charData.imageUrl);
    return embed;
  }

  static createStatusEmbed(message, isSuccess = true) {
    const color = isSuccess ? "#00FF00" : "#FF0000";
    const emoji = isSuccess ? "✅" : "❌";
    
    return new EmbedBuilder()
      .setColor(color)
      .setDescription(`${emoji} ${message}`);
  }
}

module.exports = EmbedManager;
