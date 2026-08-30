<script setup lang="ts">
import { inject } from 'vue'
import {
  SunnyOutline,
  MoonOutline,
  SettingsOutline,
  PencilOutline,
  PaperPlaneOutline,
} from '@vicons/ionicons5'
import { NIcon, NButton } from 'naive-ui'
import { h } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from '@/composables/i18n/useI18n'
import { useSharedLayout } from '@/composables/layout/useSharedLayout'
import { useRouter } from 'vue-router'
import { usePublishAction } from '@/composables/editor/usePublishAction'

const { t } = useI18n()
const settings = useSettingsStore()
const router = useRouter()
const { isEditorActive, publish: publishFromHeader } = usePublishAction()
const { sidebarCollapsed, toggleSidebar } = useSharedLayout()
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

    <!-- 面包屑 / 标题 -->
    <div class="ml-12 flex-shrink-0 text-16 font-bold color-text">PaperBlog</div>

    <div class="ml-auto" />

    <!-- 右侧按钮 -->
    <div class="header-actions flex flex-shrink-0 items-center px-12 text-18">
      <NButton
        type="primary"
        size="small"
        class="write-btn mr-8"
        @click="isEditorActive ? publishFromHeader() : router.push('/editor')"
      >
        <template #icon>
          <NIcon :component="isEditorActive ? PaperPlaneOutline : PencilOutline" />
        </template>
        {{ isEditorActive ? '发布文章' : '写文章' }}
      </NButton>

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
