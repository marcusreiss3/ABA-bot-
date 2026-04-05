const missionConfig = require("../../config/missionConfig");

class MissionRepository {
  constructor() {
    this.globalMissions = {
      daily: [],
      weekly: [],
      lastDailyRotation: null,
      lastWeeklyRotation: null
    };
    this.playerProgress = new Map(); // userId -> { missionId -> currentProgress }
    this.playerClaimed = new Map(); // userId -> Set(missionId)
  }

  // Sorteia 3 missões aleatórias de uma lista
  getRandomMissions(list, count) {
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Verifica e realiza a rotação se necessário
  checkRotation() {
    const now = new Date();
    const today = now.toDateString();
    
    // Rotação Diária (Meia-noite)
    if (this.globalMissions.lastDailyRotation !== today) {
      this.globalMissions.daily = this.getRandomMissions(missionConfig.daily, 3);
      this.globalMissions.lastDailyRotation = today;
      this.resetDailyProgress();
    }

    // Rotação Semanal (Domingo à meia-noite)
    const dayOfWeek = now.getDay(); // 0 = Domingo
    const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
    
    // Se não houver missões semanais (primeira execução), sorteia agora
    if (this.globalMissions.weekly.length === 0) {
      this.globalMissions.weekly = this.getRandomMissions(missionConfig.weekly, 3);
      this.globalMissions.lastWeeklyRotation = weekNumber;
    }
    // Rotação normal no domingo
    else if (this.globalMissions.lastWeeklyRotation !== weekNumber && dayOfWeek === 0) {
      this.globalMissions.weekly = this.getRandomMissions(missionConfig.weekly, 3);
      this.globalMissions.lastWeeklyRotation = weekNumber;
      this.resetWeeklyProgress();
    }
  }

  resetDailyProgress() {
    // Limpa apenas o progresso das missões diárias antigas
    const dailyIds = missionConfig.daily.map(m => m.id);
    this.playerProgress.forEach((progress, userId) => {
      dailyIds.forEach(id => delete progress[id]);
    });
    this.playerClaimed.forEach((claimed, userId) => {
      dailyIds.forEach(id => claimed.delete(id));
    });
  }

  resetWeeklyProgress() {
    // Limpa apenas o progresso das missões semanais antigas
    const weeklyIds = missionConfig.weekly.map(m => m.id);
    this.playerProgress.forEach((progress, userId) => {
      weeklyIds.forEach(id => delete progress[id]);
    });
    this.playerClaimed.forEach((claimed, userId) => {
      weeklyIds.forEach(id => claimed.delete(id));
    });
  }

  // Força a rotação (Admin)
  forceRotation(type) {
    if (type === "daily") {
      this.globalMissions.daily = this.getRandomMissions(missionConfig.daily, 3);
      this.resetDailyProgress();
    } else if (type === "weekly") {
      this.globalMissions.weekly = this.getRandomMissions(missionConfig.weekly, 3);
      this.resetWeeklyProgress();
    }
  }

  // Adiciona progresso a uma missão
  addProgress(userId, missionId, amount = 1) {
    if (!this.playerProgress.has(userId)) {
      this.playerProgress.set(userId, {});
    }
    const progress = this.playerProgress.get(userId);
    progress[missionId] = (progress[missionId] || 0) + amount;
  }

  getProgress(userId, missionId) {
    const progress = this.playerProgress.get(userId);
    return progress ? (progress[missionId] || 0) : 0;
  }

  isClaimed(userId, missionId) {
    const claimed = this.playerClaimed.get(userId);
    return claimed ? claimed.has(missionId) : false;
  }

  claimReward(userId, missionId) {
    if (!this.playerClaimed.has(userId)) {
      this.playerClaimed.set(userId, new Set());
    }
    this.playerClaimed.get(userId).add(missionId);
  }

  getGlobalMissions() {
    this.checkRotation();
    return this.globalMissions;
  }
}

module.exports = new MissionRepository();
