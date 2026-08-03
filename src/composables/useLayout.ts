import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useSharedLayout } from '@/composables/useSharedLayout'

/**
 * useLayout — 布局相关状态（对齐 vue-naive-admin 的布局体系）
 *
 * 布局模式：'normal' | 'full' | 'simple' | 'empty'
 * - normal：sidebar + header（tabs 在 header 内）—默认
 * - full：  sidebar + header + 独立 tabs + 内容
 * - simple：sidebar + 内容（无 header）
 * - empty：纯 slot（编辑器/沉浸式）
 */
export function useLayout() {
  const settings = useSettingsStore()
  const shared = useSharedLayout()

  const currentLayout = computed(() => settings.layout)
  const sidebarCollapsed = computed(() => shared.sidebarCollapsed.value)

  /** 侧边栏宽度（折叠 64px / 展开 220px） */
  const sidebarWidth = computed(() => {
    return sidebarCollapsed.value ? 64 : 220
  })

  /** 是否有侧边栏（empty 布局没有） */
  const hasSidebar = computed(() => currentLayout.value !== 'empty')

  function setLayout(mode: 'normal' | 'full' | 'simple' | 'empty'): void {
    settings.setLayoutMode(mode)
  }

  return {
    currentLayout,
    sidebarCollapsed,
    sidebarWidth,
    hasSidebar,
    setLayout,
  }
}
