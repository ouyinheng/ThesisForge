import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  fullPath: string
  title: string
  key: string
  name: string
  pinned: boolean  // 是否常驻（不可关闭）
}

const TAB_STORE_KEY = 'pb-open-tabs'
const TAB_SHOW_KEY = 'pb-show-tabs'

/** 常驻首页 tab */
const HOME_TAB: TabItem = {
  path: '/',
  fullPath: '/',
  title: '',
  key: '/',
  name: 'home',
  pinned: true,
}

function loadTabs(): TabItem[] {
  try {
    const raw = localStorage.getItem(TAB_STORE_KEY)
    if (raw) {
      const parsed: TabItem[] = JSON.parse(raw)
      // 确保首页常驻在第一个
      const hasHome = parsed.some(t => t.pinned)
      if (!hasHome) {
        parsed.unshift({ ...HOME_TAB, title: '' })
      } else {
        // 确保 home 在第一位
        const homeIdx = parsed.findIndex(t => t.pinned)
        if (homeIdx > 0) {
          const [home] = parsed.splice(homeIdx, 1)
          parsed.unshift(home)
        }
      }
      return parsed
    }
  } catch { /* ignore */ }
  return [{ ...HOME_TAB }]
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
  'todos': '待办',
  'collections': '收藏夹',
  'novel-bookshelf': '作品书架',
  'novel-write': '写作台',
  'edu-dashboard': '班级工作台',
  'edu-students': '学生管理',
  'edu-attendance': '考勤管理',
  'edu-grades': '成绩管理',
  'edu-schedule': '课表管理',
  'edu-seats': '座位表',
  'edu-notices': '通知公告',
  'job': '招聘情报',
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
  'todos': 'Todos',
  'collections': 'Collections',
  'novel-bookshelf': 'Bookshelf',
  'novel-write': 'Writer',
  'edu-dashboard': 'Class Dashboard',
  'edu-students': 'Students',
  'edu-attendance': 'Attendance',
  'edu-grades': 'Grades',
  'edu-schedule': 'Schedule',
  'edu-seats': 'Seats',
  'edu-notices': 'Notices',
  'job': 'Recruitment',
  'about': 'About',
}

const routeTitle = (route: RouteLocationNormalized, locale: string): string => {
  const map = locale === 'en' ? TITLE_MAP_EN : TITLE_MAP
  const name = route.name as string
  if (name && map[name]) return map[name]
  const metaTitle = route.meta?.title
  if (metaTitle) return String(metaTitle)
  return route.path
}

/** 刷新 key map —— 每个 fullPath 一个计数器，变化时触发对应组件强制重建 */
export const reloadKeyMap = ref<Record<string, number>>({})

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>(loadTabs())
  const activeKey = ref<string>(tabs.value[0]?.fullPath || '/')
  const showTabs = ref<boolean>(localStorage.getItem(TAB_SHOW_KEY) !== 'false')

  function syncActive(key: string): void {
    activeKey.value = key
  }

  function addTab(route: RouteLocationNormalized, locale: string): void {
    const fullPath = route.fullPath
    const routeName = (route.name || fullPath) as string
    // 首页已经在 tabs 中，跳过
    if (fullPath === '/' || fullPath === '') {
      // 更新 home tab title if needed
      const homeTab = tabs.value.find(t => t.pinned)
      if (homeTab) homeTab.title = routeTitle(route, locale)
      activeKey.value = tabs.value[0]?.fullPath || '/'
      return
    }
    // 查找是否存在相同 path 的非固定 tab，若有则复用（更新 fullPath/key，而非新建）
    const existingByPath = tabs.value.find(t => !t.pinned && t.path === route.path)
    if (existingByPath) {
      existingByPath.fullPath = fullPath
      existingByPath.key = fullPath
      existingByPath.name = routeName
      existingByPath.title = routeTitle(route, locale)
      activeKey.value = fullPath
      saveTabs(tabs.value)
      return
    }
    // 精确匹配 fullPath（兜底，理论上与上面一致或不存在）
    const exists = tabs.value.find(t => t.fullPath === fullPath)
    if (!exists) {
      const title = routeTitle(route, locale)
      tabs.value.push({
        path: route.path,
        fullPath,
        title,
        key: fullPath,
        name: routeName,
        pinned: false,
      })
    }
    activeKey.value = fullPath
    saveTabs(tabs.value)
  }

  function closeTab(fullPath: string): void {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx === -1) return
    const tab = tabs.value[idx]
    if (tab.pinned) return // 常驻 tab 不允许关闭

    tabs.value.splice(idx, 1)
    if (activeKey.value === fullPath) {
      activeKey.value = tabs.value[Math.min(idx, tabs.value.length - 1)]?.fullPath || '/'
    }
    saveTabs(tabs.value)
  }

  function closeOthers(fullPath: string): void {
    // 关闭其他时保留所有 pinned
    const pinnedTabs = tabs.value.filter(t => t.pinned)
    const current = tabs.value.find(t => t.fullPath === fullPath)
    if (current && !current.pinned) {
      tabs.value = [...pinnedTabs, current]
    } else {
      tabs.value = pinnedTabs
    }
    activeKey.value = fullPath
    saveTabs(tabs.value)
  }

  function closeLeft(fullPath: string): void {
    const idx = tabs.value.findIndex(t => t.fullPath === fullPath)
    if (idx <= 0) return
    // 不能关闭 pinned 之前的
    const pinnedBefore = tabs.value.slice(0, idx).filter(t => t.pinned)
    const rest = tabs.value.slice(idx)
    tabs.value = [...pinnedBefore, ...rest]
    if (tabs.value.slice(0, idx).some(t => t.fullPath === activeKey.value) && !tabs.value.find(t => t.fullPath === activeKey.value)) {
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

  /** 刷新指定 tab：递增其 reloadKey 触发组件 key 变化 → 强制重建 */
  function reloadTab(fullPath: string): void {
    reloadKeyMap.value[fullPath] = (reloadKeyMap.value[fullPath] || 0) + 1
  }

  function toggleShow(show?: boolean): void {
    showTabs.value = show ?? !showTabs.value
    localStorage.setItem(TAB_SHOW_KEY, String(showTabs.value))
  }

  // keep-alive include 用
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
    reloadTab,
    toggleShow,
  }
})
