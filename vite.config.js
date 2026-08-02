import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'
import { cpSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    {
      name: 'copy-electron-main',
      closeBundle() {
        const electronDir = resolve(__dirname, 'dist/electron')
        mkdirSync(electronDir, { recursive: true })
        cpSync(
          resolve(__dirname, 'electron/main.cjs'),
          resolve(electronDir, 'main.cjs')
        )
        cpSync(
          resolve(__dirname, 'electron/preload.cjs'),
          resolve(electronDir, 'preload.cjs')
        )
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5178,
  },
})
