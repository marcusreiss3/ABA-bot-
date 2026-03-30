class Artifact {
  constructor(data) {
    this.id = data.id;
    this.instanceId = data.instanceId;
    this.name = data.name;
    this.emoji = data.emoji;
    this.effectType = data.effectType;
    this.effectValue = data.effectValue;
    this.effectUnit = data.effectUnit;
    this.conditionType = data.conditionType || null;
    this.conditionValue = data.conditionValue || null;
  }
}

module.exports = Artifact;
