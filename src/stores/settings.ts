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
const AVATAR_KEY = 'pb-avatar'
const NICKNAME_KEY = 'pb-nickname'
const FONT_SIZE_KEY = 'pb-font-size'

function getStoredCity(): string {
  return localStorage.getItem(WEATHER_CITY_KEY) || '长沙'
}
function setStoredCity(city: string): void {
  if (city) localStorage.setItem(WEATHER_CITY_KEY, city)
  else localStorage.removeItem(WEATHER_CITY_KEY)
}

function getStoredAccent(): string {
  return localStorage.getItem(ACCENT_COLOR_KEY) || '#D12F2F'
}
function setStoredAccent(color: string): void {
  if (color) localStorage.setItem(ACCENT_COLOR_KEY, color)
  else localStorage.removeItem(ACCENT_COLOR_KEY)
}

function getStoredAvatar(): string {
  return localStorage.getItem(AVATAR_KEY) || ''
}
function setStoredAvatar(data: string): void {
  if (data) localStorage.setItem(AVATAR_KEY, data)
  else localStorage.removeItem(AVATAR_KEY)
}

function getStoredNickname(): string {
  return localStorage.getItem(NICKNAME_KEY) || ''
}
function setStoredNickname(name: string): void {
  if (name) localStorage.setItem(NICKNAME_KEY, name)
  else localStorage.removeItem(NICKNAME_KEY)
}

function getStoredFontSize(): number {
  const v = localStorage.getItem(FONT_SIZE_KEY)
  return v ? parseInt(v, 10) : 14
}
function setStoredFontSize(size: number): void {
  localStorage.setItem(FONT_SIZE_KEY, String(size))
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
  const layout: Ref<LayoutMode> = ref<LayoutMode>('normal')
  const locale: Ref<Locale> = ref<Locale>('zh')
  const loaded: Ref<boolean> = ref<boolean>(false)
  const storagePath: Ref<string> = ref<string>('')
  const weatherCity: Ref<string> = ref<string>(getStoredCity())
  const accentColor: Ref<string> = ref<string>(getStoredAccent())
  const avatar: Ref<string> = ref<string>(getStoredAvatar())
  const nickname: Ref<string> = ref<string>(getStoredNickname())
  const fontSize: Ref<number> = ref<number>(getStoredFontSize())

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
  watch(avatar, (val) => {
    setStoredAvatar(val)
  })
  watch(nickname, (val) => {
    setStoredNickname(val)
  })
  watch(fontSize, (val) => {
    setStoredFontSize(val)
    document.documentElement.style.setProperty('--base-font-size', `${val}px`)
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
    document.documentElement.style.setProperty('--base-font-size', `${fontSize.value}px`)
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
    // normal <-> full 切换
    layout.value = layout.value === 'normal' ? 'full' : 'normal'
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
    avatar,
    nickname,
    fontSize,
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
