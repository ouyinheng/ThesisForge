const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('__IS_ELECTRON__', true)

contextBridge.exposeInMainWorld('__fileBridge', {
  readJSON: (filename) => ipcRenderer.invoke('file:readJSON', filename),
  writeJSON: (filename, content) => ipcRenderer.invoke('file:writeJSON', filename, content),
  deleteFile: (filename) => ipcRenderer.invoke('file:deleteFile', filename),
  getUserDataPath: () => ipcRenderer.invoke('file:userDataPath'),
  getStoragePath: () => ipcRenderer.invoke('file:getStoragePath'),
  setStoragePath: (newPath) => ipcRenderer.invoke('file:setStoragePath', newPath),
  selectDirectory: () => ipcRenderer.invoke('file:selectDirectory'),
  migrateStorage: (fromPath, toPath) => ipcRenderer.invoke('file:migrateStorage', fromPath, toPath),
  juejinFetch: (body) => ipcRenderer.invoke('juejin:fetch', body),
  juejinGetPage: (url) => ipcRenderer.invoke('juejin:getPage', url),
})

// 窗口管理桥接
contextBridge.exposeInMainWorld('__windowBridge', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximize: (cb) => {
    ipcRenderer.on('window:isMaximized', (_, value) => cb(value))
  },
  onUnmaximize: (cb) => {
    ipcRenderer.on('window:isMaximized', (_, value) => {
      if (!value) cb()
    })
  },
})

ipcRenderer.on('env:platform', (_, platform) => {
  window.__PLATFORM__ = platform
})

// 系统深色模式订阅（跟随系统 + 手动主题双向联动）
function subscribeTheme(cb) {
  if (typeof cb !== 'function') return
  const handler = (_, isDark) => cb(Boolean(isDark))
  ipcRenderer.on('env:theme', handler)
  return () => ipcRenderer.removeListener('env:theme', handler)
}

contextBridge.exposeInMainWorld('__themeBridge', {
  isDark: () => ipcRenderer.invoke('env:getTheme'),
  subscribe: subscribeTheme,
})
