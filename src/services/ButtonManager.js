const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const Emojis = require("../config/emojis");

const ELEMENT_NAME = {
  vento: 'Vento', agua: 'Água', fogo: 'Fogo', gelo: 'Gelo',
  terra: 'Terra', escuridao: 'Escuridão', raio: 'Raio', luz: 'Luz',
};
function elemTag(elementType) {
  if (!elementType) return 'N/A';
  return `[${ELEMENT_NAME[elementType] || elementType}]`;
}

class ButtonManager {
  static createActionComponents(battleId, character, isDisabled = false, battle = null) {
    const rows = [];

    // Batalha encerrada: sem botões
    if (battle && battle.state === "finished") return rows;

    // --- Menu de Seleção de Sombra: Sung Jin-Woo ---
    if (character.id === "sung_jin_woo" && battle && !battle.sjwShadowChosen && !isDisabled) {
      const shadowMenu = new StringSelectMenuBuilder()
        .setCustomId(`shadow_${battleId}`)
        .setPlaceholder("👥 Escolha uma Sombra para invocar este turno!")
        .addOptions([
          { label: "⚔️ Igris — Precisão e Execução", value: "igris", description: "Acumule Marcas de Sangue e execute com poder devastador." },
          { label: "🐜 Beru — Agressão e Sustain", value: "beru", description: "Roubo de vida 20% e chance de golpe duplo em todos os ataques." },
          { label: "🛡️ Tank — Defesa e Controle", value: "tank", description: "15% de redução física passiva + contra-ataques poderosos." }
        ]);

      const abandonButton = new ButtonBuilder()
        .setCustomId(`battle_${battleId}_abandon`)
        .setLabel("Abandonar Combate")
        .setStyle(ButtonStyle.Danger);

      rows.push(new ActionRowBuilder().addComponents(shadowMenu));
      rows.push(new ActionRowBuilder().addComponents(abandonButton));
      return rows;
    }

    // Botão de Avançar Andar na Torre Infinita
    if (battle && battle.state === "waiting_next_floor") {
      const nextFloorNum = battle.currentFloor + 1;
      const nextFloorButton = new ButtonBuilder()
        .setCustomId(`tower_next_${battleId}_${nextFloorNum}_${battle.player1Id}`)
        .setLabel(`Avançar para o Andar ${nextFloorNum}`)
        .setStyle(ButtonStyle.Success);
      
      rows.push(new ActionRowBuilder().addComponents(nextFloorButton));
      return rows;
    }
    
    // Menu de Seleção de Alvo para o Boss no Boss Rush
    if (battle && battle.type === "boss-rush" && battle.currentPlayerTurnId === battle.player1Id && !isDisabled) {
      const aliveTargets = battle.partyCharacters.filter(c => c.isAlive());
      const targetOptions = aliveTargets.map(c => ({
        label: `Atacar: ${c.name}`,
        value: c.ownerId,
        description: `HP: ${c.health}/${c.maxHealth}`,
        emoji: "🎯",
        default: c.ownerId === battle.player2Id
      }));

      const targetMenu = new StringSelectMenuBuilder()
        .setCustomId(`target_${battleId}`)
        .setPlaceholder('Escolha quem você quer atacar!')
        .addOptions(targetOptions);
      
      rows.push(new ActionRowBuilder().addComponents(targetMenu));
    }

    // StringSelectMenu para ataques, buffs e curas
    const attackOptions = character.activeSkills.map(skill => {
      let label = `${skill.name} (${skill.cost}⚡)`;
      if (skill.isOnCooldown()) {
        label = `${skill.name} (⏳ ${skill.currentCooldown} turno(s))`;
      }

      const baseDesc = skill.description || "";
      const elPart = skill.type === "attack" ? ` · ${elemTag(skill.elementType)}` : "";
      const fullDesc = (baseDesc + elPart).substring(0, 100);
      return {
        label: label,
        description: fullDesc || "Sem descrição.",
        value: skill.id,
        emoji: this.getSkillEmoji(skill)
      };
    });

    const rikaFocusActive = battle && battle.rikaActive && battle.rikaHealth > 0 && !isDisabled && !battle.isPve &&
      ((battle.character1.id === "yuta_okkotsu" && battle.currentPlayerTurnId !== battle.player1Id) ||
       (battle.character2.id === "yuta_okkotsu" && battle.currentPlayerTurnId !== battle.player2Id));

    const menuPlaceholder = battle?.focusingRika
      ? `👁️ FOCANDO RIKA — escolha um ataque!`
      : 'Selecione uma habilidade para usar!';

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`menu_${battleId}_attack`)
      .setPlaceholder(menuPlaceholder)
      .addOptions(attackOptions)
      .setDisabled(isDisabled);

    const menuRow = new ActionRowBuilder().addComponents(menu);
    rows.push(menuRow);

    // Botão separado para Recuperar Energia
    const recoverButton = new ButtonBuilder()
      .setCustomId(`recover_${battleId}_energy`)
      .setLabel("Recuperar Energia (+25⚡)")
      .setStyle(ButtonStyle.Success)
      .setDisabled(isDisabled || character.energy >= character.maxEnergy);

    const abandonButton = new ButtonBuilder()
      .setCustomId(`battle_${battleId}_abandon`)
      .setLabel("Abandonar Combate")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isDisabled);

    // Botão de troca de personagem no 3v3 e torre/história isPveTeam
    if (battle && (battle.isTeamPvp || battle.isPveTeam) && !isDisabled) {
      const isP1Turn = battle.currentPlayerTurnId === battle.player1Id;
      const team = isP1Turn ? battle.p1Team : battle.p2Team;
      const activeIdx = isP1Turn ? battle.p1ActiveIdx : battle.p2ActiveIdx;
      const hasBench = team && team.some((c, i) => i !== activeIdx && c.isAlive());
      if (hasBench) {
        const swapButton = new ButtonBuilder()
          .setCustomId(`team_swap_${battleId}`)
          .setLabel("🔄 Trocar Personagem (gasta turno)")
          .setStyle(ButtonStyle.Secondary);
        const swapRow = new ActionRowBuilder().addComponents(recoverButton, swapButton, abandonButton);
        rows.push(swapRow);
        return rows;
      }
    }

    if (rikaFocusActive) {
      const rikaLabel = battle.focusingRika
        ? `👁️ Cancelar Foco na Rika`
        : `👁️ Focar Rika (${battle.rikaHealth}/${battle.rikaMaxHealth} HP)`;
      const focusRikaButton = new ButtonBuilder()
        .setCustomId(`focus_rika_${battleId}`)
        .setLabel(rikaLabel)
        .setStyle(battle.focusingRika ? ButtonStyle.Secondary : ButtonStyle.Danger);
      rows.push(new ActionRowBuilder().addComponents(recoverButton, focusRikaButton, abandonButton));
      return rows;
    }

    const buttonRow = new ActionRowBuilder().addComponents(recoverButton, abandonButton);
    rows.push(buttonRow);

    return rows;
  }

  static getSkillEmoji(skill) {
    if (skill.type === "heal") return "💚";
    if (skill.type === "buff") return "✨";
    if (skill.elementType) return "🔥";
    return "🥊";
  }

  static createReactionButtons(battleId, character, isDisabled = false) {
    const row = new ActionRowBuilder();

    character.reactions.forEach(reaction => {
      let label = `${reaction.name} (${reaction.cost}⚡)`;
      if (reaction.isOnCooldown()) {
        label = `${reaction.name} (⏳ ${reaction.currentCooldown} turno(s))`;
      }

      const button = new ButtonBuilder()
        .setCustomId(`reaction_${battleId}_${reaction.id}`)
        .setLabel(label)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(isDisabled || character.energy < reaction.cost || reaction.isOnCooldown());

      row.addComponents(button);
    });

    const skipButton = new ButtonBuilder()
      .setCustomId(`reaction_${battleId}_skip`)
      .setLabel("Pular Reação")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isDisabled);

    row.addComponents(skipButton);

    const abandonButton = new ButtonBuilder()
      .setCustomId(`battle_${battleId}_abandon`)
      .setLabel("Abandonar Combate")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isDisabled);

    const abandonRow = new ActionRowBuilder().addComponents(abandonButton);

    return [row, abandonRow];
  }
}

module.exports = ButtonManager;
