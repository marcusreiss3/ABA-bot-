const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const BattleEngine = require("../services/BattleEngine");
const EmbedManager = require("../services/EmbedManager");
const ButtonManager = require("../services/ButtonManager");
const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const ArtifactManager = require("../services/ArtifactManager");
const EvolutionManager = require("../services/EvolutionManager");
const storyConfig = require("../config/storyConfig.js");
const RankManager = require("../services/RankManager");
const { ChannelType, PermissionFlagsBits } = require("discord.js");

module.exports = {
  execute: async (interaction) => {
    // 0.0 Lógica de Escolha Inicial de Equipamento (Botões)
    if (interaction.isButton() && interaction.customId.startsWith("equip_choice_")) {
      const [_, __, type, userId] = interaction.customId.split("_");
      if (interaction.user.id !== userId) return interaction.reply({ content: "Esta não é a sua sessão!", ephemeral: true });

      if (type === "char") {
        const player = playerRepository.getPlayer(userId);
        const instances = playerRepository.getPlayerCharacters(userId);

        if (instances.length === 0) {
          return interaction.update({ content: "Você não possui nenhum personagem para equipar!", embeds: [], components: [] });
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("equip_select")
          .setPlaceholder("Selecione um personagem para equipar");

        const options = instances.map(inst => {
          const charData = CharacterManager.getCharacter(inst.character_id, inst);
          const isEquipped = player.equipped_instance_id === inst.id;

          return {
            label: `${charData.name} [Lvl ${inst.level}]`,
            value: inst.id.toString(),
            description: `Raridade: ${charData.rarity} | ID: ${inst.id}${isEquipped ? " (Equipado)" : ""}`,
            emoji: isEquipped ? "✅" : "🥋"
          };
        });

        selectMenu.addOptions(options.slice(0, 25));
        const row = new ActionRowBuilder().addComponents(selectMenu);

        let equippedName = "Nenhum";
        if (player.equipped_instance_id) {
          const inst = instances.find(i => i.id === player.equipped_instance_id);
          if (inst) {
            const charData = CharacterManager.getCharacter(inst.character_id, inst);
            equippedName = `${charData.name} [Lvl ${inst.level}]`;
          }
        }

        const embed = new EmbedBuilder()
          .setTitle("Equipar Personagem")
          .setDescription("Escolha abaixo qual personagem você deseja equipar para suas batalhas.")
          .setColor("#0099ff")
          .addFields({ name: "Atualmente Equipado", value: `\`${equippedName}\`` })
          .setFooter({ text: "Use o menu abaixo para selecionar." });

        return interaction.update({ embeds: [embed], components: [row] });
      }

      if (type === "artifact") {
        const ownedChars = playerRepository.getPlayerCharacters(userId);
        const artifacts = playerRepository.getPlayerArtifacts(userId);

        if (!ownedChars || ownedChars.length === 0) {
          return interaction.update({ content: "❌ Você não possui nenhum personagem para equipar artefatos.", embeds: [], components: [] });
        }
        if (!artifacts || artifacts.length === 0) {
          return interaction.update({ content: "❌ Você não possui nenhum artefato no seu inventário.", embeds: [], components: [] });
        }

        const embed = new EmbedBuilder()
          .setTitle("🛡️ Gerenciamento de Artefatos")
          .setDescription("Escolha abaixo o personagem que você deseja gerenciar os artefatos.")
          .setColor("#3498DB")
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: "Anime Battle Arena • Sistema de Artefatos" });

        const characterOptions = ownedChars.map(charInstance => {
          const charData = CharacterManager.getCharacter(charInstance.character_id, charInstance);
          return {
            label: `${charData.name} (Lvl ${charInstance.level})`,
            description: `ID: ${charInstance.id} • Clique para gerenciar`,
            value: charInstance.id.toString()
          };
        });

        const charSelectRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("equip_artifact_char_select")
            .setPlaceholder("Selecione um personagem...")
            .addOptions(characterOptions)
        );

        return interaction.update({ embeds: [embed], components: [charSelectRow] });
      }
    }

    // 0. Lógica de Equipar Personagem (Menu)
    if (interaction.isStringSelectMenu() && interaction.customId === "equip_select") {
      const instanceId = parseInt(interaction.values[0]);
      playerRepository.updatePlayer(interaction.user.id, { equipped_instance_id: instanceId });
      const instance = playerRepository.getCharacterInstance(instanceId);
      const charData = CharacterManager.getCharacter(instance.character_id, instance);
      return interaction.update({
        content: `✅ Você equipou **${charData.name} [Lvl ${instance.level}]** com sucesso!`,
        embeds: [], components: []
      });
    }

    // 0.1 Lógica de Botões do Inventário
    if (interaction.isButton() && interaction.customId.startsWith("inv_")) {
      const [_, type, userId] = interaction.customId.split("_");
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });
      const player = playerRepository.getPlayer(userId);
      player.ownedChars = playerRepository.getPlayerCharacters(userId);
      player.items = playerRepository.getPlayerItems(userId);
      player.artifacts = playerRepository.getPlayerArtifacts(userId);
      const result = EmbedManager.createInventoryEmbed(player, interaction.user, type);
      return interaction.update(result);
    }

    // 0.2 Lógica de Seleção de Personagem para Artefato
    if (interaction.isStringSelectMenu() && interaction.customId === "equip_artifact_char_select") {
      const characterInstanceId = parseInt(interaction.values[0]);
      const playerId = interaction.user.id;
      const player = playerRepository.getPlayer(playerId);
      player.ownedChars = playerRepository.getPlayerCharacters(playerId);
      player.artifacts = playerRepository.getPlayerArtifacts(playerId);
      const selectedCharInstance = player.ownedChars.find(c => c.id === characterInstanceId);
      if (!selectedCharInstance) return interaction.update({ content: "Personagem não encontrado.", embeds: [], components: [] });
      const charData = CharacterManager.getCharacter(selectedCharInstance.character_id, selectedCharInstance);
      const availableArtifacts = player.artifacts.filter(pa => ![selectedCharInstance.equipped_artifact_1, selectedCharInstance.equipped_artifact_2, selectedCharInstance.equipped_artifact_3].includes(pa.id)).map(pa => {
        const artifactData = ArtifactManager.getArtifact(pa.artifact_id, pa);
        return { label: `${artifactData.emoji} ${artifactData.name}`, description: `ID: ${pa.id}`, value: pa.id.toString() };
      });
      const artifactSelectMenu = new StringSelectMenuBuilder().setCustomId(`equip_artifact_select_${characterInstanceId}`).setPlaceholder("Escolha um artefato para equipar").addOptions(availableArtifacts.length > 0 ? availableArtifacts : [{ label: "Nenhum artefato disponível", value: "none", description: "Você não tem artefatos para equipar ou todos já estão equipados." }]);
      const equipRow = new ActionRowBuilder().addComponents(artifactSelectMenu);
      const unequipButtons = [];
      for (let i = 1; i <= 3; i++) {
        const equippedArtifactInstanceId = selectedCharInstance[`equipped_artifact_${i}`];
        if (equippedArtifactInstanceId) {
          const artifactInstance = playerRepository.getArtifactInstance(equippedArtifactInstanceId);
          const artifactData = ArtifactManager.getArtifact(artifactInstance.artifact_id, artifactInstance);
          unequipButtons.push(new ButtonBuilder().setCustomId(`unequip_artifact_${characterInstanceId}_${i}_${equippedArtifactInstanceId}`).setLabel(`Remover ${artifactData.emoji} ${artifactData.name}`).setStyle(ButtonStyle.Danger));
        }
      }
      const unequipRow = unequipButtons.length > 0 ? new ActionRowBuilder().addComponents(unequipButtons) : null;
      const components = [equipRow];
      if (unequipRow) components.push(unequipRow);
      const manageEmbed = new EmbedBuilder().setTitle(`🛡️ Gerenciando: ${charData.name}`).setDescription(`Gerencie os artefatos equipados neste personagem.\n\n**Slots Disponíveis:** \`${3 - charData.equippedArtifacts.length}/3\``).setColor("#F1C40F").setThumbnail(charData.imageUrl || null).addFields({ name: "📦 Artefatos Atuais", value: charData.equippedArtifacts.length > 0 ? charData.equippedArtifacts.map((a, idx) => `Slot ${idx + 1}: ${a.emoji} **${a.name}**`).join("\n") : "Nenhum artefato equipado." }).setFooter({ text: "Selecione um artefato abaixo para equipar ou use os botões para remover." });
      return interaction.update({ embeds: [manageEmbed], components: components });
    }

    // 0.3 Lógica de Equipar Artefato
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("equip_artifact_select_")) {
      const parts = interaction.customId.split("_");
      const characterInstanceId = parseInt(parts[parts.length - 1]);
      const artifactInstanceId = parseInt(interaction.values[0]);
      if (interaction.values[0] === "none") return interaction.update({ content: "Nenhum artefato selecionado.", embeds: [], components: [] });
      const charInstance = playerRepository.getCharacterInstance(characterInstanceId);
      if (!charInstance) return interaction.update({ content: `❌ Personagem não encontrado (ID: ${characterInstanceId}).`, embeds: [], components: [] });
      let equippedSlot = null;
      for (let i = 1; i <= 3; i++) { if (!charInstance[`equipped_artifact_${i}`]) { equippedSlot = i; break; } }
      if (!equippedSlot) return interaction.update({ content: "❌ Este personagem já tem 3 artefatos equipados. Remova um antes de equipar outro.", embeds: [], components: [] });
      playerRepository.equipArtifact(charInstance.id, artifactInstanceId, equippedSlot);
      const updatedCharInstance = playerRepository.getCharacterInstance(charInstance.id);
      const charData = CharacterManager.getCharacter(updatedCharInstance.character_id, updatedCharInstance);
      const artifactRaw = playerRepository.getArtifactInstance(artifactInstanceId);
      const artifactData = ArtifactManager.getArtifact(artifactRaw.artifact_id, artifactRaw);
      const successEmbed = new EmbedBuilder().setTitle("✅ Artefato Equipado!").setDescription(`O artefato **${artifactData.name}** foi equipado com sucesso em **${charData.name}**!`).setColor("#2ECC71").setThumbnail(charData.imageUrl || null).addFields({ name: "Slot Utilizado", value: `Slot ${equippedSlot}`, inline: true }).setFooter({ text: "Anime Battle Arena • Artefatos" });
      return interaction.update({ embeds: [successEmbed], components: [] });
    }

    // 0.4 Lógica de Desequipar Artefato
    if (interaction.isButton() && interaction.customId.startsWith("unequip_artifact_")) {
      const [_, __, characterInstanceId, slot, artifactInstanceId] = interaction.customId.split("_");
      playerRepository.unequipArtifact(parseInt(characterInstanceId), parseInt(slot));
      const updatedCharInstance = playerRepository.getCharacterInstance(parseInt(characterInstanceId));
      const charData = CharacterManager.getCharacter(updatedCharInstance.character_id, updatedCharInstance);
      const artifactRaw = playerRepository.getArtifactInstance(parseInt(artifactInstanceId));
      const artifactData = ArtifactManager.getArtifact(artifactRaw.artifact_id, artifactRaw);
      return interaction.update({ content: `✅ Artefato **${artifactData.name}** removido de **${charData.name}**!`, embeds: [], components: [] });
    }

    // --- Lógica de Party: Aceitar/Recusar ---
    if (interaction.isButton() && interaction.customId.startsWith("party_")) {
      const [_, action, leaderId, targetId] = interaction.customId.split("_");
      if (interaction.user.id !== targetId) return interaction.reply({ content: "Este convite não é para você!", ephemeral: true });

      if (action === "decline") {
        return interaction.update({ content: `❌ **${interaction.user.username}** recusou o convite.`, embeds: [], components: [] });
      }

      if (action === "accept") {
        global.parties = global.parties || new Map();
        let party = global.parties.get(leaderId);
        
        if (!party) {
          party = { leaderId: leaderId, members: [leaderId] };
          global.parties.set(leaderId, party);
        }

        if (party.members.length >= 3) return interaction.update({ content: "❌ A party já está cheia.", embeds: [], components: [] });
        if (party.members.includes(targetId)) return interaction.update({ content: "❌ Você já está nesta party.", embeds: [], components: [] });

        party.members.push(targetId);
        const leaderUser = await interaction.client.users.fetch(leaderId);
        return interaction.update({ content: `✅ **${interaction.user.username}** aceitou o convite e entrou na party de **${leaderUser.username}**! (${party.members.length}/3)`, embeds: [], components: [] });
      }
    }

    // --- Lógica de Use: Seleção de Personagem ---
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("use_item_select_")) {
      const playerId = interaction.customId.split("_")[3];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Este menu não é seu!", ephemeral: true });

      const itemId = interaction.values[0];
      const characters = playerRepository.getPlayerCharacters(playerId);
      
      if (characters.length === 0) return interaction.update({ content: "❌ Você não possui personagens.", embeds: [], components: [] });

      const itemData = EvolutionManager.ITEMS[itemId];
      if (!itemData) return interaction.update({ content: `❌ Item inválido (${itemId}).`, embeds: [], components: [] });

      const charOptions = characters.map(c => {
        const charData = CharacterManager.getCharacter(c.character_id, c);
        return { label: `${charData.name} (Lvl ${c.level})`, description: `ID: ${c.id}`, value: c.id.toString() };
      });

      const embed = new EmbedBuilder()
        .setTitle("👤 Selecionar Personagem")
        .setDescription(`Você selecionou **${itemData.name}**. Agora escolha em qual personagem deseja usar.`)
        .setColor("#5865F2");

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`use_char_select_${playerId}_${itemId}`)
          .setPlaceholder("Escolha um personagem...")
          .addOptions(charOptions)
      );

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // --- Lógica de Use: Seleção de Quantidade ---
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("use_char_select_")) {
      const parts = interaction.customId.split("_");
      const playerId = parts[3];
      const itemId = parts.slice(4).join("_");
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Este menu não é seu!", ephemeral: true });

      const instanceId = parseInt(interaction.values[0]);
      const playerItems = playerRepository.getPlayerItems(playerId);
      const item = playerItems.find(i => i.item_id === itemId);
      
      const itemData = EvolutionManager.ITEMS[itemId];
      if (!itemData) return interaction.update({ content: `❌ Item inválido (${itemId}).`, embeds: [], components: [] });

      if (!item || item.quantity <= 0) {
        return interaction.update({ content: `❌ Você não possui o item **${itemData.name}** no inventário.`, embeds: [], components: [] });
      }

      const maxQuantity = item.quantity;
      const embed = new EmbedBuilder()
        .setTitle("🔢 Selecionar Quantidade")
        .setDescription(`Quantas **${itemData.name}** você deseja usar?\n\nVocê possui: **${maxQuantity}**`)
        .setColor("#5865F2");

      const qtyOptions = [1, 5, 10, 20, 50].filter(q => q <= maxQuantity).map(q => ({ label: `${q} unidades`, value: q.toString() }));
      
      if (maxQuantity > 1 && !qtyOptions.find(o => parseInt(o.value) === maxQuantity)) {
        qtyOptions.push({ label: `Tudo (${maxQuantity})`, value: maxQuantity.toString() });
      }

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`use_qty_select_${playerId}_${instanceId}_${itemId}`)
          .setPlaceholder("Escolha a quantidade...")
          .addOptions(qtyOptions)
      );

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // --- Lógica de Use: Confirmação ---
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("use_qty_select_")) {
      const parts = interaction.customId.split("_");
      const playerId = parts[3];
      const instanceId = parts[4];
      const itemId = parts.slice(5).join("_");
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Este menu não é seu!", ephemeral: true });

      const quantity = parseInt(interaction.values[0]);
      const instance = playerRepository.getCharacterInstance(parseInt(instanceId));
      if (!instance) return interaction.update({ content: "❌ Personagem não encontrado.", embeds: [], components: [] });

      const charData = CharacterManager.getCharacter(instance.character_id, instance);
      const itemData = EvolutionManager.ITEMS[itemId];
      if (!itemData) return interaction.update({ content: `❌ Item inválido (${itemId}).`, embeds: [], components: [] });

      const totalXP = itemData.xp * quantity;

      const embed = new EmbedBuilder()
        .setTitle("⚠️ Confirmar Uso")
        .setDescription(`Deseja usar **${quantity}x ${itemData.name}** em **${charData.name}**?\n\nEle ganhará **${totalXP} XP**.`)
        .setColor("#E67E22");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`use_confirm_${playerId}_${instanceId}_${quantity}_${itemId}`)
          .setLabel("Confirmar")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`use_cancel_${playerId}`)
          .setLabel("Cancelar")
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // --- Lógica de Use: Execução Final ---
    if (interaction.isButton() && interaction.customId.startsWith("use_confirm_")) {
      const parts = interaction.customId.split("_");
      const playerId = parts[2];
      const instanceId = parts[3];
      const quantity = parseInt(parts[4]);
      const itemId = parts.slice(5).join("_");
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta ação não é sua!", ephemeral: true });

      const itemData = EvolutionManager.ITEMS[itemId];
      if (!itemData) return interaction.update({ content: `❌ Item inválido (${itemId}).`, embeds: [], components: [] });

      const instanceBefore = playerRepository.getCharacterInstance(parseInt(instanceId));
      if (!instanceBefore) return interaction.update({ content: "❌ Personagem não encontrado.", embeds: [], components: [] });
      
      const oldLevel = instanceBefore.level;
      const result = EvolutionManager.useItem(playerId, parseInt(instanceId), itemId, quantity);

      if (!result.success) return interaction.update({ content: `❌ ${result.message}`, embeds: [], components: [] });

      const instanceAfter = playerRepository.getCharacterInstance(parseInt(instanceId));
      const charData = CharacterManager.getCharacter(instanceAfter.character_id, instanceAfter);

      if (result.leveledUp) {
        const levelUpEmbed = EmbedManager.createLevelUpEmbed(charData, oldLevel, result.newLevel, result.xpGained);
        return interaction.update({ embeds: [levelUpEmbed], components: [] });
      } else {
        const xpRequired = EvolutionManager.getXPRequired(instanceAfter.level);
        const xpGainEmbed = EmbedManager.createXPGainEmbed(charData, result.xpGained, instanceAfter.xp, xpRequired, quantity, itemData.name);
        return interaction.update({ embeds: [xpGainEmbed], components: [] });
      }
    }

    if (interaction.isButton() && interaction.customId.startsWith("use_cancel_")) {
      return interaction.update({ content: "❌ Ação cancelada.", embeds: [], components: [] });
    }

    // 1. Lógica de Seleção de Personagem (Botões)
    if (interaction.isButton() && interaction.customId.startsWith("select_")) {
      const [type, id1, id2] = interaction.customId.split("_");
      const selection = global.selections.get(interaction.message.id);
      if (!selection) return interaction.reply({ content: "Seleção expirada.", ephemeral: true });
      if (interaction.user.id !== id1) return interaction.reply({ content: "Não é sua vez de escolher!", ephemeral: true });
      const player = playerRepository.getPlayer(interaction.user.id);
      const instances = playerRepository.getPlayerCharacters(interaction.user.id);
      let instance = instances.find(i => i.id === player.equipped_instance_id && i.character_id === id2);
      if (!instance) instance = instances.find(i => i.character_id === id2);
      if (!instance) return interaction.reply({ content: "Você não possui este personagem!", ephemeral: true });
      if (interaction.user.id === selection.p1Id) selection.p1 = instance;
      else if (interaction.user.id === selection.p2Id) selection.p2 = instance;
      if (selection.p1 && selection.p2) {
        const battle = BattleEngine.startBattle(selection.p1Id, selection.p2Id, selection.p1, selection.p2);
        const embed = EmbedManager.createBattleEmbed(battle);
        const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);
        await interaction.update({ embeds: [embed], components: components });
        global.selections.delete(interaction.message.id);
      } else {
        await interaction.reply({ content: `Você escolheu **${id2.toUpperCase()}**! Aguardando o outro jogador...`, ephemeral: true });
      }
      return;
    }

    const isMenu = interaction.isStringSelectMenu();
    const isButton = interaction.isButton();
    if (!isMenu && !isButton) return;
    const parts = interaction.customId.split("_");
    const type = parts[0];

    // --- Lógica de Seleção de Mundo ---
    if (type === "story" && parts[1] === "world") {
      const worldId = parts[2];
      const playerId = parts[3];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });

      const world = storyConfig.worlds.find(w => w.id === worldId);
      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;

      const embed = new EmbedBuilder()
        .setTitle(`${world.emoji} Modo História: ${world.name}`)
        .setDescription("Selecione um vilão para enfrentar. Derrote o atual para desbloquear o próximo!")
        .setColor("#5865F2")
        .setTimestamp();

      const row = new ActionRowBuilder();
      const allBosses = [];
      storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));

      world.bosses.forEach((boss) => {
        let isUnlocked = false;
        const globalBossIndex = allBosses.findIndex(b => b.id === boss.id);
        
        if (globalBossIndex === 0) isUnlocked = true;
        else {
          const previousBossId = allBosses[globalBossIndex - 1].id;
          const lastDefeatedIndex = allBosses.findIndex(b => b.id === lastDefeated);
          const prevBossIndex = allBosses.findIndex(b => b.id === previousBossId);
          if (lastDefeatedIndex >= prevBossIndex) isUnlocked = true;
        }

        const isDefeated = allBosses.findIndex(b => b.id === lastDefeated) >= globalBossIndex;

        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`pve_intro_${boss.id}_${playerId}`)
            .setLabel(boss.shortName)
            .setStyle(isDefeated ? ButtonStyle.Success : (isUnlocked ? ButtonStyle.Primary : ButtonStyle.Secondary))
            .setDisabled(!isUnlocked)
        );
      });

      const backButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`story_back_${playerId}`).setLabel("Voltar aos Mundos").setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [embed], components: [row, backButton] });
    }

    // --- Lógica de Voltar ao Menu de Mundos ---
    if (type === "story" && parts[1] === "back") {
      const playerId = parts[2];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });

      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;

      const embed = new EmbedBuilder()
        .setTitle("🌍 Modo História: Seleção de Universo")
        .setDescription("Escolha o universo que deseja explorar. Derrote o boss final de um mundo para desbloquear o próximo!")
        .setColor("#5865F2")
        .setTimestamp();

      const row = new ActionRowBuilder();
      const allBosses = [];
      storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));

      storyConfig.worlds.forEach((world, index) => {
        let isWorldUnlocked = index === 0;
        if (index > 0) {
          const prevWorld = storyConfig.worlds[index - 1];
          const lastBossPrev = prevWorld.bosses[prevWorld.bosses.length - 1].id;
          const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);
          const prevWorldLastIdx = allBosses.findIndex(b => b.id === lastBossPrev);
          if (lastDefeatedIdx >= prevWorldLastIdx) isWorldUnlocked = true;
        }

        embed.addFields({ name: `${world.emoji} ${world.name}`, value: isWorldUnlocked ? "✅ Disponível" : "❌ Bloqueado", inline: true });
        row.addComponents(new ButtonBuilder().setCustomId(`story_world_${world.id}_${playerId}`).setLabel(world.name.split(" ")[1] || world.name).setEmoji(world.emoji).setStyle(isWorldUnlocked ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(!isWorldUnlocked));
      });

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // --- Lógica de Introdução do Modo História ---
    if (type === "pve" && parts[1] === "intro") {
      const bossId = parts.slice(2, -1).join("_");
      const playerId = parts[parts.length - 1];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });
      
      const player = playerRepository.getPlayer(playerId);
      if (!player.equipped_instance_id) return interaction.reply({ content: "Equipe um personagem antes de lutar! Use `!equip`", ephemeral: true });
      
      const charInstance = playerRepository.getCharacterInstance(player.equipped_instance_id);
      const playerChar = CharacterManager.getCharacter(charInstance.character_id, charInstance);
      
      let worldData, bossData;
      const allBosses = [];
      storyConfig.worlds.forEach(w => {
        allBosses.push(...w.bosses);
        const b = w.bosses.find(x => x.id === bossId);
        if (b) { worldData = w; bossData = b; }
      });
      
      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;
      const globalBossIndex = allBosses.findIndex(b => b.id === bossId);
      const lastDefeatedIndex = allBosses.findIndex(b => b.id === lastDefeated);
      
      if (globalBossIndex > 0 && lastDefeatedIndex < globalBossIndex - 1) {
        return interaction.reply({ content: "Você ainda não desbloqueou este desafio!", ephemeral: true });
      }

      const introEmbed = EmbedManager.createStoryIntroEmbed(worldData, bossData, playerChar);
      const startButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pve_start_${bossId}_${playerId}`).setLabel("INICIAR COMBATE").setStyle(ButtonStyle.Danger)
      );
      
      return interaction.update({ embeds: [introEmbed], components: [startButton] });
    }

    if (type === "pve" && parts[1] === "start") {
      const bossId = parts.slice(2, -1).join("_");
      const playerId = parts[parts.length - 1];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });
      
      const status = BattleEngine.canStartBattle(playerId);
      if (!status.can) return interaction.reply({ content: status.reason, ephemeral: true });

      const player = playerRepository.getPlayer(playerId);
      const charInstance = playerRepository.getCharacterInstance(player.equipped_instance_id);
      
      // Verificar se o jogador está em uma party
      const party = global.parties ? global.parties.get(playerId) : null;
      const partyMembers = party ? party.members : [playerId];
      
      // Validar se todos os membros têm personagens equipados
      for (const memberId of partyMembers) {
        const memberPlayer = playerRepository.getPlayer(memberId);
        if (!memberPlayer.equipped_instance_id) {
          const memberUser = await interaction.client.users.fetch(memberId);
          return interaction.reply({ content: `O membro **${memberUser.username}** não tem um personagem equipado!`, ephemeral: true });
        }
      }

      const bossInstance = { character_id: bossId, level: 1 }; 
      const battle = BattleEngine.startBattle(playerId, `boss_${bossId}`, charInstance, bossInstance, true, partyMembers);
      const embed = EmbedManager.createBattleEmbed(battle);
      const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);
      return interaction.update({ embeds: [embed], components: components });
    }

    // 1.0 Lógica de Confirmação de PVP
    if (interaction.isButton() && interaction.customId.startsWith("pvp_")) {
      const parts = interaction.customId.split("_");
      const action = parts[1];
      const p1Id = parts[parts.length - 1]; // Para init_ranked e init_casual

      // Lógica de Inicialização (Escolha entre Casual e Ranqueado)
      if (action === "init") {
        const mode = parts[2];
        if (interaction.user.id !== p1Id) return interaction.reply({ content: "Apenas quem usou o comando pode escolher!", ephemeral: true });

        if (mode === "ranked") {
          const status = BattleEngine.canStartBattle(p1Id);
          if (!status.can) return interaction.reply({ content: status.reason, ephemeral: true });

          playerRepository.addToQueue(p1Id);
          await interaction.update({ content: "✅ Você entrou na fila ranqueada! O bot procurará um oponente compatível...", embeds: [], components: [] });

          // Anúncio no canal específico
          const queueChannelId = "1487958808897781780";
          try {
            const qChannel = await interaction.client.channels.fetch(queueChannelId);
            if (qChannel) {
              const p1Data = playerRepository.getPlayer(p1Id);
              const queueEmbed = new EmbedBuilder()
                .setTitle("🏆 Nova Fila Ranqueada!")
                .setDescription(`<@${p1Id}> entrou na fila para uma partida ranqueada!`)
                .addFields({ name: "Rank Atual", value: `**${p1Data.rank}** (${p1Data.pa} PA)`, inline: true })
                .setColor("#FFD700")
                .setTimestamp();
              await qChannel.send({ embeds: [queueEmbed] });
            }
          } catch (e) { console.error("Erro ao enviar anúncio de fila:", e); }

          // Tentar Matchmaking
          const queue = playerRepository.getQueue();
          const p1Data = playerRepository.getPlayer(p1Id);
          
          for (const entry of queue) {
            if (entry.player_id === p1Id) continue;
            const p2Data = playerRepository.getPlayer(entry.player_id);
            
            if (RankManager.canFight(p1Data.rank, p2Data.rank)) {
              playerRepository.removeFromQueue(p1Id);
              playerRepository.removeFromQueue(p2Data.id);

              const guild = interaction.guild;
              const channel = await guild.channels.create({
                name: `ranked-${p1Data.id.slice(-4)}-vs-${p2Data.id.slice(-4)}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                  { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                  { id: p1Id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
                  { id: p2Data.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
                ]
              });

              const inst1 = playerRepository.getCharacterInstance(p1Data.equipped_instance_id);
              const inst2 = playerRepository.getCharacterInstance(p2Data.equipped_instance_id);
              const battle = BattleEngine.startBattle(p1Id, p2Data.id, inst1, inst2, false, null, true, channel.id);
              
              const embed = EmbedManager.createBattleEmbed(battle);
              const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);

              await channel.send({
                content: `⚔️ **PARTIDA RANQUEADA INICIADA!** ⚔️\n<@${p1Id}> vs <@${p2Data.id}>\n\nEste canal será apagado em 45 minutos ou ao fim da luta.`,
                embeds: [embed],
                components: components
              });

              return interaction.followUp({ content: `🎮 Partida ranqueada encontrada! Vá para o canal <#${channel.id}>`, ephemeral: true });
            }
          }
          return;
        }

        if (mode === "casual") {
          return interaction.update({ content: "🥊 Modo Casual selecionado! Agora use `!pvp @usuario` para desafiar alguém específico.", embeds: [], components: [] });
        }
      }

      // Lógica de Aceitar/Recusar (Para o desafiado)
      const p1IdChallenge = parts[parts.length - 2];
      const p2IdChallenge = parts[parts.length - 1];
      if (interaction.user.id !== p2IdChallenge) return interaction.reply({ content: "Você não é o desafiado!", ephemeral: true });

      if (action === "refuse") {
        return interaction.update({ content: `❌ <@${p2IdChallenge}> recusou o desafio de PVP de <@${p1IdChallenge}>.`, embeds: [], components: [] });
      }

      if (action === "accept") {
        const mode = parts[2];
        const statusP1 = BattleEngine.canStartBattle(p1IdChallenge);
        const statusP2 = BattleEngine.canStartBattle(p2IdChallenge);
        if (!statusP1.can || !statusP2.can) {
          const reason = !statusP1.can ? statusP1.reason.replace("Você já está", `<@${p1IdChallenge}> já está`) : statusP2.reason.replace("Você já está", `<@${p2IdChallenge}> já está`);
          return interaction.update({ content: reason, components: [] });
        }

        const p1 = playerRepository.getPlayer(p1IdChallenge);
        const p2 = playerRepository.getPlayer(p2IdChallenge);
        const inst1 = playerRepository.getCharacterInstance(p1.equipped_instance_id);
        const inst2 = playerRepository.getCharacterInstance(p2.equipped_instance_id);

        // Criar canal temporário para PVP Casual também (conforme pedido: "quando usa o boss rush ou o pvp ele deve criar um canal temporário")
        const guild = interaction.guild;
        const channel = await guild.channels.create({
          name: `pvp-${p1.id.slice(-4)}-vs-${p2.id.slice(-4)}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: p1IdChallenge, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
            { id: p2IdChallenge, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
          ]
        });

        const battle = BattleEngine.startBattle(p1IdChallenge, p2IdChallenge, inst1, inst2, false, null, false, channel.id);
        const embed = EmbedManager.createBattleEmbed(battle);
        const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);

        await channel.send({
          content: `⚔️ **BATALHA INICIADA!** ⚔️\n<@${p1IdChallenge}> vs <@${p2IdChallenge}>`,
          embeds: [embed],
          components: components
        });

        return interaction.update({ content: `✅ Batalha iniciada no canal <#${channel.id}>!`, components: [] });
      }
    }

    // 1.1 Lógica de Abandono de Combate
    if (interaction.isButton() && interaction.customId.includes("_abandon")) {
      const parts = interaction.customId.split("_");
      const battleId = parts[1];
      const battle = BattleEngine.getBattle(battleId);

      if (!battle) return interaction.reply({ content: "Combate não encontrado ou já encerrado.", ephemeral: true });
      
      // Verificar se o jogador faz parte da batalha
      const isP1 = battle.player1Id === interaction.user.id;
      const isP2 = battle.player2Id === interaction.user.id;
      const isParty = battle.partyMembers && battle.partyMembers.includes(interaction.user.id);
      const isTeam2 = battle.team2 && battle.team2.includes(interaction.user.id);

      if (!isP1 && !isP2 && !isParty && !isTeam2) {
        return interaction.reply({ content: "Você não faz parte deste combate!", ephemeral: true });
      }

      const result = BattleEngine.abandonBattle(battleId, interaction.user.id);
      
      if (result === "voted") {
        return interaction.reply({ content: `✅ Você votou para abandonar! (${battle.abandonVotes.size}/2)`, ephemeral: true });
      } else if (result) {
        const embed = EmbedManager.createBattleEmbed(result);
        
        // Deletar canal temporário se existir no abandono
        if (result.channelId) {
          setTimeout(async () => {
            try {
              const channel = await interaction.client.channels.fetch(result.channelId);
              if (channel) await channel.delete("Combate abandonado");
            } catch (e) { console.error("Erro ao deletar canal:", e); }
          }, 10000);
        }

        return interaction.update({ embeds: [embed], components: [] });
      } else {
        return interaction.reply({ content: "Erro ao tentar abandonar o combate.", ephemeral: true });
      }
    }

    // 1.2 Lógica de Boss Rush
    if (interaction.isButton() && interaction.customId.startsWith("bossrush_")) {
      const parts = interaction.customId.split("_");
      const action = parts[1];
      const bossId = parts[2];

      if (action === "refuse") {
        if (interaction.user.id !== bossId) {
          // Qualquer um do time pode recusar? Vamos assumir que sim ou apenas o boss pode cancelar o proprio desafio.
          // Mas se o desafiado recusar, cancela.
          return interaction.update({ content: `❌ O desafio de Boss Rush foi cancelado por <@${interaction.user.id}>.`, components: [] });
        }
        return interaction.update({ content: `❌ <@${bossId}> cancelou o desafio de Boss Rush.`, components: [] });
      }

      if (action === "accept") {
        const team2Ids = parts.slice(3);
        if (!team2Ids.includes(interaction.user.id)) {
          return interaction.reply({ content: "Você não faz parte do time desafiado!", ephemeral: true });
        }

        const allPlayers = [bossId, ...team2Ids];
        for (const pid of allPlayers) {
          const status = BattleEngine.canStartBattle(pid);
          if (!status.can) {
            const reason = status.reason.replace("Você já está", `<@${pid}> já está`).replace("Saia da fila", "Precisa sair da fila");
            return interaction.update({ content: reason, components: [] });
          }
        }

        // Criar canal temporário para Boss Rush
        const guild = interaction.guild;
        const channel = await guild.channels.create({
          name: `boss-rush-${bossId.slice(-4)}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: bossId, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
            ...team2Ids.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }))
          ]
        });

        const battle = BattleEngine.startBossRush(bossId, team2Ids, channel.id);
        const embed = EmbedManager.createBattleEmbed(battle);
        const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);

        await channel.send({
          content: `🔥 **BOSS RUSH INICIADO!** 🔥\nO Boss <@${bossId}> vs o Trio desafiante!\n\nEste canal será apagado ao fim da luta.`,
          embeds: [embed],
          components: components
        });

        return interaction.update({ content: `🔥 Boss Rush iniciado no canal <#${channel.id}>!`, components: [] });
      }
    }

    // 1.3 Lógica de Seleção de Alvo
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("target_")) {
      const battleId = interaction.customId.split("_")[1];
      const battle = BattleEngine.getBattle(battleId);
      if (!battle) return interaction.reply({ content: "Combate não encontrado.", ephemeral: true });
      if (interaction.user.id !== battle.player1Id) return interaction.reply({ content: "Apenas o Boss pode mudar o alvo!", ephemeral: true });

      const targetId = interaction.values[0];
      const targetChar = battle.partyCharacters.find(c => c.ownerId === targetId);
      
      if (targetChar) {
        battle.player2Id = targetId;
        battle.character2 = targetChar;
        const embed = EmbedManager.createBattleEmbed(battle);
        const components = ButtonManager.createActionComponents(battleId, battle.getCurrentPlayer(), false, battle);
        return interaction.update({ content: `🎯 Alvo alterado para **${targetChar.name}**!`, embeds: [embed], components: components });
      }
    }

    if (["menu", "recover", "reaction"].includes(type)) {
      const battleId = parts[1];
      const actionId = parts.slice(2).join("_");
      const battle = BattleEngine.getBattle(battleId);
      if (!battle) return interaction.reply({ content: `Batalha expirada.`, ephemeral: true });
      if (battle.state === "finished") return interaction.reply({ content: "A batalha terminou!", ephemeral: true });

      let updatedBattle = null;

      if (isMenu && type === "menu") {
        if (interaction.user.id !== battle.currentPlayerTurnId) return interaction.reply({ content: "Não é seu turno!", ephemeral: true });
        const selectedSkillId = interaction.values[0];
        updatedBattle = BattleEngine.processAction(battleId, interaction.user.id, selectedSkillId);
        if (!updatedBattle) return interaction.reply({ content: "Ação inválida.", ephemeral: true });
      }

      if (isButton && type === "recover") {
        if (interaction.user.id !== battle.currentPlayerTurnId) return interaction.reply({ content: "Não é seu turno!", ephemeral: true });
        updatedBattle = BattleEngine.processRecoverEnergy(battleId, interaction.user.id);
        if (!updatedBattle) return interaction.reply({ content: "Erro ao recuperar energia.", ephemeral: true });
      }

      if (isButton && type === "reaction") {
        if (interaction.user.id !== battle.getOpponentId()) return interaction.reply({ content: "Não é sua vez!", ephemeral: true });
        updatedBattle = BattleEngine.processReaction(battleId, interaction.user.id, actionId);
        if (!updatedBattle) return interaction.reply({ content: "Erro na reação.", ephemeral: true });
      }
      if (updatedBattle) {
        const embed = EmbedManager.createBattleEmbed(updatedBattle);
        let components = [];
        if (updatedBattle.state === "finished") {
          components = [];
          // Deletar canal temporário se existir
          if (updatedBattle.channelId) {
            setTimeout(async () => {
              try {
                const channel = await interaction.client.channels.fetch(updatedBattle.channelId);
                if (channel) await channel.delete("Combate finalizado");
              } catch (e) { console.error("Erro ao deletar canal:", e); }
            }, 10000); // Espera 10 segundos para os jogadores verem o resultado
          }
        } else if (updatedBattle.state === "choosing_reaction") {
          const isBossTurn = updatedBattle.isPve && updatedBattle.getOpponentId() === updatedBattle.player2Id;
          components = ButtonManager.createReactionButtons(battleId, updatedBattle.getOpponentPlayer(), isBossTurn);
        } else if (updatedBattle.state === "choosing_action") {
          const isBossTurn = updatedBattle.isPve && updatedBattle.currentPlayerTurnId === updatedBattle.player2Id;
          components = ButtonManager.createActionComponents(battleId, updatedBattle.getCurrentPlayer(), isBossTurn, updatedBattle);
        }
        await interaction.update({ embeds: [embed], components: components });

        // ✅ AUTOMAÇÃO PVE CENTRALIZADA: Reação e Turno do Boss
        if (updatedBattle.isPve && updatedBattle.player2Id.startsWith("boss_")) {
          // 1. Reação do Boss (sempre pula se estiver em fase de reação)
          if (updatedBattle.state === "choosing_reaction" && updatedBattle.getOpponentId() === updatedBattle.player2Id) {
            setTimeout(async () => {
              const reactionBattle = BattleEngine.processBossReaction(updatedBattle);
              if (reactionBattle) {
                const reactionEmbed = EmbedManager.createBattleEmbed(reactionBattle);
                
                // 2. Ataque do Boss após reagir
                if (reactionBattle.state === "choosing_action" && reactionBattle.currentPlayerTurnId === reactionBattle.player2Id) {
                  setTimeout(async () => {
                    const attackBattle = BattleEngine.processBossTurn(reactionBattle);
                    if (attackBattle) {
                      const attackEmbed = EmbedManager.createBattleEmbed(attackBattle);
                      const isBossReacting = attackBattle.isPve && attackBattle.getOpponentId() === attackBattle.player2Id;
                      const attackComponents = attackBattle.state === "finished" ? [] : (attackBattle.state === "choosing_reaction" ? ButtonManager.createReactionButtons(battleId, attackBattle.getOpponentPlayer(), isBossReacting) : ButtonManager.createActionComponents(battleId, attackBattle.getCurrentPlayer(), false, attackBattle));
                      await interaction.editReply({ embeds: [attackEmbed], components: attackComponents });
                    }
                  }, 1500);
                } else {
                  const isBossTurn = reactionBattle.isPve && reactionBattle.currentPlayerTurnId === reactionBattle.player2Id;
                  const reactionComponents = reactionBattle.state === "finished" ? [] : ButtonManager.createActionComponents(battleId, reactionBattle.getCurrentPlayer(), isBossTurn, reactionBattle);
                  await interaction.editReply({ embeds: [reactionEmbed], components: reactionComponents });
                }
              }
            }, 1500);
          } 
          // 3. Ataque Direto do Boss (ex: após player usar buff ou recuperar energia)
          else if (updatedBattle.state === "choosing_action" && updatedBattle.currentPlayerTurnId === updatedBattle.player2Id) {
            setTimeout(async () => {
              const attackBattle = BattleEngine.processBossTurn(updatedBattle);
              if (attackBattle) {
                const attackEmbed = EmbedManager.createBattleEmbed(attackBattle);
                const isBossReacting = attackBattle.isPve && attackBattle.getOpponentId() === attackBattle.player2Id;
                const attackComponents = attackBattle.state === "finished" ? [] : (attackBattle.state === "choosing_reaction" ? ButtonManager.createReactionButtons(battleId, attackBattle.getOpponentPlayer(), isBossReacting) : ButtonManager.createActionComponents(battleId, attackBattle.getCurrentPlayer(), false, attackBattle));
                await interaction.editReply({ embeds: [attackEmbed], components: attackComponents });
              }
            }, 1500);
          }
        }
      }
    }
  }
};
