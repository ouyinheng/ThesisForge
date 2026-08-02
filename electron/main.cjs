const { app, BrowserWindow, ipcMain, systemPreferences } = require('electron')
const path = require('path')
const fs = require('fs/promises')
const os = require('os')

const isDev = !app.isPackaged
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

let mainWindow = null

// 存储路径状态变量：初始为空，由前端读取 localStorage 后通过 IPC 同步
let currentStoragePath = ''

function createWindow() {
  const windowOptions = {
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'PaperBlog',
    backgroundColor: '#fafaf9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  }

  if (isMac) {
    // macOS: 隐藏标题栏但保留红绿灯按钮（left inset）
    windowOptions.titleBarStyle = 'hiddenInset'
  } else if (isWindows) {
    // Windows: 完全移除原生标题栏
    windowOptions.frame = false
    windowOptions.titleBarStyle = 'hidden'
  } else {
    // Linux
    windowOptions.frame = false
    windowOptions.titleBarStyle = 'hidden'
  }

  mainWindow = new BrowserWindow(windowOptions)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5178')
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 通知前端 Electron 主机信息
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('env:platform', process.platform)
  })

  // 打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })

  // macOS：最大化状态变更监听
  if (isMac) {
    mainWindow.on('maximize', () => {
      mainWindow?.webContents.send('window:isMaximized', true)
    })
    mainWindow.on('unmaximize', () => {
      mainWindow?.webContents.send('window:isMaximized', false)
    })
  }
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

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

function setupIpcHandlers() {
  ipcMain.handle('file:getStoragePath', async () => {
    return currentStoragePath
  })

  ipcMain.handle('file:setStoragePath', async (_, newPath) => {
    if (typeof newPath !== 'string' || !newPath.trim()) return
    currentStoragePath = newPath.trim()
  })

  // 迁移数据：从旧存储路径复制文件到新路径
  ipcMain.handle('file:migrateStorage', async (_, fromPath, toPath) => {
    if (!fromPath || !toPath || fromPath === toPath) return
    const entries = ['preferences.json', 'articles.json', 'articles/index.json']
    await ensureDir(toPath)
    await ensureDir(path.join(toPath, 'articles'))
    for (const rel of entries) {
      try {
        const data = await fs.readFile(path.join(fromPath, rel), 'utf-8')
        const dest = path.join(toPath, rel)
        await ensureDir(path.dirname(dest))
        await fs.writeFile(dest, data, 'utf-8')
      } catch {
        // 旧路径文件不存在时跳过
      }
    }
  })

  ipcMain.handle('file:readJSON', async (_, filename) => {
    const filePath = path.join(currentStoragePath, filename)
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch {
      return null
    }
  })

  ipcMain.handle('file:writeJSON', async (_, filename, content) => {
    const filePath = path.join(currentStoragePath, filename)
    await ensureDir(path.dirname(filePath))
    await fs.writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('file:deleteFile', async (_, filename) => {
    const filePath = path.join(currentStoragePath, filename)
    try {
      await fs.unlink(filePath)
    } catch {
      // 不存在时忽略
    }
  })

  ipcMain.handle('file:userDataPath', async () => {
    return app.getPath('userData')
  })

  ipcMain.handle('env:isElectron', async () => {
    return true
  })

  // 窗口控制 IPC
  ipcMain.handle('window:minimize', async () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:maximize', async () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.handle('window:close', async () => {
    mainWindow?.close()
  })

  ipcMain.handle('window:isMaximized', async () => {
    return mainWindow?.isMaximized() ?? false
  })
}
