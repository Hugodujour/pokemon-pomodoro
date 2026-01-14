import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
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

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
