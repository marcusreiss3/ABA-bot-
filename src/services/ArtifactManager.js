const Artifact = require("../models/Artifact");
const Emojis = require("../config/emojis");

class ArtifactManager {
  static getArtifact(artifactId, instanceData = {}) {
    let artifact = null;

    switch (artifactId) {
      case "capsula_curativa":
        artifact = new Artifact({
          id: "capsula_curativa",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Cápsula Curativa",
          emoji: Emojis.CAPSULA_CURATIVA,
          effectType: "maxHealth",
          effectValue: 0.10,
          effectUnit: "percentage",
        });
        break;
      case "esfera_4_estrelas":
        artifact = new Artifact({
          id: "esfera_4_estrelas",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Esfera de 4 Estrelas",
          emoji: Emojis.ESFERA_4_ESTRELAS,
          effectType: "damage",
          effectValue: 0.15,
          effectUnit: "percentage",
          conditionType: "anime",
          conditionValue: "dragonball",
        });
        break;
      case "mascara_hollow":
        artifact = new Artifact({
          id: "mascara_hollow",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Máscara de Hollow",
          emoji: Emojis.MASCARA_HOLLOW,
          effectType: "damage",
          effectValue: 0.10,
          effectUnit: "percentage",
        });
        break;
      case "dedo_sukuna":
        artifact = new Artifact({
          id: "dedo_sukuna",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Dedo do Sukuna",
          emoji: Emojis.DEDO_SUKUNA,
          effectType: "damage",
          effectValue: 0.30,
          effectUnit: "percentage",
          conditionType: "character",
          conditionValue: "itadori",
        });
        break;
      case "pedra_filosofal":
        artifact = new Artifact({
          id: "pedra_filosofal",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Pedra Filosofal",
          emoji: Emojis.PEDRA_FILOSOFAL,
          effectType: "energyCost",
          effectValue: 5,
          effectUnit: "flat",
        });
        break;

      // ── Novos Artefatos ───────────────────────────────────────────────────
      case "hogyoku":
        artifact = new Artifact({
          id: "hogyoku",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Hōgyoku",
          emoji: Emojis.HOGYOKU,
          effectType: "stacking_damage",  // +5% por ataque, máx 30% (6 stacks)
          effectValue: 0.05,
          effectUnit: "percentage",
        });
        break;
      case "chakra_nova_caudas":
        artifact = new Artifact({
          id: "chakra_nova_caudas",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Chakra da Nova Caudas",
          emoji: Emojis.CHAKRA_NOVA_CAUDAS,
          effectType: "maxEnergy",
          effectValue: 0.15,
          effectUnit: "percentage",
        });
        break;
      case "sharingan":
        artifact = new Artifact({
          id: "sharingan",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Sharingan",
          emoji: Emojis.SHARINGAN,
          effectType: "damage",
          effectValue: 0.20,
          effectUnit: "percentage",
          conditionType: "anime",
          conditionValue: "naruto",
        });
        break;
      case "marca_maldicao":
        artifact = new Artifact({
          id: "marca_maldicao",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Marca da Maldição",
          emoji: Emojis.MARCA_MALDICAO,
          effectType: "curse_mark",  // +30% dano, -10% HP máx
          effectValue: 0.30,
          effectUnit: "percentage",
        });
        break;
      case "controle_infinito":
        artifact = new Artifact({
          id: "controle_infinito",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Controle do Infinito",
          emoji: Emojis.CONTROLE_INFINITO,
          effectType: "damageReduction",  // -15% dano recebido
          effectValue: 0.15,
          effectUnit: "percentage",
        });
        break;
      case "haki_do_rei":
        artifact = new Artifact({
          id: "haki_do_rei",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Haki do Rei",
          emoji: Emojis.HAKI_DO_REI,
          effectType: "damage",
          effectValue: 0.20,
          effectUnit: "percentage",
          conditionType: "hpAdvantage",  // ativo quando atacante tem mais HP que o defensor
        });
        break;
      case "pesos_lee":
        artifact = new Artifact({
          id: "pesos_lee",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Pesos do Rock Lee",
          emoji: Emojis.PESOS_LEE,
          effectType: "damage",
          effectValue: 0.15,
          effectUnit: "percentage",
        });
        break;
      case "roda_mahoraga":
        artifact = new Artifact({
          id: "roda_mahoraga",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Roda do Mahoraga",
          emoji: Emojis.RODA_MAHORAGA,
          effectType: "stacking_defense",  // +5% defesa ao tomar dano, máx 25% (5 stacks)
          effectValue: 0.05,
          effectUnit: "percentage",
        });
        break;
      case "seis_olhos":
        artifact = new Artifact({
          id: "seis_olhos",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Seis Olhos",
          emoji: Emojis.SEIS_OLHOS,
          effectType: "damage",
          effectValue: 0.25,
          effectUnit: "percentage",
          conditionType: "character",
          conditionValue: "satoru_gojo",
          secondaryEffect: { type: "damageReduction", value: 0.10 },
        });
        break;
      case "knight_killer":
        artifact = new Artifact({
          id: "knight_killer",
          instanceId: instanceData.id || instanceData.lastInsertRowid,
          name: "Knight Killer",
          emoji: Emojis.KNIGHT_KILLER,
          effectType: "damage",
          effectValue: 0.25,
          effectUnit: "percentage",
          conditionType: "character",
          conditionValue: "sung_jin_woo",
          secondaryEffect: { type: "maxEnergy", value: 0.05 },
        });
        break;
    }
    return artifact;
  }

  static getAllArtifacts() {
    return [
      "capsula_curativa",
      "esfera_4_estrelas",
      "mascara_hollow",
      "dedo_sukuna",
      "pedra_filosofal",
      "hogyoku",
      "chakra_nova_caudas",
      "sharingan",
      "marca_maldicao",
      "controle_infinito",
      "haki_do_rei",
      "pesos_lee",
      "roda_mahoraga",
      "seis_olhos",
      "knight_killer",
    ];
  }
}

module.exports = ArtifactManager;
