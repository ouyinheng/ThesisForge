<script setup lang="ts">
import { computed, type Component } from 'vue'
import { NButton, NButtonGroup, NIcon } from 'naive-ui'
import {
  SunnyOutline,
  MoonOutline,
  SettingsOutline,
  ReaderOutline,
  ExpandOutline,
} from '@vicons/ionicons5'
import { useI18n } from '@/composables/useI18n'
import { useBlogStore } from '@/stores/blog'
import { useLayout } from '@/composables/useLayout'
import { useSettingsStore } from '@/stores/settings'
import { useRouter, useRoute } from 'vue-router'
import { isDesktop } from '@/services/storage'
import { h } from 'vue'

const emit = defineEmits<{
  openSettings: []
}>()

const { t, currentLocale } = useI18n()
const { currentLayout, toggleLayout } = useLayout()
const settings = useSettingsStore()
const router = useRouter()
const route = useRoute()

const currentTheme = computed(() => settings.theme)
const isElectron = isDesktop()
const isMac = computed(() => (window as any).__PLATFORM__ === 'darwin')
const isWindows = computed(() => (window as any).__PLATFORM__ === 'win32')

function toggleTheme(): void {
  settings.toggleTheme()
}

function toggleLocale(): void {
  settings.toggleLocale()
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

// Windows 窗口控制
function winMinimize(): void {
  (window as any).__windowBridge?.minimize()
}
function winMaximize(): void {
  (window as any).__windowBridge?.maximize()
}
function winClose(): void {
  (window as any).__windowBridge?.close()
}

// 导航下拉菜单
interface NavItem {
  label: string
  key: string
  path: string
}

const navItems = computed<NavItem[]>(() => [
  { label: t('nav.papers'), key: 'papers', path: '/' },
  { label: t('nav.write'), key: 'write', path: '/editor' },
  { label: t('nav.about'), key: 'about', path: '/about' },
])
</script>

<template>
  <header class="app-header">
    <!-- 顶栏模式下展示导航 -->
    <nav class="header-nav" v-if="currentLayout === 'topbar'">
      <NButton
        v-for="item in navItems"
        :key="item.key"
        quaternary
        size="small"
        :type="(item.path === '/' && route.path === '/' && !route.query.tag) || (item.path !== '/' && route.path.startsWith(item.path)) ? 'primary' : 'default'"
        @click="router.push(item.path)"
      >
        {{ item.label }}
      </NButton>
    </nav>

    <!-- 中间填充区 -->
    <div class="header-spacer"></div>

    <!-- macOS 不可拖动拖拽区给红绿灯 -->
    <div class="header-drag-zone" v-if="isMac && isElectron"></div>

    <!-- 右侧：工具按钮 -->
    <div class="header-right">
      <NButtonGroup size="small">
        <NButton
          tertiary
          :render-icon="renderIcon(currentLayout === 'sidebar' ? ReaderOutline : ExpandOutline)"
          @click="toggleLayout"
        >
          {{ t('layout') }}
        </NButton>
        <NButton
          quaternary
          :render-icon="renderIcon(currentTheme === 'light' ? SunnyOutline : MoonOutline)"
          @click="toggleTheme"
        >
          {{ t(`display.${currentTheme}`) }}
        </NButton>
        <NButton quaternary @click="toggleLocale">
          {{ currentLocale === 'zh' ? '中' : 'EN' }}
        </NButton>
        <NButton
          quaternary
          :render-icon="renderIcon(SettingsOutline)"
          @click="emit('openSettings')"
        >
          {{ t('settings') }}
        </NButton>
      </NButtonGroup>

      <!-- Windows 窗口控制 -->
      <div class="window-controls" v-if="isWindows && isElectron">
        <button class="win-btn" @click="winMinimize">
          <NIcon :size="14">
            <svg viewBox="0 0 12 12"><rect y="5.5" width="10" height="1" fill="currentColor"/></svg>
          </NIcon>
        </button>
        <button class="win-btn" @click="winMaximize">
          <NIcon :size="12">
            <svg viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
          </NIcon>
        </button>
        <button class="win-btn close-btn" @click="winClose">
          <NIcon :size="14">
            <svg viewBox="0 0 12 12"><path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>
          </NIcon>
        </button>
      </div>
    </div>
  </header>
</template>

<style lang="less" scoped>
.app-header {
  height: 48px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5em;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
  -webkit-app-region: drag;
}

/* 拖拽区：给 macOS 红绿灯按钮留白 */
.header-drag-zone {
  width: 72px;
  min-width: 72px;
  height: 100%;
  -webkit-app-region: drag;
}

.header-nav {
  display: flex;
  gap: 0.5em;
  -webkit-app-region: no-drag;

  :deep(.n-button) {
    padding: 0 1.2em;
    font-size: 14px;
  }
}

.header-spacer {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5em;
  -webkit-app-region: no-drag;
}

/* Windows 窗口控制按钮 */
.window-controls {
  display: flex;
  align-items: center;
  border-left: 1px solid var(--color-border);
  margin-left: 0.8em;
  padding-left: 0.5em;
}

.win-btn {
  width: 38px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  &.close-btn:hover {
    background: #e03e3e;
    color: #fff;
  }
}
</style>
