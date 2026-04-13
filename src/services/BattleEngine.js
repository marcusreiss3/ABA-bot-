const Battle = require("../models/Battle");
const CharacterManager = require("./CharacterManager");
const playerRepository = require("../database/repositories/playerRepository");
const storyConfig = require("../config/storyConfig.js");
const towerConfig = require("../config/towerConfig.js");
const Emojis = require("../config/emojis.js");

class BattleEngine {
  constructor() {
    this.activeBattles = new Map();
  }

  startBattle(player1Id, player2Id, p1Instance, p2Instance, isPve = false, partyMembers = null, isRanked = false, channelId = null) {
    const battleId = Math.random().toString(36).substring(2, 9);
    const character1 = CharacterManager.getCharacter(p1Instance.character_id, p1Instance);
    const character2 = CharacterManager.getCharacter(p2Instance.character_id, p2Instance);

    let turnOrder;
    if (isPve) {
      if (partyMembers && partyMembers.length > 1) {
        // Party no PVE: Líder, depois membros, depois boss
        turnOrder = [...partyMembers, player2Id];
        
        character1.ownerId = player1Id;
      } else {
        turnOrder = [player1Id, player2Id];
        character1.ownerId = player1Id;
      }

      // Aplicar Buff ao Boss baseado no tamanho da party
      const partySize = partyMembers ? partyMembers.length : 1;
      if (partySize > 1) {
        const extraMembers = partySize - 1;
        const healthMultiplier = 1 + extraMembers * 0.3; // 30% a mais de vida por pessoa extra
        const damageMultiplier = 1 + extraMembers * 0.5; // 50% a mais de dano por pessoa extra
        const energyMultiplier = 1 + extraMembers * 0.3; // 30% a mais de energia por pessoa extra

        character2.maxHealth = Math.floor(character2.maxHealth * healthMultiplier);
        character2.health = character2.maxHealth;
        
        character2.maxEnergy = Math.floor(character2.maxEnergy * energyMultiplier);
        character2.energy = character2.maxEnergy;

        character2.skills.forEach(s => {
          if (s.damage) s.damage = Math.floor(s.damage * damageMultiplier);
        });
      }
    } else {
      turnOrder = Math.random() < 0.5 ? [player1Id, player2Id] : [player2Id, player1Id];
      character1.ownerId = player1Id;
      character2.ownerId = player2Id;
    }
    
    const currentPlayerTurnId = turnOrder[0];

    const battle = new Battle({
      id: battleId,
      player1Id,
      player2Id,
      character1,
      character2,
      turnOrder,
      currentPlayerTurnId,
      state: "choosing_action",
      lastActionMessage: isPve ? `Você desafiou o boss **${character2.name}**! Sua vez.` : "A batalha começou! O destino decidirá quem ataca primeiro."
    });
    
    battle.isPve = isPve;
    if (isPve && partyMembers) {
      battle.partyMembers = partyMembers;
      // Guardar instâncias dos personagens da party
      battle.partyCharacters = partyMembers.map(id => {
        const p = playerRepository.getPlayer(id);
        const inst = playerRepository.getCharacterInstance(p.equipped_instance_id);
        const char = CharacterManager.getCharacter(inst.character_id, inst);
        char.ownerId = id;
        return char;
      });

      // ✅ ESCALONAMENTO (SCALING) PARA PARTY (EXATAMENTE COMO NO MODO HISTÓRIA)
      const partySize = partyMembers.length;
      if (partySize > 1) {
        const extraMembers = partySize - 1;
        const healthMultiplier = 1 + extraMembers * 0.3; // 30% a mais de vida por pessoa extra
        const damageMultiplier = 1 + extraMembers * 0.5; // 50% a mais de dano por pessoa extra
        const energyMultiplier = 1 + extraMembers * 0.3; // 30% a mais de energia por pessoa extra

        character2.maxHealth = Math.floor(character2.maxHealth * healthMultiplier);
        character2.health = character2.maxHealth;
        
        character2.maxEnergy = Math.floor(character2.maxEnergy * energyMultiplier);
        character2.energy = character2.maxEnergy;

        character2.skills.forEach(s => {
          if (s.damage) s.damage = Math.floor(s.damage * damageMultiplier);
        });
      }
    }

    battle.startedAt = Date.now();
    battle.type = isPve ? "pve" : "pvp";
    battle.isRanked = isRanked;
    battle.channelId = channelId;
    this.activeBattles.set(battleId, battle);
    return battle;
  }

  startBossRush(bossId, team2Ids, channelId = null) {
    const battleId = Math.random().toString(36).substring(2, 9);
    
    // Boss (Player 1)
    const bossPlayer = playerRepository.getPlayer(bossId);
    const bossInstance = playerRepository.getCharacterInstance(bossPlayer.equipped_instance_id);
    const bossChar = CharacterManager.getCharacter(bossInstance.character_id, bossInstance);
    bossChar.ownerId = bossId;

    // Buffs massivos para o Boss (1v3)
    bossChar.maxHealth = Math.floor(bossChar.maxHealth * 3.5);
    bossChar.health = bossChar.maxHealth;
    bossChar.maxEnergy = Math.floor(bossChar.maxEnergy * 3.0);
    bossChar.energy = bossChar.maxEnergy;
    bossChar.skills.forEach(s => {
      if (s.damage) s.damage = Math.floor(s.damage * 2.5);
    });

    // Time desafiante
    const team2Characters = team2Ids.map(id => {
      const p = playerRepository.getPlayer(id);
      const inst = playerRepository.getCharacterInstance(p.equipped_instance_id);
      const char = CharacterManager.getCharacter(inst.character_id, inst);
      char.ownerId = id;
      return char;
    });

    // Ordem de turnos: Boss -> Player1 -> Player2 -> Player3
    const turnOrder = [bossId, ...team2Ids];
    const currentPlayerTurnId = turnOrder[0];

    const battle = new Battle({
      id: battleId,
      player1Id: bossId,
      player2Id: team2Ids[0], // Representante
      character1: bossChar,
      character2: team2Characters[0], // Será trocado dinamicamente no turno
      turnOrder,
      currentPlayerTurnId,
      state: "choosing_action",
      lastActionMessage: `🔥 **BOSS RUSH COMEÇOU!** <@${bossId}> está com buffs massivos contra o trio!`
    });

    battle.type = "boss-rush";
    battle.team2 = team2Ids;
    battle.partyCharacters = team2Characters; // Reutilizar campo de party para o time desafiante
    battle.startedAt = Date.now();
    battle.channelId = channelId;

    this.activeBattles.set(battleId, battle);
    return battle;
  }

  getBattle(battleId) {
    return this.activeBattles.get(battleId);
  }

  isPlayerInBattle(playerId) {
    for (const battle of this.activeBattles.values()) {
      if (battle.state === "finished") continue;
      if (battle.player1Id === playerId || battle.player2Id === playerId) return true;
      if (battle.partyMembers && battle.partyMembers.includes(playerId)) return true;
      if (battle.team2 && battle.team2.includes(playerId)) return true;
    }
    return false;
  }

  canStartBattle(playerId) {
    if (this.isPlayerInBattle(playerId)) {
      return { can: false, reason: "Você já está em um combate ativo!" };
    }
    
    // Verificação de fila ranqueada
    const playerRepository = require("../database/repositories/playerRepository");
    if (playerRepository.isInQueue(playerId)) {
      return { can: false, reason: "Você já está na fila ranqueada! Saia da fila para iniciar outra atividade." };
    }

    return { can: true };
  }

  abandonBattle(battleId, playerId) {
    const battle = this.getBattle(battleId);
    if (!battle || battle.state === "finished") return null;

    if (battle.type === "boss-rush") {
      if (!battle.abandonVotes) battle.abandonVotes = new Set();
      battle.abandonVotes.add(playerId);
      
      if (battle.abandonVotes.size >= 2) {
        battle.state = "finished";
        battle.lastActionMessage = "🏳️ O combate foi encerrado pois 2 ou mais jogadores abandonaram!";
        this.activeBattles.delete(battleId);
        return battle;
      }
      return "voted";
    } else {
      battle.state = "finished";
      battle.lastActionMessage = `🏳️ <@${playerId}> abandonou o combate!`;
      battle.winnerId = (battle.player1Id === playerId) ? battle.player2Id : battle.player1Id;
      
      // Se for Torre Infinita, aplicar cooldown de 30 minutos em todos os membros da party que abandonaram
      if (battle.type === "tower") {
        const cooldownTime = 30 * 60 * 1000;
        const availableAt = Date.now() + cooldownTime;
        const playersToCooldown = battle.partyMembers || [playerId];
        
        console.log(`[TOWER COOLDOWN] Aplicando cooldown de 30 min para: ${playersToCooldown.join(", ")}`);
        
        playersToCooldown.forEach(mId => {
          playerRepository.updateTowerCooldown(mId, availableAt);
        });
        battle.lastActionMessage += `\n\n⚠️ **COOLDOWN:** Todos os membros da party que abandonaram estão em cooldown de 30 minutos.`;
      }

      // Recompensa de PA se for ranqueado no abandono
      if (battle.isRanked) {
        const RankManager = require("./RankManager");
        const winnerResult = RankManager.updatePA(battle.winnerId, true);
        const loserResult = RankManager.updatePA(playerId, false);
        
        battle.lastActionMessage += `\n📈 O vencedor ganhou 20 PA! (Novo Rank: ${winnerResult.rank})`;
        battle.lastActionMessage += `\n📉 <@${playerId}> perdeu 15 PA! (Novo Rank: ${loserResult.rank})`;
      }
      
      this.activeBattles.delete(battleId);
      return battle;
    }
  }

  async checkTimeouts(client) {
    const now = Date.now();
    const timeoutLimit = 45 * 60 * 1000; // 45 minutos

    for (const [battleId, battle] of this.activeBattles.entries()) {
      if (battle.state !== "finished" && battle.startedAt && (now - battle.startedAt > timeoutLimit)) {
        battle.state = "finished";
        battle.lastActionMessage = "⏰ O combate foi encerrado automaticamente por exceder o limite de 45 minutos!";
        
        if (battle.channelId && client) {
          try {
            const channel = await client.channels.fetch(battle.channelId);
            if (channel) {
              await channel.send(battle.lastActionMessage);
              setTimeout(async () => {
                try { await channel.delete("Combate encerrado por timeout de 45 minutos"); }
                catch (e) { console.error("Erro ao deletar canal por timeout:", e); }
              }, 10000);
            }
          } catch (e) { console.error("Erro ao enviar timeout message:", e); }
        }
        this.activeBattles.delete(battleId);
      }
    }
  }

  processAction(battleId, playerId, skillId) {
    const battle = this.getBattle(battleId);
    if (!battle || battle.currentPlayerTurnId !== playerId || battle.state !== "choosing_action") return null;

    const attacker = battle.getCurrentPlayer();
    const defender = battle.getOpponentPlayer();
    const skill = attacker.skills.find(s => s.id === skillId);

    if (!skill) return null;

    let finalSkillCost = skill.cost;
    attacker.equippedArtifacts.forEach(artifact => {
      if (artifact.effectType === "energyCost") {
        if (!artifact.conditionType || 
            (artifact.conditionType === "anime" && attacker.anime === artifact.conditionValue) ||
            (artifact.conditionType === "character" && attacker.id === artifact.conditionValue)) {
          if (artifact.effectUnit === "flat") {
            finalSkillCost = Math.max(0, finalSkillCost - artifact.effectValue);
          }
        }
      }
    });

    if (attacker.energy < finalSkillCost || skill.isOnCooldown()) {
      return null;
    }

    attacker.consumeEnergy(finalSkillCost);
    skill.startCooldown();
    
    this.applyStatusTick(attacker, battle);

    battle.lastPendingSkill = skill;

    // Habilidades utilitárias (Heal, Buffs, etc) processam direto
    if (skill.id === "kaioken") {
      const selfDamage = Math.floor(attacker.maxHealth * 0.1);
      attacker.takeDamage(selfDamage, 'fisico');
      battle.lastActionMessage = `**${attacker.name}** ativou o **Kaioken**! Dano aumentado, mas sofreu **${selfDamage}** de auto-dano.`;
      attacker.addBuff({ id: "kaioken", multiplier: 1.5, duration: 2 });
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action"; 
      return battle;
    }

    if (skill.type === "heal") {
      const amount = attacker.heal(skill.healPercent);
      battle.lastActionMessage = `**${attacker.name}** usou **${skill.name}** e recuperou **${amount}** de HP!`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    }

    if (skill.id === "kage_bunshin") {
      attacker.addStack("kage_bunshin", 3);
      const stacks = attacker.stacks["kage_bunshin"];
      battle.lastActionMessage = `**${attacker.name}** usou **${skill.name}**! Clones: **${stacks}/3**.`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    }

    if (skill.id === "at_field") {
      attacker.addBuff({ id: "at_field", duration: 2, multiplier: 1.3 });
      battle.lastActionMessage = `**${attacker.name}** ativou **Campo AT**! Proximo ataque causa **+30% de dano**.`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    }

    if (skill.id === "mana_analysis") {
      attacker.manaAnalysisActive = true;
      battle.lastActionMessage = `**${attacker.name}** usou **${skill.name}**! O próximo ataque terá **+50% de dano**.`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    }

    if (skill.id === "determination") {
      attacker.addStack("eva_charge", 3);
      const stacks = attacker.stacks["eva_charge"];
      if (stacks < 3) {
        battle.lastActionMessage = `**${attacker.name}** reuniu **Determinação**! (${stacks}/3). O EVA-01 aguarda...`;
      } else {
        // TRANSFORMAR EM EVA-01
        const eva = CharacterManager.getCharacter("eva_01", { id: attacker.instanceId, level: attacker.level });
        attacker.name = "EVA-01";
        attacker.id = "eva_01";
        attacker.rarity = "AL";
        attacker.imageUrl = eva.imageUrl;
        attacker.maxHealth = eva.maxHealth;
        attacker.health = eva.maxHealth;
        attacker.baseMaxHealth = eva.baseMaxHealth;
        attacker.maxEnergy = eva.maxEnergy;
        attacker.energy = eva.maxEnergy;
        attacker.skills = eva.skills;
        attacker.stacks = { sync: 0 };
        battle.lastActionMessage = `**${attacker.name}** TRANSFORMOU no **EVA-01**! A verdadeira batalha começa.`;
      }
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    }

    // Levi mark handling
    if (attacker.id === "levi") {
      // ✅ CORREÇÃO: Usar attacker.stacks["marks"] em vez de defender.marks
      if (!attacker.stacks["marks"]) attacker.stacks["marks"] = 0;

      // Apply marks based on skill used
      if (skill.id === "corte_horizontal") {
        attacker.addStack("marks", 3);
      } else if (skill.id === "investida_com_dmt") {
        attacker.addStack("marks", 3);
      } else if (skill.id === "foco_do_capitao") {
        attacker.addStack("marks", 3);
        attacker.addStack("marks", 3);
        // Remove bleed and burn effects from attacker (self-cleanse)
        attacker.statusEffects = attacker.statusEffects.filter(e => e.type !== "bleed" && e.type !== "burn");
      }
      
      // ✅ CORREÇÃO: Fury Mode só é ativado se já tiver 3 marcas ANTES do cálculo de dano
      // Mas a lógica de ativação deve ser: se chegou em 3, "arma" o bônus para o PRÓXIMO ataque.
      // Vamos verificar se atingiu 3 marcas. Se sim, o furyMode será checado no calculateDamage do PRÓXIMO ataque.
      if (attacker.stacks["marks"] === 3 && !attacker.furyModeArmado) {
        attacker.furyModeArmado = true; // Indica que o bônus está pronto para o próximo ataque
      }

      // Se for Foco do Capitão, encerra o turno aqui
      if (skill.id === "foco_do_capitao") {
        battle.lastActionMessage = `**${attacker.name}** usou **${skill.name}**! Marcas acumuladas: (${attacker.stacks["marks"]}/3).`;
        if (attacker.furyModeArmado) {
            battle.lastActionMessage += `\n⚡ **Fury Mode** preparado para o próximo ataque!`;
        }
        battle.switchTurn();
        this.endTurnUpdate(battle);
        battle.state = "choosing_action";
        return battle;
      }
    }


    if (skill.id === "total_concentration") {
      attacker.recoverEnergy(50);
      battle.lastActionMessage = `**${attacker.name}** ativou **Concentração Total** e recuperou 50 de energia!`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    }

    if (skill.selfDamage) {
      const selfDamageAmount = Math.floor(attacker.health * skill.selfDamage);
      attacker.takeDamage(selfDamageAmount, 'fisico');
      battle.lastActionMessage += `\n⚠️ **${attacker.name}** se feriu no ataque e perdeu **${selfDamageAmount}** HP!`;
    }

    if (skill.id === "chainsaw_man_form") {
      attacker.addBuff({ id: "chainsaw_man", type: "transform", duration: 3 });
      battle.lastActionMessage = `**${attacker.name}** deixou Pochita tomar o controle, o verdadeiro **CHAINSAW MAN**! 🪚\n🔥 Dano aumentado massivamente, mas sofrerá dano por turno!`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    }

    // --- Sung Jin-Woo: Marcas de Sangue (Igris) ---
    if (attacker.id === "sung_jin_woo" && attacker.activeShadow === "igris") {
      if (!attacker.stacks["blood_marks"]) attacker.stacks["blood_marks"] = 0;
      let markBonus = 0;
      let markMsg = "";

      if (skill.id === "sjw_corte_preciso") {
        attacker.stacks["blood_marks"] = Math.min(3, attacker.stacks["blood_marks"] + 1);
        if (attacker.stacks["blood_marks"] >= 3) {
          markBonus = 40;
          markMsg = `\n⚔️ **MARCA DE SANGUE x3!** Igris dispara! **+40** de dano bônus!`;
          attacker.stacks["blood_marks"] = 0;
        }
      } else if (skill.id === "sjw_investida_cavaleiro") {
        attacker.stacks["blood_marks"] = Math.min(3, attacker.stacks["blood_marks"] + 2);
        if (attacker.stacks["blood_marks"] >= 3) {
          markBonus = 40;
          markMsg = `\n⚔️ **MARCA DE SANGUE x3!** Igris dispara! **+40** de dano bônus!`;
          attacker.stacks["blood_marks"] = 0;
        }
      } else if (skill.id === "sjw_execucao_carmesim") {
        const existing = attacker.stacks["blood_marks"];
        if (existing > 0) {
          markBonus = existing * 35;
          markMsg = `\n🗡️ **Execução Carmesim!** ${existing} marca(s) consumida(s)! **+${markBonus}** de dano bônus!`;
          attacker.stacks["blood_marks"] = 0;
        }
        attacker.stacks["blood_marks"] = 1; // sempre aplica 1 nova marca
      }

      attacker.sjwMarkBonus = markBonus;
      attacker.sjwMarkMsg = markMsg;
    }

    // --- Sung Jin-Woo: Postura Inabalável (Tank) ---
    if (skill.id === "sjw_postura_inabalavel") {
      attacker.addBuff({ id: "sjw_postura_inabalavel", type: "damage_reduction_passive", duration: 2 });
      battle.lastActionMessage = `**${attacker.name}** assumiu a **Postura Inabalável**! Dano recebido reduzido em **30%** por 2 turnos.`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    }

    // --- Sung Jin-Woo: Contra-Ataque Brutal (Tank) ---
    if (skill.id === "sjw_contra_ataque_brutal") {
      attacker.addBuff({ id: "sjw_contra_ataque_brutal", type: "counter_brutal", duration: 2 });
      battle.lastActionMessage = `**${attacker.name}** ativou o **Contra-Ataque Brutal**! Qualquer atacante sofrerá **${Math.floor(attacker.maxHealth * 0.10)}** de dano por turno por 2 turnos.`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    }

    if (skill.type === "buff") {
      attacker.addBuff({ ...skill.effect, id: skill.id });
      battle.lastActionMessage = `**${attacker.name}** usou **${skill.name}**!`;
      battle.switchTurn();if (skill.type === "buff")
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    } 
    
    const damage = this.calculateDamage(attacker, defender, skill, battle);
    battle.lastPendingDamage = damage;
    battle.lastActionMessage = `**${attacker.name}** usou **${skill.name}** contra **${defender.name}**!\nDano previsto: **${damage}** HP.`;
    
    // ✅ CORREÇÃO: Feedback visual do Fury Mode no BattleEngine
    if (attacker.id === "levi" && attacker.furyModeAtivoNesteAtaque) {
        battle.lastActionMessage += `\n⚡ **FURY MODE CONSUMIDO!** Dano aumentado em 150%.`;
        attacker.furyModeAtivoNesteAtaque = false;
    }

    // Feedback visual das Marcas de Sangue de Sung Jin-Woo (Igris)
    if (attacker.id === "sung_jin_woo" && attacker.sjwMarkMsg) {
      battle.lastActionMessage += attacker.sjwMarkMsg;
      attacker.sjwMarkMsg = "";
      attacker.sjwMarkBonus = 0;
    }

    // Feedback de Taxa de Sincronização do EVA-01
    if (attacker.id === "eva_01") {
      const sync = attacker.stacks["sync"] || 0;
      if (skill.id === "positron_beam") {
        battle.lastActionMessage += `\n🔵 **Sincronização EVA-01: ${sync * 10}%** — Bônus de dano do Rifle Posítron: **+${Math.round(sync * 10)}%**`;
      } else {
        battle.lastActionMessage += `\n🔵 **Sincronização EVA-01: ${sync * 10}%**${sync >= 10 ? " (MÁXIMO!)" : ""}`;
      }
    }

    if (skill.effect && skill.effect.type === "ignore_reaction") {
        const damage = battle.lastPendingDamage;
        const finalDamage = defender.takeDamage(damage, skill.damageType);
        battle.lastActionMessage += `\n💥 **${defender.name}** recebeu **${finalDamage}** de dano.`;
        battle.lastActionMessage += `\n✨ **${attacker.name}** usou **${skill.name}** e ignorou a reação de **${defender.name}**!`;
        if (skill.effect.bleed) {
          defender.addStatusEffect({ type: "bleed", duration: skill.effect.bleed.duration, value: skill.effect.bleed.value });
          battle.lastActionMessage += `\n🩸 **${defender.name}** está sofrendo de **Sangramento** por ${skill.effect.bleed.duration} turno(s)!`;
        }
        battle.lastPendingSkill = null; // ← LINHA ADICIONADA: limpa o flag antes de chamar endTurnUpdate
        battle.switchTurn();
        this.endTurnUpdate(battle);
        battle.state = "choosing_action";
    } else {
      battle.state = "choosing_reaction";
    }

    return battle;
  }

  processRecoverEnergy(battleId, playerId) {
    const battle = this.getBattle(battleId);
    if (!battle || battle.currentPlayerTurnId !== playerId || battle.state !== "choosing_action") return null;

    const character = battle.getCurrentPlayer();
    this.applyStatusTick(character, battle);

    character.recoverEnergy(25);
    battle.lastActionMessage = `**${character.name}** concentrou sua energia e recuperou 25 pontos!`;

    battle.switchTurn();
    this.endTurnUpdate(battle);
    battle.state = "choosing_action";
    return battle;
  }

  processShadowChoice(battleId, playerId, shadowId) {
    const battle = this.getBattle(battleId);
    if (!battle || battle.currentPlayerTurnId !== playerId || battle.state !== "choosing_action") return null;

    const attacker = battle.getCurrentPlayer();
    if (attacker.id !== "sung_jin_woo" || !attacker.shadowSkillSets) return null;

    const shadowSkills = attacker.shadowSkillSets[shadowId];
    if (!shadowSkills) return null;

    attacker.skills = shadowSkills;
    attacker.activeShadow = shadowId;
    battle.sjwShadowChosen = true;

    // Aplicar passiva de Tank (redução física)
    if (shadowId === "tank") {
      attacker.passives = { ...attacker.passives, physicalReduction: 0.15 };
    } else {
      const { physicalReduction, ...rest } = attacker.passives || {};
      attacker.passives = rest;
    }

    const shadowEmojis = { igris: "⚔️", beru: "🐜", tank: "🛡️" };
    const shadowNames = { igris: "Igris", beru: "Beru", tank: "Tank" };
    const shadowDesc = {
      igris: "Precisão e Execução — acumule **Marcas de Sangue**!",
      beru: "Agressão e Sustain — **roubo de vida** e golpe duplo!",
      tank: "Defesa e Controle — **15% de redução física** passiva!",
    };

    battle.lastActionMessage = `**${attacker.name}** invoca a sombra **${shadowEmojis[shadowId]} ${shadowNames[shadowId]}**!\n${shadowDesc[shadowId]}\nEscolha sua habilidade.`;
    return battle;
  }



  processBossReaction(battle) {
    if (!battle || battle.state !== "choosing_reaction") return null;

    const boss = battle.getOpponentPlayer();
    const incomingDamage = battle.lastPendingDamage || 0;
    const availableReactions = boss.reactions.filter(r => boss.energy >= r.cost && !r.isOnCooldown());

    let reactionId = "skip";

    if (availableReactions.length > 0) {
      // Threshold alto: só reage se o dano ultrapassar 22% do HP máximo
      const damageThresholdMax = boss.maxHealth * 0.22;
      // Chance base 45%, sobe para 65% se boss tiver muita energia (> 70% do máximo)
      const hasHighEnergy = boss.energy > boss.maxEnergy * 0.70;
      const reactionChance = hasHighEnergy ? 0.65 : 0.45;
      const shouldReact = incomingDamage > damageThresholdMax && Math.random() < reactionChance;

      if (shouldReact) {
        const bestReaction = availableReactions.reduce((best, r) => {
          const reduction = r.effect && r.effect.type === "damage_reduction" ? (1 - r.effect.value) : 0;
          const bestReduction = best.effect && best.effect.type === "damage_reduction" ? (1 - best.effect.value) : 0;
          return reduction > bestReduction ? r : best;
        });
        reactionId = bestReaction.id;
      }
      // Só reage em HP muito crítico (< 10%), com 65% de chance
      if (boss.health < boss.maxHealth * 0.10 && Math.random() < 0.65) {
        reactionId = availableReactions[0].id;
      }
    }

    return this.processReaction(battle.id, boss.ownerId || battle.player2Id, reactionId);
  }

  processReaction(battleId, playerId, skillId) {
    const battle = this.getBattle(battleId);
    if (!battle || battle.getOpponentId() !== playerId || battle.state !== "choosing_reaction") return null;

    const defender = battle.getOpponentPlayer();
    const attacker = battle.getCurrentPlayer();
    const skillUsed = battle.lastPendingSkill;
    
    let damageToApply = battle.lastPendingDamage;
    let avoidedEffect = false;

    if (skillId !== "skip") {
      const reaction = defender.reactions.find(r => r.id === skillId);
      if (reaction && defender.energy >= reaction.cost && !reaction.isOnCooldown()) {
        defender.consumeEnergy(reaction.cost);
        reaction.startCooldown();
        
        if (reaction.effect.type === "damage_reduction") {
          if (reaction.effect.negateElemental && skillUsed.damageType === 'elemental') {
            damageToApply = 0;
            avoidedEffect = true;
            battle.lastActionMessage += `\n⚔️ **${reaction.name}** anulou completamente o ataque elemental!`;
          } else {
            damageToApply = Math.floor(damageToApply * reaction.effect.value);
            if (reaction.effect.value === 0 || damageToApply === 0) {
              avoidedEffect = true;
            }
          }
        }
        battle.lastActionMessage += `\n🛡️ **${defender.name}** reagiu com **${reaction.name}**!`;
      }
    } else {
      battle.lastActionMessage += `\n⏩ **${defender.name}** não reagiu.`;
      // Postura Inabalável de Sung Jin-Woo (passivo, sem reação)
      if (defender.id === "sung_jin_woo") {
        const posBuff = defender.buffs.find(b => b.id === "sjw_postura_inabalavel");
        if (posBuff) {
          damageToApply = Math.floor(damageToApply * 0.70);
          battle.lastActionMessage += `\n🛡️ **Postura Inabalável:** Dano reduzido em 30%!`;
        }
      }
    }

    const finalDamage = defender.takeDamage(damageToApply, skillUsed.damageType);
    battle.lastActionMessage += `\n💥 **${defender.name}** recebeu **${finalDamage}** de dano.`;

    // --- Sung Jin-Woo: mecânicas de defesa (Tank) ao ser atacado ---
    if (defender.id === "sung_jin_woo" && finalDamage > 0) {
      if (defender.activeShadow === "tank") {
        const passiveCounter = Math.floor(defender.maxHealth * 0.05);
        attacker.health = Math.max(0, attacker.health - passiveCounter);
        battle.lastActionMessage += `\n🛡️ **Instinto de Tank:** **${attacker.name}** sofreu **${passiveCounter}** de contra-ataque!`;
      }
      const counterBuff = defender.buffs.find(b => b.id === "sjw_contra_ataque_brutal");
      if (counterBuff) {
        const counterDmg = Math.floor(defender.maxHealth * 0.10);
        attacker.addStatusEffect({ type: "brutal_counter", value: counterDmg, duration: 2 });
        battle.lastActionMessage += `\n⚔️ **Contra-Ataque Brutal!** **${attacker.name}** sofrerá **${counterDmg}** de dano por 2 turnos!`;
      }
    }

    // --- Sung Jin-Woo: Beru lifesteal e curas ---
    if (attacker.id === "sung_jin_woo" && attacker.activeShadow === "beru" && finalDamage > 0) {
      const lifesteal = Math.floor(finalDamage * 0.20);
      attacker.health = Math.min(attacker.maxHealth, attacker.health + lifesteal);
      battle.lastActionMessage += `\n🩸 **Roubo de Vida:** Sung Jin-Woo recuperou **${lifesteal}** HP!`;
      if (skillUsed.id === "sjw_garras_vorazes") {
        const extraHeal = Math.floor(attacker.maxHealth * 0.10);
        attacker.health = Math.min(attacker.maxHealth, attacker.health + extraHeal);
        battle.lastActionMessage += `\n💚 **Garras Vorazes:** Drena vitalidade! +**${extraHeal}** HP!`;
      }
      if (skillUsed.id === "sjw_frenesi_predador") {
        const hits = attacker.sjwFrenesiHits || 2;
        const frenesiHeal = Math.floor(attacker.maxHealth * 0.08) * hits;
        attacker.health = Math.min(attacker.maxHealth, attacker.health + frenesiHeal);
        battle.lastActionMessage += `\n💚 **Frenesi do Predador:** Drenou em ${hits} hit(s)! +**${frenesiHeal}** HP!`;
        attacker.sjwFrenesiHits = 0;
      }
    }

    if (!avoidedEffect && skillUsed.effect) {
      if (skillUsed.effect.type === "stun") {
        // Boss no Boss Rush é imune a atordoamento
        if (battle.type === "boss-rush" && defender.ownerId === battle.player1Id && !skillUsed.effect.ignore_immunity) {
          battle.lastActionMessage += `\n✨ **${defender.name}** é imune a atordoamento!`;
        // Boss em party PvE consome carga anti-stun se tiver
        } else if (battle.isPve && battle.partyCharacters && battle.partyCharacters.length > 1
            && defender === battle.character2 && !skillUsed.effect.ignore_immunity
            && (battle.bossStunCharges || 0) > 0) {
          battle.bossStunCharges--;
          battle.lastActionMessage += `\n🛡️ **${defender.name}** absorveu o atordoamento! (Cargas restantes: ${battle.bossStunCharges})`;
        } else {
          defender.isStunned = true;
          defender.stunDuration = skillUsed.effect.duration || 1;
          battle.lastActionMessage += `\n💥 **${defender.name}** ficou **ATORDOADO** por ${defender.stunDuration} turno(s)!`;
        }
      } else if (skillUsed.effect.type === "burn" || skillUsed.effect.type === "bleed") {
        defender.addStatusEffect({ ...skillUsed.effect });
        const emoji = skillUsed.effect.type === "burn" ? "🔥" : "🩸";
        battle.lastActionMessage += `\n${emoji} **${defender.name}** está sofrendo de **${skillUsed.effect.type === "burn" ? "Queimadura" : "Sangramento"}**!`;
      } else if (skillUsed.effect.type === "debuff_damage") {
        defender.addBuff({ id: `debuff_damage_${skillUsed.id}`, type: "debuff_damage", value: skillUsed.effect.value, duration: skillUsed.effect.duration });
        battle.lastActionMessage += `\n📉 **${defender.name}** teve seu dano reduzido em ${skillUsed.effect.value * 100}% por ${skillUsed.effect.duration} turno(s)!`;
      }
    }

    if (!avoidedEffect && skillUsed.effect && skillUsed.effect.type === "energy_drain") {
      const drainAmount = skillUsed.effect.value;
      const energyTaken = Math.min(defender.energy, drainAmount);
      defender.consumeEnergy(energyTaken);
      attacker.recoverEnergy(energyTaken);
      battle.lastActionMessage += `\n🔮 **${defender.name}** teve **${energyTaken}** de energia drenada!`;
    }

    // Aplica debuff_damage_taken se presente no efeito da skill
    if (!avoidedEffect && skillUsed.effect && skillUsed.effect.debuff_damage_taken) {
      defender.addBuff({ id: `debuff_damage_taken_${skillUsed.id}`, type: "debuff_damage_taken", value: skillUsed.effect.debuff_damage_taken, duration: skillUsed.effect.debuff_duration });
      battle.lastActionMessage += `\n📈 **${defender.name}** receberá ${skillUsed.effect.debuff_damage_taken * 100}% a mais de dano por ${skillUsed.effect.debuff_duration} turno(s)!`;
    }

    if (attacker.id === "naruto" && attacker.stacks["kage_bunshin"] > 0) {
      attacker.resetStacks("kage_bunshin");
    }

    battle.switchTurn();
    
    if (!defender.isAlive()) {
      const missionRepository = require("../database/repositories/missionRepository");
      if (battle.type === "boss-rush") {
        if (defender.ownerId === battle.player1Id) {
          // Boss morreu
          battle.state = "finished";
          battle.winnerId = "team";
          battle.lastActionMessage += `\n\n🏆 O Boss foi derrotado! O trio venceu!`;
          
          // Missão: Jogue um Boss Rush (Diária)
          battle.team2.forEach(id => missionRepository.addProgress(id, "play_boss_rush"));
        } else {
          // Membro do time morreu
          battle.lastActionMessage += `\n💀 **${defender.name}** foi derrotado e está fora de combate!`;
          const allDead = battle.partyCharacters.every(c => !c.isAlive());
          if (allDead) {
            battle.state = "finished";
            battle.winnerId = battle.player1Id;
            battle.lastActionMessage += `\n\n💀 Todos os desafiantes foram derrotados! O Boss venceu!`;
            
            // Missão: Jogue um Boss Rush (Diária)
            missionRepository.addProgress(battle.player1Id, "play_boss_rush");
            // Missão: Vença um Boss Rush como Boss (Semanal)
            missionRepository.addProgress(battle.player1Id, "win_boss_rush_as_boss");
          }
        }
      } else if (battle.isPve && defender.id === battle.character2.id) {
        battle.state = "finished";
        battle.winnerId = "players"; // Vitória do time
        battle.lastActionMessage += `\n\n🏆 O Boss foi derrotado!`;
        this.handlePveRewards(battle);

        // Missões PVE
        const partyMembers = battle.partyMembers || [battle.player1Id];
        partyMembers.forEach(id => {
          if (battle.type === "tower") {
            missionRepository.addProgress(id, "win_tower_floor");
            // Lógica de 3 andares seguidos seria mais complexa, vamos simplificar para 3 andares no total na semana
            missionRepository.addProgress(id, "win_3_tower_floors");
          } else if (battle.challengeDifficulty) {
            missionRepository.addProgress(id, "win_challenge");
            if (battle.challengeDifficulty === "medium") {
              missionRepository.addProgress(id, "win_challenge_medium");
            }
          }
        });
      } else if (!battle.isPve) {
        if (defender.health <= 0) {
          battle.state = "finished";
          battle.winnerId = attacker.ownerId;
          battle.lastActionMessage += `\n🏆 **${attacker.name}** venceu o combate!`;
          
          // Missões PVP
          if (battle.isRanked) {
            missionRepository.addProgress(battle.winnerId, "win_pvp_ranked");
            missionRepository.addProgress(battle.winnerId, "win_3_pvp_ranked");
          } else {
            missionRepository.addProgress(battle.winnerId, "win_pvp_casual");
            missionRepository.addProgress(battle.winnerId, "win_3_pvp_casual");
          }

          // Recompensa de PA se for ranqueado
          if (battle.isRanked) {
            const RankManager = require("./RankManager");
            const winnerResult = RankManager.updatePA(battle.winnerId, true);
            const loserId = (battle.player1Id === battle.winnerId) ? battle.player2Id : battle.player1Id;
            const loserResult = RankManager.updatePA(loserId, false);
            
            battle.lastActionMessage += `\n📈 **${attacker.name}** ganhou 20 PA! (Novo Rank: ${winnerResult.rank})`;
            battle.lastActionMessage += `\n📉 O oponente perdeu 15 PA! (Novo Rank: ${loserResult.rank})`;
          }
        }
      } else {
        // Se um jogador da party morreu no PVE
        battle.lastActionMessage += `\n💀 **${defender.name}** foi derrotado e está fora de combate!`;
        
        // Verificar se todos os jogadores foram derrotados
        const allDead = battle.partyCharacters ? battle.partyCharacters.every(c => !c.isAlive()) : !battle.character1.isAlive();
        if (allDead) {
          battle.state = "finished";
          battle.winnerId = battle.player2Id;
          battle.lastActionMessage += `\n\n💀 Todos os jogadores foram derrotados! O Boss venceu.`;
          
          // Se for Torre Infinita, aplicar cooldown de 30 minutos em todos
          if (battle.type === "tower") {
            const cooldownTime = 30 * 60 * 1000;
            const availableAt = Date.now() + cooldownTime;
            battle.partyMembers.forEach(mId => {
              playerRepository.updateTowerCooldown(mId, availableAt);
            });
            battle.lastActionMessage += `\n\n⚠️ **COOLDOWN:** Todos os membros da party estão em cooldown de 30 minutos.`;
          }
        }
      }
    }

    if (battle.state !== "waiting_next_floor") {
      this.endTurnUpdate(battle);
    }
    return battle;
  }

  handlePveRewards(battle) {
    const leaderId = battle.player1Id;
    const bossId = battle.character2.id;
    const partyMembers = battle.partyMembers || [leaderId];
    const now = Date.now();

    if (battle.type === "tower") {
      const floorNum = battle.currentFloor;
      const floorData = towerConfig.floors.find(f => f.floor === floorNum);
      const rewards = floorData.reward;
      const fragmentsZenith = 10;

      let rewardMsg = `\n\n✨ **RECOMPENSAS DO ANDAR ${floorNum}:**`;
      
      partyMembers.forEach(memberId => {
        const player = playerRepository.getPlayer(memberId);
        playerRepository.updatePlayer(memberId, { 
          zenith_fragments: (player.zenith_fragments || 0) + fragmentsZenith 
        });
        playerRepository.addItem(memberId, rewards.stoneId, rewards.stoneQty);
        
        // Salvar recorde da torre para o ranking
        playerRepository.updateTowerRecord(memberId, floorNum);
      });

      rewardMsg += `\n- Todos: ${Emojis.ZENITH} **${fragmentsZenith} Fragmentos Zenith** + ${this._formatItem(rewards.stoneId, rewards.stoneQty)}`;
      battle.lastActionMessage += rewardMsg;

      // Verificar se há próximo andar
      const nextFloor = towerConfig.floors.find(f => f.floor === floorNum + 1);
      if (nextFloor) {
        battle.state = "waiting_next_floor"; // Estado especial
        battle.lastActionMessage += `\n\n🗼 O líder pode clicar no botão abaixo para avançar para o **Andar ${floorNum + 1}**!`;
      } else {
        battle.lastActionMessage += `\n\n🏆 **PARABÉNS!** Vocês completaram todos os andares disponíveis da Torre Infinita!`;
      }
      return;
    }

    if (battle.challengeDifficulty) {
      const challengeConfig = require("../config/challengeConfig.js");
      const diff = challengeConfig.difficulties[battle.challengeDifficulty];
      const bossData = diff.bosses.find(b => b.id === bossId);
      const rewards = bossData.reward;

      let rewardMsg = `\n\n✨ **RECOMPENSAS DO DESAFIO (${diff.name}):**`;

      // Verificar se algum membro está em cooldown (baseado na janela BRT individual)
      const anyMemberInCooldown = partyMembers.some(mId => !playerRepository.isPlayerChallengeCooledDown(mId, battle.challengeDifficulty));

      partyMembers.forEach(memberId => {
        const isLeader = memberId === leaderId;
        const inCooldown = !playerRepository.isPlayerChallengeCooledDown(memberId, battle.challengeDifficulty);

        // Regra de Party:
        // Caso algum membro esteja em cooldown -> Apenas o líder recebe a recompensa
        // Caso todos estejam sem cooldown -> Todos recebem recompensa normalmente
        if (!inCooldown || (!anyMemberInCooldown) || isLeader) {
          if (!inCooldown) {
            let memberRewards = [];
            for (const itemId in rewards) {
              const range = rewards[itemId];
              const qty = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
              playerRepository.addItem(memberId, itemId, qty);
              memberRewards.push(this._formatItem(itemId, qty));
            }
            playerRepository.updatePlayerChallengeProgress(memberId, battle.challengeDifficulty, now);
            rewardMsg += `\n- <@${memberId}>: ${memberRewards.join(" + ")}`;
          } else {
            rewardMsg += `\n- <@${memberId}>: *Em cooldown — sem recompensa desta vez.*`;
          }
        } else {
          rewardMsg += `\n- <@${memberId}>: *Membro em cooldown na party (apenas líder recebeu).*`;
        }
      });

      battle.lastActionMessage += rewardMsg;

      // Agendar notificação de disponibilidade
      const notificationChannelId = "1488527948909904014";
      setTimeout(async () => {
        try {
          const client = require("../index.js").client; // Assumindo que o client está exportado
          const channel = await client.channels.fetch(notificationChannelId);
          if (channel) {
            const { EmbedBuilder } = require("discord.js");
            const embed = new EmbedBuilder()
              .setTitle("🔔 Desafio Disponível!")
              .setDescription(`O Modo Desafio na dificuldade **${diff.name}** está liberado novamente!`)
              .setColor(diff.emoji === "🟢" ? "#00FF00" : diff.emoji === "🟡" ? "#FFFF00" : "#FF0000")
              .setTimestamp();
            await channel.send({ embeds: [embed] });
          }
        } catch (e) { console.error("Erro ao enviar notificação de desafio:", e); }
      }, diff.cooldown);

      return;
    }
    
    let bossReward = { zenith: 250, stoneId: "soul_stone_1", stoneQty: 1 };
    for (const world of storyConfig.worlds) {
      const data = world.bosses.find(b => b.id === bossId);
      if (data) { bossReward = data.reward; break; }
    }

    let rewardMsg = `\n\n✨ **RECOMPENSAS DISTRIBUÍDAS:**`;

    partyMembers.forEach(memberId => {
      const isLeader = memberId === leaderId;
      const zenithAmount = isLeader ? 250 : 25;
      
      const player = playerRepository.getPlayer(memberId);
      playerRepository.updatePlayer(memberId, { 
        zenith_fragments: (player.zenith_fragments || 0) + zenithAmount 
      });
      
      // Todos recebem a mesma soul stone
      playerRepository.addItem(memberId, bossReward.stoneId, bossReward.stoneQty);
      
      // Apenas o líder desbloqueia o próximo nível
      if (isLeader) {
        // Garantir que o ID do boss não tenha o prefixo "boss_" para bater com a config
        const cleanBossId = bossId.startsWith("boss_") ? bossId.replace("boss_", "") : bossId;
        playerRepository.updateStoryProgress(memberId, cleanBossId);
      }
      
      rewardMsg += `\n- <@${memberId}>: ${Emojis.ZENITH} **${zenithAmount} Fragmentos Zenith** + ${this._formatItem(bossReward.stoneId, bossReward.stoneQty)}`;
    });

    battle.lastActionMessage += rewardMsg;
  }

  _formatItem(itemId, qty) {
    const names = {
      "soul_stone_1": `${Emojis.SOUL_STONE_1} Pedra da Alma I`,
      "soul_stone_2": `${Emojis.SOUL_STONE_2} Pedra da Alma II`,
      "soul_stone_3": `${Emojis.SOUL_STONE_3} Pedra da Alma III`,
      "fr":           `${Emojis.ARTIFACT} Fragmento de Relíquia`,
    };
    return `**${qty}x** ${names[itemId] || itemId}`;
  }

  processBossTurn(battle) {
    if (!battle || battle.state !== "choosing_action") return null;

    // Em party PvE: seleciona alvo aleatório entre membros vivos e acumula carga anti-stun
    if (battle.isPve && battle.partyCharacters && battle.partyCharacters.length > 1) {
      const living = battle.partyCharacters.filter(c => c.isAlive());
      battle.bossCurrentTarget = living.length > 0
        ? living[Math.floor(Math.random() * living.length)]
        : battle.partyCharacters[0];
      // Uma carga anti-stun por rodada do boss
      battle.bossStunCharges = Math.min((battle.bossStunCharges || 0) + 1, 2);
    }

    const attacker = battle.getCurrentPlayer();

    const allAttacks = attacker.skills.filter(s => s.type === "attack");
    const affordableAttacks = allAttacks.filter(s => attacker.energy >= s.cost && !s.isOnCooldown());
    const healSkills = attacker.skills.filter(s => s.type === "heal" && attacker.energy >= s.cost && !s.isOnCooldown());

    // Critério de cura: HP < 30% e tem skill de cura disponível
    if (healSkills.length > 0 && attacker.health < attacker.maxHealth * 0.30) {
      return this.processAction(battle.id, battle.player2Id, healSkills[0].id);
    }

    // Encontra o ataque mais forte que consegue usar agora
    const bestAffordable = affordableAttacks.sort((a, b) => b.damage - a.damage)[0];

    if (bestAffordable) {
      // Verifica se economizando energia consegue usar um ataque bem mais forte (30%+ mais dano)
      const bestPossible = allAttacks.filter(s => !s.isOnCooldown()).sort((a, b) => b.damage - a.damage)[0];
      const energyNeeded = bestPossible ? bestPossible.cost : 0;
      const shouldSaveEnergy = (
        bestPossible &&
        bestPossible.id !== bestAffordable.id &&
        bestPossible.damage > bestAffordable.damage * 1.3 &&
        attacker.energy < energyNeeded &&
        attacker.maxEnergy - attacker.energy >= 25 // Ainda tem espaço para recuperar
      );

      if (shouldSaveEnergy && attacker.energy < attacker.maxEnergy * 0.5) {
        return this.processRecoverEnergy(battle.id, battle.player2Id);
      }

      return this.processAction(battle.id, battle.player2Id, bestAffordable.id);
    }

    // Sem ataque disponível — recupera energia
    return this.processRecoverEnergy(battle.id, battle.player2Id);
  }

  applyStatusTick(character, battle) {
    character.statusEffects.forEach(effect => {
      let tickDamage = 0;
      if (effect.type === "burn") {
        tickDamage = Math.floor(character.maxHealth * effect.value);
        battle.lastActionMessage += `\n🔥 **${character.name}** sofreu **${tickDamage}** de Queimadura!`;
      } else if (effect.type === "bleed") {
        tickDamage = Math.floor(character.health * effect.value);
        battle.lastActionMessage += `\n🩸 **${character.name}** sofreu **${tickDamage}** de Sangramento!`;
      } else if (effect.type === "brutal_counter") {
        character.health = Math.max(0, character.health - effect.value);
        battle.lastActionMessage += `\n⚔️ **Contra-Ataque Brutal:** **${character.name}** sofreu **${effect.value}** de dano de retaliação!`;
      }
      
      // Aplicar o dano de status de fato
      if (tickDamage > 0) {
        character.takeDamage(tickDamage, 'elemental');
      }

      const chainsawBuff = character.buffs.find(b => b.id === "chainsaw_man");
      if (chainsawBuff) {
        const drainDamage = Math.floor(character.maxHealth * 0.08);
        character.takeDamage(drainDamage, 'fisico');
        battle.lastActionMessage += `\n🪚 A forma de **Chainsaw Man** está drenando a vida de **${character.name}**! (-${drainDamage} HP)`;
      }
    });
  }


  endTurnUpdate(battle) {
    if (battle.state === "finished") {
      this.activeBattles.delete(battle.id);
      return;
    }

    // Limpa alvo do boss ao encerrar turno
    if (battle.bossCurrentTarget) battle.bossCurrentTarget = null;

    const nextPlayer = battle.getCurrentPlayer();
    
    // Se o jogador estiver morto em qualquer modo (PVE, Boss Rush, etc), pula o turno
    if (!nextPlayer.isAlive()) {
      battle.lastActionMessage += `\n💀 **${nextPlayer.name}** está derrotado, pulando turno...`;
      battle.switchTurn();
      return this.endTurnUpdate(battle);
    }

    nextPlayer.updateCooldowns();
    nextPlayer.updateBuffsAndStatus();

    // Lógica para pular o turno de reação se a habilidade "Imaginário: Roxo" foi usada
    if (battle.lastPendingSkill && battle.lastPendingSkill.effect && battle.lastPendingSkill.effect.type === "ignore_reaction") {
      battle.lastActionMessage += `\n🚫 O turno de reação de **${nextPlayer.name}** foi ignorado devido ao **Imaginário: Roxo**!`;
      battle.lastPendingSkill = null; // Resetar para não ignorar reações futuras
      battle.switchTurn();
      this.endTurnUpdate(battle);
      return;
    }

    if (nextPlayer.isStunned) {
      // ✅ CORREÇÃO: Reduzir a duração apenas quando o turno é efetivamente pulado
      nextPlayer.stunDuration--;
      battle.lastActionMessage += `\n💤 **${nextPlayer.name}** pulou o turno por atordoamento! (Restam: ${nextPlayer.stunDuration} turnos)`;

      if (nextPlayer.stunDuration <= 0) {
        nextPlayer.isStunned = false;
      }

      battle.switchTurn();
      this.endTurnUpdate(battle);
      return;
    }

    // Reset da seleção de sombra de Sung Jin-Woo a cada novo turno
    if (nextPlayer.id === "sung_jin_woo") {
      battle.sjwShadowChosen = false;
    }

    battle.state = "choosing_action";
  }

  calculateDamage(attacker, defender, skill, battle) {
    let damage = skill.damage;
    attacker.equippedArtifacts.forEach(artifact => {
      if (artifact.effectType === "damage") {
        if (!artifact.conditionType || 
            (artifact.conditionType === "anime" && attacker.anime === artifact.conditionValue) ||
            (artifact.conditionType === "character" && attacker.id === artifact.conditionValue)) {
          if (artifact.effectUnit === "percentage") {
            damage *= (1 + artifact.effectValue);
          } else if (artifact.effectUnit === "flat") {
            damage += artifact.effectValue;
          }
        }
      }
    });
    
    attacker.buffs.forEach(buff => {
      if (buff.id === "kaioken") damage *= 1.5;
      if (buff.type === "debuff_damage") damage *= (1 - buff.value);
    });

    if (attacker.id === "naruto" && attacker.stacks["kage_bunshin"]) {
      const multiplier = 1 + (attacker.stacks["kage_bunshin"] * 0.5);
      damage *= multiplier;
    }

    if (attacker.id === "eva_01") {
      // Taxa de Sincronização: ganha 1 stack por ataque (10%), cada stack aumenta o dano do Canhão Posítron.
      attacker.addStack("sync", 10); // Aumentar limite para 10 (100%)
      const sync = attacker.stacks["sync"] || 0;
      
      let finalMultiplier = 1;
      // Se for Canhão Posítron, aplica o bônus de sincronização (10% por stack)
      if (skill.id === "positron_beam") {
        finalMultiplier *= (1 + (sync * 0.1));
      }

      const atBuff = attacker.buffs.find(b => b.id === "at_field");
      const atBonus = atBuff ? 1.3 : 1;
      damage *= finalMultiplier * atBonus;
    }

    if (attacker.id === "frieren" && attacker.manaAnalysisActive) {
      damage *= 1.5;
      attacker.manaAnalysisActive = false;
    }

    // ✅ CORREÇÃO: Fury Mode damage boost for Levi
    // Agora verifica se o bônus está "armado" (atingiu 3 marcas no passado)
    if (attacker.id === "levi" && attacker.furyModeArmado) {
      damage = Math.floor(damage * 2.5); // Bônus de +150% (total 2.5x)
      attacker.furyModeArmado = false; // Consome o bônus
      attacker.resetStacks("marks"); // Reseta as marcas para 0
      attacker.furyModeAtivoNesteAtaque = true; // Flag para feedback visual no BattleEngine
    }

    if (attacker.id === "itadori" && skill.id === "black_flash") {
      if (Math.random() < 0.3) {
        damage *= 3;
        battle.lastActionMessage += `\n✨ **BLACK FLASH!**`;
      }
    }

    if (attacker.buffs.some(b => b.id === "chainsaw_man")) {
      damage *= 1.8; // +80% de dano na forma transformada
    }

    // Passiva: Sinergia com Sangramento
    const isBleeding = defender.statusEffects.some(e => e.type === "bleed");
    if (isBleeding && attacker.id === "denji") {
      damage *= 1.2; // +20% de dano contra alvos sangrando
      const lifesteal = Math.floor(damage * 0.15); // Cura 15% do dano causado
      attacker.health = Math.min(attacker.maxHealth, attacker.health + lifesteal);
      battle.lastActionMessage += `\n🩸 **Brutalidade:** Denji se cura em **${lifesteal}** HP ao atacar um alvo sangrando!`;
    }

    // --- Sung Jin-Woo: mecânicas de dano por sombra ---
    if (attacker.id === "sung_jin_woo") {
      // Igris: bônus de marcas de sangue
      if (attacker.activeShadow === "igris" && attacker.sjwMarkBonus > 0) {
        damage += attacker.sjwMarkBonus;
      }

      // Beru: Frenesi do Predador (2-3 hits com damage override)
      if (attacker.activeShadow === "beru" && skill.id === "sjw_frenesi_predador") {
        let hits = 2;
        if (Math.random() < 0.35) {
          hits = 3;
          battle.lastActionMessage += `\n⚡ **Hit Extra!** Beru desfere um 3º golpe!`;
        }
        damage = Math.floor(skill.damage * hits);
        attacker.sjwFrenesiHits = hits;
      }
      // Beru: golpe duplo em Garras e Devorar (25%)
      else if (attacker.activeShadow === "beru" && (skill.id === "sjw_garras_vorazes" || skill.id === "sjw_devorar")) {
        if (Math.random() < 0.25) {
          damage *= 2;
          battle.lastActionMessage += `\n⚡ **Golpe Duplo!** Beru ataca novamente!`;
        }
      }
    }

    // Efeito de debuff_damage_taken
    defender.buffs.forEach(buff => {
      if (buff.type === "debuff_damage_taken") damage *= (1 + buff.value);
    });

    return Math.floor(damage);
  }
}

module.exports = new BattleEngine();
