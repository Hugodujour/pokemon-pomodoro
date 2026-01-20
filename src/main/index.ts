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
let mapWindow: BrowserWindow | null = null

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
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  const width = 380
  const height = 550

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: screenWidth - width - 20,
    y: screenHeight - height - 20,
    show: false,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  
  // Force highest priority
  mainWindow.setAlwaysOnTop(true, 'screen-saver')

  // Native material disabled to allow rounded corner masking
  /*
  if (process.platform === 'win32') {
    mainWindow.setBackgroundMaterial('acrylic')
  }
  */

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

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createSelectionWindow(): void {
  if (selectionWindow) {
    if (selectionWindow.isMinimized()) selectionWindow.restore()
    selectionWindow.focus()
    return
  }

  selectionWindow = new BrowserWindow({
    width: 600,  /* Adjusted width */
    height: 750, /* Increased height for better scrolling */
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    titleBarStyle: 'hidden',
    resizable: true,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  
  selectionWindow.setAlwaysOnTop(true, 'screen-saver')

  if (process.platform === 'win32') {
    // selectionWindow.setBackgroundMaterial('acrylic')
  }

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

function createMapWindow(): void {
  if (mapWindow) {
    if (mapWindow.isMinimized()) mapWindow.restore()
    mapWindow.focus()
    return
  }

  mapWindow = new BrowserWindow({
    width: 600,
    height: 500,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  
  mapWindow.setAlwaysOnTop(true, 'screen-saver')

  mapWindow.on('ready-to-show', () => {
    mapWindow?.show()
  })

  mapWindow.on('closed', () => {
    mapWindow = null
  })

  const url = is.dev && process.env['ELECTRON_RENDERER_URL'] 
    ? `${process.env['ELECTRON_RENDERER_URL']}#map`
    : `file://${join(__dirname, '../renderer/index.html')}#map`

  mapWindow.loadURL(url)
}

// IPC Handlers for Window Management
ipcMain.on('open-selection-window', () => {
  createSelectionWindow()
})

ipcMain.on('close-selection-window', () => {
  if (selectionWindow && !selectionWindow.isDestroyed()) {
    selectionWindow.close()
  }
})

ipcMain.on('open-map-window', () => {
  createMapWindow()
})

ipcMain.on('zone-selected', (_event, zoneId: string) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('zone-selected', zoneId)
  }
  if (mapWindow && !mapWindow.isDestroyed()) {
    mapWindow.close()
  }
})

ipcMain.on('pokemon-selected', (_event, pokemonId: string, shouldClose = true) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('pokemon-selected', pokemonId)
  }
  if (shouldClose && selectionWindow && !selectionWindow.isDestroyed()) {
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

ipcMain.on('window-toggle-minimalist', (event, isMinimalist: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return

  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  if (isMinimalist) {
    const minWidth = 180
    const minHeight = 100
    win.setSize(minWidth, minHeight)
    win.setPosition(screenWidth - minWidth - 20, screenHeight - minHeight - 20)
  } else {
    const normalWidth = 380
    const normalHeight = 550
    win.setSize(normalWidth, normalHeight)
    win.setPosition(screenWidth - normalWidth - 20, screenHeight - normalHeight - 20)
  }
  // Force screen-saver level to ensure it stays on top of everything
  win.setAlwaysOnTop(true, 'screen-saver')
})

ipcMain.on('window-set-combat-mode', (event, inCombat: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return

  const { screen } = require('electron')
  const winBounds = win.getBounds()
  const display = screen.getDisplayMatching(winBounds)
  const { x: dX, y: dY, width: dW, height: dH } = display.workArea

  const targetHeight = 550
  const targetWidth = inCombat ? 456 : 380

  // Smart Anchoring: Check if closer to Right or Left edge
  const distRight = (dX + dW) - (winBounds.x + winBounds.width)
  const distLeft = winBounds.x - dX

  let newX = winBounds.x
  let newY = winBounds.y 

  // If closer to right edge (or default position), anchor to Right
  if (distRight < distLeft) {
    newX = (dX + dW) - distRight - targetWidth
  } 
  // Else (closer to left), anchor Left: newX stays winBounds.x (default resize behavior)

  // Vertical anchoring: always align bottom if consistent with app design? 
  // The app is bottom-heavy. Let's keep bottom anchor if closer to bottom.
  const distBottom = (dY + dH) - (winBounds.y + winBounds.height)
  const distTop = winBounds.y - dY
  
  if (distBottom < distTop) {
     newY = (dY + dH) - distBottom - targetHeight
  }
  
  // Ensure we don't go off-screen (Clamp)
  if (newX < dX) newX = dX
  if (newX + targetWidth > dX + dW) newX = dX + dW - targetWidth
  
  if (newY < dY) newY = dY
  if (newY + targetHeight > dY + dH) newY = dY + dH - targetHeight

  win.setBounds({
    x: Math.round(newX),
    y: Math.round(newY),
    width: Math.round(targetWidth),
    height: Math.round(targetHeight)
  })
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
  closeDatabase('window-all-closed')
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase('before-quit')
})
