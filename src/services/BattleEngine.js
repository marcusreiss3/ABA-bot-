const Battle = require("../models/Battle");
const CharacterManager = require("./CharacterManager");
const playerRepository = require("../database/repositories/playerRepository");
const storyConfig = require("../config/storyConfig.js");
const towerConfig = require("../config/towerConfig.js");

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
        
        // Criar instâncias de personagens para os membros da party
        const partyCharacters = partyMembers.map(memberId => {
          const player = playerRepository.getPlayer(memberId);
          const charInstance = playerRepository.getCharacterInstance(player.equipped_instance_id);
          const char = CharacterManager.getCharacter(charInstance.character_id, charInstance);
          char.ownerId = memberId;
          return char;
        });
        
        // Substituir character1 pela lista da party ou guardar na battle
        // Para manter compatibilidade, character1 será o líder
        // Mas vamos guardar a party na battle
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
            if (channel) await channel.delete("Combate expirado (45 min)");
          } catch (e) { console.error("Erro ao deletar canal expirado:", e); }
        }
        
        battle.state = "finished";
        this.activeBattles.delete(battleId);
      }
    }
  }

  processAction(battleId, playerId, skillId) {
    const battle = this.getBattle(battleId);
    if (!battle || battle.currentPlayerTurnId !== playerId || battle.state !== "choosing_action") {
      return null;
    }

    // No Boss Rush, se for o turno do Boss, ele ataca um alvo aleatório ou o primeiro vivo
    if (battle.type === "boss-rush" && playerId === battle.player1Id) {
      // Se o alvo atual morreu, seleciona um novo alvo vivo automaticamente
      if (!battle.character2.isAlive()) {
        const aliveTargets = battle.partyCharacters.filter(c => c.isAlive());
        if (aliveTargets.length > 0) {
          const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
          battle.player2Id = target.ownerId;
          battle.character2 = target;
        }
      }
    }

    // Se for o turno de um membro do time no Boss Rush, o oponente é o Boss
    if (battle.type === "boss-rush" && playerId !== battle.player1Id) {
      battle.character2 = battle.character1;
      battle.player2Id = battle.player1Id;
    }

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

    if (skill.type === "buff") {
      attacker.addBuff({ ...skill.effect, id: skill.id });
      battle.lastActionMessage = `**${attacker.name}** usou **${skill.name}**!`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      battle.state = "choosing_action";
      return battle;
    } 
    
    const damage = this.calculateDamage(attacker, defender, skill, battle);
    battle.lastPendingDamage = damage;
    battle.lastActionMessage = `**${attacker.name}** usou **${skill.name}** contra **${defender.name}**!\nDano previsto: **${damage}** HP.`;
    battle.state = "choosing_reaction";

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
          damageToApply = Math.floor(damageToApply * reaction.effect.value);
          if (reaction.effect.value === 0 || damageToApply === 0) {
            avoidedEffect = true;
          }
        }
        battle.lastActionMessage += `\n🛡️ **${defender.name}** reagiu com **${reaction.name}**!`;
      }
    } else {
      battle.lastActionMessage += `\n⏩ **${defender.name}** não reagiu.`;
    }

    const finalDamage = defender.takeDamage(damageToApply, skillUsed.damageType);
    battle.lastActionMessage += `\n💥 **${defender.name}** recebeu **${finalDamage}** de dano.`;

    if (!avoidedEffect && skillUsed.effect) {
      if (skillUsed.effect.type === "stun") {
        // Boss no Boss Rush é imune a atordoamento
        if (battle.type === "boss-rush" && defender.ownerId === battle.player1Id) {
          battle.lastActionMessage += `\n✨ **${defender.name}** é imune a atordoamento!`;
        } else {
          defender.isStunned = true;
          battle.lastActionMessage += `\n💥 **${defender.name}** ficou **ATORDOADO**!`;
        }
      } else if (skillUsed.effect.type === "burn" || skillUsed.effect.type === "bleed") {
        defender.addStatusEffect({ ...skillUsed.effect });
        const emoji = skillUsed.effect.type === "burn" ? "🔥" : "🩸";
        battle.lastActionMessage += `\n${emoji} **${defender.name}** recebeu um efeito negativo!`;
      }
    }

    if (attacker.id === "naruto" && attacker.stacks["kage_bunshin"] > 0) {
      attacker.resetStacks("kage_bunshin");
    }

    battle.switchTurn();
    
    if (!defender.isAlive()) {
      if (battle.type === "boss-rush") {
        if (defender.ownerId === battle.player1Id) {
          // Boss morreu
          battle.state = "finished";
          battle.winnerId = "team";
          battle.lastActionMessage += `\n\n🏆 O Boss foi derrotado! O trio venceu!`;
        } else {
          // Membro do time morreu
          battle.lastActionMessage += `\n💀 **${defender.name}** foi derrotado e está fora de combate!`;
          const allDead = battle.partyCharacters.every(c => !c.isAlive());
          if (allDead) {
            battle.state = "finished";
            battle.winnerId = battle.player1Id;
            battle.lastActionMessage += `\n\n💀 Todos os desafiantes foram derrotados! O Boss venceu!`;
          }
        }
      } else if (battle.isPve && defender.id === battle.character2.id) {
        battle.state = "finished";
        battle.winnerId = "players"; // Vitória do time
        battle.lastActionMessage += `\n\n🏆 O Boss foi derrotado!`;
        this.handlePveRewards(battle);
      } else if (!battle.isPve) {
           if (defender.health <= 0) {
      battle.state = "finished";
      battle.winnerId = attacker.ownerId;
      battle.lastActionMessage += `\n🏆 **${attacker.name}** venceu o combate!`;
      
      // Recompensa de PA se for ranqueado
      if (battle.isRanked) {
        const RankManager = require("./RankManager");
        const winnerResult = RankManager.updatePA(battle.winnerId, true);
        const loserId = (battle.player1Id === battle.winnerId) ? battle.player2Id : battle.player1Id;
        const loserResult = RankManager.updatePA(loserId, false);
        
        battle.lastActionMessage += `\n📈 **${attacker.name}** ganhou 20 PA! (Novo Rank: ${winnerResult.rank})`;
        battle.lastActionMessage += `\n📉 O oponente perdeu 15 PA! (Novo Rank: ${loserResult.rank})`;
      }
    }  } else {
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

      rewardMsg += `\n- Todos: ${fragmentsZenith} Fragmentos Zenith + ${rewards.stoneQty}x ${rewards.stoneId.toUpperCase().replace(/_/g, " ")}`;
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

      // Atualizar Cooldown Global
      playerRepository.updateGlobalChallengeCooldown(battle.challengeDifficulty, now + diff.cooldown);

      let rewardMsg = `\n\n✨ **RECOMPENSAS DO DESAFIO (${diff.name}):**`;
      
      const globalCooldown = playerRepository.getGlobalChallengeCooldown(battle.challengeDifficulty);
      const currentCycleStart = globalCooldown.available_at - diff.cooldown;
      
      // Verificar se algum membro está em cooldown
      const anyMemberInCooldown = partyMembers.some(mId => {
        const p = playerRepository.getPlayerChallengeProgress(mId, battle.challengeDifficulty);
        return p.last_completed_at >= currentCycleStart;
      });

      partyMembers.forEach(memberId => {
        const progress = playerRepository.getPlayerChallengeProgress(memberId, battle.challengeDifficulty);
        const isLeader = memberId === leaderId;
        
        // Regra de Party: 
        // Caso algum membro esteja em cooldown -> Apenas o líder recebe a recompensa
        // Caso todos estejam sem cooldown -> Todos recebem recompensa normalmente
        if (!anyMemberInCooldown || isLeader) {
          let memberRewards = [];
          for (const itemId in rewards) {
            const range = rewards[itemId];
            const qty = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
            playerRepository.addItem(memberId, itemId, qty);
            memberRewards.push(`${qty}x ${itemId.toUpperCase().replace(/_/g, " ")}`);
          }
          playerRepository.updatePlayerChallengeProgress(memberId, battle.challengeDifficulty, now);
          rewardMsg += `\n- <@${memberId}>: ${memberRewards.join(", ")}`;
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
    });

    rewardMsg += `\n- Líder: ${250} Zenith + Soul Stone`;
    if (partyMembers.length > 1) {
      rewardMsg += `\n- Membros: ${25} Zenith + Soul Stone`;
      rewardMsg += `\n*(Apenas o líder desbloqueou a próxima missão)*`;
    }

    battle.lastActionMessage += rewardMsg;
  }

  processBossReaction(battle) {
    if (battle.state !== "choosing_reaction") return null;
    
    const boss = battle.character2;
    // Tentar encontrar uma reação válida (que não esteja em cooldown e tenha energia)
    const reaction = boss.reactions.find(r => !r.isOnCooldown() && boss.energy >= r.cost);
    
    if (reaction) {
      // 70% de chance do Boss reagir se tiver uma reação disponível
      if (Math.random() < 0.7) {
        return this.processReaction(battle.id, battle.player2Id, reaction.id);
      }
    }
    
    // Caso contrário, pula a reação
    return this.processReaction(battle.id, battle.player2Id, "skip");
  }

  processBossTurn(battle) {
    if (battle.state !== "choosing_action" || battle.currentPlayerTurnId !== battle.player2Id) return null;
    const boss = battle.character2;

    // Escolher um alvo vivo da party
    if (battle.isPve && battle.partyCharacters) {
      const aliveMembers = battle.partyCharacters.filter(c => c.isAlive());
      if (aliveMembers.length > 0) {
        // Boss ataca um membro aleatório vivo
        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        // Atualizar temporariamente o character1 para ser o alvo da reação/dano
        battle.character1 = target;
        battle.player1Id = target.ownerId;
      }
    }
    
    const healSkill = boss.skills.find(s => s.type === "heal" && !s.isOnCooldown() && boss.energy >= s.cost);
    if (healSkill && boss.health < boss.maxHealth * 0.3) {
      return this.processAction(battle.id, battle.player2Id, healSkill.id);
    }

    const attackSkills = boss.skills.filter(s => s.type === "attack" && !s.isOnCooldown() && boss.energy >= s.cost)
      .sort((a, b) => b.cost - a.cost);

    if (attackSkills.length > 0) {
      const skill = attackSkills[0];
      return this.processAction(battle.id, battle.player2Id, skill.id);
    } else {
      return this.processRecoverEnergy(battle.id, battle.player2Id);
    }
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
      }
      character.takeDamage(tickDamage, 'elemental');
    });
  }

  endTurnUpdate(battle) {
    if (battle.state === "finished") {
      this.activeBattles.delete(battle.id);
      return;
    }

    const nextPlayer = battle.getCurrentPlayer();
    
    // Se o jogador estiver morto em qualquer modo (PVE, Boss Rush, etc), pula o turno
    if (!nextPlayer.isAlive()) {
      battle.lastActionMessage += `\n💀 **${nextPlayer.name}** está derrotado, pulando turno...`;
      battle.switchTurn();
      return this.endTurnUpdate(battle);
    }

    nextPlayer.updateCooldowns();
    nextPlayer.updateBuffsAndStatus();

    if (nextPlayer.isStunned) {
      nextPlayer.isStunned = false;
      battle.lastActionMessage += `\n💤 **${nextPlayer.name}** pulou o turno por atordoamento!`;
      battle.switchTurn();
      this.endTurnUpdate(battle);
      return;
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
    });

    if (attacker.id === "naruto" && attacker.stacks["kage_bunshin"]) {
      const multiplier = 1 + (attacker.stacks["kage_bunshin"] * 0.5);
      damage *= multiplier;
    }

    if (attacker.id === "itadori" && skill.id === "black_flash") {
      if (Math.random() < 0.3) {
        damage *= 3;
        battle.lastActionMessage += `\n✨ **BLACK FLASH!**`;
      }
    }

    return Math.floor(damage);
  }
}

module.exports = new BattleEngine();
