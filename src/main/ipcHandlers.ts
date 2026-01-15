import { ipcMain, BrowserWindow } from 'electron'
import { pokedex, zones } from './data/gameData'
import { GameService } from './services/gameService'
import { CombatService } from './services/combatService'

/**
 * Configure tous les handlers IPC pour la communication Main <-> Renderer.
 */
export function setupIpcHandlers(
  gameService: GameService, 
  combatService: CombatService, 
  mainWindow: BrowserWindow | null
) {
  console.log('[IPC] Initialisation des handlers...');
  
  // =============== GAME STATE ===============
  
  ipcMain.handle('game:getState', () => {
    return gameService.getState()
  })

  ipcMain.handle('game:getActivePokemon', () => {
    return gameService.getActivePokemon()
  })

  ipcMain.handle('game:setActiveId', (_, id: string) => {
    return gameService.setActiveId(id)
  })

  ipcMain.handle('game:setTeamIds', (_, teamIds: string[]) => {
    return gameService.setTeamIds(teamIds)
  })

  ipcMain.handle('game:pickStarter', (_, speciesId: string) => {
    return gameService.pickStarter(speciesId)
  })

  ipcMain.handle('game:reorderPokemon', (_, uuids: string[]) => {
    return gameService.reorderPokemon(uuids)
  })

  ipcMain.handle('game:setAdventureActive', (_, active: boolean) => {
    return gameService.setAdventureActive(active)
  })

  ipcMain.handle('game:setCombatActive', (_, active: boolean) => {
    return gameService.setCombatActive(active)
  })

  // =============== POKEMON ===============

  ipcMain.handle('game:updatePokemon', (_, uuid: string, updates: any) => {
    return gameService.updatePokemon(uuid, updates)
  })

  ipcMain.handle('game:giveXp', (_, uuid: string, amount: number) => {
    return gameService.giveXp(uuid, amount)
  })

  // =============== RESOURCES ===============

  ipcMain.handle('game:addCandies', (_, amount: number) => {
    return gameService.addCandies(amount)
  })

  ipcMain.handle('game:useCandy', () => {
    return gameService.useCandy()
  })

  ipcMain.handle('game:spendCandies', (_, amount: number) => {
    return gameService.spendCandies(amount)
  })

  ipcMain.handle('game:addItem', (_, itemId: string, quantity: number) => {
    return gameService.addItem(itemId, quantity)
  })

  ipcMain.handle('game:useItem', (_, itemId: string) => {
    return gameService.useItem(itemId)
  })

  // =============== COMBAT ===============

  ipcMain.handle('combat:start', (_, activeId: string, zoneId: string) => {
    return combatService.startCombat(activeId, zoneId)
  })

  ipcMain.handle('combat:attack', (_, combatState: any) => {
    return combatService.executeTurn(combatState)
  })

  ipcMain.handle('combat:flee', (_, combatState: any) => {
    return combatService.flee(combatState)
  })

  ipcMain.handle('combat:finish', (_, combatState: any) => {
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

  ipcMain.handle('shop:evolveWithStone', (_, pokemonUuid: string, stoneType: string) => {
    const state = gameService.getState()
    const pokemon = gameService.getPokemon(pokemonUuid)
    
    if (!pokemon) return { success: false, message: 'Pokemon non trouve' }
    if (!state.inventory[stoneType] || state.inventory[stoneType] <= 0) {
      return { success: false, message: 'Pierre non possedee' }
    }

    const speciesData = pokedex.find(p => p.id === pokemon.speciesId)
    
    if (!speciesData || !speciesData.evolutions) {
      return { success: false, message: 'Pas d\'evolution disponible' }
    }

    const stoneEvo = speciesData.evolutions.find(e => e.type === 'item' && 'item' in e && e.item === stoneType)
    if (!stoneEvo) {
      return { success: false, message: 'Cette pierre n\'affecte pas ce Pokemon' }
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
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('game:stateChanged', newState)
      }
    })
  })
}
