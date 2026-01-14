import { eq, and, isNull, asc, desc } from 'drizzle-orm'
import { getDb, getSqlite, schema } from '../db'
import type { Pokemon, NewPokemon, GameState, InventoryItem } from '../db/schema'

/**
 * Service de base de données utilisant Drizzle ORM avec SQLite.
 */
export class DatabaseService {
  // ============ POKEMON ============
  
  /**
   * Récupère tous les Pokémon.
   */
  getAllPokemon(): Pokemon[] {
    return getDb().select().from(schema.pokemon).all()
  }

  /**
   * Récupère un Pokémon par son UUID.
   */
  getPokemon(uuid: string): Pokemon | undefined {
    return getDb()
      .select()
      .from(schema.pokemon)
      .where(eq(schema.pokemon.uuid, uuid))
      .get()
  }

  /**
   * Récupère les Pokémon de l'équipe (triés par position).
   */
  getTeamPokemon(): Pokemon[] {
    return getDb()
      .select()
      .from(schema.pokemon)
      .where(eq(schema.pokemon.isInTeam, true))
      .orderBy(asc(schema.pokemon.teamPosition))
      .all()
  }

  /**
   * Récupère les Pokémon dans le PC (pas dans l'équipe).
   */
  getStoredPokemon(): Pokemon[] {
    return getDb()
      .select()
      .from(schema.pokemon)
      .where(eq(schema.pokemon.isInTeam, false))
      .all()
  }

  /**
   * Ajoute un nouveau Pokémon.
   */
  addPokemon(data: NewPokemon): Pokemon {
    getDb().insert(schema.pokemon).values(data).run()
    return this.getPokemon(data.uuid)!
  }

  /**
   * Met à jour un Pokémon.
   */
  updatePokemon(uuid: string, updates: Partial<Pokemon>): Pokemon | undefined {
    getDb()
      .update(schema.pokemon)
      .set(updates)
      .where(eq(schema.pokemon.uuid, uuid))
      .run()
    return this.getPokemon(uuid)
  }

  /**
   * Supprime un Pokémon.
   */
  deletePokemon(uuid: string): void {
    getDb()
      .delete(schema.pokemon)
      .where(eq(schema.pokemon.uuid, uuid))
      .run()
  }

  // ============ TEAM MANAGEMENT ============

  /**
   * Récupère les UUIDs des Pokémon de l'équipe.
   */
  getTeamIds(): string[] {
    return this.getTeamPokemon().map(p => p.uuid)
  }

  /**
   * Définit l'équipe (max 3 Pokémon).
   */
  setTeamIds(uuids: string[]): void {
    const db = getDb()
    
    // Reset tous les Pokémon hors équipe
    db.update(schema.pokemon)
      .set({ isInTeam: false, teamPosition: null })
      .run()
    
    // Ajouter les nouveaux membres à l'équipe
    uuids.slice(0, 3).forEach((uuid, index) => {
      db.update(schema.pokemon)
        .set({ isInTeam: true, teamPosition: index })
        .where(eq(schema.pokemon.uuid, uuid))
        .run()
    })
  }

  // ============ GAME STATE ============

  /**
   * Récupère l'état du jeu.
   */
  getGameState(): GameState | undefined {
    return getDb()
      .select()
      .from(schema.gameState)
      .where(eq(schema.gameState.id, 1))
      .get()
  }

  /**
   * Met à jour l'état du jeu.
   */
  updateGameState(updates: Partial<GameState>): GameState | undefined {
    getDb()
      .update(schema.gameState)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(schema.gameState.id, 1))
      .run()
    return this.getGameState()
  }

  /**
   * Récupère le Pokémon actif.
   */
  getActivePokemon(): Pokemon | undefined {
    const state = this.getGameState()
    if (!state?.activeId) return undefined
    return this.getPokemon(state.activeId)
  }

  /**
   * Définit le Pokémon actif.
   */
  setActiveId(uuid: string): boolean {
    const pokemon = this.getPokemon(uuid)
    if (!pokemon || !pokemon.isInTeam) return false
    
    this.updateGameState({ activeId: uuid })
    return true
  }

  // ============ CANDIES ============

  /**
   * Récupère le nombre de bonbons.
   */
  getCandies(): number {
    return this.getGameState()?.candies ?? 0
  }

  /**
   * Ajoute des bonbons.
   */
  addCandies(amount: number): number {
    const current = this.getCandies()
    const newAmount = Math.max(0, current + amount)
    this.updateGameState({ candies: newAmount })
    return newAmount
  }

  /**
   * Dépense des bonbons.
   */
  spendCandies(amount: number): boolean {
    const current = this.getCandies()
    if (current < amount) return false
    this.updateGameState({ candies: current - amount })
    return true
  }

  // ============ INVENTORY ============

  /**
   * Récupère tout l'inventaire.
   */
  getInventory(): Record<string, number> {
    const items = getDb().select().from(schema.inventory).all()
    return items.reduce((acc, item) => {
      acc[item.itemId] = item.quantity
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Récupère la quantité d'un item.
   */
  getItemQuantity(itemId: string): number {
    const item = getDb()
      .select()
      .from(schema.inventory)
      .where(eq(schema.inventory.itemId, itemId))
      .get()
    return item?.quantity ?? 0
  }

  /**
   * Ajoute un item à l'inventaire.
   */
  addItem(itemId: string, quantity: number = 1): number {
    const db = getDb()
    const existing = this.getItemQuantity(itemId)
    
    if (existing > 0) {
      db.update(schema.inventory)
        .set({ quantity: existing + quantity })
        .where(eq(schema.inventory.itemId, itemId))
        .run()
    } else {
      db.insert(schema.inventory)
        .values({ itemId, quantity })
        .run()
    }
    
    return this.getItemQuantity(itemId)
  }

  /**
   * Utilise un item de l'inventaire.
   */
  useItem(itemId: string): boolean {
    const quantity = this.getItemQuantity(itemId)
    if (quantity <= 0) return false
    
    getDb()
      .update(schema.inventory)
      .set({ quantity: quantity - 1 })
      .where(eq(schema.inventory.itemId, itemId))
      .run()
    
    return true
  }

  // ============ FULL STATE (for IPC) ============

  /**
   * Retourne l'état complet du jeu pour le Renderer.
   */
  getFullState() {
    const gameState = this.getGameState()
    const ownedPokemon = this.getAllPokemon()
    const teamIds = this.getTeamIds()
    const inventory = this.getInventory()

    return {
      ownedPokemon,
      teamIds,
      activeId: gameState?.activeId ?? null,
      candies: gameState?.candies ?? 0,
      inventory
    }
  }
}
