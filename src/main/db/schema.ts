import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ============ POKEMON TABLE ============
export const pokemon = sqliteTable('pokemon', {
  uuid: text('uuid').primaryKey(),
  speciesId: text('species_id').notNull(),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  dateCaught: text('date_caught').notNull(),
  isInTeam: integer('is_in_team', { mode: 'boolean' }).notNull().default(false),
  teamPosition: integer('team_position'), // 0, 1, 2 for team slots, null if in PC
  pcPosition: integer('pc_position'), // Sort order for the PC
  nickname: text('nickname')
})

// ============ GAME STATE TABLE ============
export const gameState = sqliteTable('game_state', {
  id: integer('id').primaryKey().default(1), // Single row
  activeId: text('active_id'),
  candies: integer('candies').notNull().default(10),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

// ============ INVENTORY TABLE ============
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemId: text('item_id').notNull().unique(),
  quantity: integer('quantity').notNull().default(0)
})

// ============ TYPES ============
export type Pokemon = typeof pokemon.$inferSelect
export type NewPokemon = typeof pokemon.$inferInsert
export type GameState = typeof gameState.$inferSelect
export type InventoryItem = typeof inventory.$inferSelect
