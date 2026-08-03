<script setup lang="ts">
import { inject } from 'vue'
import AppTabs from '@/components/AppTabs.vue'
import { useSharedLayout } from '@/composables/useSharedLayout'
import { useTabsStore } from '@/stores/tabs'
import {
  SunnyOutline,
  MoonOutline,
  SettingsOutline,
} from '@vicons/ionicons5'
import { NIcon, NButton } from 'naive-ui'
import { h } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
const settings = useSettingsStore()
const { sidebarCollapsed, toggleSidebar } = useSharedLayout()
const tabsStore = useTabsStore()

// 注入 App.vue 提供的 openSettings
const openSettings = inject<(() => void) | null>('openSettings', null)

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}
</script>

<template>
  <div class="header-bar flex items-center px-12">
    <!-- 折叠按钮 -->
    <div
      class="menu-collapse f-c-c cursor-pointer rounded-4 auto-bg-hover p-6 text-22"
      @click="toggleSidebar"
    >
      <i :class="sidebarCollapsed ? 'i-line-md-menu-unfold-left' : 'i-line-md-menu-fold-left'" />
    </div>

    <!-- Tab 栏 (flex-1 占满剩余) — 含分隔符整体显隐，保证隐藏时右侧按钮仍在右边 -->
    <template v-if="tabsStore.showTabs">
      <AppTabs class="w-0 flex-1 px-12" />
      <span class="mx-6 opacity-20">|</span>
    </template>

    <!-- 右侧按钮 -->
    <div class="header-actions flex flex-shrink-0 items-center px-12 text-18 ml-auto">
      <NButton quaternary circle size="small" @click="settings.toggleTheme">
        <template #icon>
          <NIcon :component="settings.theme === 'dark' ? SunnyOutline : MoonOutline" />
        </template>
      </NButton>

      <NButton
        quaternary
        circle
        size="small"
        @click="openSettings?.()"
      >
        <template #icon>
          <NIcon :component="SettingsOutline" />
        </template>
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.header-bar {
  height: 60px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
}
.menu-collapse {
  width: 32px;
  height: 32px;
  color: var(--color-text-secondary);
}
.header-actions {
  gap: 4px;
}
</style>
