/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

export {}

interface FileBridge {
  readJSON(filename: string): Promise<string | null>
  writeJSON(filename: string, content: string): Promise<void>
  deleteFile?(filename: string): Promise<void>
  getUserDataPath(): Promise<string>
  getStoragePath(): Promise<string>
  setStoragePath(path: string): Promise<void>
  migrateStorage(fromPath: string, toPath: string): Promise<void>
}

interface WindowBridge {
  minimize(): Promise<void>
  maximize(): Promise<void>
  close(): Promise<void>
  isMaximized(): Promise<boolean>
  onMaximize(cb: (isMax: boolean) => void): void
  onUnmaximize(cb: () => void): void
}

declare global {
  interface Window {
    __IS_ELECTRON__?: boolean
    __fileBridge?: FileBridge
    __windowBridge?: WindowBridge
    __PLATFORM__?: 'darwin' | 'win32' | 'linux'
    process?: {
      versions?: {
        electron?: string
      }
    }
  }
}
