<script setup lang="ts">
import { inject } from "vue";
import AppTabs from "@/components/app/AppTabs.vue";
import { useSharedLayout } from "@/composables/layout/useSharedLayout";
import { useTabsStore } from "@/stores/tabs";
import { useSettingsStore } from "@/stores/settings";
import { useRouter } from "vue-router";
import { usePublishAction } from "@/composables/editor/usePublishAction";
import {
  SunnyOutline,
  MoonOutline,
  SettingsOutline,
  PencilOutline,
  PaperPlaneOutline
} from "@vicons/ionicons5";
import { NIcon, NButton } from "naive-ui";

const settings = useSettingsStore();
const router = useRouter();
const { isEditorActive, publish: publishFromHeader } = usePublishAction();
const { sidebarCollapsed, toggleSidebar } = useSharedLayout();
const tabsStore = useTabsStore();

// 注入 App.vue 提供的 openSettings
const openSettings = inject<(() => void) | null>("openSettings", null);
</script>

<template>
  <div class="app-title-bar">
    <!-- 折叠按钮 -->
    <div class="menu-collapse f-c-c cursor-pointer auto-bg-hover" @click="toggleSidebar">
      <i :class="sidebarCollapsed ? 'i-line-md-menu-unfold-left' : 'i-line-md-menu-fold-left'" />
    </div>
    <router-link class="title-logo" to="/">
      <span class="brand-mark">P</span>
      <span class="brand-text">PaperBlog</span>
    </router-link>

    <!-- Tab 栏 (flex-1 占满剩余) -->
    <template v-if="tabsStore.showTabs">
      <div class="tab-wrap w-0 flex-1 px-3">
        <AppTabs class="w-full" />
      </div>
      <span class="mx-3 opacity-20">|</span>
    </template>

    <!-- 右侧按钮 -->
    <div class="header-actions flex flex-shrink-0 items-center px-2 gap-1 ml-auto">
      <NButton
        size="tiny"
        type="primary"
        class="write-btn mr-2"
        @click="isEditorActive ? publishFromHeader() : router.push('/editor')"
      >
        <template #icon>
          <NIcon :component="isEditorActive ? PaperPlaneOutline : PencilOutline" />
        </template>
        {{ isEditorActive ? "发布文章" : "写文章" }}
      </NButton>

      <NButton quaternary circle size="tiny" class="icon-btn" @click="settings.toggleTheme">
        <template #icon>
          <NIcon :component="settings.theme === 'dark' ? SunnyOutline : MoonOutline" :size="16" />
        </template>
      </NButton>

      <NButton quaternary circle size="tiny" class="icon-btn" @click="openSettings?.()">
        <template #icon>
          <NIcon :component="SettingsOutline" :size="16" />
        </template>
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.app-title-bar {
  height: 38px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  background: #e0e3e2;
  /* border-bottom: 1px solid var(--color-border); */
  -webkit-app-region: drag;
  padding-left: 80px;
}
/* macOS：logo 右移 100px，避开原生红绿灯 */
.title-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 0 10px;
  -webkit-app-region: no-drag;
}
.brand-mark {
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}
.brand-text {
  margin-left: 6px;
  color: var(--color-text);
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
}
.menu-collapse {
  width: 28px;
  height: 28px;
  font-size: 18px;
  color: var(--color-text-secondary);
  border-radius: 6px;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
  transition:
    background 0.2s,
    color 0.2s;
}
.menu-collapse:hover {
  background: var(--color-fill-hover, rgba(128, 128, 128, 0.12));
  color: var(--color-text);
}
.tab-wrap {
  -webkit-app-region: no-drag;
}
.header-actions {
  gap: 4px;
  -webkit-app-region: no-drag;
}
/* 顶部栏为固定 #e0e3e2 底色，图标按钮改用透明底 + 适配灰底的深灰配色 */
.icon-btn {
  background: transparent !important;
  color: rgba(60, 60, 60, 0.7) !important;
}
.icon-btn:hover {
  background: rgba(60, 60, 60, 0.14) !important;
  color: rgba(30, 30, 30, 0.92) !important;
}
.icon-btn:active {
  background: rgba(60, 60, 60, 0.22) !important;
}
</style>
