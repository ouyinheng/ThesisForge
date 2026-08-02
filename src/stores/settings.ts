import { defineStore } from 'pinia'
import { ref, watch, type Ref } from 'vue'
import {
  getTheme,
  setTheme,
  getLayout,
  setLayout,
  getLocale,
  setLocale,
  getStoragePath,
  setStoragePath as saveStoragePath,
  migrateStorage,
  getDefaultStoragePath,
} from '@/services/storage'
import type { Theme, LayoutMode, Locale } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  const theme: Ref<Theme> = ref<Theme>('light')
  const layout: Ref<LayoutMode> = ref<LayoutMode>('sidebar')
  const locale: Ref<Locale> = ref<Locale>('zh')
  const loaded: Ref<boolean> = ref<boolean>(false)
  const storagePath: Ref<string> = ref<string>('')

  // 立即注册 watcher，响应式地应用所有变更
  watch(theme, (val) => {
    document.documentElement.setAttribute('data-theme', val)
    setTheme(val)
  })
  watch(layout, (val) => {
    setLayout(val)
  })
  watch(locale, (val) => {
    document.documentElement.lang = val === 'zh' ? 'zh-CN' : 'en'
    setLocale(val)
  })

  async function load(): Promise<void> {
    if (loaded.value) return
    theme.value = await getTheme()
    layout.value = await getLayout()
    locale.value = await getLocale()
    storagePath.value = await getStoragePath()
    loaded.value = true
  }

  /**
   * 切换存储路径：先把旧路径数据迁移到新路径，再更新存储路径。
   */
  async function changeStoragePath(newPath: string): Promise<void> {
    const trimmed = newPath.trim()
    if (!trimmed || trimmed === storagePath.value) return
    const oldPath = storagePath.value
    // 迁移旧数据到新路径
    await migrateStorage(oldPath, trimmed)
    // 更新路径
    await saveStoragePath(trimmed)
    storagePath.value = trimmed
  }

  /**
   * 恢复默认存储路径
   */
  async function resetStoragePath(): Promise<void> {
    const defaultPath = await getDefaultStoragePath()
    await changeStoragePath(defaultPath)
  }

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setThemeMode(mode: Theme): void {
    theme.value = mode
  }

  function toggleLayout(): void {
    layout.value = layout.value === 'sidebar' ? 'topbar' : 'sidebar'
  }

  function setLayoutMode(mode: LayoutMode): void {
    layout.value = mode
  }

  function toggleLocale(): void {
    locale.value = locale.value === 'zh' ? 'en' : 'zh'
  }

  function setLocaleLang(lang: Locale): void {
    locale.value = lang
  }

  return {
    theme,
    layout,
    locale,
    storagePath,
    loaded,
    load,
    changeStoragePath,
    resetStoragePath,
    toggleTheme,
    setThemeMode,
    toggleLayout,
    setLayoutMode,
    toggleLocale,
    setLocaleLang,
  }
})
