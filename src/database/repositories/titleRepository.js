"use strict";
const db = require("../db");

const TITLES = {
  pvp_champion: {
    id: "pvp_champion",
    name: "Soberano da Carnificina",
    description: "Vença **20** partidas de PVP Ranqueado",
    goal: 20,
    roleId: "1494494286102925452",
    zenith: 250,
    emoji: "⚔️",
  },
  npc_slayer: {
    id: "npc_slayer",
    name: "Exterminador de Titãs",
    description: "Derrote **150** chefes em combates PVE",
    goal: 150,
    roleId: "1494494549647560724",
    zenith: 350,
    emoji: "💀",
  },
  challenge_master: {
    id: "challenge_master",
    name: "Conquistador do Abismo",
    description: "Vença o Modo Desafio no Difícil **10 vezes**",
    goal: 10,
    roleId: "1494494397591715870",
    zenith: 250,
    emoji: "🏆",
  },
  boss_rush_emperor: {
    id: "boss_rush_emperor",
    name: "Imperador da Ruína",
    description: "Vença um Boss Rush sendo o **Boss**",
    goal: 1,
    roleId: "1494494782360129536",
    zenith: 150,
    emoji: "👑",
  },
  tower_irregular: {
    id: "tower_irregular",
    name: "O Irregular",
    description: "Alcance o **Andar 10** da Torre Infinita",
    goal: 10,
    roleId: "1494494642622697542",
    zenith: 350,
    emoji: "🗼",
    usesTowerRecord: true,
  },
};

function getProgress(playerId, titleId) {
  const title = TITLES[titleId];
  if (!title) return 0;
  if (title.usesTowerRecord) {
    const record = db.prepare("SELECT max_floor FROM tower_records WHERE player_id = ?").get(playerId);
    return record ? record.max_floor : 0;
  }
  const row = db.prepare("SELECT progress FROM title_progress WHERE player_id = ? AND title_id = ?").get(playerId, titleId);
  return row ? row.progress : 0;
}

function addProgress(playerId, titleId, amount = 1) {
  const title = TITLES[titleId];
  if (!title || title.usesTowerRecord) return; // torre usa tower_records
  db.prepare(
    `INSERT INTO title_progress (player_id, title_id, progress) VALUES (?, ?, ?)
     ON CONFLICT(player_id, title_id) DO UPDATE SET progress = progress + ?`
  ).run(playerId, titleId, amount, amount);
}

function isClaimed(playerId, titleId) {
  return !!db.prepare("SELECT 1 FROM title_claimed WHERE player_id = ? AND title_id = ?").get(playerId, titleId);
}

function claimTitle(playerId, titleId) {
  db.prepare("INSERT OR IGNORE INTO title_claimed (player_id, title_id) VALUES (?, ?)").run(playerId, titleId);
}

module.exports = { TITLES, getProgress, addProgress, isClaimed, claimTitle };
