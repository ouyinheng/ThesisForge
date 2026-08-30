const { app, BrowserWindow, ipcMain, systemPreferences, dialog, Menu, Tray, nativeTheme, globalShortcut } = require('electron')
const path = require('path')
const fs = require('fs')
const fsp = require('fs/promises')
const os = require('os')
const https = require('https')

const isDev = !app.isPackaged
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

let mainWindow = null
let tray = null

// 存储路径状态变量：默认使用 Electron userData 目录（可写），前端自定义路径会通过 setStoragePath 覆盖
let currentStoragePath = app.getPath('userData')

// ---------------------------------------------------------------------------
// 主进程未捕获异常 / 未处理 Promise 拒绝：写入日志便于排查，不中断运行
// ---------------------------------------------------------------------------
function writeErrorLog(scope, err) {
  try {
    const logPath = path.join(app.getPath('userData'), 'error.log')
    const detail = (err && err.stack) || String(err)
    fs.appendFileSync(logPath, `\n[${new Date().toLocaleString()}] [${scope}] ${detail}`, 'utf-8')
  } catch {
    /* 日志写入失败不影响主流程 */
  }
}
process.on('uncaughtException', (err) => writeErrorLog('uncaughtException', err))
process.on('unhandledRejection', (reason) => writeErrorLog('unhandledRejection', reason))

// ---------------------------------------------------------------------------
// 单实例锁（避免多开，抢锁失败即退出）
// ---------------------------------------------------------------------------
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })
}

// ---------------------------------------------------------------------------
// 窗口状态记忆（尺寸 / 位置 / 最大化）
// ---------------------------------------------------------------------------
const WINDOW_STATE_FILE = path.join(app.getPath('userData'), 'window-state.json')

function loadWindowState() {
  try {
    if (fs.existsSync(WINDOW_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(WINDOW_STATE_FILE, 'utf-8'))
    }
  } catch (_) {
    /* 忽略损坏状态文件 */
  }
  return {}
}

function saveWindowState(state) {
  try {
    fs.mkdirSync(path.dirname(WINDOW_STATE_FILE), { recursive: true })
    fs.writeFileSync(WINDOW_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch (_) {
    /* 忽略写入失败 */
  }
}

function createWindow() {
  const saved = loadWindowState()
  let { width = 1200, height = 800 } = saved
  const MIN_W = 900
  const MIN_H = 600
  // 防止分辨率变化导致窗口出现在屏幕外
  width = Math.max(MIN_W, width)
  height = Math.max(MIN_H, height)

  const windowOptions = {
    width,
    height,
    minWidth: MIN_W,
    minHeight: MIN_H,
    title: 'PaperBlog',
    backgroundColor: '#fafaf9',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  }

  if (typeof saved.x === 'number' && typeof saved.y === 'number') {
    windowOptions.x = saved.x
    windowOptions.y = saved.y
  }

  if (isMac) {
    // macOS: 保留自带红绿灯（hiddenInset），标题栏交给渲染层自绘
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

  if (saved.maximized) mainWindow.maximize()

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5178')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  const captureState = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const { x, y } = mainWindow.getBounds()
    saveWindowState({
      x,
      y,
      width: mainWindow.getWidth(),
      height: mainWindow.getHeight(),
      maximized: mainWindow.isMaximized(),
    })
  }

  mainWindow.on('resize', captureState)
  mainWindow.on('move', captureState)
  mainWindow.on('maximize', captureState)
  mainWindow.on('unmaximize', captureState)
  mainWindow.on('close', () => {
    captureState()
    if (tray) {
      // 关闭不退出，最小化到托盘（可在托盘菜单"退出"彻底关闭）
      mainWindow = null
    }
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 通知前端 Electron 主机信息
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('env:platform', process.platform)
    mainWindow?.webContents.send('env:theme', nativeTheme.shouldUseDarkColors)
  })

  // 打开外部链接交给系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })

  // 同源页面挂载/重定向一律在应用内打开新窗口
  mainWindow.webContents.on('will-navigate', (e) => {
    e.preventDefault()
  })
}

// ---------------------------------------------------------------------------
// 窗口状态记忆 / 托盘
// ---------------------------------------------------------------------------
function createTray() {
  // dev 时 __dirname = electron/，打包后由 vite 一并拷贝到 dist/electron/
  const iconPath = path.join(__dirname, 'window-tray.png')
  // 若图标缺失则跳过托盘，避免启动崩溃
  if (!fs.existsSync(iconPath)) return
  tray = new Tray(iconPath)
  tray.setToolTip('PaperBlog')
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (!mainWindow) createWindow()
        mainWindow?.show()
        mainWindow?.focus()
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (!mainWindow) createWindow()
    mainWindow?.isVisible() ? mainWindow.focus() : mainWindow?.show()
  })
}

// macOS/Windows 默认隐藏系统菜单栏的情况下仍暴露标准快捷键
function createMenu() {
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),
    {
      label: '文件',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [{ role: 'pasteAndMatchStyle' }, { role: 'delete' }, { role: 'selectAll' }]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: '窗口',
      submenu: [{ role: 'minimize' }, ...(isMac ? [{ role: 'zoom' }, { type: 'separator' }, { role: 'front' }] : [{ role: 'close' }])],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createMenu()
  createWindow()
  createTray()

  // 跟随系统深色模式
  nativeTheme.on('updated', () => {
    mainWindow?.webContents.send('env:theme', nativeTheme.shouldUseDarkColors)
  })

  app.on('activate', () => {
    createWindow()
  })
})

app.on('window-all-closed', (e) => {
  // 保留托盘常驻；除非用户显式退出
  if (app.isQuitting) app.quit()
})

app.on('before-quit', () => {
  app.isQuitting = true
  if (globalShortcut) globalShortcut.unregisterAll()
})

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true })
}

// ---------------------------------------------------------------------------
// IPC 安全：仅允许访问存储目录下的相对路径，防止目录穿越
// ---------------------------------------------------------------------------
function resolveSafeStorageRel(filename) {
  if (typeof filename !== 'string' || !filename.trim()) {
    throw new Error('invalid filename')
  }
  const normalized = path.normalize(filename).replace(/^([/\\])+/, '')
  if (
    normalized.includes('..') ||
    path.isAbsolute(filename) ||
    normalized.startsWith('..')
  ) {
    throw new Error('invalid filename')
  }
  return normalized
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
      // 目标路径同样做安全校验
      resolveSafeStorageRel(rel)
      try {
        const data = await fsp.readFile(path.join(fromPath, rel), 'utf-8')
        const dest = path.join(toPath, rel)
        await ensureDir(path.dirname(dest))
        await fsp.writeFile(dest, data, 'utf-8')
      } catch {
        // 旧路径文件不存在时跳过
      }
    }
  })

  // 读取 JSON（带路径安全校验）
  ipcMain.handle('file:readJSON', async (_, filename) => {
    try {
      const rel = resolveSafeStorageRel(filename)
      const filePath = path.join(currentStoragePath, rel)
      return await fsp.readFile(filePath, 'utf-8')
    } catch {
      return null
    }
  })

  // 写入 JSON：原子写入（临时文件 + rename），避免写入一半损坏
  ipcMain.handle('file:writeJSON', async (_, filename, content) => {
    try {
      const rel = resolveSafeStorageRel(filename)
      const filePath = path.join(currentStoragePath, rel)
      await ensureDir(path.dirname(filePath))
      const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
      await fsp.writeFile(tmpPath, String(content ?? ''), 'utf-8')
      await fsp.rename(tmpPath, filePath)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: String(err && err.message || err) }
    }
  })

  ipcMain.handle('file:deleteFile', async (_, filename) => {
    try {
      const rel = resolveSafeStorageRel(filename)
      await fsp.unlink(path.join(currentStoragePath, rel))
      return { ok: true }
    } catch {
      return { ok: false }
    }
  })

  ipcMain.handle('file:userDataPath', async () => {
    return app.getPath('userData')
  })

  ipcMain.handle('env:isElectron', async () => {
    return true
  })

  // 当前系统深色模式状态
  ipcMain.handle('env:getTheme', async () => {
    return nativeTheme.shouldUseDarkColors
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