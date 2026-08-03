import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as fs from 'fs/promises'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

let currentStoragePath = app.getPath('userData')

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'PaperBlog',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5178')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function setupIpcHandlers(): void {
  ipcMain.handle('file:getStoragePath', async () => {
    return currentStoragePath
  })

  ipcMain.handle('file:setStoragePath', async (_, newPath: string) => {
    if (typeof newPath !== 'string' || !newPath.trim()) return
    currentStoragePath = newPath.trim()
  })

  ipcMain.handle('file:readJSON', async (_, filename: string) => {
    const filePath = path.join(currentStoragePath, filename)
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch {
      return null
    }
  })

  ipcMain.handle('file:writeJSON', async (_, filename: string, content: string) => {
    const filePath = path.join(currentStoragePath, filename)
    await ensureDir(path.dirname(filePath))
    await fs.writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('file:deleteFile', async (_, filename: string) => {
    const filePath = path.join(currentStoragePath, filename)
    try {
      await fs.unlink(filePath)
    } catch {
    }
  })

  ipcMain.handle('file:userDataPath', async () => {
    return app.getPath('userData')
  })

  ipcMain.handle('env:isElectron', async () => {
    return true
  })
}
