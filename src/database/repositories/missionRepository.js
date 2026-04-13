const db = require("../db");
const missionConfig = require("../../config/missionConfig");

// Cache em memória para evitar queries a cada checagem de progresso
let cache = null;

function loadCache() {
  const dailyRow  = db.prepare("SELECT mission_ids, last_rotation FROM mission_state WHERE type = 'daily'").get();
  const weeklyRow = db.prepare("SELECT mission_ids, last_rotation FROM mission_state WHERE type = 'weekly'").get();

  const allDaily  = missionConfig.daily;
  const allWeekly = missionConfig.weekly;

  // Reconstrói lista de missões ativas a partir dos IDs salvos
  const hydrate = (ids, pool) => ids
    .map(id => pool.find(m => m.id === id))
    .filter(Boolean);

  cache = {
    daily:              dailyRow  ? hydrate(JSON.parse(dailyRow.mission_ids),  allDaily)  : [],
    weekly:             weeklyRow ? hydrate(JSON.parse(weeklyRow.mission_ids), allWeekly) : [],
    lastDailyRotation:  dailyRow  ? dailyRow.last_rotation  : null,
    lastWeeklyRotation: weeklyRow ? weeklyRow.last_rotation : null,
  };
}

function saveMissionState(type, missions, lastRotation) {
  const ids = JSON.stringify(missions.map(m => m.id));
  db.prepare(`
    INSERT OR REPLACE INTO mission_state (type, mission_ids, last_rotation)
    VALUES (?, ?, ?)
  `).run(type, ids, lastRotation);
}

// Retorna a chave do sábado mais recente (meia-noite) como string de data
function getMostRecentSaturdayKey() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Dom ... 6=Sáb
  const daysSinceSat = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const lastSat = new Date(now);
  lastSat.setHours(0, 0, 0, 0);
  lastSat.setDate(lastSat.getDate() - daysSinceSat);
  return lastSat.toDateString();
}

class MissionRepository {
  constructor() {
    loadCache();
  }

  getRandomMissions(list, count) {
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Verifica e realiza rotações necessárias
  checkRotation() {
    const today = new Date().toDateString();

    // Rotação diária — meia-noite de cada dia
    if (cache.lastDailyRotation !== today) {
      cache.daily = this.getRandomMissions(missionConfig.daily, 3);
      cache.lastDailyRotation = today;
      saveMissionState("daily", cache.daily, today);
      this.resetDailyProgress();
    }

    // Rotação semanal — sábado à meia-noite
    const currentSatKey = getMostRecentSaturdayKey();
    if (cache.lastWeeklyRotation !== currentSatKey) {
      const isFirstRun = cache.weekly.length === 0;
      cache.weekly = this.getRandomMissions(missionConfig.weekly, 3);
      cache.lastWeeklyRotation = currentSatKey;
      saveMissionState("weekly", cache.weekly, currentSatKey);
      if (!isFirstRun) this.resetWeeklyProgress();
    }
  }

  resetDailyProgress() {
    const ids = missionConfig.daily.map(m => m.id);
    const ph  = ids.map(() => "?").join(",");
    db.prepare(`DELETE FROM mission_progress WHERE mission_id IN (${ph})`).run(...ids);
    db.prepare(`DELETE FROM mission_claimed  WHERE mission_id IN (${ph})`).run(...ids);
  }

  resetWeeklyProgress() {
    const ids = missionConfig.weekly.map(m => m.id);
    const ph  = ids.map(() => "?").join(",");
    db.prepare(`DELETE FROM mission_progress WHERE mission_id IN (${ph})`).run(...ids);
    db.prepare(`DELETE FROM mission_claimed  WHERE mission_id IN (${ph})`).run(...ids);
  }

  // Força rotação manual (Admin)
  forceRotation(type) {
    if (type === "daily") {
      cache.daily = this.getRandomMissions(missionConfig.daily, 3);
      cache.lastDailyRotation = new Date().toDateString();
      saveMissionState("daily", cache.daily, cache.lastDailyRotation);
      this.resetDailyProgress();
    } else if (type === "weekly") {
      cache.weekly = this.getRandomMissions(missionConfig.weekly, 3);
      cache.lastWeeklyRotation = getMostRecentSaturdayKey();
      saveMissionState("weekly", cache.weekly, cache.lastWeeklyRotation);
      this.resetWeeklyProgress();
    }
  }

  addProgress(userId, missionId, amount = 1) {
    db.prepare(`
      INSERT INTO mission_progress (player_id, mission_id, progress)
      VALUES (?, ?, ?)
      ON CONFLICT(player_id, mission_id) DO UPDATE SET progress = progress + excluded.progress
    `).run(userId, missionId, amount);
  }

  getProgress(userId, missionId) {
    const row = db.prepare(
      "SELECT progress FROM mission_progress WHERE player_id = ? AND mission_id = ?"
    ).get(userId, missionId);
    return row ? row.progress : 0;
  }

  isClaimed(userId, missionId) {
    return !!db.prepare(
      "SELECT 1 FROM mission_claimed WHERE player_id = ? AND mission_id = ?"
    ).get(userId, missionId);
  }

  claimReward(userId, missionId) {
    db.prepare(
      "INSERT OR IGNORE INTO mission_claimed (player_id, mission_id) VALUES (?, ?)"
    ).run(userId, missionId);
  }

  getGlobalMissions() {
    this.checkRotation();
    return cache;
  }
}

module.exports = new MissionRepository();
