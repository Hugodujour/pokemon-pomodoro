import { ipcMain } from 'electron'
import { pokedex, zones } from './data/gameData.js'

/**
 * Configure tous les handlers IPC pour la communication Main <-> Renderer.
 */
export function setupIpcHandlers(gameService, combatService, mainWindow) {
  
  // =============== GAME STATE ===============
  
  ipcMain.handle('game:getState', () => {
    return gameService.getState()
  })

  ipcMain.handle('game:getActivePokemon', () => {
    return gameService.getActivePokemon()
  })

  ipcMain.handle('game:setActiveId', (_, id) => {
    return gameService.setActiveId(id)
  })

  ipcMain.handle('game:setTeamIds', (_, teamIds) => {
    return gameService.setTeamIds(teamIds)
  })

  ipcMain.handle('game:pickStarter', (_, speciesId) => {
    return gameService.pickStarter(speciesId)
  })

  // =============== POKEMON ===============

  ipcMain.handle('game:updatePokemon', (_, uuid, updates) => {
    return gameService.updatePokemon(uuid, updates)
  })

  ipcMain.handle('game:giveXp', (_, uuid, amount) => {
    return gameService.giveXp(uuid, amount)
  })

  // =============== RESOURCES ===============

  ipcMain.handle('game:addCandies', (_, amount) => {
    return gameService.addCandies(amount)
  })

  ipcMain.handle('game:useCandy', () => {
    return gameService.useCandy()
  })

  ipcMain.handle('game:spendCandies', (_, amount) => {
    return gameService.spendCandies(amount)
  })

  ipcMain.handle('game:addItem', (_, itemId, quantity) => {
    return gameService.addItem(itemId, quantity)
  })

  ipcMain.handle('game:useItem', (_, itemId) => {
    return gameService.useItem(itemId)
  })

  // =============== COMBAT ===============

  ipcMain.handle('combat:start', (_, activeId, zoneId) => {
    return combatService.startCombat(activeId, zoneId)
  })

  ipcMain.handle('combat:attack', (_, combatState) => {
    return combatService.executeTurn(combatState)
  })

  ipcMain.handle('combat:flee', (_, combatState) => {
    return combatService.flee(combatState)
  })

  ipcMain.handle('combat:finish', (_, combatState) => {
    return combatService.finishCombat(combatState)
  })

  // =============== SHOP ===============

  ipcMain.handle('shop:buyStone', () => {
    const STONE_COST = 50
    if (gameService.spendCandies(STONE_COST)) {
      gameService.addItem('pierre-foudre', 1)
      return { success: true, inventory: gameService.getState().inventory }
    }
    return { success: false, message: 'Pas assez de bonbons' }
  })

  ipcMain.handle('shop:evolveWithStone', (_, pokemonUuid, stoneType) => {
    const state = gameService.getState()
    const pokemon = gameService.getPokemon(pokemonUuid)
    
    if (!pokemon) return { success: false, message: 'Pokémon non trouvé' }
    if (!state.inventory[stoneType] || state.inventory[stoneType] <= 0) {
      return { success: false, message: 'Pierre non possédée' }
    }

    const speciesData = pokedex.find(p => p.id === pokemon.speciesId)
    
    if (!speciesData || !speciesData.evolutions) {
      return { success: false, message: 'Pas d\'évolution disponible' }
    }

    const stoneEvo = speciesData.evolutions.find(e => e.type === 'item' && e.item === stoneType)
    if (!stoneEvo) {
      return { success: false, message: 'Cette pierre n\'affecte pas ce Pokémon' }
    }

    gameService.useItem(stoneType)
    gameService.updatePokemon(pokemonUuid, { speciesId: stoneEvo.to })

    return { 
      success: true, 
      newSpeciesId: stoneEvo.to,
      pokemon: gameService.getPokemon(pokemonUuid)
    }
  })

  // =============== DATA ===============

  ipcMain.handle('data:getPokedex', () => {
    return pokedex
  })

  ipcMain.handle('data:getZones', () => {
    return zones
  })

  // Listener pour notifier le renderer des changements d'état
  gameService.addListener((newState) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('game:stateChanged', newState)
    }
  })
}
