const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const CharacterManager = require("./CharacterManager");
const Emojis = require("../config/emojis");

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
        name: `🔥 ${char1.name} (BOSS) [Lvl ${char1.level}]`,
        value: this.formatCharStats(char1),
        inline: false
      });
      // Mostrar o trio desafiante
      battle.partyCharacters.forEach((char, index) => {
        embed.addFields({
          name: `👤 ${char.name} (P${index + 1}) [Lvl ${char.level}]`,
          value: this.formatCharStats(char),
          inline: true
        });
      });
    } else if (battle.isPve && battle.partyCharacters) {
      // No PVE normal, char2 é o Boss
      battle.partyCharacters.forEach((char, index) => {
        embed.addFields({
          name: `${index === 0 ? "👑" : "👤"} ${char.name} (P${index + 1}) [Lvl ${char.level}]`,
          value: this.formatCharStats(char),
          inline: true
        });
      });
      embed.addFields({
        name: `👾 ${char2.name} (BOSS) [Lvl ${char2.level}]`,
        value: this.formatCharStats(char2),
        inline: true
      });
    } else {
      embed.addFields(
        { 
          name: `🥋 ${char1.name} (P1) [Lvl ${char1.level}]`, 
          value: this.formatCharStats(char1), 
          inline: true 
        },
        { 
          name: `🥋 ${char2.name} (P2) [Lvl ${char2.level}]`, 
          value: this.formatCharStats(char2), 
          inline: true 
        }
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

    if (battle.state === "choosing_action") {
        const turnText = (battle.isPve && battle.currentPlayerTurnId === battle.player2Id) ? `Turno de: ${currentPlayer.name} (Boss pensando...)` : `Turno de: ${currentPlayer.name} | Escolha uma habilidade!`;
        embed.setFooter({ text: turnText });
    } else if (battle.state === "choosing_reaction") {
      const damage = battle.lastPendingDamage || 0;
      const turnText = (battle.isPve && battle.getOpponentId() === battle.player2Id) ? `Turno de: ${opponentPlayer.name} (Boss reagindo...)` : `Turno de: ${opponentPlayer.name} | Dano Previsto: ${damage} HP | Reaja ou Pule!`;
      embed.setFooter({ text: turnText });
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

  static createStoryIntroEmbed(world, boss, playerChar) {
    return new EmbedBuilder()
      .setTitle(`📖 Modo História: ${world.name}`)
      .setDescription(`Você atravessa um portal interdimensional e surge de repente diante de um poderoso inimigo...\n\n**${boss.dialogue}**`)
      .setColor("#E74C3C")
      .setImage(boss.imageUrl)
      .addFields(
        { name: "🌍 Local", value: world.name, inline: true },
        { name: "⚔️ Oponente", value: `${boss.name} [Lvl ${boss.level}]`, inline: true },
        { name: "🥋 Seu Personagem", value: `${playerChar.name} [Lvl ${playerChar.level}]`, inline: true }
      )
      .setFooter({ text: "Clique no botão abaixo para iniciar o combate!" });
  }

  static createProfileEmbed(player) {
    const instances = player.ownedChars || [];
    const charCounts = {};
    instances.forEach(inst => {
      charCounts[inst.character_id] = (charCounts[inst.character_id] || 0) + 1;
    });

    const equippedInstance = instances.find(i => i.id === player.equipped_instance_id);
    let equippedName = "Nenhum";
    let equippedArtifactsList = "Nenhum";
    if (equippedInstance) {
      const charData = CharacterManager.getCharacter(equippedInstance.character_id, equippedInstance);
      let artifactIcons = "";
      if (charData.equippedArtifacts && charData.equippedArtifacts.length > 0) {
        artifactIcons = " " + charData.equippedArtifacts.map(a => a.emoji).join("");
        equippedArtifactsList = charData.equippedArtifacts.map(a => `${a.emoji} ${a.name}`).join("\n");
      }
      equippedName = `${charData.name} [Lvl ${charData.level}]${artifactIcons}`;
    }

    return new EmbedBuilder()
      .setTitle(`Perfil do Jogador`)
      .setColor("#00ff00")
      .addFields(
        { name: "Nível", value: `\`${player.level}\``, inline: true },
        { name: "XP", value: `\`${player.xp}\``, inline: true },
        { name: "Ouro", value: `\`${player.gold}\``, inline: true },
        { name: "Fragmentos Zenith", value: `${Emojis.ZENITH} \`${player.zenith_fragments || 0}\``, inline: true },
        { name: "🏆 Rank", value: `\`${player.rank || "Discípulo I"}\``, inline: true },
        { name: "📈 PA", value: `\`${player.pa || 0}/100\``, inline: true },
        { name: "Equipado", value: `\`${equippedName}\``, inline: false },
        { name: "Artefatos Equipados", value: equippedArtifactsList, inline: false }
      )
;
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
      const rarityGroups = {};

      displayedInstances.forEach(inst => {
        const charData = CharacterManager.getCharacter(inst.character_id, inst);
        const rarity = charData.rarity;
        if (!rarityGroups[rarity]) rarityGroups[rarity] = [];

        const EvolutionManager = require("./EvolutionManager");
        const nextLevelXP = EvolutionManager.getXPRequired(inst.level);
        const xpPercent = Math.floor((inst.xp / nextLevelXP) * 10);
        const bar = "█".repeat(xpPercent) + "░".repeat(10 - xpPercent);

        let artifactIcons = "";
        if (charData.equippedArtifacts && charData.equippedArtifacts.length > 0) {
          artifactIcons = " " + charData.equippedArtifacts.map(a => a.emoji).join("");
        }

        rarityGroups[rarity].push(`• **${charData.name}** [Lvl ${inst.level}]${artifactIcons} (ID: ${inst.id})\n \`${bar}\` \`${inst.xp}/${nextLevelXP}\``);
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

      const rarities = Object.keys(rarityGroups).sort();
      if (rarities.length === 0) {
        embed.addFields({ name: "Personagens", value: "Seu inventário de personagens está vazio.", inline: false });
      } else {
        rarities.forEach(rarity => {
          embed.addFields({
            name: `✨ Raridade: ${rarity}`,
            value: rarityGroups[rarity].join("\n"),
            inline: false
          });
        });
      }

      if (instances.length > charSlots) {
        embed.addFields({ name: "⚠️ Slots Cheios!", value: `Você tem **${instances.length - charSlots}** personagem(ns) além do limite que não aparecem. Desbloqueie mais slots!`, inline: false });
      }

      embed.setFooter({ text: `Total: ${instances.length}/${charSlots} slots | Use !inv para alternar` });
    } else {
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

    const rows = [];
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`inv_chars_${user.id}`)
        .setLabel("Personagens")
        .setStyle(type === "chars" ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`inv_items_${user.id}`)
        .setLabel("Itens e Artefatos")
        .setStyle(type === "items" ? ButtonStyle.Primary : ButtonStyle.Secondary)
    ));

    if (type === "chars" && canUnlockChar) {
      rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`inv_unlock_char_${user.id}`)
          .setLabel(`🔓 +5 Slots Personagem (${playerRepository.SLOT_COST} Zenith)`)
          .setStyle(ButtonStyle.Success)
      ));
    }
    if (type === "items" && canUnlockArt) {
      rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`inv_unlock_artifact_${user.id}`)
          .setLabel(`🔓 +5 Slots Artefato (${playerRepository.SLOT_COST} Zenith)`)
          .setStyle(ButtonStyle.Success)
      ));
    }

    return { embeds: [embed], components: rows };
  }

  static createLevelUpEmbed(charData, oldLevel, newLevel, xpGained) {
    const embed = new EmbedBuilder()
      .setTitle("🆙 LEVEL UP!")
      .setDescription(`Seu personagem **${charData.name}** ficou mais forte!`)
      .setColor("#FFD700")
      .addFields(
        { name: "Nível Anterior", value: `\`${oldLevel}\``, inline: true },
        { name: "Novo Nível", value: `\`${newLevel}\``, inline: true },
        { name: "XP Ganho", value: `\`+${xpGained}\``, inline: true },
        { name: "Novos Atributos", value: `❤️ HP: \`${charData.maxHealth}\`\n⚔️ Dano Bônus: \`+${charData.bonusDamage}\``, inline: false }
      )
;

    if (charData.imageUrl) {
      embed.setThumbnail(charData.imageUrl);
    }

    return embed;
  }

  static createXPGainEmbed(charData, xpGained, currentXP, requiredXP, quantity, itemName) {
    const xpPercent = Math.floor((currentXP / requiredXP) * 10);
    const bar = "█".repeat(Math.min(10, Math.max(0, xpPercent))) + "░".repeat(Math.min(10, Math.max(0, 10 - xpPercent)));
    
    const embed = new EmbedBuilder()
      .setTitle("✨ XP Adquirido!")
      .setDescription(`Você usou **${quantity}x ${itemName}** em **${charData.name}**!`)
      .setColor("#3498DB")
      .addFields(
        { name: "XP Ganho", value: `\`+${xpGained}\``, inline: true },
        { name: "Progresso", value: `\`${bar}\` \`${Math.floor(currentXP)}/${Math.floor(requiredXP)}\``, inline: false }
      );

    if (charData.imageUrl) {
      embed.setThumbnail(charData.imageUrl);
    }

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
