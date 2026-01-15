import { contextBridge, ipcRenderer } from 'electron'

// Window management API
const windowAPI = {
  openSelectionWindow: () => ipcRenderer.send('open-selection-window'),
  selectPokemon: (pokemonId, shouldClose = true) => ipcRenderer.send('pokemon-selected', pokemonId, shouldClose),
  onPokemonSelected: (callback) => {
    const subscription = (_event, pokemonId) => callback(pokemonId)
    ipcRenderer.on('pokemon-selected', subscription)
    return () => ipcRenderer.removeListener('pokemon-selected', subscription)
  },
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close')
}

// New Game API
const gameAPI = {
  // ============ STATE ============
  getState: () => ipcRenderer.invoke('game:getState'),
  getActivePokemon: () => ipcRenderer.invoke('game:getActivePokemon'),
  setActiveId: (id) => ipcRenderer.invoke('game:setActiveId', id),
  setTeamIds: (teamIds) => ipcRenderer.invoke('game:setTeamIds', teamIds),
  pickStarter: (speciesId) => ipcRenderer.invoke('game:pickStarter', speciesId),
  reorderPokemon: (uuids) => ipcRenderer.invoke('game:reorderPokemon', uuids),
  setAdventureActive: (active) => ipcRenderer.invoke('game:setAdventureActive', active),
  setCombatActive: (active) => ipcRenderer.invoke('game:setCombatActive', active),

  // ============ POKEMON ============
  updatePokemon: (uuid, updates) => ipcRenderer.invoke('game:updatePokemon', uuid, updates),
  giveXp: (uuid, amount) => ipcRenderer.invoke('game:giveXp', uuid, amount),

  // ============ RESOURCES ============
  addCandies: (amount) => ipcRenderer.invoke('game:addCandies', amount),
  useCandy: () => ipcRenderer.invoke('game:useCandy'),
  spendCandies: (amount) => ipcRenderer.invoke('game:spendCandies', amount),
  addItem: (itemId, quantity) => ipcRenderer.invoke('game:addItem', itemId, quantity),
  useItem: (itemId) => ipcRenderer.invoke('game:useItem', itemId),

  // ============ COMBAT ============
  startCombat: (activeId, zoneId) => ipcRenderer.invoke('combat:start', activeId, zoneId),
  attack: (combatState) => ipcRenderer.invoke('combat:attack', combatState),
  flee: (combatState) => ipcRenderer.invoke('combat:flee', combatState),
  finishCombat: (combatState) => ipcRenderer.invoke('combat:finish', combatState),

  // ============ SHOP ============
  buyStone: () => ipcRenderer.invoke('shop:buyStone'),
  evolveWithStone: (pokemonUuid, stoneType) => ipcRenderer.invoke('shop:evolveWithStone', pokemonUuid, stoneType),

  // ============ DATA ============
  getPokedex: () => ipcRenderer.invoke('data:getPokedex'),
  getZones: () => ipcRenderer.invoke('data:getZones'),

  // ============ EVENTS ============
  onStateChange: (callback) => {
    const handler = (_event, newState) => callback(newState)
    ipcRenderer.on('game:stateChanged', handler)
    return () => ipcRenderer.removeListener('game:stateChanged', handler)
  }
}

// Expose APIs
try {
  contextBridge.exposeInMainWorld('api', windowAPI)
  contextBridge.exposeInMainWorld('gameAPI', gameAPI)
  // We'll expose a dummy electron object if needed, but the toolkit one might be failing
  contextBridge.exposeInMainWorld('electron', { 
    ipcRenderer: {
      send: (channel, ...args) => ipcRenderer.send(channel, ...args),
      on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args))
    }
  })
  console.log('[Preload] APIs exposed successfully')
} catch (error) {
  console.error('[Preload] Exposure failed:', error)
}
