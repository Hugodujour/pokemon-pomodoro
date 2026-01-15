import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// Database
import { initDatabase, closeDatabase } from './db'
import { DatabaseService } from './services/databaseService'
import { GameService } from './services/gameService'
import { CombatService } from './services/combatService'
import { setupIpcHandlers } from './ipcHandlers'

let mainWindow: BrowserWindow | null = null
let selectionWindow: BrowserWindow | null = null

// Services
let databaseService: DatabaseService
let gameService: GameService
let combatService: CombatService

function initializeServices(): void {
  const userDataPath = app.getPath('userData')
  
  // Initialiser la base de données SQLite
  initDatabase(userDataPath)
  
  // Créer les services
  databaseService = new DatabaseService()
  gameService = new GameService(databaseService)
  combatService = new CombatService(gameService)
  
  console.log('[Main] Services initialises avec SQLite')
  console.log('[Main] Base de donnees:', userDataPath + '/pokemon-game.db')
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 250,
    height: 350,
    show: false,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    console.log('[Main] Fenetre principale prete')
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createSelectionWindow(): void {
  if (selectionWindow) {
    selectionWindow.focus()
    return
  }

  selectionWindow = new BrowserWindow({
    width: 450,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    titleBarStyle: 'hidden',
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  selectionWindow.on('ready-to-show', () => {
    selectionWindow?.show()
  })

  selectionWindow.on('closed', () => {
    selectionWindow = null
  })

  const url = is.dev && process.env['ELECTRON_RENDERER_URL'] 
    ? `${process.env['ELECTRON_RENDERER_URL']}#selection`
    : `file://${join(__dirname, '../renderer/index.html')}#selection`

  selectionWindow.loadURL(url)
}

// IPC Handlers for Window Management
ipcMain.on('open-selection-window', () => {
  createSelectionWindow()
})

ipcMain.on('pokemon-selected', (_event, pokemonId: string, shouldClose = true) => {
  if (mainWindow) {
    mainWindow.webContents.send('pokemon-selected', pokemonId)
  }
  if (shouldClose && selectionWindow) {
    selectionWindow.close()
  }
})

ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.minimize()
})

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.close()
})

// App Lifecycle
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize services BEFORE creating windows
  initializeServices()
  
  // Setup IPC handlers BEFORE creating windows to avoid race conditions
  setupIpcHandlers(gameService, combatService, null)
  
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
