<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NConfigProvider, NMessageProvider } from 'naive-ui'
import { useLayout } from '@/composables/useLayout'
import { useNaiveTheme } from '@/theme/naive-theme'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { isDesktop } from '@/services/storage'

const { currentLayout } = useLayout()
const route = useRoute()
const showSettings = ref(false)
const { themeOverrides } = useNaiveTheme()

// 侧边栏收起状态（localStorage 持久化）
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')

watch(sidebarCollapsed, (val) => {
  localStorage.setItem('sidebarCollapsed', String(val))
})

// 文章页/掘金内容页自动收起侧边栏
watch(
  () => route.path,
  (path) => {
    if (
      currentLayout.value === 'sidebar' &&
      (path.startsWith('/article/') || path.startsWith('/juejin/'))
    ) {
      sidebarCollapsed.value = true
    }
  }
)

// 切换布局时重置 sidebar 状态
watch(currentLayout, (layout) => {
  if (layout === 'topbar') {
    sidebarCollapsed.value = false
  }
})

const isElectron = isDesktop()
const outlineVisible = computed(
  () => sidebarCollapsed.value && route.path.startsWith('/article/') && currentLayout.value === 'sidebar'
)

if (typeof window !== 'undefined') {
  window.addEventListener('open-settings-global', () => {
    showSettings.value = true
  })
}
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <div class="app-layout" :class="[currentLayout, { 'custom-titlebar': isElectron }]">
        <AppHeader @open-settings="showSettings = true" />
        <div class="app-body">
          <AppSidebar
            v-if="currentLayout === 'sidebar'"
            :collapsed="sidebarCollapsed"
            @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
          />
          <main
            class="app-main"
            :class="{
              'sidebar-collapsed': currentLayout === 'sidebar' && sidebarCollapsed,
              'outline-visible': outlineVisible,
              'juejin-main': route.path.startsWith('/juejin')
            }"
          >
            <router-view />
          </main>
        </div>
      </div>

      <SettingsModal v-model:show="showSettings" />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style lang="less" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-body {
  display: flex;
  flex: 1;
  margin-top: 48px;
}

.app-main {
  flex: 1;
  padding: 2em 3em;
  max-width: 820px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

/* 掘金页：放宽最大宽度以适配瀑布流两列 */
.app-layout .app-main.juejin-main {
  max-width: 1400px;
}

/* 侧边栏展开：内容在侧边栏右侧的可用空间内居中 */
.app-layout.sidebar .app-main {
  margin-left: max(220px, calc((100vw - 820px) / 2));
  margin-right: auto;
}

/* 侧边栏收起：内容在窄 sidebar 右侧居中 */
.app-layout.sidebar .app-main.sidebar-collapsed {
  margin-left: max(56px, calc((100vw - 820px) / 2));
  margin-right: auto;
}

/* 大纲面板展开时：左边距加大 */
.app-layout.sidebar .app-main.sidebar-collapsed.outline-visible {
  margin-left: max(256px, calc((100vw - 820px) / 2));
  margin-right: auto;
}

/* 顶栏模式：完全居中 */
.app-layout.topbar .app-main {
  max-width: 900px;
  margin: 0 auto;
}

/* Electron 自定义标题栏时留出红绿灯空间 */
.app-layout.custom-titlebar .app-body {
  margin-top: 0;
  padding-top: 60px;
}
</style>
