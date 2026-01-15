import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq, and, isNull } from 'drizzle-orm'
import * as schema from './schema'
import path from 'path'

let db: ReturnType<typeof drizzle>
let sqlite: Database.Database

/**
 * Initialise la connexion à la base de données SQLite.
 * @param userDataPath - Chemin vers le dossier userData d'Electron
 */
export function initDatabase(userDataPath: string) {
  const dbPath = path.join(userDataPath, 'pokemon-game.db')
  console.log('[Database] Initialisation:', dbPath)
  
  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL') // Meilleure performance
  
  db = drizzle(sqlite, { schema })
  
  // Créer les tables si elles n'existent pas
  createTablesIfNotExist()
  
  // Initialiser l'état du jeu si vide
  initializeGameState()
  
  console.log('[Database] Pret')
  return db
}

/**
 * Crée les tables manuellement (sans migrations pour simplifier).
 */
function createTablesIfNotExist() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS pokemon (
      uuid TEXT PRIMARY KEY,
      species_id TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      date_caught TEXT NOT NULL,
      is_in_team INTEGER NOT NULL DEFAULT 0,
      team_position INTEGER,
      pc_position INTEGER
    );
    
    -- Attempt to add pc_position if it doesn't exist (for existing DBs)
    -- SQLite doesn't have "IF NOT EXISTS" for ADD COLUMN, so we use a try-catch pattern or check pragma
  `);

  try {
    sqlite.exec('ALTER TABLE pokemon ADD COLUMN pc_position INTEGER;');
  } catch (e) {
    // Column probably already exists
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      active_id TEXT,
      candies INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL UNIQUE,
      quantity INTEGER NOT NULL DEFAULT 0
    );
  `)
}

/**
 * Initialise l'état du jeu avec un starter si la DB est vide.
 */
function initializeGameState() {
  const state = sqlite.prepare('SELECT * FROM game_state WHERE id = 1').get()
  
  if (!state) {
    const now = new Date().toISOString()
    
    // Créer l'état du jeu vide (pas encore de Pokémon)
    sqlite.prepare(`
      INSERT INTO game_state (id, active_id, candies, created_at, updated_at)
      VALUES (1, NULL, 10, ?, ?)
    `).run(now, now)
    
    console.log('[Database] Etat initial cree (sans Pokemon)')
  }
}



/**
 * Ferme proprement la connexion à la base de données.
 */
export function closeDatabase() {
  if (sqlite) {
    sqlite.close()
    console.log('[Database] Connexion fermee')
  }
}

/**
 * Retourne l'instance Drizzle.
 */
export function getDb() {
  return db
}

/**
 * Retourne l'instance SQLite brute.
 */
export function getSqlite() {
  return sqlite
}

export { schema }
