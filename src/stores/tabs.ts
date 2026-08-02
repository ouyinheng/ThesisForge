import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  fullPath: string
  title: string
  key: string
  name: string
}

const TAB_STORE_KEY = 'pb-open-tabs'
const TAB_SHOW_KEY = 'pb-show-tabs'

function loadTabs(): TabItem[] {
  try {
    const raw = localStorage.getItem(TAB_STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveTabs(tabs: TabItem[]): void {
  localStorage.setItem(TAB_STORE_KEY, JSON.stringify(tabs))
}

const TITLE_MAP: Record<string, string> = {
  'home': '首页',
  'papers': '文章',
  'article': '文章详情',
  'editor-new': '写文章',
  'editor-edit': '编辑文章',
  'juejin': '掘金',
  'juejin-article': '掘金文章',
  'about': '关于',
}

const TITLE_MAP_EN: Record<string, string> = {
  'home': 'Home',
  'papers': 'Papers',
  'article': 'Article',
  'editor-new': 'Write',
  'editor-edit': 'Edit',
  'juejin': 'Juejin',
  'juejin-article': 'Juejin Article',
  'about': 'About',
}

function getTitle(route: RouteLocationNormalized, locale: string): string {
  const map = locale === 'en' ? TITLE_MAP_EN : TITLE_MAP
  const name = route.name as string
  if (name && map[name]) return map[name]
  // fallback: 从 route.meta 取
  const metaTitle = route.meta?.title
  if (metaTitle) return String(metaTitle)
  return route.path
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>(loadTabs())
  const activeKey = ref<string>(tabs.value[0]?.fullPath || '')
  const showTabs = ref<boolean>(localStorage.getItem(TAB_SHOW_KEY) !== 'false')

  function syncActive(key: string): void {
    activeKey.value = key
  }

  function addTab(route: RouteLocationNormalized, locale: string): void {
    const fullPath = route.fullPath
    const routeName = (route.name || fullPath) as string
    const exists = tabs.value.find(t => t.fullPath === fullPath)
    const title = getTitle(route, locale)
    if (!exists) {
      tabs.value.push({
        path: route.path,
        fullPath,
        title,
        key: fullPath,
        name: routeName,
      })
    }
    activeKey.value = fullPath
    saveTabs(tabs.value)
  }

  function closeTab(fullPath: string): void {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx === -1) return
    tabs.value.splice(idx, 1)
    if (activeKey.value === fullPath) {
      activeKey.value = tabs.value[Math.min(idx, tabs.value.length - 1)]?.fullPath || ''
    }
    saveTabs(tabs.value)
  }

  function closeOthers(fullPath: string): void {
    const kept = tabs.value.find(t => t.fullPath === fullPath)
    tabs.value = kept ? [kept] : []
    activeKey.value = fullPath
    saveTabs(tabs.value)
  }

  function closeLeft(fullPath: string): void {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx <= 0) return
    const removed = tabs.value.slice(0, idx)
    tabs.value = tabs.value.slice(idx)
    if (removed.some(t => t.fullPath === activeKey.value)) {
      activeKey.value = fullPath
    }
    saveTabs(tabs.value)
  }

  function closeRight(fullPath: string): void {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx === -1) return
    const removed = tabs.value.slice(idx + 1)
    tabs.value = tabs.value.slice(0, idx + 1)
    if (removed.some(t => t.fullPath === activeKey.value)) {
      activeKey.value = fullPath
    }
    saveTabs(tabs.value)
  }

  function toggleShow(show?: boolean): void {
    showTabs.value = show ?? !showTabs.value
    localStorage.setItem(TAB_SHOW_KEY, String(showTabs.value))
  }

  // 计算属性：keep-alive include 用的组件名列表
  const cachedNames = computed(() => [...new Set(tabs.value.map(t => t.name))])

  return {
    tabs,
    activeKey,
    showTabs,
    cachedNames,
    syncActive,
    addTab,
    closeTab,
    closeOthers,
    closeLeft,
    closeRight,
    toggleShow,
  }
})
