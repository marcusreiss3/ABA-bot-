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

// --- Personagens ---

function getPlayerCharacters(playerId) {
  // Retorna todas as instâncias de personagens do jogador
  return db.prepare("SELECT * FROM player_characters WHERE player_id = ?").all(playerId);
}

function getCharacterInstance(instanceId) {
  return db.prepare("SELECT * FROM player_characters WHERE id = ?").get(instanceId);
}

function addCharacter(playerId, characterId, level = 1) {
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
  return db.prepare(`UPDATE player_characters SET ${fields} WHERE id = ?`).run(...values);
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
  
  if (existing.quantity === quantity) {
    return db.prepare("DELETE FROM player_items WHERE player_id = ? AND item_id = ?").run(playerId, itemId);
  } else {
    return db.prepare("UPDATE player_items SET quantity = quantity - ? WHERE player_id = ? AND item_id = ?").run(quantity, playerId, itemId);
  }
}

// --- Artefatos ---

function getPlayerArtifacts(playerId) {
  return db.prepare("SELECT * FROM player_artifacts WHERE player_id = ?").all(playerId);
}

function getArtifactInstance(instanceId) {
  return db.prepare("SELECT * FROM player_artifacts WHERE id = ?").get(instanceId);
}

function addArtifact(playerId, artifactId) {
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

module.exports = {
  getPlayer,
  createPlayer,
  updatePlayer,
  getPlayerCharacters,
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
  addToQueue: (playerId) => db.prepare("INSERT OR REPLACE INTO ranked_queue (player_id) VALUES (?)").run(playerId),
  removeFromQueue: (playerId) => db.prepare("DELETE FROM ranked_queue WHERE player_id = ?").run(playerId),
  getQueue: () => db.prepare("SELECT * FROM ranked_queue ORDER BY joined_at ASC").all(),
  isInQueue: (playerId) => !!db.prepare("SELECT 1 FROM ranked_queue WHERE player_id = ?").get(playerId),

  // --- Modo Desafio ---
  getGlobalChallengeCooldown: (difficulty) => {
    return db.prepare("SELECT available_at FROM challenge_cooldowns WHERE difficulty = ?").get(difficulty);
  },

  updateGlobalChallengeCooldown: (difficulty, availableAt) => {
    return db.prepare("UPDATE challenge_cooldowns SET available_at = ? WHERE difficulty = ?").run(availableAt, difficulty);
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
    return db.prepare("UPDATE player_challenge_progress SET last_completed_at = ? WHERE player_id = ? AND difficulty = ?").run(completedAt, playerId, difficulty);
  }
};
