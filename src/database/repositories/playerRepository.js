const db = require("../db.js");

function getPlayer(id) {
  let player = db.prepare("SELECT * FROM players WHERE id = ?").get(id);
  if (!player) {
    player = createPlayer(id);
  }
  return player;
}

function createPlayer(id) {
  db.prepare("INSERT INTO players (id) VALUES (?)").run(id);
  return { id, xp: 0, level: 1, gold: 0, zenith_fragments: 0, equipped_instance_id: null, pa: 0, rank: 'Discípulo III' };
}

function getStoryProgress(playerId) {
  let progress = db.prepare("SELECT last_boss_defeated FROM player_story_progress WHERE player_id = ?").get(playerId);
  if (!progress) {
    db.prepare("INSERT INTO player_story_progress (player_id) VALUES (?)").run(playerId);
    progress = { last_boss_defeated: null };
  }
  return progress;
}

function updateStoryProgress(playerId, bossId) {
  return db.prepare("UPDATE player_story_progress SET last_boss_defeated = ? WHERE player_id = ?").run(bossId, playerId);
}

function updatePlayer(id, data) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
  const values = Object.values(data);
  values.push(id);
  return db.prepare(`UPDATE players SET ${fields} WHERE id = ?`).run(...values);
}

// --- Sistema de Nível de Conta ---
const ACCOUNT_MAX_LEVEL = 100;

// XP necessário para subir DO nível atual para o PRÓXIMO.
// Curva suave: Lv1→2 ~106 XP, Lv25→26 ~375 XP, Lv50→51 ~774 XP, Lv99→100 ~1777 XP.
// Total Lv1→100 ≈ 81.000 XP (~2-3 meses para jogador ativo).
function getAccountLevelXPRequired(level) {
  if (level >= ACCOUNT_MAX_LEVEL) return Infinity;
  return Math.floor(100 + level * 5 + Math.pow(level, 1.5) * 1.2);
}

// Adiciona XP de conta ao jogador e processa level-ups.
// Retorna { leveledUp, oldLevel, newLevel }.
function addPlayerXP(playerId, amount) {
  const player = getPlayer(playerId);
  let { level, xp } = player;
  if (level >= ACCOUNT_MAX_LEVEL) return { leveledUp: false, oldLevel: level, newLevel: level };

  xp += amount;
  const oldLevel = level;
  let leveledUp = false;

  while (level < ACCOUNT_MAX_LEVEL) {
    const required = getAccountLevelXPRequired(level);
    if (xp < required) break;
    xp -= required;
    level++;
    leveledUp = true;
  }

  if (level >= ACCOUNT_MAX_LEVEL) xp = 0;
  updatePlayer(playerId, { level, xp });
  return { leveledUp, oldLevel, newLevel: level };
}

// --- Personagens ---

function getPlayerCharacters(playerId) {
  // Retorna todas as instâncias de personagens do jogador
  return db.prepare("SELECT * FROM player_characters WHERE player_id = ?").all(playerId);
}

function getCharacterInstance(instanceId) {
  return db.prepare("SELECT * FROM player_characters WHERE id = ?").get(instanceId);
}

function addCharacter(playerId, characterId, level = 1) {
  const player = getPlayer(playerId);
  const limit = player.char_slots ?? SLOT_DEFAULT;
  const count = db.prepare("SELECT COUNT(*) as cnt FROM player_characters WHERE player_id = ?").get(playerId).cnt;
  if (count >= limit) return { error: `Inventário cheio! (${count}/${limit} slots). Desbloqueie mais slots no \`!inv\`.` };
  const result = db.prepare("INSERT INTO player_characters (player_id, character_id, level) VALUES (?, ?, ?)").run(playerId, characterId, level);
  return result.lastInsertRowid;
}

function removeCharacterInstance(instanceId) {
  return db.prepare("DELETE FROM player_characters WHERE id = ?").run(instanceId);
}

function updateCharacterInstance(instanceId, data) {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
  const values = Object.values(data);
  values.push(instanceId);
  const result = db.prepare(`UPDATE player_characters SET ${fields} WHERE id = ?`).run(...values);
  
  // Missão: Level Up
  if (data.level) {
    const instance = getCharacterInstance(instanceId);
    const missionRepository = require("./missionRepository");
    if (data.level >= 10) missionRepository.addProgress(instance.player_id, "level_up_10");
    if (data.level >= 30) missionRepository.addProgress(instance.player_id, "level_up_30");
  }
  
  return result;
}

// --- Itens ---

function getPlayerItems(playerId) {
  return db.prepare("SELECT * FROM player_items WHERE player_id = ?").all(playerId);
}

function addItem(playerId, itemId, quantity = 1) {
  const existing = db.prepare("SELECT quantity FROM player_items WHERE player_id = ? AND item_id = ?").get(playerId, itemId);
  if (existing) {
    return db.prepare("UPDATE player_items SET quantity = quantity + ? WHERE player_id = ? AND item_id = ?").run(quantity, playerId, itemId);
  } else {
    return db.prepare("INSERT INTO player_items (player_id, item_id, quantity) VALUES (?, ?, ?)").run(playerId, itemId, quantity);
  }
}

function removeItem(playerId, itemId, quantity = 1) {
  const existing = db.prepare("SELECT quantity FROM player_items WHERE player_id = ? AND item_id = ?").get(playerId, itemId);
  if (!existing || existing.quantity < quantity) return false;
  
  let result;
  if (existing.quantity === quantity) {
    result = db.prepare("DELETE FROM player_items WHERE player_id = ? AND item_id = ?").run(playerId, itemId);
  } else {
    result = db.prepare("UPDATE player_items SET quantity = quantity - ? WHERE player_id = ? AND item_id = ?").run(quantity, playerId, itemId);
  }

  // Missão: Soul Stones
  if (itemId.startsWith("soul_stone_")) {
    const missionRepository = require("./missionRepository");
    missionRepository.addProgress(playerId, "use_soul_stones", quantity);
  }

  return result;
}

// --- Artefatos ---

function getPlayerArtifacts(playerId) {
  return db.prepare("SELECT * FROM player_artifacts WHERE player_id = ?").all(playerId);
}

function getArtifactInstance(instanceId) {
  return db.prepare("SELECT * FROM player_artifacts WHERE id = ?").get(instanceId);
}

function addArtifact(playerId, artifactId) {
  const player = getPlayer(playerId);
  const limit = player.artifact_slots ?? SLOT_DEFAULT;
  const count = db.prepare("SELECT COUNT(*) as cnt FROM player_artifacts WHERE player_id = ?").get(playerId).cnt;
  if (count >= limit) return { error: `Inventário de artefatos cheio! (${count}/${limit} slots). Desbloqueie mais slots no \`!inv\`.` };
  const result = db.prepare("INSERT INTO player_artifacts (player_id, artifact_id) VALUES (?, ?)").run(playerId, artifactId);
  return result.lastInsertRowid;
}

function removeArtifactInstance(instanceId) {
  return db.prepare("DELETE FROM player_artifacts WHERE id = ?").run(instanceId);
}

function equipArtifact(characterInstanceId, artifactInstanceId, slot) {
  return db.prepare(`UPDATE player_characters SET equipped_artifact_${slot} = ? WHERE id = ?`).run(artifactInstanceId, characterInstanceId);
}

function unequipArtifact(characterInstanceId, slot) {
  return db.prepare(`UPDATE player_characters SET equipped_artifact_${slot} = NULL WHERE id = ?`).run(characterInstanceId);
}

// --- Reset de Cooldowns (Admin) ---

/**
 * Reseta o cooldown da Torre Infinita de um jogador específico.
 * @param {string} playerId
 */
function resetTowerCooldown(playerId) {
  const existing = db.prepare("SELECT player_id FROM tower_cooldowns WHERE player_id = ?").get(playerId);
  if (existing) {
    return db.prepare("UPDATE tower_cooldowns SET available_at = 0 WHERE player_id = ?").run(playerId);
  }
  // Se não existir registro, cria com available_at = 0 (sem cooldown)
  return db.prepare("INSERT INTO tower_cooldowns (player_id, available_at) VALUES (?, 0)").run(playerId);
}

/**
 * Reseta os cooldowns globais do Modo Desafio para todas as dificuldades.
 */
function resetAllChallengeCooldowns() {
  return db.prepare("UPDATE challenge_cooldowns SET available_at = 0").run();
}

/**
 * Reseta o progresso individual de desafio de um jogador (permite receber recompensa novamente).
 * @param {string} playerId
 */
function resetPlayerChallengeProgress(playerId) {
  return db.prepare("UPDATE player_challenge_progress SET last_completed_at = 0 WHERE player_id = ?").run(playerId);
}

// --- Sistema de Slots ---
const SLOT_COST      = 300;
const SLOT_INCREMENT = 5;
const SLOT_DEFAULT   = 10;
const SLOT_MAX       = 30;

const FRAG_SLOT_DEFAULT   = 10;
const FRAG_SLOT_MAX       = 15;
const FRAG_SLOT_INCREMENT = 5;

function getSlots(playerId) {
  const player = getPlayer(playerId);
  return {
    charSlots:     player.char_slots     ?? SLOT_DEFAULT,
    artifactSlots: player.artifact_slots ?? SLOT_DEFAULT,
    fragmentSlots: player.fragment_slots ?? FRAG_SLOT_DEFAULT,
  };
}

function canUnlockSlots(playerId, type) {
  const player  = getPlayer(playerId);
  const isFrags = type === "fragment";
  const col     = type === "char" ? "char_slots" : isFrags ? "fragment_slots" : "artifact_slots";
  const defVal  = isFrags ? FRAG_SLOT_DEFAULT : SLOT_DEFAULT;
  const maxVal  = isFrags ? FRAG_SLOT_MAX     : SLOT_MAX;
  const current = player[col] ?? defVal;
  if (current >= maxVal) return { can: false, reason: `Você já atingiu o máximo de **${maxVal} slots**!` };
  const zenith  = player.zenith_fragments || 0;
  if (zenith < SLOT_COST) return { can: false, reason: `Você precisa de **${SLOT_COST} Fragmentos Zenith** para desbloquear mais slots. (Você tem: ${zenith})` };
  return { can: true };
}

function unlockSlots(playerId, type) {
  const check   = canUnlockSlots(playerId, type);
  if (!check.can) return check;
  const player  = getPlayer(playerId);
  const isFrags = type === "fragment";
  const col     = type === "char" ? "char_slots" : isFrags ? "fragment_slots" : "artifact_slots";
  const defVal  = isFrags ? FRAG_SLOT_DEFAULT   : SLOT_DEFAULT;
  const maxVal  = isFrags ? FRAG_SLOT_MAX       : SLOT_MAX;
  const incVal  = isFrags ? FRAG_SLOT_INCREMENT : SLOT_INCREMENT;
  const current = player[col] ?? defVal;
  const newSlots = Math.min(maxVal, current + incVal);
  db.prepare(`UPDATE players SET ${col} = ?, zenith_fragments = zenith_fragments - ? WHERE id = ?`).run(newSlots, SLOT_COST, playerId);
  return { can: true, newSlots };
}

module.exports = {
  getPlayer,
  createPlayer,
  updatePlayer,
  getPlayerCharacters,
  getSlots,
  canUnlockSlots,
  unlockSlots,
  SLOT_DEFAULT,
  SLOT_MAX,
  SLOT_COST,
  SLOT_INCREMENT,
  FRAG_SLOT_DEFAULT,
  FRAG_SLOT_MAX,
  FRAG_SLOT_INCREMENT,
  getCharacterInstance,
  addCharacter,
  removeCharacterInstance,
  updateCharacterInstance,
  getPlayerItems,
  addItem,
  removeItem,
  getPlayerArtifacts,
  getArtifactInstance,
  addArtifact,
  removeArtifactInstance,
  equipArtifact,
  unequipArtifact,
  getStoryProgress,
  updateStoryProgress,
  addPlayerXP,
  getAccountLevelXPRequired,
  ACCOUNT_MAX_LEVEL,
  addToQueue: (playerId) => db.prepare("INSERT OR REPLACE INTO ranked_queue (player_id) VALUES (?)").run(playerId),
  removeFromQueue: (playerId) => db.prepare("DELETE FROM ranked_queue WHERE player_id = ?").run(playerId),
  getQueue: () => db.prepare("SELECT * FROM ranked_queue ORDER BY joined_at ASC").all(),
  isInQueue: (playerId) => !!db.prepare("SELECT 1 FROM ranked_queue WHERE player_id = ?").get(playerId),

  // --- Modo Desafio ---
  // Retorna o timestamp (UTC ms) em que a próxima janela de hora BRT começa após `completedAt`
  // BRT = UTC-3. Se completou às 13:40 BRT → disponível às 14:00 BRT.
  getNextBRTHourBoundary: (completedAtMs) => {
    if (!completedAtMs) return 0;
    const BRT_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3 = subtrair 3h para converter UTC→BRT
    const brtMs = completedAtMs - BRT_OFFSET_MS;
    const nextHourBrt = (Math.floor(brtMs / 3600000) + 1) * 3600000;
    return nextHourBrt + BRT_OFFSET_MS; // de volta para UTC
  },

  isPlayerChallengeCooledDown: function(playerId, difficulty) {
    let progress = db.prepare("SELECT last_completed_at FROM player_challenge_progress WHERE player_id = ? AND difficulty = ?").get(playerId, difficulty);
    if (!progress || !progress.last_completed_at) return true; // nunca jogou, pode jogar
    const nextWindow = this.getNextBRTHourBoundary(progress.last_completed_at);
    return Date.now() >= nextWindow;
  },

  getPlayerChallengeCooldownMs: function(playerId, difficulty) {
    let progress = db.prepare("SELECT last_completed_at FROM player_challenge_progress WHERE player_id = ? AND difficulty = ?").get(playerId, difficulty);
    if (!progress || !progress.last_completed_at) return 0;
    const nextWindow = this.getNextBRTHourBoundary(progress.last_completed_at);
    return Math.max(0, nextWindow - Date.now());
  },

  getPlayerChallengeProgress: (playerId, difficulty) => {
    let progress = db.prepare("SELECT last_completed_at FROM player_challenge_progress WHERE player_id = ? AND difficulty = ?").get(playerId, difficulty);
    if (!progress) {
      db.prepare("INSERT INTO player_challenge_progress (player_id, difficulty) VALUES (?, ?)").run(playerId, difficulty);
      progress = { last_completed_at: 0 };
    }
    return progress;
  },

  updatePlayerChallengeProgress: (playerId, difficulty, completedAt) => {
    const existing = db.prepare("SELECT 1 FROM player_challenge_progress WHERE player_id = ? AND difficulty = ?").get(playerId, difficulty);
    if (existing) {
      return db.prepare("UPDATE player_challenge_progress SET last_completed_at = ? WHERE player_id = ? AND difficulty = ?").run(completedAt, playerId, difficulty);
    }
    return db.prepare("INSERT INTO player_challenge_progress (player_id, difficulty, last_completed_at) VALUES (?, ?, ?)").run(playerId, difficulty, completedAt);
  },

  // Mantido para compatibilidade com admin reset
  getGlobalChallengeCooldown: (difficulty) => {
    return db.prepare("SELECT available_at FROM challenge_cooldowns WHERE difficulty = ?").get(difficulty) || { available_at: 0 };
  },
  updateGlobalChallengeCooldown: (difficulty, availableAt) => {
    return db.prepare("UPDATE challenge_cooldowns SET available_at = ? WHERE difficulty = ?").run(availableAt, difficulty);
  },

  // --- Torre Infinita ---
  getTowerCooldown: (playerId) => {
    let cooldown = db.prepare("SELECT available_at FROM tower_cooldowns WHERE player_id = ?").get(playerId);
    if (!cooldown) {
      db.prepare("INSERT INTO tower_cooldowns (player_id, available_at) VALUES (?, 0)").run(playerId);
      cooldown = { available_at: 0 };
    }
    return cooldown;
  },

  updateTowerCooldown: (playerId, availableAt) => {
    return db.prepare("UPDATE tower_cooldowns SET available_at = ? WHERE player_id = ?").run(availableAt, playerId);
  },

  // --- Ranking da Torre ---
  updateTowerRecord: (playerId, floor, teamInstanceIds = []) => {
    const existing = db.prepare("SELECT max_floor FROM tower_records WHERE player_id = ?").get(playerId);
    const [c1, c2, c3] = teamInstanceIds;
    if (!existing) {
      return db.prepare("INSERT INTO tower_records (player_id, max_floor, team_char_1, team_char_2, team_char_3) VALUES (?, ?, ?, ?, ?)").run(playerId, floor, c1 ?? null, c2 ?? null, c3 ?? null);
    } else if (floor > existing.max_floor) {
      return db.prepare("UPDATE tower_records SET max_floor = ?, team_char_1 = ?, team_char_2 = ?, team_char_3 = ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?").run(floor, c1 ?? null, c2 ?? null, c3 ?? null, playerId);
    }
  },

  getTowerRanking: (limit = 10) => {
    return db.prepare(`
      SELECT tr.player_id, tr.max_floor, tr.team_char_1, tr.team_char_2, tr.team_char_3, p.equipped_instance_id
      FROM tower_records tr
      JOIN players p ON tr.player_id = p.id
      ORDER BY tr.max_floor DESC, tr.updated_at ASC
      LIMIT ?
    `).all(limit);
  },

  getPvpRanking: (limit = 100) => {
    return db.prepare(`
      SELECT id AS player_id, pa, rank, equipped_instance_id
      FROM players
      WHERE rank != 'Discípulo III' OR pa > 0
      LIMIT ?
    `).all(limit);
  },

  // --- Admin: Reset de Cooldowns ---
  resetTowerCooldown,
  resetAllChallengeCooldowns,
  resetPlayerChallengeProgress,

  // --- Proteção de Personagem ---
  toggleCharacterProtection: (instanceId) => {
    const inst = db.prepare("SELECT protected FROM player_characters WHERE id = ?").get(instanceId);
    if (!inst) return null;
    const newVal = inst.protected ? 0 : 1;
    db.prepare("UPDATE player_characters SET protected = ? WHERE id = ?").run(newVal, instanceId);
    return newVal;
  },

  // --- Limbo ---
  LIMBO_MAX: 100,
  addToLimbo: (playerId, characterId) => {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM limbo_characters WHERE player_id = ?").get(playerId).cnt;
    if (count >= 100) return { error: "limbo_full" };
    return db.prepare("INSERT INTO limbo_characters (player_id, character_id) VALUES (?, ?)").run(playerId, characterId);
  },
  getLimboCharacters: (playerId) => {
    return db.prepare("SELECT * FROM limbo_characters WHERE player_id = ? ORDER BY id ASC").all(playerId);
  },
  getLimboCount: (playerId) => {
    return db.prepare("SELECT COUNT(*) as cnt FROM limbo_characters WHERE player_id = ?").get(playerId).cnt;
  },
  removeFromLimbo: (limboId) => {
    const row = db.prepare("SELECT * FROM limbo_characters WHERE id = ?").get(limboId);
    if (!row) return null;
    db.prepare("DELETE FROM limbo_characters WHERE id = ?").run(limboId);
    return row;
  },
};
