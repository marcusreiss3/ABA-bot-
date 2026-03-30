const Artifact = require("../models/Artifact");
const Emojis = require("../config/emojis");

class ArtifactManager {
  static getArtifact(artifactId, instanceData = {}) {
    let artifact = null;

    switch (artifactId) {
      case "hp_boost_small":
        artifact = new Artifact({
          id: "hp_boost_small",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Amuleto da Vitalidade Menor",
          emoji: Emojis.ARTIFACT_HP_SMALL,
          effectType: "maxHealth",
          effectValue: 0.10,
          effectUnit: "percentage",
        });
        break;
      case "dragonball_damage_boost":
        artifact = new Artifact({
          id: "dragonball_damage_boost",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Essência Saiyajin",
          emoji: Emojis.ARTIFACT_DRAGONBALL_DMG,
          effectType: "damage",
          effectValue: 0.15,
          effectUnit: "percentage",
          conditionType: "anime",
          conditionValue: "dragonball",
        });
        break;
      case "general_damage_boost":
        artifact = new Artifact({
          id: "general_damage_boost",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Luvas do Poder",
          emoji: Emojis.ARTIFACT_GENERAL_DMG,
          effectType: "damage",
          effectValue: 0.10,
          effectUnit: "percentage",
        });
        break;
      case "itadori_damage_boost":
        artifact = new Artifact({
          id: "itadori_damage_boost",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Marca do Tigre",
          emoji: Emojis.ARTIFACT_ITADORI_DMG,
          effectType: "damage",
          effectValue: 0.30,
          effectUnit: "percentage",
          conditionType: "character",
          conditionValue: "itadori",
        });
        break;
      case "energy_cost_reduction":
        artifact = new Artifact({
          id: "energy_cost_reduction",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Pingente da Sabedoria",
          emoji: Emojis.ARTIFACT_ENERGY_COST_RED,
          effectType: "energyCost",
          effectValue: 5,
          effectUnit: "flat",
        });
        break;
      // Adicionar novos artefatos aqui
    }
    return artifact;
  }

  static getAllArtifacts() {
    // Retorna uma lista de todos os IDs de artefatos disponíveis
    return [
      "hp_boost_small",
      "dragonball_damage_boost",
      "general_damage_boost",
      "itadori_damage_boost",
      "energy_cost_reduction",
    ];
  }
}

module.exports = ArtifactManager;
