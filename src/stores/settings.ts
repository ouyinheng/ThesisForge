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

const WEATHER_CITY_KEY = 'pb-weather-city'
const ACCENT_COLOR_KEY = 'pb-accent-color'

function getStoredCity(): string {
  return localStorage.getItem(WEATHER_CITY_KEY) || '长沙'
}
function setStoredCity(city: string): void {
  if (city) localStorage.setItem(WEATHER_CITY_KEY, city)
  else localStorage.removeItem(WEATHER_CITY_KEY)
}

function getStoredAccent(): string {
  return localStorage.getItem(ACCENT_COLOR_KEY) || ''
}
function setStoredAccent(color: string): void {
  if (color) localStorage.setItem(ACCENT_COLOR_KEY, color)
  else localStorage.removeItem(ACCENT_COLOR_KEY)
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

export const useSettingsStore = defineStore('settings', () => {
  const theme: Ref<Theme> = ref<Theme>('light')
  const layout: Ref<LayoutMode> = ref<LayoutMode>('sidebar')
  const locale: Ref<Locale> = ref<Locale>('zh')
  const loaded: Ref<boolean> = ref<boolean>(false)
  const storagePath: Ref<string> = ref<string>('')
  const weatherCity: Ref<string> = ref<string>(getStoredCity())
  const accentColor: Ref<string> = ref<string>(getStoredAccent())

  watch(theme, (val) => {
    document.documentElement.setAttribute('data-theme', val)
    setTheme(val)
    applyAccentColor(accentColor.value)
  })
  watch(layout, (val) => {
    setLayout(val)
  })
  watch(locale, (val) => {
    document.documentElement.lang = val === 'zh' ? 'zh-CN' : 'en'
    setLocale(val)
  })
  watch(weatherCity, (val) => {
    setStoredCity(val)
  })
  watch(accentColor, (val) => {
    setStoredAccent(val)
    applyAccentColor(val)
  })

  function applyAccentColor(color: string): void {
    if (!color) {
      document.documentElement.style.removeProperty('--color-primary')
      document.documentElement.style.removeProperty('--color-primary-hover')
      document.documentElement.style.removeProperty('--color-primary-light')
      document.documentElement.style.removeProperty('--color-quote-border')
      return
    }
    const isDark = theme.value === 'dark'
    const hover = adjustColor(color, isDark ? 30 : -20)
    const light = isDark ? adjustColor(color, -120) : adjustColor(color, 200)
    document.documentElement.style.setProperty('--color-primary', color)
    document.documentElement.style.setProperty('--color-primary-hover', hover)
    document.documentElement.style.setProperty('--color-primary-light', light)
    document.documentElement.style.setProperty('--color-quote-border', color)
  }

  async function load(): Promise<void> {
    if (loaded.value) return
    theme.value = await getTheme()
    layout.value = await getLayout()
    locale.value = await getLocale()
    storagePath.value = await getStoragePath()
    loaded.value = true
    applyAccentColor(accentColor.value)
  }

  async function changeStoragePath(newPath: string): Promise<void> {
    const trimmed = newPath.trim()
    if (!trimmed || trimmed === storagePath.value) return
    const oldPath = storagePath.value
    await migrateStorage(oldPath, trimmed)
    await saveStoragePath(trimmed)
    storagePath.value = trimmed
  }

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
    weatherCity,
    accentColor,
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
