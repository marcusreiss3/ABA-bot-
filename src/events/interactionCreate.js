const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const BattleEngine = require("../services/BattleEngine");
const EmbedManager = require("../services/EmbedManager");
const ButtonManager = require("../services/ButtonManager");
const playerRepository = require("../database/repositories/playerRepository");
const CharacterManager = require("../services/CharacterManager");
const ArtifactManager = require("../services/ArtifactManager");
const EvolutionManager = require("../services/EvolutionManager");
const storyConfig = require("../config/storyConfig.js");
const towerConfig = require("../config/towerConfig.js");
const RankManager = require("../services/RankManager");
const missionRepository = require("../database/repositories/missionRepository");
const missionsCommand = require("../commands/missions");
const fendaAncestralCommand = require("../commands/fenda-ancestral");
const nexusZenithCommand = require("../commands/nexus-zenith");
const lojaReliquiasCommand = require("../commands/loja-reliquias");
const charInfoCommand = require("../commands/char-info");
const limboCommand = require("../commands/limbo");
const protegerCommand = require("../commands/proteger");
const tutorialCommand = require("../commands/tutorial");
const ticketCommand = require("../commands/ticket");
const helpCommand = require("../commands/help");
const titleRepository = require("../database/repositories/titleRepository");
const { ChannelType, PermissionFlagsBits } = require("discord.js");

// --- Stall Recovery Helpers ---

async function sendStallEmbed(message, battleId, battle) {
  try {
    const leaderId = (battle.partyMembers && battle.partyMembers[0]) || battle.player1Id;
    const battleEmbed = EmbedManager.createBattleEmbed(battle);
    const stallEmbed = new EmbedBuilder()
      .setColor("#FF6600")
      .setTitle("⚠️ Combate Travado?")
      .setDescription(
        `O boss não está respondendo. Se o combate estiver parado, <@${leaderId}> pode forçar a retomada.\n` +
        `*Aguarde alguns segundos antes de usar o botão.*`
      );
    const fixRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fixcombat_${battleId}_${leaderId}`)
        .setLabel("🔧 Consertar Combate")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`${battleId}_abandon`)
        .setLabel("🏳️ Abandonar")
        .setStyle(ButtonStyle.Secondary)
    );
    await message.edit({ embeds: [battleEmbed, stallEmbed], components: [fixRow] });
  } catch (e) {
    console.error("[STALL_EMBED] Erro ao enviar embed de recuperação:", e);
  }
}

// Edits the battle message or falls back to sending a new one if the edit fails.
// Always updates battle.lastMessageId to point at the current visible message.
async function safeEditBattleMessage(client, battle, payload) {
  const channelId = battle.channelId;
  const msgId = battle.lastMessageId;

  if (channelId && msgId) {
    try {
      const ch = await client.channels.fetch(channelId).catch(() => null);
      if (ch) {
        const msg = await ch.messages.fetch(msgId).catch(() => null);
        if (msg) {
          await msg.edit(payload);
          return;
        }
      }
    } catch (_) {}
  }

  // Fallback: send a new message
  if (channelId) {
    try {
      const ch = await client.channels.fetch(channelId).catch(() => null);
      if (ch) {
        const newMsg = await ch.send(payload);
        battle.lastMessageId = newMsg.id;
      }
    } catch (e) {
      console.error("[SAFE_EDIT] Fallback send falhou:", e);
    }
  }
}

module.exports = {
  execute: async (interaction) => {
    // 0.0 Tutorial (must be before all other handlers)
    if (interaction.isButton() && interaction.customId.startsWith("tutorial_")) {
      return tutorialCommand.handleInteraction(interaction);
    }

    // Help menu
    if (
      (interaction.isButton() && interaction.customId.startsWith("help_")) ||
      (interaction.isStringSelectMenu() && interaction.customId.startsWith("help_select_"))
    ) {
      return helpCommand.handleInteraction(interaction);
    }

    // Ticket system
    if (
      (interaction.isStringSelectMenu() && interaction.customId === "ticket_select") ||
      (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_modal_")) ||
      (interaction.isButton() && interaction.customId.startsWith("ticket_"))
    ) {
      return ticketCommand.handleInteraction(interaction);
    }

    // 0.0 Fix Combat (stall recovery — must be first)
    if (interaction.isButton() && interaction.customId.startsWith("fixcombat_")) {
      const parts = interaction.customId.split("_");
      // format: fixcombat_<battleId>_<leaderId>
      const battleId = parts[1];
      const leaderId = parts[2];

      if (interaction.user.id !== leaderId) {
        return interaction.reply({ content: "❌ Apenas o líder da party pode consertar o combate!", ephemeral: true });
      }

      const battle = BattleEngine.getBattle(battleId);
      if (!battle || battle.state === "finished") {
        return interaction.reply({ content: "Este combate já foi encerrado.", ephemeral: true });
      }
      if (!battle.isPve) {
        return interaction.reply({ content: "Este botão só funciona em combates PVE.", ephemeral: true });
      }

      // Cooldown: 15s between fix attempts
      const now = Date.now();
      if (battle.lastFixAttempt && (now - battle.lastFixAttempt) < 15000) {
        const remainingSec = Math.ceil((15000 - (now - battle.lastFixAttempt)) / 1000);
        return interaction.reply({ content: `⏳ Aguarde **${remainingSec}s** antes de tentar novamente.`, ephemeral: true });
      }
      battle.lastFixAttempt = now;

      await interaction.deferUpdate();

      try {
        let resultBattle = null;

        if (battle.bossProcessing) {
          // Se bossProcessing está travado há mais de 10s, força reset
          const processingAge = battle.bossProcessingAt ? (Date.now() - battle.bossProcessingAt) : Infinity;
          if (processingAge < 10000) {
            await interaction.followUp({ content: "⏳ O boss já está reagindo, aguarde um momento...", ephemeral: true });
            return;
          }
          battle.bossProcessing = false; // Força reset após 10s travado
        }
        battle.bossProcessingAt = Date.now();
        if (battle.state === "choosing_reaction") {
          battle.bossProcessing = true;
          resultBattle = BattleEngine.processBossReaction(battle);
          battle.bossProcessing = false;
        } else if (battle.state === "choosing_action" && battle.currentPlayerTurnId === battle.player2Id) {
          battle.bossProcessing = true;
          resultBattle = BattleEngine.processBossTurn(battle);
          battle.bossProcessing = false;
        } else {
          // Not stuck on boss side — just refresh display
          resultBattle = battle;
        }

        if (!resultBattle) {
          await interaction.followUp({ content: "❌ Não foi possível recuperar o combate. Tente abandonar com o botão 🏳️.", ephemeral: true });
          return;
        }

        const embed = EmbedManager.createBattleEmbed(resultBattle);
        let components = [];
        if (resultBattle.state !== "finished") {
          if (resultBattle.state === "choosing_reaction") {
            const isBossReacting = resultBattle.getOpponentId() === resultBattle.player2Id;
            components = ButtonManager.createReactionButtons(battleId, resultBattle.getOpponentPlayer(), isBossReacting);
          } else {
            const isBossTurn = resultBattle.currentPlayerTurnId === resultBattle.player2Id;
            components = ButtonManager.createActionComponents(battleId, resultBattle.getCurrentPlayer(), isBossTurn, resultBattle);
          }
        }

        // Reset stall counter so the fix button can reappear if it bugs again
        resultBattle.stallNotifiedAt = 0;
        resultBattle.bossProcessing = false;

        resultBattle.lastMessageId = interaction.message.id;
        await interaction.editReply({ embeds: [embed], components });

        // If boss still needs to act, trigger automation
        if (resultBattle.isPve && resultBattle.state === "choosing_action" && resultBattle.currentPlayerTurnId === resultBattle.player2Id) {
          const fixBattleId = battleId;
          const fixClient = interaction.client;
          setTimeout(async () => {
            try {
              const freshFix = BattleEngine.getBattle(fixBattleId);
              if (!freshFix || freshFix.state !== "choosing_action" || freshFix.currentPlayerTurnId !== freshFix.player2Id || freshFix.bossProcessing) return;
              freshFix.bossProcessing = true;
              const attackBattle = BattleEngine.processBossTurn(freshFix);
              freshFix.bossProcessing = false;
              if (!attackBattle) return;
              const attackEmbed = EmbedManager.createBattleEmbed(attackBattle);
              const isBossReacting = attackBattle.isPve && attackBattle.getOpponentId() === attackBattle.player2Id;
              const attackComponents = attackBattle.state === "finished" ? [] :
                (attackBattle.state === "choosing_reaction"
                  ? ButtonManager.createReactionButtons(fixBattleId, attackBattle.getOpponentPlayer(), isBossReacting)
                  : ButtonManager.createActionComponents(fixBattleId, attackBattle.getCurrentPlayer(), false, attackBattle));
              await safeEditBattleMessage(fixClient, attackBattle, { embeds: [attackEmbed], components: attackComponents });
            } catch (e) {
              console.error("[FIX_COMBAT] Boss automation após fix:", e);
              const b = BattleEngine.getBattle(fixBattleId);
              if (b) b.bossProcessing = false;
            }
          }, 1500);
        }
      } catch (e) {
        console.error("[FIX_COMBAT] Erro:", e);
        try { await interaction.followUp({ content: "❌ Erro ao tentar consertar o combate.", ephemeral: true }); } catch (_) {}
      }
      return;
    }

    // 0.0 Fenda Ancestral (gacha)
    if (interaction.isButton() && interaction.customId.startsWith("fenda_")) {
      return fendaAncestralCommand.handleInteraction(interaction);
    }

    // 0.0d Loja de Relíquias
    if (interaction.isButton() && interaction.customId.startsWith("lojar_")) {
      return lojaReliquiasCommand.handleInteraction(interaction);
    }

    // 0.0e Char Info
    if ((interaction.isButton() || interaction.isStringSelectMenu()) && interaction.customId.startsWith("ci_")) {
      return charInfoCommand.handleInteraction(interaction);
    }

    // 0.0b Nexus Zenith (gacha de personagens)
    if ((interaction.isButton() || interaction.isStringSelectMenu()) && interaction.customId.startsWith("nexus_")) {
      return nexusZenithCommand.handleInteraction(interaction);
    }

    // 0.0c Limbo (botões e selects)
    if ((interaction.isStringSelectMenu() || interaction.isButton()) && interaction.customId.startsWith("limbo_")) {
      return limboCommand.handleInteraction(interaction);
    }

    // 0.0d Proteger personagem
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("proteger_toggle_")) {
      return protegerCommand.handleInteraction(interaction);
    }

    // 0.1 Lógica de Escolha Inicial de Equipamento (Botões)
    if (interaction.isButton() && interaction.customId.startsWith("equip_choice_")) {
      const [_, __, type, userId] = interaction.customId.split("_");
      if (interaction.user.id !== userId) return interaction.reply({ content: "Esta não é a sua sessão!", ephemeral: true });

      if (type === "char") {
        const player = playerRepository.getPlayer(userId);
        const instances = playerRepository.getPlayerCharacters(userId);

        if (instances.length === 0) {
          return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você não possui nenhum personagem para equipar!", false)], components: [] });
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
          .setTitle("🥋 Escolha seu Combatente")
          .setDescription(
            `> *\"Um guerreiro sem propósito é apenas um homem com uma espada.\"*\n\n` +
            `Selecione o personagem que irá representá-lo nas batalhas.`
          )
          .setColor("#16213e")
          .addFields({ name: "⚔️ Em Campo Agora", value: `\`${equippedName}\``, inline: false })
          .setFooter({ text: "Anime Battle Arena • Selecione seu combatente" });

        return interaction.update({ embeds: [embed], components: [row] });
      }

      if (type === "team") {
        const chars = playerRepository.getPlayerCharacters(userId);
        if (chars.length < 3) {
          return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você precisa de ao menos 3 personagens para montar um time 3v3!", false)], components: [] });
        }

        const savedTeam = BattleEngine.getRankedTeam(userId);
        let savedInfo = "Nenhum time salvo.";
        if (savedTeam && savedTeam.length === 3) {
          savedInfo = savedTeam.map((instId, i) => {
            const inst = playerRepository.getCharacterInstance(instId);
            const c = CharacterManager.getCharacter(inst.character_id, inst);
            return `${i + 1}. **${c.name}** [Lv${inst.level}]`;
          }).join("\n");
        }

        const options = chars.slice(0, 25).map(inst => {
          const charDef = CharacterManager.getCharacter(inst.character_id, inst);
          return { label: `${charDef.name} [Lv${inst.level}]`, value: String(inst.id), description: `Raridade: ${charDef.rarity}` };
        });

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`equip_team_select_${userId}`)
          .setPlaceholder("Selecione 3 personagens (1º entra em campo primeiro)")
          .setMinValues(3).setMaxValues(3)
          .addOptions(options);

        const embed = new EmbedBuilder()
          .setTitle("👥 Montar Time 3v3")
          .setDescription(
            `Selecione **3 personagens** para compor seu time.\nO primeiro da lista entra em campo no início da batalha.\n\nUsado no **PVP Ranqueado** e no **Modo História a partir do mundo JJK**.\n\n─────────────────────────\n**Time atual:**\n${savedInfo}`
          )
          .setColor("#1a1a2e")
          .setFooter({ text: "O time fica salvo até você alterá-lo." });

        return interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
      }

      if (type === "artifact") {
        const ownedChars = playerRepository.getPlayerCharacters(userId);
        const artifacts = playerRepository.getPlayerArtifacts(userId);

        if (!ownedChars || ownedChars.length === 0) {
          return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você não possui nenhum personagem para equipar artefatos.", false)], components: [] });
        }
        if (!artifacts || artifacts.length === 0) {
          return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você não possui nenhum artefato no seu inventário.", false)], components: [] });
        }

        const embed = new EmbedBuilder()
          .setTitle("🛡️ Forja de Relíquias")
          .setDescription(
            `> *\"As relíquias não fazem o guerreiro — mas amplificam o que ele já é.\"*\n\n` +
            `Escolha em qual combatente deseja encaixar ou remover uma relíquia.`
          )
          .setColor("#0f3460")
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: "Anime Battle Arena • Forja de Relíquias" });

        const characterOptions = ownedChars.map(charInstance => {
          const charData = CharacterManager.getCharacter(charInstance.character_id, charInstance);
          const slotsUsed = [charInstance.equipped_artifact_1, charInstance.equipped_artifact_2, charInstance.equipped_artifact_3].filter(Boolean).length;
          return {
            label: `${charData.name} (Lv ${charInstance.level})`,
            description: `Relíquias: ${slotsUsed}/3 • ID #${charInstance.id}`,
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

      if (type === "title") {
        const claimedTitles = Object.keys(titleRepository.TITLES).filter(tid => titleRepository.isClaimed(userId, tid));

        if (claimedTitles.length === 0) {
          return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você ainda não desbloqueou nenhum título. Use `!titulos` para ver seu progresso.", false)], components: [] });
        }

        const player = playerRepository.getPlayer(userId);
        const options = claimedTitles.map(tid => {
          const t = titleRepository.TITLES[tid];
          const isEquipped = player.equipped_title === tid;
          return { label: `${t.emoji} ${t.name}`, value: tid, description: isEquipped ? "✅ Equipado atualmente" : "Clique para equipar" };
        });

        const currentTitle = player.equipped_title ? titleRepository.TITLES[player.equipped_title] : null;
        const embed = new EmbedBuilder()
          .setTitle("🎖️ Salão dos Títulos")
          .setDescription(
            `> *\"Um título não é dado — é conquistado com sangue e determinação.\"*\n\n` +
            `Escolha a insígnia que carregará em batalha.`
          )
          .setColor("#b8860b")
          .addFields({ name: "Insígnia Atual", value: currentTitle ? `${currentTitle.emoji} **${currentTitle.name}**` : "*Sem título equipado*", inline: false })
          .setFooter({ text: "Anime Battle Arena • Salão dos Títulos" });

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder().setCustomId(`equip_title_select_${userId}`).setPlaceholder("Selecione um título...").addOptions(options)
        );

        return interaction.update({ embeds: [embed], components: [row] });
      }
    }

    // 0. Equipar título selecionado
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("equip_title_select_")) {
      const userId = interaction.customId.split("_")[3];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Esta não é a sua sessão!", ephemeral: true });

      const newTitleId = interaction.values[0];
      const player = playerRepository.getPlayer(userId);
      const oldTitleId = player.equipped_title;
      const title = titleRepository.TITLES[newTitleId];

      if (oldTitleId && oldTitleId !== newTitleId) {
        const oldTitle = titleRepository.TITLES[oldTitleId];
        if (oldTitle?.roleId) {
          const member = interaction.guild?.members.cache.get(userId) || await interaction.guild?.members.fetch(userId).catch(() => null);
          if (member) await member.roles.remove(oldTitle.roleId).catch(() => {});
        }
      }

      if (title?.roleId) {
        const member = interaction.guild?.members.cache.get(userId) || await interaction.guild?.members.fetch(userId).catch(() => null);
        if (member) await member.roles.add(title.roleId).catch(() => {});
      }

      playerRepository.updatePlayer(userId, { equipped_title: newTitleId });

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle("🎖️ Insígnia Equipada!")
          .setDescription(`${title.emoji} **${title.name}**\n\n*Sua conquista agora é exibida para todos verem. Use \`!profile\` para conferir.*`)
          .setColor("#b8860b")
          .setFooter({ text: "Anime Battle Arena • Salão dos Títulos" })
        ],
        components: []
      });
    }

    // 0. Paginação de títulos
    if (interaction.isButton() && interaction.customId.startsWith("titulos_page_")) {
      const parts = interaction.customId.split("_"); // titulos_page_<page>_<userId>
      const userId = parts[parts.length - 1];
      const page = parseInt(parts[2]);
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu painel de títulos!", ephemeral: true });
      const titulosCommand = require("../commands/titulos");
      return interaction.update(titulosCommand.buildPage(userId, page));
    }

    // 0. Resgatar título (!titulos button)
    if (interaction.isButton() && interaction.customId.startsWith("claim_title_")) {
      const parts = interaction.customId.split("_"); // claim_title_<titleId>_<userId>
      const userId = parts[parts.length - 1];
      const titleId = parts.slice(2, parts.length - 1).join("_");

      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu painel de títulos!", ephemeral: true });

      const title = titleRepository.TITLES[titleId];
      if (!title) return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("Título inválido.", false)], ephemeral: true });

      if (titleRepository.isClaimed(userId, titleId)) {
        return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("Você já resgatou este título!", false)], ephemeral: true });
      }

      const progress = titleRepository.getProgress(userId, titleId);
      if (progress < title.goal) {
        return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("Você ainda não completou este título!", false)], ephemeral: true });
      }

      titleRepository.claimTitle(userId, titleId);
      playerRepository.updatePlayer(userId, { zenith_fragments: (playerRepository.getPlayer(userId).zenith_fragments || 0) + title.zenith });

      // Refresh the page to remove the claim button and show claimed status
      const titulosCommand = require("../commands/titulos");
      const TITLE_IDS = Object.keys(titleRepository.TITLES);
      const page = TITLE_IDS.indexOf(titleId);
      const pageData = titulosCommand.buildPage(userId, page);
      await interaction.update(pageData);

      return interaction.followUp({
        embeds: [new EmbedBuilder()
          .setColor("#FFD700")
          .setTitle("🎖️ Título Desbloqueado!")
          .setDescription(`Parabéns! Você desbloqueou o título **${title.emoji} ${title.name}**!\n+**${title.zenith} Fragmentos Zenith** adicionados.\n\nUse \`!equip\` → **Equipar Título** para exibi-lo no perfil.`)
        ],
        ephemeral: true
      });
    }

    // 0. Lógica de Equipar Personagem (Menu)
    if (interaction.isStringSelectMenu() && interaction.customId === "equip_select") {
      const userId = interaction.user.id;
      const instanceId = parseInt(interaction.values[0]);
      playerRepository.updatePlayer(userId, { equipped_instance_id: instanceId });
      const instance = playerRepository.getCharacterInstance(instanceId);
      const charData = CharacterManager.getCharacter(instance.character_id, instance);
      await interaction.update({
        embeds: [EmbedManager.createStatusEmbed(`Você equipou **${charData.name} [Lvl ${instance.level}]** com sucesso!`, true)],
        components: []
      });
      // Tutorial hook: advance to battle_intro if in tutorial channel
      const tutorialUserId = tutorialCommand.getTutorialUserByChannel(interaction.channel.id);
      if (tutorialUserId && tutorialUserId === userId) {
        tutorialCommand.onEquipComplete(userId, interaction.client, interaction.channel.id);
      }
      return;
    }

    // 0.1 Lógica de Botões do Inventário
    if (interaction.isButton() && interaction.customId.startsWith("inv_unlock_")) {
      const parts = interaction.customId.split("_"); // inv_unlock_char_userId or inv_unlock_artifact_userId
      const slotType = parts[2]; // "char" or "artifact"
      const userId = parts[3];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const result = playerRepository.unlockSlots(userId, slotType);
      if (!result.can) {
        return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(result.reason, false)], ephemeral: true });
      }

      const typeLabel = slotType === "char" ? "personagens" : slotType === "fragment" ? "fragmentos" : "artefatos";
      await interaction.reply({ embeds: [EmbedManager.createStatusEmbed(`✅ Desbloqueado! Agora você tem **${result.newSlots} slots de ${typeLabel}**! (-${playerRepository.SLOT_COST} Fragmentos Zenith)`, true)], ephemeral: true });

      // Atualizar embed do inventário
      const viewType = slotType === "char" ? "chars" : slotType === "fragment" ? "fragments" : "items";
      const player = playerRepository.getPlayer(userId);
      player.ownedChars = playerRepository.getPlayerCharacters(userId);
      player.items = playerRepository.getPlayerItems(userId);
      player.artifacts = playerRepository.getPlayerArtifacts(userId);
      const invResult = EmbedManager.createInventoryEmbed(player, interaction.user, viewType);
      return interaction.message.edit(invResult);
    }

    if (interaction.isButton() && interaction.customId.startsWith("inv_") && !interaction.customId.startsWith("inv_discard_") && !interaction.customId.startsWith("inv_unlock_") && !interaction.customId.startsWith("inv_bulk_")) {
      const parts = interaction.customId.split("_"); // inv_chars_userId or inv_items_userId
      const type = parts[1];
      const userId = parts[2];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });
      const player = playerRepository.getPlayer(userId);
      player.ownedChars = playerRepository.getPlayerCharacters(userId);
      player.items = playerRepository.getPlayerItems(userId);
      player.artifacts = playerRepository.getPlayerArtifacts(userId);
      const result = EmbedManager.createInventoryEmbed(player, interaction.user, type);
      return interaction.update(result);
    }

    // 0.15 Forjar relíquia via fragmentos
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("inv_craft_select_")) {
      const userId = interaction.customId.split("inv_craft_select_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const FragmentMap = require("../config/fragmentMap");
      const itemId = interaction.values[0];
      const fragData = FragmentMap[itemId];
      if (!fragData) return interaction.reply({ content: "❌ Fragmento inválido.", ephemeral: true });

      const items = playerRepository.getPlayerItems(userId);
      const qty = items.find(i => i.item_id === itemId)?.quantity || 0;
      if (qty < 100) return interaction.reply({ content: "❌ Você não tem fragmentos suficientes (precisa de 100).", ephemeral: true });

      playerRepository.removeItem(userId, itemId, 100);
      playerRepository.addArtifact(userId, fragData.artifactId);

      const player = playerRepository.getPlayer(userId);
      player.ownedChars = playerRepository.getPlayerCharacters(userId);
      player.items = playerRepository.getPlayerItems(userId);
      player.artifacts = playerRepository.getPlayerArtifacts(userId);

      await interaction.reply({
        embeds: [EmbedManager.createStatusEmbed(`✅ Relíquia **${fragData.name}** forjada com sucesso! ${fragData.emoji}`, true)],
        ephemeral: true,
      });
      const invResult = EmbedManager.createInventoryEmbed(player, interaction.user, "fragments");
      return interaction.message.edit(invResult);
    }

    // 0.16 Descarte de fragmentos — passo 1: botão abre select de qual fragmento
    if (interaction.isButton() && interaction.customId.startsWith("inv_discard_frag_")) {
      const userId = interaction.customId.split("inv_discard_frag_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const FragmentMap = require("../config/fragmentMap");
      const items = playerRepository.getPlayerItems(userId);
      const opts = Object.entries(FragmentMap)
        .map(([itemId, data]) => ({ itemId, qty: items.find(i => i.item_id === itemId)?.quantity || 0, ...data }))
        .filter(f => f.qty > 0)
        .sort((a, b) => b.qty - a.qty)
        .map(f => ({ label: `${f.name} (${f.qty} fragmentos)`, value: f.itemId }));

      if (opts.length === 0) return interaction.update({
        embeds: [EmbedManager.createStatusEmbed("Você não possui fragmentos para descartar.", false)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`inv_fragments_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary)
        )],
      });

      return interaction.update({
        embeds: [EmbedManager.createStatusEmbed("Selecione qual fragmento deseja descartar:", true)],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`inv_discard_qty_${userId}`)
              .setPlaceholder("Selecione o fragmento...")
              .addOptions(opts),
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`inv_fragments_${userId}`).setLabel("← Cancelar").setStyle(ButtonStyle.Secondary)
          ),
        ],
      });
    }

    // 0.17 Descarte de fragmentos — passo 2: selecionou o fragmento, escolher quantidade
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("inv_discard_qty_")) {
      const userId = interaction.customId.split("inv_discard_qty_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const FragmentMap = require("../config/fragmentMap");
      const itemId = interaction.values[0];
      const fragData = FragmentMap[itemId];
      if (!fragData) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("❌ Fragmento inválido.", false)], components: [] });

      const items = playerRepository.getPlayerItems(userId);
      const qty = items.find(i => i.item_id === itemId)?.quantity || 0;
      if (qty === 0) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você não possui esse fragmento.", false)], components: [] });

      const half    = Math.floor(qty / 2);
      const quarter = Math.floor(qty / 4);
      const qtyOpts = [{ label: `Descartar tudo (${qty})`, value: `${itemId}:${qty}` }];
      if (half > 0 && half !== qty)        qtyOpts.push({ label: `Descartar metade (${half})`,   value: `${itemId}:${half}` });
      if (quarter > 0 && quarter !== half) qtyOpts.push({ label: `Descartar 25% (${quarter})`,   value: `${itemId}:${quarter}` });

      return interaction.update({
        embeds: [EmbedManager.createStatusEmbed(`**${fragData.name}** — Você tem **${qty}** fragmentos. Quantos deseja descartar?`, true)],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`inv_discard_confirm_${userId}`)
              .setPlaceholder("Escolha a quantidade...")
              .addOptions(qtyOpts),
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`inv_discard_frag_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary)
          ),
        ],
      });
    }

    // 0.18 Descarte de fragmentos — passo 3: execução
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("inv_discard_confirm_")) {
      const userId = interaction.customId.split("inv_discard_confirm_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const FragmentMap = require("../config/fragmentMap");
      const [itemId, qtyStr] = interaction.values[0].split(":");
      const qty = parseInt(qtyStr);
      const fragData = FragmentMap[itemId];
      if (!fragData || isNaN(qty) || qty <= 0) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("❌ Dados inválidos.", false)], components: [] });

      const removed = playerRepository.removeItem(userId, itemId, qty);
      if (!removed) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("❌ Você não possui fragmentos suficientes.", false)], components: [] });

      const player = playerRepository.getPlayer(userId);
      player.ownedChars = playerRepository.getPlayerCharacters(userId);
      player.items = playerRepository.getPlayerItems(userId);
      player.artifacts = playerRepository.getPlayerArtifacts(userId);

      const invResult = EmbedManager.createInventoryEmbed(player, interaction.user, "fragments");
      // Injeta mensagem de sucesso no topo da descrição
      const embed = invResult.embeds[0];
      const currentDesc = embed.data?.description || "";
      embed.setDescription(`> ✅ **${qty}x ${fragData.name}** descartado.\n\n` + currentDesc);

      return interaction.update(invResult);
    }

    // ── Helpers reutilizados nos handlers de descarte em massa ───────────────
    function applyBulkFilter(chars, equippedId, type) {
      // Nunca inclui o equipado nem os protegidos
      const sellable = chars.filter(i => i.id !== equippedId && !i.protected);
      if (type === "all")      return sellable;
      if (type === "ec_all")   return sellable.filter(i => CharacterManager.getCharacter(i.character_id, i).rarity === "EC");
      if (type === "al_all")   return sellable.filter(i => CharacterManager.getCharacter(i.character_id, i).rarity === "AL");
      if (type === "lvl1")     return sellable.filter(i => i.level <= 1);
      if (type === "lvl2")     return sellable.filter(i => i.level <= 2);
      if (type === "lvl5")     return sellable.filter(i => i.level <= 5);
      if (type === "ec_lvl5")  return sellable.filter(i => i.level <= 5  && CharacterManager.getCharacter(i.character_id, i).rarity === "EC");
      if (type === "ec_lvl10") return sellable.filter(i => i.level <= 10 && CharacterManager.getCharacter(i.character_id, i).rarity === "EC");
      if (type === "dupes") {
        const seen = {}, toSell = [];
        for (const i of sellable) {
          const c = CharacterManager.getCharacter(i.character_id, i);
          if (c.rarity !== "EC") continue;
          if (seen[i.character_id]) toSell.push(i); else seen[i.character_id] = true;
        }
        return toSell;
      }
      return [];
    }
    const BULK_FILTER_NAMES = {
      all: "Todos (exceto protegidos)", ec_all: "Todos EC", al_all: "Todos AL",
      lvl1: "Nível 1", lvl2: "Nível ≤ 2", lvl5: "Nível ≤ 5",
      ec_lvl5: "EC Nível ≤ 5", ec_lvl10: "EC Nível ≤ 10", dupes: "Duplicatas EC",
    };
    const RARITY_ICON_MAP = { EM: "👁️", AL: "🌟", EC: "◆" };

    // 0.18b Descarte em Massa — passo 1: select de filtro
    if (interaction.isButton() && interaction.customId.startsWith("inv_bulk_sell_") && !interaction.customId.startsWith("inv_bulk_sell_confirm_")) {
      const userId = interaction.customId.split("inv_bulk_sell_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const FILTERS = [
        { value: "all",      label: "⚠️ Todos (exceto protegidos)", description: "Remove tudo exceto equipado e 🔒 protegidos" },
        { value: "ec_all",   label: "Todos Eco Comum (EC)",          description: "Remove todos EC (exceto protegidos)" },
        { value: "al_all",   label: "Todos Aura Lendária (AL)",      description: "Remove todos AL (exceto protegidos)" },
        { value: "lvl1",     label: "Todos Nível 1",                 description: "Remove nível 1 (exceto protegidos)" },
        { value: "lvl2",     label: "Todos Nível ≤ 2",               description: "Remove nível 1-2 (exceto protegidos)" },
        { value: "lvl5",     label: "Todos Nível ≤ 5",               description: "Remove até nível 5 (exceto protegidos)" },
        { value: "ec_lvl5",  label: "EC com Nível ≤ 5",              description: "Remove EC até nível 5 (exceto protegidos)" },
        { value: "ec_lvl10", label: "EC com Nível ≤ 10",             description: "Remove EC até nível 10 (exceto protegidos)" },
        { value: "dupes",    label: "Duplicatas EC (manter 1)",      description: "Mantém 1 de cada EC, remove o restante" },
      ];

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle("🗑️ Descarte em Massa")
          .setDescription("Selecione o filtro abaixo. O personagem **equipado** nunca é removido.")
          .setColor("#e74c3c")],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`inv_bulk_sell_filter_${userId}`)
              .setPlaceholder("Escolha o filtro...")
              .addOptions(FILTERS),
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`inv_discard_char_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }

    // 0.18c Descarte em Massa — passo 2: preview + confirmar
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("inv_bulk_sell_filter_")) {
      const userId = interaction.customId.split("inv_bulk_sell_filter_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const filterType = interaction.values[0];
      const player     = playerRepository.getPlayer(userId);
      const allChars   = playerRepository.getPlayerCharacters(userId);
      const toRemove   = applyBulkFilter(allChars, player.equipped_instance_id, filterType);

      if (toRemove.length === 0) {
        return interaction.update({
          embeds: [new EmbedBuilder()
            .setTitle("🗑️ Descarte em Massa — Sem Resultados")
            .setDescription(`Nenhum personagem encontrado para **${BULK_FILTER_NAMES[filterType]}**.`)
            .setColor("#e74c3c")],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`inv_bulk_sell_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
          )],
        });
      }

      const previewLines = toRemove.slice(0, 15).map(i => {
        const c = CharacterManager.getCharacter(i.character_id, i);
        return `${RARITY_ICON_MAP[c.rarity] || "◆"} **${c.name}** Lv.${i.level}`;
      });
      if (toRemove.length > 15) previewLines.push(`*...e mais ${toRemove.length - 15} personagens*`);

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle(`🗑️ Confirmar Descarte — ${BULK_FILTER_NAMES[filterType]}`)
          .setDescription(
            `**${toRemove.length} personagem(ns)** serão removidos permanentemente.\n\n` +
            previewLines.join("\n")
          )
          .setColor("#e74c3c")
          .setFooter({ text: "Esta ação é permanente e irrecuperável." })],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_bulk_sell_confirm_${userId}_${filterType}`)
            .setLabel(`Confirmar — Descartar ${toRemove.length}`)
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`inv_bulk_sell_${userId}`)
            .setLabel("← Voltar")
            .setStyle(ButtonStyle.Secondary),
        )],
      });
    }

    // 0.18d Descarte em Massa — passo 3: execução
    if (interaction.isButton() && interaction.customId.startsWith("inv_bulk_sell_confirm_")) {
      const rest           = interaction.customId.split("inv_bulk_sell_confirm_")[1];
      const underscoreIdx  = rest.indexOf("_");
      const userId         = rest.slice(0, underscoreIdx);
      const filterType     = rest.slice(underscoreIdx + 1);
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const player   = playerRepository.getPlayer(userId);
      const allChars = playerRepository.getPlayerCharacters(userId);
      const toRemove = applyBulkFilter(allChars, player.equipped_instance_id, filterType);

      const XP_PER_RARITY = { EC: 3, AL: 15, EM: 50 };
      let totalXpBulk = 0;
      for (const inst of toRemove) {
        const cDef = CharacterManager.getCharacter(inst.character_id, inst);
        totalXpBulk += XP_PER_RARITY[cDef?.rarity] || 3;
        playerRepository.removeCharacterInstance(inst.id);
      }
      if (totalXpBulk > 0) playerRepository.addPlayerXP(userId, totalXpBulk);

      const playerUpdated = playerRepository.getPlayer(userId);
      playerUpdated.ownedChars = playerRepository.getPlayerCharacters(userId);
      playerUpdated.items      = playerRepository.getPlayerItems(userId);
      playerUpdated.artifacts  = playerRepository.getPlayerArtifacts(userId);

      const invResult = EmbedManager.createInventoryEmbed(playerUpdated, interaction.user, "chars");
      const embed = invResult.embeds[0];
      const currentDesc = embed.data?.description || "";
      embed.setDescription(`> 🗑️ **${toRemove.length} personagem(ns)** descartado(s)! **(+${totalXpBulk} XP)**\n\n` + currentDesc);

      return interaction.update(invResult);
    }

    // 0.19 Descartar — menu de opções (um por vez ou venda em massa)
    if (interaction.isButton() && interaction.customId.startsWith("inv_discard_char_") && !interaction.customId.startsWith("inv_discard_char_confirm_") && !interaction.customId.startsWith("inv_discard_char_select_") && !interaction.customId.startsWith("inv_discard_single_")) {
      const userId = interaction.customId.split("inv_discard_char_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle("🗑️ Descartar Personagens")
        .setDescription(
          "Como deseja descartar?\n\n" +
          "**Um por vez** — Escolhe e confirma um personagem específico.\n" +
          "**Em Massa** — Remove vários de uma vez usando filtros."
        )
        .setColor("#e74c3c");

      return interaction.update({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`inv_discard_single_${userId}`).setLabel("🗑️ Um por vez").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`inv_bulk_sell_${userId}`).setLabel("🗑️ Em Massa").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`inv_chars_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
        )],
      });
    }

    // 0.19b Descarte individual — passo 1: select de personagem
    if (interaction.isButton() && interaction.customId.startsWith("inv_discard_single_")) {
      const userId = interaction.customId.split("inv_discard_single_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const instances   = playerRepository.getPlayerCharacters(userId);
      const player      = playerRepository.getPlayer(userId);
      const discardable = instances.filter(i => i.id !== player.equipped_instance_id);

      if (discardable.length === 0) {
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você não possui personagens para descartar (o equipado não pode ser descartado).", false)], components: [] });
      }

      const opts = discardable.slice(0, 25).map(i => {
        const c = CharacterManager.getCharacter(i.character_id, i);
        return {
          label: `${c.name} [Lvl ${i.level}]`,
          description: `Raridade: ${c.rarity} · ID: ${i.id}`,
          value: i.id.toString(),
        };
      });

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle("🗑️ Descartar — Um por vez")
          .setDescription("Selecione qual personagem deseja descartar.\n⚠️ **Esta ação é permanente e irrecuperável.**")
          .setColor("#e74c3c")],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`inv_discard_char_select_${userId}`)
              .setPlaceholder("Escolha o personagem...")
              .addOptions(opts),
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`inv_discard_char_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }

    // 0.20 Descarte de personagem — passo 2: confirmar
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("inv_discard_char_select_")) {
      const userId = interaction.customId.split("inv_discard_char_select_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const instanceId = parseInt(interaction.values[0]);
      const instance   = playerRepository.getCharacterInstance(instanceId);
      if (!instance) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Personagem não encontrado.", false)], components: [] });

      const c = CharacterManager.getCharacter(instance.character_id, instance);
      const rarityIcon = { EM: "👁️", AL: "🌟", EC: "◆" }[c.rarity] || "◆";

      const embed = new EmbedBuilder()
        .setTitle("⚠️ Confirmar Descarte")
        .setDescription(`Você tem certeza que deseja descartar **${rarityIcon} ${c.name}** (Nível ${instance.level})?\n\n> ❌ Este personagem será **permanentemente removido**.\n> Ele não pode ser recuperado após o descarte.`)
        .setColor("#e74c3c")
        .setThumbnail(c.imageUrl || null);

      return interaction.update({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`inv_discard_char_confirm_${userId}_${instanceId}`)
              .setLabel(`Confirmar — Descartar ${c.name}`)
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`inv_discard_single_${userId}`)
              .setLabel("← Voltar")
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }

    // 0.21 Descarte de personagem — passo 3: execução
    if (interaction.isButton() && interaction.customId.startsWith("inv_discard_char_confirm_")) {
      const rest = interaction.customId.split("inv_discard_char_confirm_")[1];
      const [userId, instanceIdStr] = rest.split("_");
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const instanceId = parseInt(instanceIdStr);
      const instance   = playerRepository.getCharacterInstance(instanceId);
      const player     = playerRepository.getPlayer(userId);

      if (!instance || instance.player_id !== userId) {
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Personagem não encontrado.", false)], components: [] });
      }
      if (player.equipped_instance_id === instanceId) {
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Não é possível descartar o personagem atualmente equipado.", false)], components: [] });
      }

      const c = CharacterManager.getCharacter(instance.character_id, instance);
      playerRepository.removeCharacterInstance(instanceId);

      const XP_BY_RARITY = { EC: 3, AL: 15, EM: 50 };
      const xpGain = XP_BY_RARITY[c.rarity] || 3;
      playerRepository.addPlayerXP(userId, xpGain);

      // Recarrega aba de personagens com mensagem de sucesso
      const playerUpdated = playerRepository.getPlayer(userId);
      playerUpdated.ownedChars = playerRepository.getPlayerCharacters(userId);
      playerUpdated.items      = playerRepository.getPlayerItems(userId);
      playerUpdated.artifacts  = playerRepository.getPlayerArtifacts(userId);

      const invResult = EmbedManager.createInventoryEmbed(playerUpdated, interaction.user, "chars");
      const embed = invResult.embeds[0];
      const currentDesc = embed.data?.description || "";
      embed.setDescription(`> 🗑️ **${c.name}** foi descartado. **(+${xpGain} XP)**\n\n` + currentDesc);

      return interaction.update(invResult);
    }

    // ── Helpers de descarte de artefatos ─────────────────────────────────────
    function getEquippedArtifactIds(ownedChars) {
      return (ownedChars || []).reduce((acc, c) => {
        if (c.equipped_artifact_1) acc.push(c.equipped_artifact_1);
        if (c.equipped_artifact_2) acc.push(c.equipped_artifact_2);
        if (c.equipped_artifact_3) acc.push(c.equipped_artifact_3);
        return acc;
      }, []);
    }

    // 0.22 Descartar artefato — menu de opções
    if (interaction.isButton() && interaction.customId.startsWith("inv_discard_art_")
        && !interaction.customId.startsWith("inv_discard_art_single_")
        && !interaction.customId.startsWith("inv_discard_art_select_")
        && !interaction.customId.startsWith("inv_discard_art_confirm_")
        && !interaction.customId.startsWith("inv_discard_art_dupes_")) {
      const userId = interaction.customId.split("inv_discard_art_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle("🗑️ Descartar Artefatos")
          .setDescription(
            "Como deseja descartar?\n\n" +
            "**Um por vez** — Escolhe e confirma um artefato específico.\n" +
            "**Repetidos** — Remove duplicatas mantendo um exemplar de cada tipo."
          )
          .setColor("#e74c3c")],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`inv_discard_art_single_${userId}`).setLabel("🗑️ Um por vez").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`inv_discard_art_dupes_${userId}`).setLabel("🗑️ Repetidos").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`inv_items_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
        )],
      });
    }

    // 0.22b Descartar artefato individual — passo 1: select
    if (interaction.isButton() && interaction.customId.startsWith("inv_discard_art_single_")) {
      const userId = interaction.customId.split("inv_discard_art_single_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const allArtifacts  = playerRepository.getPlayerArtifacts(userId);
      const ownedChars    = playerRepository.getPlayerCharacters(userId);
      const equippedIds   = getEquippedArtifactIds(ownedChars);
      const discardable   = allArtifacts.filter(a => !equippedIds.includes(a.id));

      if (discardable.length === 0) {
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você não possui artefatos para descartar (os equipados não podem ser removidos).", false)], components: [] });
      }

      const opts = discardable.slice(0, 25).map(a => {
        const d = ArtifactManager.getArtifact(a.artifact_id, a);
        return { label: d.name, description: `ID: ${a.id}`, value: a.id.toString() };
      });

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle("🗑️ Descartar Artefato — Um por vez")
          .setDescription("Selecione qual artefato deseja descartar.\n⚠️ **Esta ação é permanente e irrecuperável.**")
          .setColor("#e74c3c")],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`inv_discard_art_select_${userId}`)
              .setPlaceholder("Escolha o artefato...")
              .addOptions(opts),
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`inv_discard_art_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }

    // 0.22c Descartar artefato individual — passo 2: confirmar
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("inv_discard_art_select_")) {
      const userId     = interaction.customId.split("inv_discard_art_select_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const instanceId = parseInt(interaction.values[0]);
      const artifact   = playerRepository.getArtifactInstance(instanceId);
      if (!artifact) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Artefato não encontrado.", false)], components: [] });

      const d = ArtifactManager.getArtifact(artifact.artifact_id, artifact);

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle("⚠️ Confirmar Descarte")
          .setDescription(`Você tem certeza que deseja descartar **${d.name}**?\n\n> ❌ Este artefato será **permanentemente removido**.\n> Ele não pode ser recuperado após o descarte.`)
          .setColor("#e74c3c")],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_discard_art_confirm_${userId}_${instanceId}`)
            .setLabel(`Confirmar — Descartar ${d.name}`)
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`inv_discard_art_single_${userId}`)
            .setLabel("← Voltar")
            .setStyle(ButtonStyle.Secondary),
        )],
      });
    }

    // 0.22d Descartar artefato individual — passo 3: execução
    if (interaction.isButton() && interaction.customId.startsWith("inv_discard_art_confirm_")) {
      const rest       = interaction.customId.split("inv_discard_art_confirm_")[1];
      const [userId, instanceIdStr] = rest.split("_");
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const instanceId = parseInt(instanceIdStr);
      const artifact   = playerRepository.getArtifactInstance(instanceId);
      if (!artifact || artifact.player_id !== userId) {
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Artefato não encontrado.", false)], components: [] });
      }

      const ownedChars  = playerRepository.getPlayerCharacters(userId);
      const equippedIds = getEquippedArtifactIds(ownedChars);
      if (equippedIds.includes(instanceId)) {
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Não é possível descartar um artefato que está equipado.", false)], components: [] });
      }

      const d = ArtifactManager.getArtifact(artifact.artifact_id, artifact);
      playerRepository.removeArtifactInstance(instanceId);

      const playerUpdated = playerRepository.getPlayer(userId);
      playerUpdated.ownedChars = playerRepository.getPlayerCharacters(userId);
      playerUpdated.items      = playerRepository.getPlayerItems(userId);
      playerUpdated.artifacts  = playerRepository.getPlayerArtifacts(userId);

      const invResult = EmbedManager.createInventoryEmbed(playerUpdated, interaction.user, "items");
      const embed = invResult.embeds[0];
      embed.setDescription(`> 🗑️ **${d.name}** foi descartado.\n\n` + (embed.data?.description || ""));
      return interaction.update(invResult);
    }

    // 0.22e Descartar artefatos repetidos — passo 1: preview
    if (interaction.isButton() && interaction.customId.startsWith("inv_discard_art_dupes_")
        && !interaction.customId.startsWith("inv_discard_art_dupes_confirm_")) {
      const userId = interaction.customId.split("inv_discard_art_dupes_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const allArtifacts  = playerRepository.getPlayerArtifacts(userId);
      const ownedChars    = playerRepository.getPlayerCharacters(userId);
      const equippedIds   = getEquippedArtifactIds(ownedChars);
      const discardable   = allArtifacts.filter(a => !equippedIds.includes(a.id));

      // Keep one of each artifact_id, remove the rest
      const seen = {};
      const toRemove = [];
      for (const a of discardable) {
        if (seen[a.artifact_id]) {
          toRemove.push(a);
        } else {
          seen[a.artifact_id] = true;
        }
      }

      if (toRemove.length === 0) {
        return interaction.update({
          embeds: [new EmbedBuilder()
            .setTitle("🗑️ Repetidos — Sem Resultados")
            .setDescription("Você não possui artefatos repetidos para descartar.")
            .setColor("#e74c3c")],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`inv_discard_art_${userId}`).setLabel("← Voltar").setStyle(ButtonStyle.Secondary),
          )],
        });
      }

      const previewLines = toRemove.slice(0, 15).map(a => {
        const d = ArtifactManager.getArtifact(a.artifact_id, a);
        return `${d.emoji || "🔮"} **${d.name}** — ID: \`${a.id}\``;
      });
      if (toRemove.length > 15) previewLines.push(`*...e mais ${toRemove.length - 15} artefatos*`);

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle(`🗑️ Confirmar — Descartar Repetidos`)
          .setDescription(
            `**${toRemove.length} artefato(s)** repetido(s) serão removidos (mantendo 1 de cada tipo).\n\n` +
            previewLines.join("\n")
          )
          .setColor("#e74c3c")
          .setFooter({ text: "Esta ação é permanente e irrecuperável." })],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_discard_art_dupes_confirm_${userId}`)
            .setLabel(`Confirmar — Descartar ${toRemove.length}`)
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`inv_discard_art_${userId}`)
            .setLabel("← Voltar")
            .setStyle(ButtonStyle.Secondary),
        )],
      });
    }

    // 0.22f Descartar artefatos repetidos — passo 2: execução
    if (interaction.isButton() && interaction.customId.startsWith("inv_discard_art_dupes_confirm_")) {
      const userId = interaction.customId.split("inv_discard_art_dupes_confirm_")[1];
      if (interaction.user.id !== userId) return interaction.reply({ content: "Este não é o seu inventário!", ephemeral: true });

      const allArtifacts  = playerRepository.getPlayerArtifacts(userId);
      const ownedChars    = playerRepository.getPlayerCharacters(userId);
      const equippedIds   = getEquippedArtifactIds(ownedChars);
      const discardable   = allArtifacts.filter(a => !equippedIds.includes(a.id));

      const seen = {};
      const toRemove = [];
      for (const a of discardable) {
        if (seen[a.artifact_id]) {
          toRemove.push(a);
        } else {
          seen[a.artifact_id] = true;
        }
      }

      for (const a of toRemove) playerRepository.removeArtifactInstance(a.id);

      const playerUpdated = playerRepository.getPlayer(userId);
      playerUpdated.ownedChars = playerRepository.getPlayerCharacters(userId);
      playerUpdated.items      = playerRepository.getPlayerItems(userId);
      playerUpdated.artifacts  = playerRepository.getPlayerArtifacts(userId);

      const invResult = EmbedManager.createInventoryEmbed(playerUpdated, interaction.user, "items");
      const embed = invResult.embeds[0];
      embed.setDescription(`> 🗑️ **${toRemove.length} artefato(s) repetido(s)** descartados!\n\n` + (embed.data?.description || ""));
      return interaction.update(invResult);
    }

    // 0.2 Lógica de Seleção de Personagem para Artefato
    if (interaction.isStringSelectMenu() && interaction.customId === "equip_artifact_char_select") {
      const characterInstanceId = parseInt(interaction.values[0]);
      const playerId = interaction.user.id;
      const player = playerRepository.getPlayer(playerId);
      player.ownedChars = playerRepository.getPlayerCharacters(playerId);
      player.artifacts = playerRepository.getPlayerArtifacts(playerId);
      const selectedCharInstance = player.ownedChars.find(c => c.id === characterInstanceId);
      if (!selectedCharInstance) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Personagem não encontrado.", false)], components: [] });
      const charData = CharacterManager.getCharacter(selectedCharInstance.character_id, selectedCharInstance);
      const allEquippedIds = new Set(
        player.ownedChars.flatMap(c => [c.equipped_artifact_1, c.equipped_artifact_2, c.equipped_artifact_3].filter(Boolean))
      );
      // Tipos de relíquias já equipadas neste personagem específico (impede duplicatas)
      const charEquippedTypes = new Set(
        [selectedCharInstance.equipped_artifact_1, selectedCharInstance.equipped_artifact_2, selectedCharInstance.equipped_artifact_3]
          .filter(Boolean)
          .map(slotId => playerRepository.getArtifactInstance(slotId)?.artifact_id)
          .filter(Boolean)
      );
      const availableArtifacts = player.artifacts
        .filter(pa => !allEquippedIds.has(pa.id) && !charEquippedTypes.has(pa.artifact_id))
        .map(pa => {
          const artifactData = ArtifactManager.getArtifact(pa.artifact_id, pa);
          if (!artifactData) return null; // artifact_id desconhecido (item removido do jogo)
          return { label: artifactData.name, description: `ID: ${pa.id}`, value: pa.id.toString() };
        })
        .filter(Boolean);
      const artifactSelectMenu = new StringSelectMenuBuilder().setCustomId(`equip_artifact_select_${characterInstanceId}`).setPlaceholder("Escolha um artefato para equipar").addOptions(availableArtifacts.length > 0 ? availableArtifacts : [{ label: "Nenhum artefato disponível", value: "none", description: "Você não tem artefatos para equipar ou todos já estão equipados." }]);
      const equipRow = new ActionRowBuilder().addComponents(artifactSelectMenu);
      const unequipButtons = [];
      for (let i = 1; i <= 3; i++) {
        const equippedArtifactInstanceId = selectedCharInstance[`equipped_artifact_${i}`];
        if (equippedArtifactInstanceId) {
          const artifactInstance = playerRepository.getArtifactInstance(equippedArtifactInstanceId);
          const artifactData = ArtifactManager.getArtifact(artifactInstance.artifact_id, artifactInstance);
          unequipButtons.push(new ButtonBuilder().setCustomId(`unequip_artifact_${characterInstanceId}_${i}_${equippedArtifactInstanceId}`).setLabel(`Remover: ${artifactData.name}`).setStyle(ButtonStyle.Danger));
        }
      }
      const unequipRow = unequipButtons.length > 0 ? new ActionRowBuilder().addComponents(unequipButtons) : null;
      const components = [equipRow];
      if (unequipRow) components.push(unequipRow);
      const rarityColor = { EM: "#9b59b6", AL: "#f1c40f", EC: "#2ecc71" };
      const slotsUsed = charData.equippedArtifacts.length;
      const slotsBar = "◆".repeat(slotsUsed) + "◇".repeat(3 - slotsUsed);
      const artifactList = slotsUsed > 0
        ? charData.equippedArtifacts.map((a, idx) => `\`Slot ${idx + 1}\`  ${a.emoji} **${a.name}**`).join("\n")
        : "*Nenhuma relíquia forjada neste combatente.*";
      const manageEmbed = new EmbedBuilder()
        .setTitle(`${charData.name}  —  Relíquias`)
        .setDescription(`> *Forje o poder das relíquias neste guerreiro.*\n\n**Slots** \`[${slotsBar}] ${slotsUsed}/3\``)
        .setColor(rarityColor[charData.rarity] || "#2c3e50")
        .setThumbnail(charData.imageUrl || null)
        .addFields({ name: "Relíquias Equipadas", value: artifactList, inline: false })
        .setFooter({ text: "Selecione uma relíquia abaixo para equipar • Use os botões para remover" });
      return interaction.update({ embeds: [manageEmbed], components: components });
    }

    // 0.3 Lógica de Equipar Artefato
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("equip_artifact_select_")) {
      const parts = interaction.customId.split("_");
      const characterInstanceId = parseInt(parts[parts.length - 1]);
      const artifactInstanceId = parseInt(interaction.values[0]);
      if (interaction.values[0] === "none") return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Nenhum artefato selecionado.", false)], components: [] });
      const charInstance = playerRepository.getCharacterInstance(characterInstanceId);
      if (!charInstance) return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`Personagem não encontrado (ID: ${characterInstanceId}).`, false)], components: [] });
      // Verificar se o artefato já está equipado em qualquer personagem do jogador
      const allCharsCheck = playerRepository.getPlayerCharacters(interaction.user.id);
      const artifactAlreadyEquipped = allCharsCheck.some(c =>
        [c.equipped_artifact_1, c.equipped_artifact_2, c.equipped_artifact_3].includes(artifactInstanceId)
      );
      if (artifactAlreadyEquipped) {
        const artifactRawCheck = playerRepository.getArtifactInstance(artifactInstanceId);
        const artData = artifactRawCheck ? ArtifactManager.getArtifact(artifactRawCheck.artifact_id, artifactRawCheck) : null;
        const artName = artData ? artData.name : "este artefato";
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`**${artName}** já está equipado em outro personagem. Remova-o de lá primeiro.`, false)], components: [] });
      }
      // Verificar artefato do mesmo tipo duplicado no personagem
      const artifactRawCheck = playerRepository.getArtifactInstance(artifactInstanceId);
      if (artifactRawCheck) {
        const slotsInUse = [charInstance.equipped_artifact_1, charInstance.equipped_artifact_2, charInstance.equipped_artifact_3].filter(Boolean);
        for (const slotId of slotsInUse) {
          const slotArt = playerRepository.getArtifactInstance(slotId);
          if (slotArt && slotArt.artifact_id === artifactRawCheck.artifact_id) {
            const artData = ArtifactManager.getArtifact(slotArt.artifact_id, slotArt);
            return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`Este personagem já possui **${artData.name}** equipado. Não é possível equipar dois artefatos iguais.`, false)], components: [] });
          }
        }
      }

      let equippedSlot = null;
      for (let i = 1; i <= 3; i++) { if (!charInstance[`equipped_artifact_${i}`]) { equippedSlot = i; break; } }
      if (!equippedSlot) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Este personagem já tem 3 artefatos equipados. Remova um antes de equipar outro.", false)], components: [] });
      playerRepository.equipArtifact(charInstance.id, artifactInstanceId, equippedSlot);
      const updatedCharInstance = playerRepository.getCharacterInstance(charInstance.id);
      const charData = CharacterManager.getCharacter(updatedCharInstance.character_id, updatedCharInstance);
      const artifactRaw = playerRepository.getArtifactInstance(artifactInstanceId);
      const artifactData = ArtifactManager.getArtifact(artifactRaw.artifact_id, artifactRaw);
      const rarityColor = { EM: "#9b59b6", AL: "#f1c40f", EC: "#2ecc71" };
      const successEmbed = new EmbedBuilder()
        .setTitle(`${artifactData.emoji || "🛡️"} Relíquia Forjada!`)
        .setDescription(`**${artifactData.name}** foi fundida ao poder de **${charData.name}**.\n\n*O guerreiro ficou mais forte.*`)
        .setColor(rarityColor[charData.rarity] || "#2ecc71")
        .setThumbnail(charData.imageUrl || null)
        .addFields({ name: "Slot", value: `\`◆ Slot ${equippedSlot}\``, inline: true })
        .setFooter({ text: "Anime Battle Arena • Forja de Relíquias" });
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
      return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`Artefato **${artifactData.name}** removido de **${charData.name}**!`, true)], components: [] });
    }

    // --- Lógica de Party: Aceitar/Recusar ---
    if (interaction.isButton() && interaction.customId.startsWith("party_")) {
      const [_, action, leaderId, targetId] = interaction.customId.split("_");
      if (interaction.user.id !== targetId) return interaction.reply({ content: "Este convite não é para você!", ephemeral: true });

      if (action === "decline") {
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`**${interaction.user.username}** recusou o convite.`, false)], components: [] });
      }

      if (action === "accept") {
        global.parties = global.parties || new Map();
        let party = global.parties.get(leaderId);
        
        if (!party) {
          party = { leaderId: leaderId, members: [leaderId] };
          global.parties.set(leaderId, party);
        }

        if (party.members.length >= 3) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("A party já está cheia.", false)], components: [] });
        if (party.members.includes(targetId)) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você já está nesta party.", false)], components: [] });

        party.members.push(targetId);
        const leaderUser = await interaction.client.users.fetch(leaderId);
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`**${interaction.user.username}** aceitou o convite e entrou na party de **${leaderUser.username}**! (${party.members.length}/3)`, true)], components: [] });
      }
    }

    // --- Lógica de Use: Seleção de Personagem ---
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("use_item_select_")) {
      const playerId = interaction.customId.split("_")[3];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Este menu não é seu!", ephemeral: true });

      const itemId = interaction.values[0];
      const characters = playerRepository.getPlayerCharacters(playerId);
      
      if (characters.length === 0) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Você não possui personagens.", false)], components: [] });

      const itemData = EvolutionManager.ITEMS[itemId];
      if (!itemData) return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`Item inválido (${itemId}).`, false)], components: [] });

      const charOptions = characters.map(c => {
        const charData = CharacterManager.getCharacter(c.character_id, c);
        return { label: `${charData.name} (Lvl ${c.level})`, description: `ID: ${c.id}`, value: c.id.toString() };
      });

      const embed = new EmbedBuilder()
        .setColor("#1a0a2e")
        .setAuthor({ name: "⚔️ Escolha o Guerreiro" })
        .setDescription(
          `*O poder de **${itemData.name}** aguarda um recipiente digno.*\n\n` +
          `Selecione o guerreiro que receberá este ritual de evolução.`
        )
        .setFooter({ text: "Câmara de Evolução • Próximo: selecionar quantidade" });

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`use_char_select_${playerId}_${itemId}`)
          .setPlaceholder("Qual guerreiro receberá o poder?")
          .addOptions(charOptions.slice(0, 25))
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
      if (!itemData) return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`Item inválido (${itemId}).`, false)], components: [] });

      if (!item || item.quantity <= 0) {
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`Você não possui o item **${itemData.name}** no inventário.`, false)], components: [] });
      }

      const maxQuantity = item.quantity;
      const embed = new EmbedBuilder()
        .setColor("#1a0a2e")
        .setAuthor({ name: "💎 Pedras a Sacrificar" })
        .setDescription(
          `*Quantas pedras deseja oferecer ao ritual?*\n\n` +
          `**Item:** ${itemData.name}\n` +
          `**Disponível:** ${maxQuantity} unidade${maxQuantity !== 1 ? "s" : ""}\n` +
          `**XP por pedra:** +${itemData.xp}`
        )
        .setFooter({ text: "Câmara de Evolução • Quanto mais pedras, mais poder" });

      const qtyOptions = [1, 5, 10, 20, 50].filter(q => q <= maxQuantity).map(q => ({ label: `${q} pedra${q !== 1 ? "s" : ""} (+${itemData.xp * q} XP)`, value: q.toString() }));

      if (maxQuantity > 1 && !qtyOptions.find(o => parseInt(o.value) === maxQuantity)) {
        qtyOptions.push({ label: `Todas (${maxQuantity}) — +${itemData.xp * maxQuantity} XP`, value: maxQuantity.toString() });
      }

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`use_qty_select_${playerId}_${instanceId}_${itemId}`)
          .setPlaceholder("Quantas pedras sacrificar?")
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
      if (!instance) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Personagem não encontrado.", false)], components: [] });

      const charData = CharacterManager.getCharacter(instance.character_id, instance);
      const itemData = EvolutionManager.ITEMS[itemId];
      if (!itemData) return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`Item inválido (${itemId}).`, false)], components: [] });

      const totalXP = itemData.xp * quantity;

      const embed = new EmbedBuilder()
        .setColor("#c8aa6e")
        .setAuthor({ name: "🔮 Confirmar Ritual de Evolução" })
        .setDescription(
          `*As pedras vibram ao redor de ${charData.name}, aguardando sua ordem.*\n\n` +
          `**Guerreiro:** ${charData.name}\n` +
          `**Pedras consumidas:** ${quantity}x ${itemData.name}\n` +
          `**XP concedido:** +${totalXP}\n\n` +
          `*Esta ação não pode ser desfeita.*`
        )
        .setFooter({ text: "Câmara de Evolução • Confirme para iniciar o ritual" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`use_confirm_${playerId}_${instanceId}_${quantity}_${itemId}`)
          .setLabel("⚗️ Iniciar Ritual")
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
      if (!itemData) return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`Item inválido (${itemId}).`, false)], components: [] });

      const instanceBefore = playerRepository.getCharacterInstance(parseInt(instanceId));
      if (!instanceBefore) return interaction.update({ embeds: [EmbedManager.createStatusEmbed("Personagem não encontrado.", false)], components: [] });

      const oldLevel = instanceBefore.level;
      const result = EvolutionManager.useItem(playerId, parseInt(instanceId), itemId, quantity);

      if (result.success) {
        const instanceAfter = playerRepository.getCharacterInstance(parseInt(instanceId));
        const charData = CharacterManager.getCharacter(instanceAfter.character_id, instanceAfter);

        if (instanceAfter.level > oldLevel) {
          const levelUpEmbed = EmbedManager.createLevelUpEmbed(charData, oldLevel, instanceAfter.level, result.xpGained);
          return interaction.update({ embeds: [levelUpEmbed], components: [] });
        } else {
          const nextLevelXP = EvolutionManager.getXPRequired(instanceAfter.level);
          const xpGainEmbed = EmbedManager.createXPGainEmbed(charData, result.xpGained, instanceAfter.xp, nextLevelXP, quantity, itemData.name);
          return interaction.update({ embeds: [xpGainEmbed], components: [] });
        }
      } else {
        return interaction.update({ embeds: [EmbedManager.createStatusEmbed(result.message, false)], components: [] });
      }
    }

    // --- Modo Desafio: Seleção de Dificuldade ----
    if (interaction.isButton() && interaction.customId.startsWith("challenge_diff_")) {
      const parts = interaction.customId.split("_");
      const diffKey = parts[2];
      const playerId = parts[3];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua sessão!", ephemeral: true });

      const challengeConfig = require("../config/challengeConfig.js");
      const diff = challengeConfig.difficulties[diffKey];

      if (!playerRepository.isPlayerChallengeCooledDown(playerId, diffKey)) {
        const msLeft = playerRepository.getPlayerChallengeCooldownMs(playerId, diffKey);
        const minLeft = Math.ceil(msLeft / 60000);
        return interaction.reply({ content: `Você ainda está em cooldown nesta dificuldade! Disponível em ~${minLeft} minutos (baseado na hora BRT).`, ephemeral: true });
      }

      // Sortear Boss
      const bossData = diff.bosses[Math.floor(Math.random() * diff.bosses.length)];
      
      const embed = new EmbedBuilder()
        .setTitle(`${diff.emoji} ${diff.name} — Um Inimigo Surge`)
        .setDescription(
          `> *"Apenas os mais fortes chegam até aqui."*\n\n` +
          `O destino cruzou seu caminho com **${bossData.name}**.\n` +
          `Ele não mostrará piedade. Você também não deve.\n\n` +
          `─────────────────────────`
        )
        .setColor("#1a0a2e")
        .setThumbnail(bossData.imageUrl)
        .addFields(
          { name: "👤 Boss", value: bossData.name, inline: true },
          { name: "📺 Anime", value: bossData.anime, inline: true },
          { name: "💀 Vida", value: `\`${bossData.health}\``, inline: true }
        )
        .setFooter({ text: "Não há volta. Apenas vitória ou derrota." });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`challenge_start_${diffKey}_${bossData.id}_${playerId}`)
          .setLabel("⚔️ ENFRENTAR")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // --- Modo Desafio: Iniciar Combate ---
    if (interaction.isButton() && interaction.customId.startsWith("challenge_start_")) {
      const parts = interaction.customId.split("_");
      const diffKey = parts[2];
      const bossId = parts[3];
      const playerId = parts[4];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua sessão!", ephemeral: true });

      const status = BattleEngine.canStartBattle(playerId);
      if (!status.can) return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(status.reason, false)], ephemeral: true });

      const player = playerRepository.getPlayer(playerId);
      if (!player.equipped_instance_id) return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("Você não tem um personagem equipado!", false)], ephemeral: true });

      const party = global.parties ? Array.from(global.parties.values()).find(p => p.members.includes(playerId)) : null;
      const partyMembers = party ? party.members : [playerId];

      for (const memberId of partyMembers) {
        const memberPlayer = playerRepository.getPlayer(memberId);
        if (!memberPlayer.equipped_instance_id) {
          const memberUser = await interaction.client.users.fetch(memberId);
          return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(`O membro **${memberUser.username}** não tem um personagem equipado!`, false)], ephemeral: true });
        }
        if (memberId !== playerId) {
          const memberStatus = BattleEngine.canStartBattle(memberId);
          if (!memberStatus.can) {
            const memberUser = await interaction.client.users.fetch(memberId);
            return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(`**${memberUser.username}** já está em um combate ativo ou na fila ranqueada!`, false)], ephemeral: true });
          }
        }
      }

      if (!playerRepository.isPlayerChallengeCooledDown(playerId, diffKey)) {
        const msLeft = playerRepository.getPlayerChallengeCooldownMs(playerId, diffKey);
        const minLeft = Math.ceil(msLeft / 60000);
        return interaction.reply({ content: `Você ainda está em cooldown nesta dificuldade! Disponível em ~${minLeft} minutos.`, ephemeral: true });
      }

      const charInstance = playerRepository.getCharacterInstance(player.equipped_instance_id);
      const bossInstance = { character_id: bossId, level: 1 };

      await interaction.deferUpdate();
      const guild = interaction.guild;
      const channel = await guild.channels.create({
        name: `desafio-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ...partyMembers.map(mId => ({ id: mId, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }))
        ]
      });

      const battle = BattleEngine.startBattle(playerId, `boss_${bossId}`, charInstance, bossInstance, true, partyMembers, false, channel.id);
      battle.p1DisplayName = interaction.member?.displayName || interaction.user.username;
      battle.challengeDifficulty = diffKey;
      
      const embed = EmbedManager.createBattleEmbed(battle);
      const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);
      
      await channel.send({
        content: `⚔️ **DESAFIO INICIADO!** ⚔️\n${partyMembers.map(id => `<@${id}>`).join(" ")} vs **${bossId.toUpperCase()}**\n\nEste canal será apagado ao fim da luta.`,
        embeds: [embed],
        components: components
      });

      return interaction.editReply({ embeds: [EmbedManager.createStatusEmbed(`Desafio iniciado no canal <#${channel.id}>!`, true)], components: [] });
    }



    if (interaction.isButton() && interaction.customId.startsWith("use_cancel_")) {
      return interaction.update({ content: "❌ Ação cancelada.", embeds: [], components: [] });
    }

    // --- Lógica de Seleção de Mundo ---
    if (interaction.isButton() && interaction.customId.startsWith("story_world_")) {
      const parts = interaction.customId.split("_");
      const worldId = parts[2];
      const playerId = parts[3];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });

      const world = storyConfig.worlds.find(w => w.id === worldId);
      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;

      const embed = EmbedManager.createStoryBossSelectEmbed(world, lastDefeated);

      const allBosses = [];
      storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
      const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);

      const row = new ActionRowBuilder();
      world.bosses.forEach((boss) => {
        const globalBossIndex = allBosses.findIndex(b => b.id === boss.id);
        const isUnlocked = globalBossIndex === 0 || lastDefeatedIdx >= globalBossIndex - 1;
        const isDefeated = lastDefeatedIdx >= globalBossIndex;
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`pve_intro_${boss.id}_${playerId}`)
            .setLabel(boss.shortName)
            .setStyle(isDefeated ? ButtonStyle.Success : (isUnlocked ? ButtonStyle.Primary : ButtonStyle.Secondary))
            .setDisabled(isDefeated || !isUnlocked)
        );
      });

      const backButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`story_back_${playerId}`).setLabel("◂ Voltar aos Mundos").setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [embed], components: [row, backButton] });
    }

    // --- Lógica de Voltar ao Menu de Mundos ---
    if (interaction.isButton() && interaction.customId.startsWith("story_back_")) {
      const parts = interaction.customId.split("_");
      const playerId = parts[2];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });

      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;

      const embed = EmbedManager.createStoryWorldSelectEmbed(lastDefeated);
      const allBosses = [];
      storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
      const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);

      const row = new ActionRowBuilder();
      storyConfig.worlds.forEach((world, index) => {
        let isWorldUnlocked = index === 0;
        if (index > 0) {
          const prevWorld = storyConfig.worlds[index - 1];
          const lastBossPrev = prevWorld.bosses[prevWorld.bosses.length - 1].id;
          const prevWorldLastIdx = allBosses.findIndex(b => b.id === lastBossPrev);
          if (lastDefeatedIdx >= prevWorldLastIdx) isWorldUnlocked = true;
        }
        row.addComponents(new ButtonBuilder().setCustomId(`story_world_${world.id}_${playerId}`).setLabel(world.name.split(" ")[1] || world.name).setEmoji(world.emoji).setStyle(isWorldUnlocked ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(!isWorldUnlocked));
      });

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // --- Lógica de Introdução do Modo História ---
    if (interaction.isButton() && interaction.customId.startsWith("pve_intro_")) {
      const parts = interaction.customId.split("_");
      const bossId = parts.slice(2, -1).join("_");
      const playerId = parts[parts.length - 1];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });

      const player = playerRepository.getPlayer(playerId);

      let worldData, bossData;
      const allBosses = [];
      storyConfig.worlds.forEach(w => {
        allBosses.push(...w.bosses);
        const b = w.bosses.find(x => x.id === bossId);
        if (b) { worldData = w; bossData = b; }
      });

      const jjkWorldIdx = storyConfig.worlds.findIndex(w => w.id === "jjk");
      const currentWorldIdx = storyConfig.worlds.findIndex(w => w.id === worldData?.id);
      const isTeamWorld = currentWorldIdx >= jjkWorldIdx;

      const introParty = global.parties ? Array.from(global.parties.values()).find(p => p.members.includes(playerId)) : null;
      const introIsMultiParty = introParty && introParty.members.length > 1;

      let playerChar;
      if (isTeamWorld && !introIsMultiParty) {
        const teamInstIds = BattleEngine.getRankedTeam(playerId);
        if (!teamInstIds || teamInstIds.length < 3) {
          return interaction.reply({ content: "❌ A partir do **Universo Jujutsu Kaisen**, as batalhas usam seu **Time 3v3**. Configure em `!equip → Time 3v3`.", ephemeral: true });
        }
        const inst = playerRepository.getCharacterInstance(teamInstIds[0]);
        playerChar = CharacterManager.getCharacter(inst.character_id, inst);
      } else {
        if (!player.equipped_instance_id) return interaction.reply({ content: "Equipe um personagem antes de lutar! Use `!equip`", ephemeral: true });
        const charInstance = playerRepository.getCharacterInstance(player.equipped_instance_id);
        playerChar = CharacterManager.getCharacter(charInstance.character_id, charInstance);
      }

      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;
      const globalBossIndex = allBosses.findIndex(b => b.id === bossId);
      const lastDefeatedIndex = allBosses.findIndex(b => b.id === lastDefeated);

      if (globalBossIndex > 0 && lastDefeatedIndex < globalBossIndex - 1) {
        return interaction.reply({ content: "Você ainda não desbloqueou este desafio!", ephemeral: true });
      }

      const introEmbed = EmbedManager.createStoryIntroEmbed(worldData, bossData, playerChar);
      if (isTeamWorld && !introIsMultiParty) {
        const teamInstIds = BattleEngine.getRankedTeam(playerId);
        const teamNames = teamInstIds.map(id => {
          const inst = playerRepository.getCharacterInstance(id);
          const c = CharacterManager.getCharacter(inst.character_id, inst);
          return c.name;
        }).join(" / ");
        introEmbed.addFields({ name: "👥 Seu Time", value: teamNames, inline: false });
      }
      const isBossDefeated = allBosses.findIndex(b => b.id === lastDefeated) >= globalBossIndex;
      const startButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pve_start_${bossId}_${playerId}`).setLabel(isBossDefeated ? "BOSS DERROTADO" : "INICIAR COMBATE").setStyle(isBossDefeated ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(isBossDefeated)
      );

      return interaction.update({ embeds: [introEmbed], components: [startButton] });
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
      if (interaction.user.id === selection.p1Id) { selection.p1 = instance; selection.p1Username = interaction.member?.displayName || interaction.user.username; }
      else if (interaction.user.id === selection.p2Id) { selection.p2 = instance; selection.p2Username = interaction.member?.displayName || interaction.user.username; }
      if (selection.p1 && selection.p2) {
        const battle = BattleEngine.startBattle(selection.p1Id, selection.p2Id, selection.p1, selection.p2);
        if (selection.p1Username) battle.p1DisplayName = selection.p1Username;
        if (selection.p2Username) battle.p2DisplayName = selection.p2Username;
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

      const embed = EmbedManager.createStoryBossSelectEmbed(world, lastDefeated);
      const allBosses = [];
      storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
      const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);

      const row = new ActionRowBuilder();
      world.bosses.forEach((boss) => {
        const globalBossIndex = allBosses.findIndex(b => b.id === boss.id);
        const isUnlocked = globalBossIndex === 0 || lastDefeatedIdx >= globalBossIndex - 1;
        const isDefeated = lastDefeatedIdx >= globalBossIndex;
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`pve_intro_${boss.id}_${playerId}`)
            .setLabel(boss.shortName)
            .setStyle(isDefeated ? ButtonStyle.Success : (isUnlocked ? ButtonStyle.Primary : ButtonStyle.Secondary))
            .setDisabled(isDefeated || !isUnlocked)
        );
      });

      const backButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`story_back_${playerId}`).setLabel("◂ Voltar aos Mundos").setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [embed], components: [row, backButton] });
    }

    // --- Lógica de Voltar ao Menu de Mundos ---
    if (type === "story" && parts[1] === "back") {
      const playerId = parts[2];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });

      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;

      const embed = EmbedManager.createStoryWorldSelectEmbed(lastDefeated);
      const allBosses = [];
      storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
      const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);

      const row = new ActionRowBuilder();
      storyConfig.worlds.forEach((world, index) => {
        let isWorldUnlocked = index === 0;
        if (index > 0) {
          const prevWorld = storyConfig.worlds[index - 1];
          const lastBossPrev = prevWorld.bosses[prevWorld.bosses.length - 1].id;
          const prevWorldLastIdx = allBosses.findIndex(b => b.id === lastBossPrev);
          if (lastDefeatedIdx >= prevWorldLastIdx) isWorldUnlocked = true;
        }
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

      let worldData, bossData;
      const allBosses = [];
      storyConfig.worlds.forEach(w => {
        allBosses.push(...w.bosses);
        const b = w.bosses.find(x => x.id === bossId);
        if (b) { worldData = w; bossData = b; }
      });

      const jjkWorldIdx = storyConfig.worlds.findIndex(w => w.id === "jjk");
      const currentWorldIdx = storyConfig.worlds.findIndex(w => w.id === worldData?.id);
      const isTeamWorld = currentWorldIdx >= jjkWorldIdx;

      const introParty = global.parties ? Array.from(global.parties.values()).find(p => p.members.includes(playerId)) : null;
      const introIsMultiParty = introParty && introParty.members.length > 1;

      let playerChar;
      if (isTeamWorld && !introIsMultiParty) {
        const teamInstIds = BattleEngine.getRankedTeam(playerId);
        if (!teamInstIds || teamInstIds.length < 3) {
          return interaction.reply({ content: "❌ A partir do **Universo Jujutsu Kaisen**, as batalhas usam seu **Time 3v3**. Configure em `!equip → Time 3v3`.", ephemeral: true });
        }
        const inst = playerRepository.getCharacterInstance(teamInstIds[0]);
        playerChar = CharacterManager.getCharacter(inst.character_id, inst);
      } else {
        if (!player.equipped_instance_id) return interaction.reply({ content: "Equipe um personagem antes de lutar! Use `!equip`", ephemeral: true });
        const charInstance = playerRepository.getCharacterInstance(player.equipped_instance_id);
        playerChar = CharacterManager.getCharacter(charInstance.character_id, charInstance);
      }

      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;
      const globalBossIndex = allBosses.findIndex(b => b.id === bossId);
      const lastDefeatedIndex = allBosses.findIndex(b => b.id === lastDefeated);

      if (globalBossIndex > 0 && lastDefeatedIndex < globalBossIndex - 1) {
        return interaction.reply({ content: "Você ainda não desbloqueou este desafio!", ephemeral: true });
      }

      const introEmbed = EmbedManager.createStoryIntroEmbed(worldData, bossData, playerChar);
      if (isTeamWorld && !introIsMultiParty) {
        const teamInstIds = BattleEngine.getRankedTeam(playerId);
        const teamNames = teamInstIds.map(id => {
          const inst = playerRepository.getCharacterInstance(id);
          const c = CharacterManager.getCharacter(inst.character_id, inst);
          return c.name;
        }).join(" / ");
        introEmbed.addFields({ name: "👥 Seu Time", value: teamNames, inline: false });
      }
      const isBossDefeated = allBosses.findIndex(b => b.id === lastDefeated) >= globalBossIndex;
      const startButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pve_start_${bossId}_${playerId}`).setLabel(isBossDefeated ? "BOSS DERROTADO" : "INICIAR COMBATE").setStyle(isBossDefeated ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(isBossDefeated)
      );

      return interaction.update({ embeds: [introEmbed], components: [startButton] });
    }

    // --- Lógica de Seleção de Mundo ---
    if (type === "story" && parts[1] === "world") {
      const worldId = parts[2];
      const playerId = parts[3];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });

      const world = storyConfig.worlds.find(w => w.id === worldId);
      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;

      const embed = EmbedManager.createStoryBossSelectEmbed(world, lastDefeated);
      const allBosses = [];
      storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
      const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);

      const row = new ActionRowBuilder();
      world.bosses.forEach((boss) => {
        const globalBossIndex = allBosses.findIndex(b => b.id === boss.id);
        const isUnlocked = globalBossIndex === 0 || lastDefeatedIdx >= globalBossIndex - 1;
        const isDefeated = lastDefeatedIdx >= globalBossIndex;
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`pve_intro_${boss.id}_${playerId}`)
            .setLabel(boss.shortName)
            .setStyle(isDefeated ? ButtonStyle.Success : (isUnlocked ? ButtonStyle.Primary : ButtonStyle.Secondary))
            .setDisabled(isDefeated || !isUnlocked)
        );
      });

      const backButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`story_back_${playerId}`).setLabel("◂ Voltar aos Mundos").setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [embed], components: [row, backButton] });
    }

    // --- Lógica de Voltar ao Menu de Mundos ---
    if (type === "story" && parts[1] === "back") {
      const playerId = parts[2];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });

      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;

      const embed = EmbedManager.createStoryWorldSelectEmbed(lastDefeated);
      const allBosses = [];
      storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
      const lastDefeatedIdx = allBosses.findIndex(b => b.id === lastDefeated);

      const row = new ActionRowBuilder();
      storyConfig.worlds.forEach((world, index) => {
        let isWorldUnlocked = index === 0;
        if (index > 0) {
          const prevWorld = storyConfig.worlds[index - 1];
          const lastBossPrev = prevWorld.bosses[prevWorld.bosses.length - 1].id;
          const prevWorldLastIdx = allBosses.findIndex(b => b.id === lastBossPrev);
          if (lastDefeatedIdx >= prevWorldLastIdx) isWorldUnlocked = true;
        }
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
      const isBossDefeated = allBosses.findIndex(b => b.id === lastDefeated) >= globalBossIndex;
      const startButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pve_start_${bossId}_${playerId}`).setLabel(isBossDefeated ? "BOSS DERROTADO" : "INICIAR COMBATE").setStyle(isBossDefeated ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(isBossDefeated)
      );
      
      return interaction.update({ embeds: [introEmbed], components: [startButton] });
    }

    if (type === "pve" && parts[1] === "start") {
      const bossId = parts.slice(2, -1).join("_");
      const playerId = parts[parts.length - 1];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua jornada!", ephemeral: true });
      
      const status = BattleEngine.canStartBattle(playerId);
      if (!status.can) return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(status.reason, false)], ephemeral: true });

      const progress = playerRepository.getStoryProgress(playerId);
      const lastDefeated = progress.last_boss_defeated;
      const allBosses = [];
      storyConfig.worlds.forEach(w => allBosses.push(...w.bosses));
      const globalBossIndex = allBosses.findIndex(b => b.id === bossId);
      const lastDefeatedIndex = allBosses.findIndex(b => b.id === lastDefeated);

      if (lastDefeatedIndex >= globalBossIndex) {
        return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("Você já derrotou este boss e não pode enfrentá-lo novamente! Avance para o próximo desafio.", false)], ephemeral: true });
      }

      const player = playerRepository.getPlayer(playerId);

      // Lista ordenada de todos os bosses do modo história
      const allStoryBossesOrdered = [];
      let worldDataForBoss;
      storyConfig.worlds.forEach(w => {
        allStoryBossesOrdered.push(...w.bosses);
        if (w.bosses.find(b => b.id === bossId)) worldDataForBoss = w;
      });
      const currentBossIndex = allStoryBossesOrdered.findIndex(b => b.id === bossId);

      const jjkWorldIdx = storyConfig.worlds.findIndex(w => w.id === "jjk");
      const bossWorldIdx = storyConfig.worlds.findIndex(w => w.id === worldDataForBoss?.id);
      const isTeamWorld = bossWorldIdx >= jjkWorldIdx;

      let charInstance, pveTeamInstances = null, partyMembers;

      const partyForCheck = global.parties ? Array.from(global.parties.values()).find(p => p.members.includes(playerId)) : null;
      const isMultiParty = partyForCheck && partyForCheck.members.length > 1;

      if (isTeamWorld && !isMultiParty) {
        const teamInstIds = BattleEngine.getRankedTeam(playerId);
        if (!teamInstIds || teamInstIds.length < 3) {
          return interaction.reply({ content: "❌ A partir do **Universo Jujutsu Kaisen**, as batalhas usam seu **Time 3v3**. Configure em `!equip → Time 3v3`.", ephemeral: true });
        }
        pveTeamInstances = teamInstIds.map(id => playerRepository.getCharacterInstance(id));
        charInstance = pveTeamInstances[0];
        partyMembers = [playerId];
      } else {
        if (!player.equipped_instance_id) return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("Você não tem um personagem equipado!", false)], ephemeral: true });
        charInstance = playerRepository.getCharacterInstance(player.equipped_instance_id);

        // Verificar se o jogador está em uma party
        const party = global.parties ? Array.from(global.parties.values()).find(p => p.members.includes(playerId)) : null;
        partyMembers = party ? party.members : [playerId];

        // Validar se todos os membros têm personagens equipados e não estão em combate
        for (const memberId of partyMembers) {
          const memberPlayer = playerRepository.getPlayer(memberId);
          if (!memberPlayer.equipped_instance_id) {
            const memberUser = await interaction.client.users.fetch(memberId);
            return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(`O membro **${memberUser.username}** não tem um personagem equipado!`, false)], ephemeral: true });
          }
          if (memberId !== playerId) {
            const memberStatus = BattleEngine.canStartBattle(memberId);
            if (!memberStatus.can) {
              const memberUser = await interaction.client.users.fetch(memberId);
              return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(`**${memberUser.username}** já está em um combate ativo ou na fila ranqueada!`, false)], ephemeral: true });
            }
            const memberProgress = playerRepository.getStoryProgress(memberId);
            const memberLastDefeated = memberProgress?.last_boss_defeated;
            const memberLastIndex = memberLastDefeated ? allStoryBossesOrdered.findIndex(b => b.id === memberLastDefeated) : -1;
            if (currentBossIndex > 0 && memberLastIndex < currentBossIndex - 1) {
              const memberUser = await interaction.client.users.fetch(memberId);
              return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(`**${memberUser.username}** ainda não chegou nessa parte da história!`, false)], ephemeral: true });
            }
          }
        }
      }

      const bossInstance = { character_id: bossId, level: 1 };

      await interaction.deferUpdate();
      const guild = interaction.guild;
      const channel = await guild.channels.create({
        name: `historia-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ...partyMembers.map(mId => ({ id: mId, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }))
        ]
      });

      const battle = BattleEngine.startBattle(playerId, `boss_${bossId}`, charInstance, bossInstance, true, partyMembers, false, channel.id, pveTeamInstances);
      battle.p1DisplayName = interaction.member?.displayName || interaction.user.username;

      const embed = EmbedManager.createBattleEmbed(battle);
      const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);
      
      await channel.send({
        content: `📖 **JORNADA INICIADA!** 📖\n${partyMembers.map(id => `<@${id}>`).join(" ")} vs **${bossId.toUpperCase()}**\n\nEste canal será apagado ao fim da luta.`,
        embeds: [embed],
        components: components
      });

      return interaction.editReply({ embeds: [EmbedManager.createStatusEmbed(`Jornada iniciada no canal <#${channel.id}>!`, true)], components: [] });
    }

    // --- Lógica da Torre Infinita ---
    if (type === "tower" && parts[1] === "start") {
      const floorNum = parseInt(parts[2]);
      const playerId = parts[3];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua torre!", ephemeral: true });

      const floorData = towerConfig.floors.find(f => f.floor === floorNum);
      if (!floorData) return interaction.reply({ content: "Andar não encontrado!", ephemeral: true });

      // Verificar cooldown e combate ativo
      const towerCooldown = playerRepository.getTowerCooldown(playerId);
      if (towerCooldown.available_at > Date.now()) {
        const remainingMin = Math.ceil((towerCooldown.available_at - Date.now()) / (1000 * 60));
        return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(`Você ainda está em cooldown da torre! Restam **${remainingMin} minutos**.`, false)], ephemeral: true });
      }
      const towerBattleStatus = BattleEngine.canStartBattle(playerId);
      if (!towerBattleStatus.can) {
        return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("Você já está em um combate ativo!", false)], ephemeral: true });
      }

      // Carregar time 3v3 do jogador
      const towerTeamIds = BattleEngine.getRankedTeam(playerId);
      if (!towerTeamIds || towerTeamIds.length < 3) {
        return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("A Torre Infinita exige um **Time de 3 personagens**. Configure em `!equip → Time 3v3`.", false)], ephemeral: true });
      }
      const towerTeamInsts = towerTeamIds.map(id => playerRepository.getCharacterInstance(id)).filter(Boolean);
      if (towerTeamInsts.length < 3) {
        return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("Um ou mais personagens do seu time não foram encontrados. Reconfigure em `!equip → Time 3v3`.", false)], ephemeral: true });
      }

      // Criar canal temporário
      await interaction.deferUpdate();
      const guild = interaction.guild;
      const channel = await guild.channels.create({
        name: `torre-andar-${floorNum}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: playerId, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
        ]
      });

      const bossInstance = { character_id: floorData.boss.id, level: floorData.boss.level };

      const battle = BattleEngine.startBattle(playerId, floorData.boss.id, towerTeamInsts[0], bossInstance, true, [playerId], false, channel.id, towerTeamInsts);
      battle.type = "tower";
      battle.currentFloor = floorNum;
      battle.partyMembers = [playerId];
      battle.p1DisplayName = interaction.member?.displayName || interaction.user.username;

      const embed = EmbedManager.createBattleEmbed(battle);
      const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);

      await channel.send({
        content: `🗼 **TORRE INFINITA - ANDAR ${floorNum}** 🗼\n<@${playerId}>\nPrepare-se para o combate contra **${floorData.boss.name}**!`,
        embeds: [embed],
        components: components
      });

      return interaction.editReply({ embeds: [EmbedManager.createStatusEmbed(`Combate iniciado no canal <#${channel.id}>!`, true)], components: [] });
    }

    if (type === "tower" && parts[1] === "next") {
      const battleId = parts[2];
      const floorNum = parseInt(parts[3]);
      const playerId = parts[4];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Apenas o líder pode avançar!", ephemeral: true });

      const floorData = towerConfig.floors.find(f => f.floor === floorNum);
      if (!floorData) return interaction.reply({ content: "Andar não encontrado!", ephemeral: true });

      const oldBattle = BattleEngine.getBattle(battleId);
      if (!oldBattle) return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("Sessão de batalha expirada. Inicie a torre novamente.", false)], ephemeral: true });

      // Remover a batalha antiga do mapa de batalhas ativas antes de criar a nova
      BattleEngine.activeBattles.delete(battleId);

      // Criar boss do novo andar
      const bossInstance = { character_id: floorData.boss.id, level: floorData.boss.level };

      // Carregar time fresco para inicializar isPveTeam corretamente
      const nextFloorTeamIds = BattleEngine.getRankedTeam(playerId);
      const nextFloorTeamInsts = nextFloorTeamIds
        ? nextFloorTeamIds.map(id => playerRepository.getCharacterInstance(id)).filter(Boolean)
        : [];

      // Iniciar nova batalha no mesmo canal
      const newBattle = BattleEngine.startBattle(
        playerId, floorData.boss.id,
        nextFloorTeamInsts[0] || playerRepository.getCharacterInstance(playerRepository.getPlayer(playerId).equipped_instance_id),
        bossInstance, true, [playerId], false, oldBattle.channelId,
        nextFloorTeamInsts.length >= 3 ? nextFloorTeamInsts : null
      );
      newBattle.type = "tower";
      newBattle.currentFloor = floorNum;
      newBattle.partyMembers = [playerId];

      // SOBRESCREVER o time pelo da luta anterior (com HP atual preservado)
      if (oldBattle.p1Team) {
        newBattle.p1Team = oldBattle.p1Team;
        newBattle.isPveTeam = true;
        const aliveIdx = oldBattle.p1Team.findIndex(c => c.isAlive());
        newBattle.p1ActiveIdx = aliveIdx >= 0 ? aliveIdx : 0;
        newBattle.character1 = newBattle.p1Team[newBattle.p1ActiveIdx];
        newBattle.partyCharacters = null;
      }
      newBattle.player1Id = playerId;
      newBattle.p1DisplayName = oldBattle.p1DisplayName || interaction.member?.displayName || interaction.user.username;

      const embed = EmbedManager.createBattleEmbed(newBattle);
      const components = ButtonManager.createActionComponents(newBattle.id, newBattle.getCurrentPlayer(), false, newBattle);

      return interaction.update({
        content: `🗼 **TORRE INFINITA - ANDAR ${floorNum}** 🗼\nVocês avançaram! Próximo oponente: **${floorData.boss.name}**!`,
        embeds: [embed],
        components: components
      });
    }

    // 1.0 Lógica de Confirmação de PVP
    if (interaction.isButton() && interaction.customId.startsWith("pvp_") && !interaction.customId.startsWith("pvp_team_")) {
      const parts = interaction.customId.split("_");
      const action = parts[1];
      const p1Id = parts[parts.length - 1]; // Para init_ranked e init_casual

      // Lógica de Inicialização (Escolha entre Casual e Ranqueado)
      if (action === "init") {
        const mode = parts[2];
        if (interaction.user.id !== p1Id) return interaction.reply({ content: "Apenas quem usou o comando pode escolher!", ephemeral: true });

        if (mode === "ranked") {
          const status = BattleEngine.canStartBattle(p1Id);
          if (!status.can) return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(status.reason, false)], ephemeral: true });

          // 3v3: mostrar seleção de time
          const savedTeam = BattleEngine.getRankedTeam(p1Id);
          if (savedTeam) {
            // Já tem time salvo — mostrar confirmação
            const teamInfo = savedTeam.map((instId, i) => {
              const inst = playerRepository.getCharacterInstance(instId);
              const charDef = CharacterManager.getCharacter(inst.character_id, inst);
              return `${i + 1}. **${charDef.name}** [Lv${inst.level}]`;
            }).join("\n");
            const confirmEmbed = new EmbedBuilder()
              .setTitle("🏆 Ranqueado 3v3 — Confirmar Time")
              .setDescription(`Seu time atual:\n\n${teamInfo}\n\nDeseja entrar na fila com este time?`)
              .setColor("#FFD700");
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`pvp_team_confirm_${p1Id}`).setLabel("✅ Confirmar Time").setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId(`pvp_team_change_${p1Id}`).setLabel("🔄 Mudar Time").setStyle(ButtonStyle.Secondary)
            );
            return interaction.update({ embeds: [confirmEmbed], components: [row] });
          }

          // Sem time salvo — mostrar seleção
          const chars = playerRepository.getPlayerCharacters(p1Id);
          if (chars.length < 3) {
            return interaction.reply({ content: "❌ Você precisa ter pelo menos 3 personagens para jogar o 3v3!", ephemeral: true });
          }
          const options = chars.slice(0, 25).map(inst => {
            const charDef = CharacterManager.getCharacter(inst.character_id, inst);
            return { label: `${charDef.name} [Lv${inst.level}]`, value: String(inst.id), description: `Raridade: ${charDef.rarity}` };
          });
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`pvp_team_select_${p1Id}`)
            .setPlaceholder("Selecione exatamente 3 personagens para seu time")
            .setMinValues(3).setMaxValues(3)
            .addOptions(options);
          const selEmbed = new EmbedBuilder()
            .setTitle("🏆 Ranqueado 3v3 — Escolha seu Time")
            .setDescription("Selecione **3 personagens** que formarão seu time. O primeiro será o personagem inicial em campo.")
            .setColor("#FFD700");
          return interaction.update({ embeds: [selEmbed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
        }

        if (mode === "casual") {
          return interaction.update({ 
            embeds: [EmbedManager.createStatusEmbed("Modo Casual selecionado! Agora use `!pvp @usuario` para desafiar alguém específico.", true)], 
            components: [] 
          });
        }
      }

      // Seletor de modo (1v1 ou 3v3 casual) — apenas p1 clica
      if (action === "modesel") {
        const submode = parts[2];
        const selP1Id = parts[3];
        const selP2Id = parts[4];
        if (interaction.user.id !== selP1Id) return interaction.reply({ content: "Apenas quem fez o desafio pode escolher o modo!", ephemeral: true });

        const p1Name = interaction.member?.displayName || interaction.user.username;
        const p2Member = interaction.guild?.members?.cache?.get(selP2Id) || await interaction.guild?.members?.fetch(selP2Id).catch(() => null);
        const p2Name = p2Member?.displayName || "Oponente";

        if (submode === "1v1") {
          const embed = new EmbedBuilder()
            .setTitle("⚔️ Desafio PVP Casual — 1v1")
            .setDescription(`**${p1Name}** desafiou **${p2Name}** para um combate **1v1** casual!\n\n${p2Name}, você aceita?`)
            .setColor("#0099ff");
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`pvp_accept_casual_${selP1Id}_${selP2Id}`).setLabel("Aceitar").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`pvp_refuse_${selP1Id}_${selP2Id}`).setLabel("Recusar").setStyle(ButtonStyle.Danger)
          );
          return interaction.update({ embeds: [embed], components: [row] });
        }

        if (submode === "3v3") {
          const savedTeam = BattleEngine.getRankedTeam(selP1Id);
          if (!savedTeam || savedTeam.length < 3) {
            return interaction.reply({ embeds: [EmbedManager.createStatusEmbed("❌ Você não tem um Time 3v3 salvo! Use `!equip` → **Time 3v3** para configurar.", false)], ephemeral: true });
          }
          const teamInfo = savedTeam.map((instId, i) => {
            const inst = playerRepository.getCharacterInstance(instId);
            const charDef = CharacterManager.getCharacter(inst.character_id, inst);
            return `${i + 1}. **${charDef.name}** [Lv${inst.level}]`;
          }).join("\n");
          const embed = new EmbedBuilder()
            .setTitle("⚔️ Desafio PVP Casual — 3v3")
            .setDescription(`**${p1Name}** desafiou **${p2Name}** para um combate **3v3** casual!\n\n**Time de ${p1Name}:**\n${teamInfo}\n\n${p2Name}, você aceita?`)
            .setColor("#00aa44");
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`pvp_accept_3v3casual_${selP1Id}_${selP2Id}`).setLabel("Aceitar").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`pvp_refuse_${selP1Id}_${selP2Id}`).setLabel("Recusar").setStyle(ButtonStyle.Danger)
          );
          return interaction.update({ embeds: [embed], components: [row] });
        }
      }

      // Lógica de Aceitar/Recusar (Para o desafiado)
      const p1IdChallenge = parts[parts.length - 2];
      const p2IdChallenge = parts[parts.length - 1];
      if (interaction.user.id !== p2IdChallenge) return interaction.reply({ content: "Você não é o desafiado!", ephemeral: true });

      if (action === "refuse") {
        return interaction.update({ content: "", embeds: [EmbedManager.createStatusEmbed(`<@${p2IdChallenge}> recusou o desafio de PVP de <@${p1IdChallenge}>.`, false)], components: [] });
      }

      if (action === "accept") {
        const mode = parts[2];
        const statusP1 = BattleEngine.canStartBattle(p1IdChallenge);
        const statusP2 = BattleEngine.canStartBattle(p2IdChallenge);
        if (!statusP1.can || !statusP2.can) {
          const reason = !statusP1.can
            ? statusP1.reason.replace("Você já está", `<@${p1IdChallenge}> já está`).replace("Saia da fila", "Ele precisa sair da fila")
            : statusP2.reason.replace("Você já está", `<@${p2IdChallenge}> já está`).replace("Saia da fila", "Ele precisa sair da fila");
          return interaction.update({ embeds: [EmbedManager.createStatusEmbed(reason, false)], components: [] });
        }

        // 3v3 Casual
        if (mode === "3v3casual") {
          const p1Team3v3 = BattleEngine.getRankedTeam(p1IdChallenge);
          const p2Team3v3 = BattleEngine.getRankedTeam(p2IdChallenge);
          if (!p1Team3v3 || p1Team3v3.length < 3) {
            return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`❌ <@${p1IdChallenge}> não tem um Time 3v3 salvo!`, false)], components: [] });
          }
          if (!p2Team3v3 || p2Team3v3.length < 3) {
            return interaction.update({ embeds: [EmbedManager.createStatusEmbed(`❌ Você não tem um Time 3v3 salvo! Use \`!equip\` → **Time 3v3** para configurar.`, false)], components: [] });
          }

          await interaction.deferUpdate();
          const guild3v3 = interaction.guild;
          const channel3v3 = await guild3v3.channels.create({
            name: `pvp-3v3-${p1IdChallenge.slice(-4)}-vs-${p2IdChallenge.slice(-4)}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              { id: guild3v3.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
              { id: p1IdChallenge, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
              { id: p2IdChallenge, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
            ]
          });

          const battle3v3 = BattleEngine.startTeamBattle(p1IdChallenge, p2IdChallenge, channel3v3.id, false);
          battle3v3.p2DisplayName = interaction.member?.displayName || interaction.user.username;
          try { const _m1 = await guild3v3.members.fetch(p1IdChallenge); battle3v3.p1DisplayName = _m1.displayName; } catch (_) {}
          const embed3v3 = EmbedManager.createBattleEmbed(battle3v3);
          const components3v3 = ButtonManager.createActionComponents(battle3v3.id, battle3v3.getCurrentPlayer(), false, battle3v3);

          await channel3v3.send({
            content: `⚔️ **BATALHA 3v3 CASUAL INICIADA!** ⚔️\n<@${p1IdChallenge}> vs <@${p2IdChallenge}>`,
            embeds: [embed3v3],
            components: components3v3
          });

          return interaction.editReply({ embeds: [EmbedManager.createStatusEmbed(`Batalha 3v3 iniciada no canal <#${channel3v3.id}>!`, true)], components: [] });
        }

        // 1v1 Casual
        const p1 = playerRepository.getPlayer(p1IdChallenge);
        const p2 = playerRepository.getPlayer(p2IdChallenge);
        const inst1 = playerRepository.getCharacterInstance(p1.equipped_instance_id);
        const inst2 = playerRepository.getCharacterInstance(p2.equipped_instance_id);

        // Criar canal temporário para PVP Casual também (conforme pedido: "quando usa o boss rush ou o pvp ele deve criar um canal temporário")
        await interaction.deferUpdate();
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
        battle.p2DisplayName = interaction.member?.displayName || interaction.user.username;
        try { const _m1 = await guild.members.fetch(p1IdChallenge); battle.p1DisplayName = _m1.displayName; } catch (_) {}
        const embed = EmbedManager.createBattleEmbed(battle);
        const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);

        await channel.send({
          content: `⚔️ **BATALHA INICIADA!** ⚔️\n<@${p1IdChallenge}> vs <@${p2IdChallenge}>`,
          embeds: [embed],
          components: components
        });

        return interaction.editReply({ embeds: [EmbedManager.createStatusEmbed(`Batalha iniciada no canal <#${channel.id}>!`, true)], components: [] });
      }
    }

    // 1.05 — Seleção de time 3v3 (select menu)
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("pvp_team_select_")) {
      const ownerId = interaction.customId.replace("pvp_team_select_", "");
      if (interaction.user.id !== ownerId) return interaction.reply({ content: "Apenas o dono pode selecionar o time!", ephemeral: true });

      const selected = interaction.values; // array de instId strings
      if (selected.length !== 3) return interaction.reply({ content: "❌ Selecione exatamente 3 personagens.", ephemeral: true });

      BattleEngine.setRankedTeam(ownerId, selected);

      const teamInfo = selected.map((instId, i) => {
        const inst = playerRepository.getCharacterInstance(instId);
        const charDef = CharacterManager.getCharacter(inst.character_id, inst);
        return `${i + 1}. **${charDef.name}** [Lv${inst.level}]`;
      }).join("\n");

      const confirmEmbed = new EmbedBuilder()
        .setTitle("🏆 Ranqueado 3v3 — Confirmar Time")
        .setDescription(`Time selecionado:\n\n${teamInfo}\n\nConfirme para entrar na fila!`)
        .setColor("#FFD700");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`pvp_team_confirm_${ownerId}`).setLabel("✅ Confirmar e Entrar na Fila").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`pvp_team_change_${ownerId}`).setLabel("🔄 Mudar Time").setStyle(ButtonStyle.Secondary)
      );
      return interaction.update({ embeds: [confirmEmbed], components: [row] });
    }

    // 1.06 — Botões de confirmação/mudança de time 3v3
    if (interaction.isButton() && interaction.customId.startsWith("pvp_team_")) {
      const parts = interaction.customId.split("_");
      const action = parts[2]; // "confirm" or "change"
      const ownerId = parts[3];
      if (interaction.user.id !== ownerId) return interaction.reply({ content: "Apenas o dono pode usar isso!", ephemeral: true });

      if (action === "change") {
        const chars = playerRepository.getPlayerCharacters(ownerId);
        if (chars.length < 3) return interaction.reply({ content: "❌ Você precisa de ao menos 3 personagens!", ephemeral: true });
        const options = chars.slice(0, 25).map(inst => {
          const charDef = CharacterManager.getCharacter(inst.character_id, inst);
          return { label: `${charDef.name} [Lv${inst.level}]`, value: String(inst.id), description: `Raridade: ${charDef.rarity}` };
        });
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`pvp_team_select_${ownerId}`)
          .setPlaceholder("Selecione 3 personagens")
          .setMinValues(3).setMaxValues(3)
          .addOptions(options);
        const selEmbed = new EmbedBuilder()
          .setTitle("🏆 Ranqueado 3v3 — Escolha seu Time")
          .setDescription("Selecione **3 personagens**. O primeiro será o inicial em campo.")
          .setColor("#FFD700");
        return interaction.update({ embeds: [selEmbed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
      }

      if (action === "confirm") {
        const status = BattleEngine.canStartBattle(ownerId);
        if (!status.can) return interaction.reply({ embeds: [EmbedManager.createStatusEmbed(status.reason, false)], ephemeral: true });

        const savedTeam = BattleEngine.getRankedTeam(ownerId);
        if (!savedTeam) return interaction.reply({ content: "❌ Selecione um time primeiro!", ephemeral: true });

        BattleEngine.addToTeamQueue(ownerId);
        await interaction.update({
          embeds: [EmbedManager.createStatusEmbed("Você entrou na fila 3v3! Procurando oponente...", true)],
          components: []
        });

        // Anúncio no canal de fila
        const queueChannelId = "1487958808897781780";
        try {
          const qChannel = await interaction.client.channels.fetch(queueChannelId);
          if (qChannel) {
            const p1Data = playerRepository.getPlayer(ownerId);
            const teamNames = savedTeam.map(id => {
              const inst = playerRepository.getCharacterInstance(id);
              return CharacterManager.getCharacter(inst.character_id, inst).name;
            }).join(", ");
            await qChannel.send({ embeds: [new EmbedBuilder()
              .setTitle("🏆 Nova Fila 3v3 Ranqueada!")
              .setDescription(`<@${ownerId}> entrou na fila 3v3!\nTime: **${teamNames}**`)
              .addFields({ name: "Rank", value: `**${p1Data.rank}** (${p1Data.pa} PA)`, inline: true })
              .setColor("#FFD700")] });
          }
        } catch (e) { console.error("Erro ao anunciar fila 3v3:", e); }

        // Tentar matchmaking 3v3
        const queue = BattleEngine.rankedTeamQueue;
        const p1Data = playerRepository.getPlayer(ownerId);
        for (const entry of queue) {
          if (entry.playerId === ownerId) continue;
          const p2Data = playerRepository.getPlayer(entry.playerId);
          if (RankManager.canFight(p1Data.rank, p2Data.rank)) {
            BattleEngine.removeFromTeamQueue(ownerId);
            BattleEngine.removeFromTeamQueue(entry.playerId);

            const guild = interaction.guild;
            const channel = await guild.channels.create({
              name: `3v3-${ownerId.slice(-4)}-vs-${entry.playerId.slice(-4)}`,
              type: ChannelType.GuildText,
              permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: ownerId, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
                { id: entry.playerId, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
              ]
            });

            const battle = BattleEngine.startTeamBattle(ownerId, entry.playerId, channel.id);
            try {
              const m1 = await interaction.guild.members.fetch(ownerId);
              const m2 = await interaction.guild.members.fetch(entry.playerId);
              battle.p1DisplayName = m1.displayName;
              battle.p2DisplayName = m2.displayName;
            } catch (_) {}
            const embed = EmbedManager.createBattleEmbed(battle);
            const components = ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);

            const battleMsg = await channel.send({
              content: `⚔️ **3v3 RANQUEADO INICIADO!** ⚔️\n<@${ownerId}> vs <@${entry.playerId}>\n\nCada jogador tem 3 personagens. Quando um cair, o próximo entra automaticamente!`,
              embeds: [embed],
              components
            });
            battle.lastMessageId = battleMsg.id;

            return interaction.followUp({ content: `🎮 Partida 3v3 encontrada! Canal: <#${channel.id}>`, ephemeral: true });
          }
        }
        return; // Na fila, aguardando oponente
      }
    }

    // 1.06b — Salvar time 3v3 via !equip
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("equip_team_select_")) {
      const ownerId = interaction.customId.replace("equip_team_select_", "");
      if (interaction.user.id !== ownerId) return interaction.reply({ content: "Apenas o dono pode usar isso!", ephemeral: true });
      const selected = interaction.values;
      if (selected.length !== 3) return interaction.reply({ content: "❌ Selecione exatamente 3 personagens.", ephemeral: true });

      const teamInfo = selected.map((instId, i) => {
        const inst = playerRepository.getCharacterInstance(instId);
        const c = CharacterManager.getCharacter(inst.character_id, inst);
        return `${i + 1}. **${c.name}** [Lv${inst.level}]`;
      }).join("\n");

      const confirmEmbed = new EmbedBuilder()
        .setTitle("👥 Confirmar Time 3v3")
        .setDescription(`**Time selecionado:**\n\n${teamInfo}\n\nConfirme para salvar.`)
        .setColor("#1a1a2e")
        .setFooter({ text: "Este time será usado no PVP ranqueado e no mundo JJK+." });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`equip_team_save_${ownerId}_${selected.join(",")}`).setLabel("✅ Salvar Time").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`equip_choice_team_${ownerId}`).setLabel("🔄 Mudar").setStyle(ButtonStyle.Secondary)
      );
      return interaction.update({ embeds: [confirmEmbed], components: [row] });
    }

    if (interaction.isButton() && interaction.customId.startsWith("equip_team_save_")) {
      const rest = interaction.customId.replace("equip_team_save_", "");
      const sepIdx = rest.indexOf("_");
      const ownerId = rest.substring(0, sepIdx);
      const instIds = rest.substring(sepIdx + 1).split(",");
      if (interaction.user.id !== ownerId) return interaction.reply({ content: "Apenas o dono pode usar isso!", ephemeral: true });

      BattleEngine.setRankedTeam(ownerId, instIds);

      const teamInfo = instIds.map((instId, i) => {
        const inst = playerRepository.getCharacterInstance(instId);
        const c = CharacterManager.getCharacter(inst.character_id, inst);
        return `${i + 1}. **${c.name}** [Lv${inst.level}]`;
      }).join("\n");

      const doneEmbed = new EmbedBuilder()
        .setTitle("✅ Time 3v3 Salvo!")
        .setDescription(`Seu time foi configurado:\n\n${teamInfo}\n\nEle será usado no **PVP Ranqueado** e no **Modo História a partir do mundo JJK**.`)
        .setColor("#2d6a4f")
        .setFooter({ text: "Use !equip → Time 3v3 para alterar quando quiser." });

      return interaction.update({ embeds: [doneEmbed], components: [] });
    }

    // 1.07 — Troca de personagem em 3v3
    if (interaction.isButton() && interaction.customId.startsWith("focus_rika_")) {
      const battleId = interaction.customId.replace("focus_rika_", "");
      const battle = BattleEngine.getBattle(battleId);
      if (!battle || battle.state !== "choosing_action") return interaction.reply({ content: "❌ Não é possível agora.", ephemeral: true });
      if (battle.currentPlayerTurnId !== interaction.user.id) return interaction.reply({ content: "❌ Não é seu turno!", ephemeral: true });

      battle.focusingRika = !battle.focusingRika;

      const currentChar = battle.getCurrentPlayer();
      const components = ButtonManager.createActionComponents(battle.id, currentChar, false, battle);
      const embed = EmbedManager.createBattleEmbed(battle);
      return interaction.update({ embeds: [embed], components });
    }

    if (interaction.isButton() && interaction.customId.startsWith("focus_vimana_")) {
      const battleId = interaction.customId.replace("focus_vimana_", "");
      const battle = BattleEngine.getBattle(battleId);
      if (!battle || battle.state !== "choosing_action") return interaction.reply({ content: "❌ Não é possível agora.", ephemeral: true });
      if (battle.currentPlayerTurnId !== interaction.user.id) return interaction.reply({ content: "❌ Não é seu turno!", ephemeral: true });

      battle.focusingVimana = !battle.focusingVimana;

      const currentChar = battle.getCurrentPlayer();
      const components = ButtonManager.createActionComponents(battle.id, currentChar, false, battle);
      const embed = EmbedManager.createBattleEmbed(battle);
      return interaction.update({ embeds: [embed], components });
    }

    if (interaction.isButton() && interaction.customId.startsWith("vimana_skip_")) {
      const battleId = interaction.customId.replace("vimana_skip_", "");
      const battle = BattleEngine.getBattle(battleId);
      if (!battle || !battle.vimanaPhase) return interaction.reply({ content: "❌ Não há fase de Vimana ativa.", ephemeral: true });
      if (battle.currentPlayerTurnId !== interaction.user.id) return interaction.reply({ content: "❌ Não é seu turno!", ephemeral: true });

      battle.vimanaPhase = false;
      battle.lastActionMessage += `\n🚀 **Gilgamesh** pulou o ataque da Vimana.`;
      battle.switchTurn();
      BattleEngine.endTurnUpdate(battle);
      if (battle.state !== "finished" && battle.state !== "waiting_next_floor") battle.state = "choosing_action";

      const embed = EmbedManager.createBattleEmbed(battle);
      if (battle.state === "finished") {
        return interaction.update({ embeds: [embed], components: [] });
      }
      const currentChar = battle.getCurrentPlayer();
      const isPveBossTurn = battle.isPve && battle.currentPlayerTurnId === battle.player2Id;
      const components = ButtonManager.createActionComponents(battle.id, currentChar, isPveBossTurn, battle);
      return interaction.update({ embeds: [embed], components });
    }

    if (interaction.isButton() && interaction.customId.startsWith("team_swap_")) {
      const battleId = interaction.customId.replace("team_swap_", "");
      const battle = BattleEngine.getBattle(battleId);
      if (!battle || battle.state !== "choosing_action") return interaction.reply({ content: "❌ Não é possível trocar agora.", ephemeral: true });
      if (battle.currentPlayerTurnId !== interaction.user.id) return interaction.reply({ content: "❌ Não é seu turno!", ephemeral: true });

      const isP1 = interaction.user.id === battle.player1Id;
      const team = isP1 ? battle.p1Team : battle.p2Team;
      const activeIdx = isP1 ? battle.p1ActiveIdx : battle.p2ActiveIdx;

      const benchOptions = team
        .map((c, i) => ({ c, i }))
        .filter(({ c, i }) => i !== activeIdx && c.isAlive())
        .map(({ c, i }) => ({ label: `${c.name} [Lv${c.level}] — ${c.health}/${c.maxHealth} HP`, value: String(i) }));

      if (benchOptions.length === 0) return interaction.reply({ content: "❌ Sem personagens no banco para trocar.", ephemeral: true });

      const swapMenu = new StringSelectMenuBuilder()
        .setCustomId(`team_doswap_${battleId}`)
        .setPlaceholder("Escolha o personagem para entrar em campo")
        .addOptions(benchOptions);

      return interaction.reply({ content: "Escolha quem entra em campo (gasta o turno):", components: [new ActionRowBuilder().addComponents(swapMenu)], ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("team_doswap_")) {
      const battleId = interaction.customId.replace("team_doswap_", "");
      const newIdx = parseInt(interaction.values[0]);

      await interaction.deferUpdate();

      const battle = BattleEngine.processTeamSwap(battleId, interaction.user.id, newIdx);
      if (!battle) {
        await interaction.editReply({ content: "❌ Troca inválida.", components: [] });
        return;
      }

      await interaction.editReply({ content: "✅ Personagem trocado!", components: [] });

      const embed = EmbedManager.createBattleEmbed(battle);
      const components = battle.state === "finished" ? [] : ButtonManager.createActionComponents(battle.id, battle.getCurrentPlayer(), false, battle);
      await safeEditBattleMessage(interaction.client, battle, { embeds: [embed], components });
      return;
    }

    // 1.1 Lógica de Abandono de Combate
    if (interaction.isButton() && interaction.customId.includes("_abandon")) {
      const parts = interaction.customId.split("_");
      const battleId = parts[1];
      const battle = BattleEngine.getBattle(battleId);

      // Batalha já encerrada: ignora silenciosamente se o canal está sendo deletado
      if (!battle) {
        try { await interaction.reply({ content: "Este combate já foi encerrado.", ephemeral: true }); } catch (_) {}
        return;
      }

      // Verificar se o jogador faz parte da batalha
      const isP1 = battle.player1Id === interaction.user.id;
      const isP2 = battle.player2Id === interaction.user.id;
      const isParty = battle.partyMembers && battle.partyMembers.includes(interaction.user.id);
      const isTeam2 = battle.team2 && battle.team2.includes(interaction.user.id);

      if (!isP1 && !isP2 && !isParty && !isTeam2) {
        try { await interaction.reply({ content: "Você não faz parte deste combate!", ephemeral: true }); } catch (_) {}
        return;
      }

      const result = BattleEngine.abandonBattle(battleId, interaction.user.id);

      try {
        if (result === "voted") {
          await interaction.reply({ content: `✅ Você votou para abandonar! (${battle.abandonVotes.size}/2)`, ephemeral: true });
        } else if (result) {
          const embed = EmbedManager.createBattleEmbed(result);

          if (result.channelId) {
            setTimeout(async () => {
              try {
                const channel = await interaction.client.channels.fetch(result.channelId);
                if (channel) await channel.delete("Combate abandonado");
              } catch (e) { console.error("Erro ao deletar canal:", e); }
            }, 10000);
          }

          await interaction.update({ embeds: [embed], components: [] });
        } else {
          await interaction.reply({ content: "Erro ao tentar abandonar o combate.", ephemeral: true });
        }
      } catch (e) {
        if (e.code !== 10003 && e.code !== 10062) console.error("Erro no abandon:", e);
      }
      return;
    }

    // 1.2 Lógica de Boss Rush
    if (interaction.isButton() && interaction.customId.startsWith("bossrush_")) {
      const parts = interaction.customId.split("_");
      const action = parts[1];
      const bossId = parts[2];

      if (action === "refuse") {
        const refuseName = interaction.member?.displayName || interaction.user.username;
        return interaction.update({
          embeds: [EmbedManager.createStatusEmbed(`**${refuseName}** recusou o desafio de Boss Rush.`, false)],
          components: []
        });
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
            return interaction.update({ embeds: [EmbedManager.createStatusEmbed(reason, false)], components: [] });
          }
        }

        // Criar canal temporário para Boss Rush
        await interaction.deferUpdate();
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

        await channel.send({ embeds: [embed], components: components });

        return interaction.editReply({ embeds: [EmbedManager.createStatusEmbed(`🔥 Boss Rush iniciado! Vá para <#${channel.id}>.`, true)], components: [] });
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

    // 1.4 Lógica de Seleção de Sombra (Sung Jin-Woo)
    if (isMenu && type === "shadow") {
      const battleId = parts[1];
      const battle = BattleEngine.getBattle(battleId);
      if (!battle) return interaction.reply({ content: "Combate não encontrado.", ephemeral: true });
      if (battle.state === "finished") return interaction.reply({ content: "A batalha terminou!", ephemeral: true });
      if (interaction.user.id !== battle.currentPlayerTurnId) return interaction.reply({ content: "Não é seu turno!", ephemeral: true });

      const shadowId = interaction.values[0];
      const updatedBattle = BattleEngine.processShadowChoice(battleId, interaction.user.id, shadowId);
      if (!updatedBattle) return interaction.reply({ content: "Erro ao selecionar sombra.", ephemeral: true });

      const shadowEmbed = EmbedManager.createBattleEmbed(updatedBattle);
      const shadowComponents = ButtonManager.createActionComponents(battleId, updatedBattle.getCurrentPlayer(), false, updatedBattle);

      // Automação PvE: boss não precisa selecionar sombra
      return interaction.update({ embeds: [shadowEmbed], components: shadowComponents });
    }

    if (["menu", "recover", "reaction"].includes(type)) {
      const battleId = parts[1];
      const actionId = parts.slice(2).join("_");
      const battle = BattleEngine.getBattle(battleId);
      const safeReply = async (content) => {
        try { await interaction.reply({ content, ephemeral: true }); } catch (_) {}
      };
      if (!battle) return safeReply("Batalha expirada.");
      if (battle.state === "finished") return safeReply("A batalha terminou!");

      let updatedBattle = null;

      if (isMenu && type === "menu") {
        if (interaction.user.id !== battle.currentPlayerTurnId) return safeReply("Não é seu turno!");
        const selectedSkillId = interaction.values[0];
        updatedBattle = BattleEngine.processAction(battleId, interaction.user.id, selectedSkillId);
        if (!updatedBattle) return safeReply("Ação inválida.");
      }

      if (isButton && type === "recover") {
        if (interaction.user.id !== battle.currentPlayerTurnId) return safeReply("Não é seu turno!");
        updatedBattle = BattleEngine.processRecoverEnergy(battleId, interaction.user.id);
        if (!updatedBattle) return safeReply("Erro ao recuperar energia.");
      }

      let reactionGifUrl = null;
      if (isButton && type === "reaction") {
        if (interaction.user.id !== battle.getOpponentId()) return safeReply("Não é sua vez!");
        const reactingPlayer = battle.getOpponentPlayer();
        const reactionSkill = reactingPlayer?.skills?.find(s => s.id === actionId);
        reactionGifUrl = reactionSkill?.gifUrl || null;

        updatedBattle = BattleEngine.processReaction(battleId, interaction.user.id, actionId);
        if (!updatedBattle) return safeReply("Erro na reação.");

        // Frieren counter: usa gif diferente se o contra-ataque disparou
        if (updatedBattle.lastReactionGifOverride) {
          reactionGifUrl = updatedBattle.lastReactionGifOverride;
          updatedBattle.lastReactionGifOverride = null;
        }
      }

      // Buff GIF (ex: Determinação do Shinji) — mostra antes do resultado
      const buffGifUrl = updatedBattle?.lastBuffGifUrl || null;
      if (updatedBattle && updatedBattle.lastBuffGifUrl) updatedBattle.lastBuffGifUrl = null;

      if (updatedBattle) {
        const embed = EmbedManager.createBattleEmbed(updatedBattle);
        let components = [];
        if (updatedBattle.state === "finished") {
          components = []; // Sem botões — batalha encerrada

          if (updatedBattle.isTutorial) {
            // Tutorial battle: don't delete channel — tutorial handles its own cleanup
            tutorialCommand.onBattleEnd(updatedBattle, interaction.client);
          } else if (updatedBattle.channelId) {
            setTimeout(async () => {
              try {
                const channel = await interaction.client.channels.fetch(updatedBattle.channelId);
                if (channel) await channel.delete("Combate finalizado");
              } catch (e) { console.error("Erro ao deletar canal:", e); }
            }, 10000);
          }
        } else if (updatedBattle.state === "waiting_next_floor") {
          components = ButtonManager.createActionComponents(battleId, updatedBattle.getCurrentPlayer(), false, updatedBattle);
        } else if (updatedBattle.state === "choosing_reaction") {
          const isBossTurn = updatedBattle.isPve && updatedBattle.getOpponentId() === updatedBattle.player2Id;
          components = ButtonManager.createReactionButtons(battleId, updatedBattle.getOpponentPlayer(), isBossTurn);
        } else if (updatedBattle.state === "choosing_action") {
          const isBossTurn = updatedBattle.isPve && updatedBattle.currentPlayerTurnId === updatedBattle.player2Id;
          components = ButtonManager.createActionComponents(battleId, updatedBattle.getCurrentPlayer(), isBossTurn, updatedBattle);
        }

        // Salvar referência da mensagem ANTES do update para uso nas atualizações automáticas do boss
        const battleMessage = interaction.message;
        updatedBattle.lastMessageId = battleMessage.id;

        if (buffGifUrl) {
          // Mostra o GIF do buff (ex: Determinação) por 3s antes do próximo estado
          const gifEmbed = EmbedManager.createBattleEmbed(updatedBattle);
          gifEmbed.setImage(buffGifUrl);
          await interaction.update({ embeds: [gifEmbed], components: [] });
          await new Promise(r => setTimeout(r, 3000));
          await battleMessage.edit({ embeds: [embed], components }).catch(() => {});
        } else if (reactionGifUrl) {
          // Mostra o GIF da reação por 5s antes do resultado final
          const gifEmbed = EmbedManager.createBattleEmbed(updatedBattle);
          gifEmbed.setImage(reactionGifUrl);
          await interaction.update({ embeds: [gifEmbed], components: [] });
          await new Promise(r => setTimeout(r, 5000));
          await battleMessage.edit({ embeds: [embed], components }).catch(() => {});
        } else {
          await interaction.update({ embeds: [embed], components: components });
        }

        // ✅ AUTOMAÇÃO PVE CENTRALIZADA: Reação e Turno do Boss
        if (updatedBattle.isPve) {
          // Helper: build components for any battle state
          const buildComponents = (b) => {
            if (b.state === "finished") return [];
            if (b.state === "choosing_reaction") {
              const isBR = b.getOpponentId() === b.player2Id;
              return ButtonManager.createReactionButtons(b.id, b.getOpponentPlayer(), isBR);
            }
            const isBT = b.currentPlayerTurnId === b.player2Id;
            return ButtonManager.createActionComponents(b.id, b.getCurrentPlayer(), isBT, b);
          };

          // Helper: delete battle channel after delay
          const scheduleChannelDelete = (b, reason) => {
            if (!b.channelId) return;
            setTimeout(async () => {
              try {
                const ch = await interaction.client.channels.fetch(b.channelId);
                if (ch) await ch.delete(reason);
              } catch (e) { console.error(`Erro ao deletar canal (${reason}):`, e); }
            }, 10000);
          };

          const pveCli = interaction.client;

          // Helper: executa o ataque do boss e atualiza a mensagem
          const executeBossAttack = async () => {
            const fresh = BattleEngine.getBattle(battleId);
            if (!fresh || fresh.state !== "choosing_action" || fresh.currentPlayerTurnId !== fresh.player2Id) return;
            if (fresh.bossProcessing) {
              const age = fresh.bossProcessingAt ? (Date.now() - fresh.bossProcessingAt) : Infinity;
              if (age < 10000) return;
              fresh.bossProcessing = false;
            }
            fresh.bossProcessing = true;
            fresh.bossProcessingAt = Date.now();
            try {
              const attackBattle = BattleEngine.processBossTurn(fresh);
              if (!attackBattle) { fresh.bossProcessing = false; return; }
              if (attackBattle.state === "finished") {
                if (attackBattle.isTutorial) tutorialCommand.onBattleEnd(attackBattle, pveCli);
                else scheduleChannelDelete(attackBattle, "Combate finalizado pelo Boss");
              }
              await safeEditBattleMessage(pveCli, attackBattle, {
                embeds: [EmbedManager.createBattleEmbed(attackBattle)],
                components: buildComponents(attackBattle),
              });
            } catch (e) {
              console.error("Erro no ataque do boss:", e);
            } finally {
              const b = BattleEngine.getBattle(battleId);
              if (b) b.bossProcessing = false;
            }
          };

          // 1. Reação do Boss
          if (updatedBattle.state === "choosing_reaction" && updatedBattle.getOpponentId() === updatedBattle.player2Id) {
            setTimeout(async () => {
              try {
                const freshForReaction = BattleEngine.getBattle(battleId);
                if (!freshForReaction || freshForReaction.state !== "choosing_reaction") return;
                if (freshForReaction.bossProcessing) {
                  const age = freshForReaction.bossProcessingAt ? (Date.now() - freshForReaction.bossProcessingAt) : Infinity;
                  if (age < 10000) return;
                  freshForReaction.bossProcessing = false;
                }
                freshForReaction.bossProcessing = true;
                freshForReaction.bossProcessingAt = Date.now();

                const reactionBattle = BattleEngine.processBossReaction(freshForReaction);
                freshForReaction.bossProcessing = false;

                if (!reactionBattle) return;

                if (reactionBattle.state === "finished") {
                  if (reactionBattle.isTutorial) tutorialCommand.onBattleEnd(reactionBattle, pveCli);
                  else scheduleChannelDelete(reactionBattle, "Combate finalizado na reação");
                  await safeEditBattleMessage(pveCli, reactionBattle, {
                    embeds: [EmbedManager.createBattleEmbed(reactionBattle)],
                    components: [],
                  });
                  return;
                }

                await safeEditBattleMessage(pveCli, reactionBattle, {
                  embeds: [EmbedManager.createBattleEmbed(reactionBattle)],
                  components: buildComponents(reactionBattle),
                });

                // 2. Ataque do Boss após reagir
                if (reactionBattle.state === "choosing_action" && reactionBattle.currentPlayerTurnId === reactionBattle.player2Id) {
                  setTimeout(() => executeBossAttack(), 1500);
                }
              } catch (e) {
                console.error("Erro na reação do boss:", e);
                const b = BattleEngine.getBattle(battleId);
                if (b) b.bossProcessing = false;
              }
            }, 1500);
          }
          // 3. Ataque Direto do Boss (ex: após player usar buff ou recuperar energia)
          else if (updatedBattle.state === "choosing_action" && updatedBattle.currentPlayerTurnId === updatedBattle.player2Id) {
            setTimeout(() => executeBossAttack(), 1500);
          }
        }
      }
    }

    // --- Lógica de Navegação de Missões ---
    if (interaction.isButton() && interaction.customId.startsWith("show_daily_missions_")) {
      const parts = interaction.customId.split("_");
      const playerId = parts[parts.length - 1];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua sessão de missões!", ephemeral: true });
      const { embeds, components } = missionsCommand.createDailyMissionsEmbed(playerId);
      return interaction.update({ embeds, components });
    }

    if (interaction.isButton() && interaction.customId.startsWith("show_weekly_missions_")) {
      const parts = interaction.customId.split("_");
      const playerId = parts[parts.length - 1];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua sessão de missões!", ephemeral: true });
      const { embeds, components } = missionsCommand.createWeeklyMissionsEmbed(playerId);
      return interaction.update({ embeds, components });
    }

    if (interaction.isButton() && interaction.customId.startsWith("missions_main_menu_")) {
      const parts = interaction.customId.split("_");
      const playerId = parts[parts.length - 1];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua sessão de missões!", ephemeral: true });
      const { embeds, components } = missionsCommand.createMainMenuEmbed(playerId);
      return interaction.update({ embeds, components });
    }

    if (interaction.isButton() && interaction.customId.startsWith("show_level_missions_")) {
      const parts = interaction.customId.split("_");
      const playerId = parts[parts.length - 1];
      if (interaction.user.id !== playerId) return interaction.reply({ content: "Esta não é a sua sessão de missões!", ephemeral: true });
      const { embeds, components } = missionsCommand.createLevelMissionsEmbed(playerId);
      return interaction.update({ embeds, components });
    }

    if (interaction.isButton() && interaction.customId.startsWith("claim_level_milestone_")) {
      // customId: claim_level_milestone_{lvl}_{userId}
      const parts = interaction.customId.split("_");
      const userId = interaction.user.id;
      const lvl = parseInt(parts[3]);
      const ownerId = parts[4];
      if (userId !== ownerId) return interaction.reply({ content: "Esta não é a sua sessão!", ephemeral: true });

      const missionId = `level_milestone_${lvl}`;
      if (missionRepository.isClaimed(userId, missionId)) {
        return interaction.reply({ content: "❌ Você já resgatou esta recompensa.", ephemeral: true });
      }

      const player = playerRepository.getPlayer(userId);
      if ((player.level || 1) < lvl) {
        return interaction.reply({ content: `❌ Você ainda não atingiu o nível ${lvl}.`, ephemeral: true });
      }

      playerRepository.updatePlayer(userId, {
        zenith_fragments: (player.zenith_fragments || 0) + missionsCommand.LEVEL_REWARD_ZENITH
      });
      missionRepository.claimReward(userId, missionId);

      const { embeds, components } = missionsCommand.createLevelMissionsEmbed(userId);
      return interaction.update({
        content: `✅ **Recompensa de Nível ${lvl} resgatada!** +${missionsCommand.LEVEL_REWARD_ZENITH} ${require("../config/emojis").ZENITH}`,
        embeds,
        components
      });
    }

    // --- Lógica de Resgate de Missões ---
    if (interaction.isButton() && interaction.customId.startsWith("claim_mission_")) {
      const parts = interaction.customId.split("_");
      const missionId = parts.slice(2).join("_");
      const userId = interaction.user.id;

      const missions = missionRepository.getGlobalMissions();
      const allMissions = [...missions.daily, ...missions.weekly];
      const mission = allMissions.find(m => m.id === missionId);

      if (!mission) return interaction.reply({ content: "Missão não encontrada ou expirada.", ephemeral: true });
      if (missionRepository.isClaimed(userId, missionId)) return interaction.reply({ content: "Você já resgatou esta recompensa!", ephemeral: true });

      const progress = missionRepository.getProgress(userId, missionId);
      if (progress < mission.goal) return interaction.reply({ content: "Você ainda não completou esta missão!", ephemeral: true });

      // Entregar Recompensas
      const player = playerRepository.getPlayer(userId);
      playerRepository.updatePlayer(userId, {
        zenith_fragments: player.zenith_fragments + mission.reward.zenith
      });
      playerRepository.addItem(userId, mission.reward.soulStone.id, mission.reward.soulStone.qty);
      missionRepository.claimReward(userId, missionId);

      // XP de conta: diária +80, semanal +200
      const isWeekly = missions.weekly.some(m => m.id === missionId);
      const missionAccountXP = isWeekly ? 200 : 80;
      const xpResult = playerRepository.addPlayerXP(userId, missionAccountXP);

      // Atualizar a interface de missões
      let updatedEmbed, updatedComponents;
      if (mission.id.startsWith("win_pvp_casual") || mission.id.startsWith("win_pvp_ranked") || mission.id.startsWith("play_boss_rush") || mission.id.startsWith("win_challenge") || mission.id.startsWith("win_tower_floor") || mission.id.startsWith("level_up_10") || mission.id.startsWith("use_soul_stones")) {
        ({ embeds: [updatedEmbed], components: updatedComponents } = missionsCommand.createDailyMissionsEmbed(userId));
      } else {
        ({ embeds: [updatedEmbed], components: updatedComponents } = missionsCommand.createWeeklyMissionsEmbed(userId));
      }

      const levelUpLine = xpResult.leveledUp ? `\n🆙 Você subiu para o **Nível ${xpResult.newLevel}**!` : "";

      return interaction.update({
        content: `✅ Recompensa resgatada: **${mission.reward.zenith} Fragmentos Zenith** e **${mission.reward.soulStone.qty}x Pedra da Alma ${mission.reward.soulStone.id.split('_')[2].toUpperCase()}**!${levelUpLine}`,
        embeds: [updatedEmbed],
        components: updatedComponents
      });
    }
  }
};
