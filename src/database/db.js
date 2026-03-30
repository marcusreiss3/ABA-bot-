const Database = require("better-sqlite3");
const db = new Database("database.sqlite");

// Criar tabela de jogadores
db.prepare(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    gold INTEGER DEFAULT 0,
    zenith_fragments INTEGER DEFAULT 0,
    equipped_instance_id INTEGER, -- Agora aponta para o ID único da instância do personagem
    pa INTEGER DEFAULT 0,
    rank TEXT DEFAULT 'Discípulo III'
  )
`).run();

// Criar tabela de fila ranqueada
db.prepare(`
  CREATE TABLE IF NOT EXISTS ranked_queue (
    player_id TEXT PRIMARY KEY,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Criar tabela de progresso do modo história
db.prepare(`
  CREATE TABLE IF NOT EXISTS player_story_progress (
    player_id TEXT PRIMARY KEY,
    last_boss_defeated TEXT DEFAULT NULL
  )
`).run();

// Criar tabela de instâncias de personagens (Permite duplicatas com níveis diferentes)
db.prepare(`
  CREATE TABLE IF NOT EXISTS player_characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT,
    character_id TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    equipped_artifact_1 INTEGER DEFAULT NULL,
    equipped_artifact_2 INTEGER DEFAULT NULL,
    equipped_artifact_3 INTEGER DEFAULT NULL
  )
`).run();

// Criar tabela de itens do inventário (Pedras da Alma, etc)
	db.prepare(`
	  CREATE TABLE IF NOT EXISTS player_artifacts (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
	    player_id TEXT,
	    artifact_id TEXT
	  )
	`).run();


db.prepare(`
  CREATE TABLE IF NOT EXISTS player_items (
    player_id TEXT,
    item_id TEXT,
    quantity INTEGER DEFAULT 0,
    PRIMARY KEY (player_id, item_id)
  )
`).run();

// Criar tabela de batalhas
db.prepare(`
  CREATE TABLE IF NOT EXISTS battles (
    id TEXT PRIMARY KEY,
    player1Id TEXT,
    player2Id TEXT,
    state TEXT,
    lastUpdate DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

module.exports = db;
