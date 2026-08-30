import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'
import { cpSync, mkdirSync, existsSync } from 'fs'

export default defineConfig({
  base: './',
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
        const trayIcon = resolve(__dirname, 'electron/window-tray.png')
        if (existsSync(trayIcon)) {
          cpSync(trayIcon, resolve(electronDir, 'window-tray.png'))
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // 开发代理仅在 `vite` / `vite preview` 本地运行时生效（同源绕过 CORS）。
  // 打包（build）后由 .env.production 中的 VITE_JUEJIN_*_BASE 直接指向真实地址，
  // 前端代码通过 import.meta.env 读取，无需代理。
  server: {
    port: 5178,
    proxy: {
      // 掘金接口会拦截带 Origin/Referer 的请求（返回 403 反爬），
      // 因此代理层删除这两个浏览器自动附加的头，伪装成服务端直连。
      '/juejin-api': {
        target: 'https://api.juejin.cn',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/juejin-api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
      '/juejin-page': {
        target: 'https://juejin.cn',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/juejin-page/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
      // 厂长资源（4kcz）无 CORS 头，web 端通过 Vite 开发代理转发，electron 直连
      '/video-station': {
        target: 'https://www.4kcz.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/video-station/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('referer')
          })
        },
      },
    },
  },
})
