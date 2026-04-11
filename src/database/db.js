const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(path.join(__dirname, "../../database.sqlite"));

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

// Criar tabela de cooldown global do Modo Desafio
db.prepare(`
  CREATE TABLE IF NOT EXISTS challenge_cooldowns (
    difficulty TEXT PRIMARY KEY,
    available_at INTEGER DEFAULT 0
  )
`).run();

// Inicializar cooldowns se não existirem
const difficulties = ['facil', 'medio', 'dificil'];
difficulties.forEach(diff => {
  db.prepare("INSERT OR IGNORE INTO challenge_cooldowns (difficulty, available_at) VALUES (?, 0)").run(diff);
});

// Criar tabela de progresso individual no Modo Desafio (para controle de recompensa em party)
db.prepare(`
  CREATE TABLE IF NOT EXISTS player_challenge_progress (
    player_id TEXT,
    difficulty TEXT,
    last_completed_at INTEGER DEFAULT 0,
    PRIMARY KEY (player_id, difficulty)
  )
`).run();

// Criar tabela de cooldown da Torre Infinita
db.prepare(`
  CREATE TABLE IF NOT EXISTS tower_cooldowns (
    player_id TEXT PRIMARY KEY,
    available_at INTEGER DEFAULT 0
  )
`).run();

// Criar tabela de recordes da Torre Infinita
db.prepare(`
  CREATE TABLE IF NOT EXISTS tower_records (
    player_id TEXT PRIMARY KEY,
    max_floor INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Adicionar colunas de slots ao players (se ainda não existirem — SQLite não tem IF NOT EXISTS em ALTER TABLE)
try { db.prepare("ALTER TABLE players ADD COLUMN char_slots INTEGER DEFAULT 10").run(); } catch (_) {}
try { db.prepare("ALTER TABLE players ADD COLUMN artifact_slots INTEGER DEFAULT 10").run(); } catch (_) {}

module.exports = db;
