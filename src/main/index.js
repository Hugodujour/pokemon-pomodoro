import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow
let selectionWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 250,
    height: 350,
    show: false,
    autoHideMenuBar: true,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createSelectionWindow() {
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
    titleBarStyle: 'hidden', // Extra safety for some platforms
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  selectionWindow.on('ready-to-show', () => {
    selectionWindow.show()
  })

  selectionWindow.on('closed', () => {
    selectionWindow = null
  })

  const url = is.dev && process.env['ELECTRON_RENDERER_URL'] 
    ? `${process.env['ELECTRON_RENDERER_URL']}#selection`
    : `file://${join(__dirname, '../renderer/index.html')}#selection`

  selectionWindow.loadURL(url)
}

// IPC Handlers
ipcMain.on('open-selection-window', () => {
  createSelectionWindow()
})

ipcMain.on('pokemon-selected', (event, pokemonId, shouldClose = true) => {
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

