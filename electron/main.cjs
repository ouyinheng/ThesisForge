const { app, BrowserWindow, ipcMain, systemPreferences, dialog } = require('electron')
const path = require('path')
const fs = require('fs/promises')
const os = require('os')
const https = require('https')

const isDev = !app.isPackaged
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

let mainWindow = null

// 存储路径状态变量：默认使用 Electron userData 目录（可写），前端自定义路径会通过 setStoragePath 覆盖
let currentStoragePath = app.getPath('userData')

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

  // 弹出系统文件夹选择对话框，返回用户选中的目录路径（取消则为空字符串）
  ipcMain.handle('file:selectDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择存储文件夹',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return ''
    return result.filePaths[0]
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

  // 掘金接口代理：渲染进程受 CORS 限制，由主进程转发（主进程不受同源策略约束）
  // payload: { url, method?, headers?, body? }
  ipcMain.handle('juejin:fetch', async (_, payload) => {
    const { url, method = 'POST', headers = {}, body } = payload || {}
    if (!url) return { ok: false, error: 'missing url' }
    return new Promise((resolve) => {
      const req = https.request(
        url,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            ...headers,
          },
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            try {
              resolve({ ok: true, data: JSON.parse(data) })
            } catch {
              resolve({ ok: false, error: 'parse error' })
            }
          })
        }
      )
      req.on('error', (err) => resolve({ ok: false, error: String(err) }))
      if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body))
      req.end()
    })
  })

  // 抓取掘金文章页 HTML（用于抽取正文，规避 CORS 与详情接口登录限制）
  ipcMain.handle('juejin:getPage', async (_, pageUrl) => {
    if (!pageUrl || typeof pageUrl !== 'string') return { ok: false, error: 'missing url' }
    return new Promise((resolve) => {
      const req = https.get(
        pageUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9',
          },
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => resolve({ ok: true, data }))
        }
      )
      req.on('error', (err) => resolve({ ok: false, error: String(err) }))
    })
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
