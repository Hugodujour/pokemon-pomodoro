import { v4 as uuidv4 } from 'uuid'
import { pokedex } from '../data/gameData.js'
import { DatabaseService } from './databaseService'

/**
 * Calcule le niveau à partir de l'XP.
 */
export function getLevel(xp: number) {
  let level = 1
  let remainingXp = xp

  while (remainingXp >= level * 1) {
    remainingXp -= level * 1
    level++
  }

  return { level, current: remainingXp, required: level * 1 }
}

/**
 * Calcule l'XP nécessaire pour atteindre un niveau donné.
 */
export function getXpForLevel(targetLevel: number): number {
  if (targetLevel <= 1) return 0
  return (targetLevel * (targetLevel - 1)) / 2
}

/**
 * Vérifie si un Pokémon doit évoluer.
 */
export function checkEvolution(speciesId: string, xp: number): string | null {
  const p = pokedex.find(p => p.id === speciesId)
  if (!p || !p.evolutions) return null

  const { level } = getLevel(xp)
  
  const levelEvo = p.evolutions.find(e => e.type === 'level' && 'level' in e && level >= e.level)
  if (levelEvo) return levelEvo.to
  
  return null
}


/**
 * Service de gestion de l'état du jeu.
 * Utilise DatabaseService pour la persistance SQLite.
 */
export class GameService {
  private db: DatabaseService
  private listeners: ((state: any) => void)[] = []
  private adventureActive: boolean = false
  private combatActive: boolean = false

  constructor(databaseService: DatabaseService) {
    this.db = databaseService
  }

  /**
   * Retourne l'état complet du jeu.
   */
  getState() {
    const state = this.db.getFullState()
    return {
      ...state,
      isAdventureActive: this.adventureActive,
      isCombatActive: this.combatActive
    }
  }

  /**
   * Définit l'état de l'aventure.
   */
  setAdventureActive(active: boolean) {
    if (this.adventureActive === active) return
    this.adventureActive = active
    this.notifyListeners()
  }

  /**
   * Définit l'état du combat.
   */
  setCombatActive(active: boolean) {
    if (this.combatActive === active) return
    this.combatActive = active
    this.notifyListeners()
  }

  /**
   * Notifie tous les listeners.
   */
  private notifyListeners() {
    const state = this.getState()
    this.listeners.forEach(cb => cb(state))
  }

  /**
   * Ajoute un listener pour les changements d'état.
   */
  addListener(callback: (state: any) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  // =============== POKEMON MANAGEMENT ===============

  /**
   * Met à jour un Pokémon.
   */
  updatePokemon(uuid: string, updates: any) {
    const result = this.db.updatePokemon(uuid, updates)
    this.notifyListeners()
    return result
  }

  /**
   * Ajoute un nouveau Pokémon.
   */
  addPokemon(speciesId: string, level: number, autoAddToTeam: boolean = true) {
    const newPokemon = {
      uuid: uuidv4(),
      speciesId,
      xp: getXpForLevel(level),
      level,
      dateCaught: new Date().toISOString(),
      isInTeam: false,
      teamPosition: null
    }
    
    const pokemon = this.db.addPokemon(newPokemon)
    
    // Ajoute à l'équipe si possible
    if (autoAddToTeam) {
      const teamIds = this.db.getTeamIds()
      if (teamIds.length < 3) {
        this.db.setTeamIds([...teamIds, pokemon.uuid])
      }
    }
    
    this.notifyListeners()
    return pokemon
  }

  /**
   * Choisit un starter pour commencer le jeu.
   */
  pickStarter(speciesId: string) {
    const owned = this.db.getAllPokemon()
    if (owned.length > 0) return null // Starter déjà choisi

    const pokemon = this.addPokemon(speciesId, 5)
    // Give initial XP (2) so the bar isn't empty (2/5 = 40% filled)
    this.giveXp(pokemon.uuid, 2)

    // Cadeaux de départ (PC)
    this.addPokemon('dracaufeu', 50, false)
    this.addPokemon('florizarre', 50, false)
    this.addPokemon('tortank', 50, false)
    this.addPokemon('raichu', 50, false)

    this.db.setActiveId(pokemon.uuid)
    this.notifyListeners()
    return pokemon
  }

  /**
   * Récupère un Pokémon par son UUID.
   */
  getPokemon(uuid: string) {
    return this.db.getPokemon(uuid)
  }

  /**
   * Récupère le Pokémon actif.
   */
  getActivePokemon() {
    return this.db.getActivePokemon()
  }

  /**
   * Réorganise les Pokémon dans le PC.
   */
  reorderPokemon(uuids: string[]) {
    this.db.reorderPokemon(uuids)
    this.notifyListeners()
  }

  // =============== TEAM MANAGEMENT ===============

  /**
   * Définit le Pokémon actif.
   */
  setActiveId(id: string): boolean {
    const result = this.db.setActiveId(id)
    if (result) this.notifyListeners()
    return result
  }

  /**
   * Met à jour l'équipe.
   */
  setTeamIds(teamIds: string[]) {
    this.db.setTeamIds(teamIds)
    
    // Assure que activeId est toujours valide
    const newTeamIds = this.db.getTeamIds()
    const state = this.db.getGameState()
    
    if (state?.activeId && !newTeamIds.includes(state.activeId) && newTeamIds.length > 0) {
      this.db.setActiveId(newTeamIds[0])
    }
    
    this.notifyListeners()
    return newTeamIds
  }

  // =============== RESOURCES ===============

  /**
   * Ajoute des bonbons.
   */
  addCandies(amount: number): number {
    const result = this.db.addCandies(amount)
    this.notifyListeners()
    return result
  }

  /**
   * Retire des bonbons.
   */
  spendCandies(amount: number): boolean {
    const result = this.db.spendCandies(amount)
    if (result) this.notifyListeners()
    return result
  }

  /**
   * Ajoute un item à l'inventaire.
   */
  addItem(itemId: string, quantity: number = 1) {
    const result = this.db.addItem(itemId, quantity)
    this.notifyListeners()
    return this.db.getInventory()
  }

  /**
   * Utilise un item.
   */
  useItem(itemId: string): boolean {
    const result = this.db.useItem(itemId)
    if (result) this.notifyListeners()
    return result
  }

  // =============== XP & EVOLUTION ===============

  /**
   * Donne de l'XP à un Pokémon et gère les évolutions.
   */
  giveXp(uuid: string, amount: number) {
    const pokemon = this.getPokemon(uuid)
    if (!pokemon) return null

    const newXp = pokemon.xp + amount
    const { level } = getLevel(newXp)
    const newSpecies = checkEvolution(pokemon.speciesId, newXp)

    const updates: any = { xp: newXp, level }
    if (newSpecies) {
      updates.speciesId = newSpecies
    }

    return this.updatePokemon(uuid, updates)
  }

  /**
   * Utilise un bonbon sur le Pokémon actif.
   */
  useCandy() {
    const active = this.getActivePokemon()
    if (!active) return null
    
    const candies = this.db.getCandies()
    if (candies <= 0) return null

    this.db.spendCandies(1)
    const result = this.giveXp(active.uuid, 40)
    this.notifyListeners()
    return result
  }
}
