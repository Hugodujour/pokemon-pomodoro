import { contextBridge, ipcRenderer } from 'electron'

// Window management API
const windowAPI = {
  openSelectionWindow: () => ipcRenderer.send('open-selection-window'),
  selectPokemon: (pokemonId: string, shouldClose: boolean = true) => ipcRenderer.send('pokemon-selected', pokemonId, shouldClose),
  onPokemonSelected: (callback: (pokemonId: string) => void) => {
    const subscription = (_event: any, pokemonId: string) => callback(pokemonId)
    ipcRenderer.on('pokemon-selected', subscription)
    return () => ipcRenderer.removeListener('pokemon-selected', subscription)
  },
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  toggleMinimalist: (isMinimalist: boolean) => ipcRenderer.send('window-toggle-minimalist', isMinimalist)
}

// New Game API
const gameAPI = {
  // ============ STATE ============
  getState: () => ipcRenderer.invoke('game:getState'),
  getActivePokemon: () => ipcRenderer.invoke('game:getActivePokemon'),
  setActiveId: (id: string) => ipcRenderer.invoke('game:setActiveId', id),
  setTeamIds: (teamIds: string[]) => ipcRenderer.invoke('game:setTeamIds', teamIds),
  pickStarter: (speciesId: string) => ipcRenderer.invoke('game:pickStarter', speciesId),
  reorderPokemon: (uuids: string[]) => ipcRenderer.invoke('game:reorderPokemon', uuids),
  setAdventureActive: (active: boolean) => ipcRenderer.invoke('game:setAdventureActive', active),
  setCombatActive: (active: boolean) => ipcRenderer.invoke('game:setCombatActive', active),

  // ============ POKEMON ============
  updatePokemon: (uuid: string, updates: any) => ipcRenderer.invoke('game:updatePokemon', uuid, updates),
  giveXp: (uuid: string, amount: number) => ipcRenderer.invoke('game:giveXp', uuid, amount),

  // ============ RESOURCES ============
  addCandies: (amount: number) => ipcRenderer.invoke('game:addCandies', amount),
  useCandy: () => ipcRenderer.invoke('game:useCandy'),
  spendCandies: (amount: number) => ipcRenderer.invoke('game:spendCandies', amount),
  addItem: (itemId: string, quantity: number) => ipcRenderer.invoke('game:addItem', itemId, quantity),
  useItem: (itemId: string) => ipcRenderer.invoke('game:useItem', itemId),

  // ============ COMBAT ============
  startCombat: (activeId: string, zoneId: string) => ipcRenderer.invoke('combat:start', activeId, zoneId),
  attack: (combatState: any) => ipcRenderer.invoke('combat:attack', combatState),
  flee: (combatState: any) => ipcRenderer.invoke('combat:flee', combatState),
  finishCombat: (combatState: any) => ipcRenderer.invoke('combat:finish', combatState),

  // ============ SHOP ============
  buyStone: () => ipcRenderer.invoke('shop:buyStone'),
  evolveWithStone: (pokemonUuid: string, stoneType: string) => ipcRenderer.invoke('shop:evolveWithStone', pokemonUuid, stoneType),

  // ============ DATA ============
  getPokedex: () => ipcRenderer.invoke('data:getPokedex'),
  getZones: () => ipcRenderer.invoke('data:getZones'),

  // ============ EVENTS ============
  onStateChange: (callback: (newState: any) => void) => {
    const handler = (_event: any, newState: any) => callback(newState)
    ipcRenderer.on('game:stateChanged', handler)
    return () => ipcRenderer.removeListener('game:stateChanged', handler)
  }
}

// Expose APIs
try {
  contextBridge.exposeInMainWorld('api', windowAPI)
  contextBridge.exposeInMainWorld('gameAPI', gameAPI)
  // We'll expose a dummy electron object if needed
  contextBridge.exposeInMainWorld('electron', { 
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
      on: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args))
    }
  })
  console.log('[Preload] APIs exposed successfully')
} catch (error) {
  console.error('[Preload] Exposure failed:', error)
}
