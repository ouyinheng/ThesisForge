<script setup lang="ts">
import { computed, type Component } from "vue";
import { NButton, NButtonGroup, NIcon, NTooltip, NMenu } from "naive-ui";
import {
  SunnyOutline,
  MoonOutline,
  SettingsOutline,
  ReaderOutline,
  ExpandOutline,
  PencilOutline
} from "@vicons/ionicons5";
import { useI18n } from "@/composables/useI18n";
import { useLayout } from "@/composables/useLayout";
import { useSettingsStore } from "@/stores/settings";
import { useRouter, useRoute } from "vue-router";
import { isDesktop } from "@/services/storage";
import { h } from "vue";
import { useNavMenu } from "@/composables/useNavMenu";

const emit = defineEmits<{
  openSettings: [];
}>();

const { t } = useI18n();
const { currentLayout, toggleLayout } = useLayout();
const settings = useSettingsStore();
const router = useRouter();
const route = useRoute();
const { navMenuOptions, activeKey: activeNavKey, handleSelect: handleNavSelect } = useNavMenu();

const currentTheme = computed(() => settings.theme);
const isElectron = isDesktop();
const isMac = computed(() => (window as any).__PLATFORM__ === "darwin");
const isWindows = computed(() => (window as any).__PLATFORM__ === "win32");

function toggleTheme(): void {
  settings.toggleTheme();
}

function toggleLocale(): void {
  settings.toggleLocale();
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

// Windows 窗口控制
function winMinimize(): void {
  (window as any).__windowBridge?.minimize();
}
function winMaximize(): void {
  (window as any).__windowBridge?.maximize();
}
function winClose(): void {
  (window as any).__windowBridge?.close();
}
</script>

<template>
  <header class="app-header">
    <!-- 品牌 -->
    <div class="header-brand" :class="{ 'brand-hidden': currentLayout === 'topbar' }">
      <!-- PaperBlog -->
    </div>

    <!-- 顶栏模式下展示导航 -->
    <NMenu
      v-if="currentLayout === 'topbar'"
      mode="horizontal"
      :options="navMenuOptions"
      :value="activeNavKey"
      @update:value="handleNavSelect"
      class="header-menu"
    />

    <!-- 中间填充区 -->
    <div class="header-spacer"></div>

    <!-- macOS 不可拖动拖拽区给红绿灯 -->
    <div class="header-drag-zone" v-if="isMac && isElectron"></div>

    <!-- 右侧：工具按钮 -->
    <div class="header-right">
      <!-- 写文章按钮 -->
      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NButton size="small" type="primary" @click="router.push('/editor')">
            <template #icon
              ><NIcon><PencilOutline /></NIcon
            ></template>
            写文章
          </NButton>
        </template>
        {{ t("nav.write") }}
      </NTooltip>

      <NButtonGroup size="small">
        <NTooltip trigger="hover" placement="bottom">
          <template #trigger>
            <NButton
              tertiary
              :render-icon="renderIcon(currentLayout === 'sidebar' ? ReaderOutline : ExpandOutline)"
              @click="toggleLayout"
            />
          </template>
          {{ currentLayout === "sidebar" ? "侧边栏布局" : "顶栏布局" }}
        </NTooltip>
        <NTooltip trigger="hover" placement="bottom">
          <template #trigger>
            <NButton
              quaternary
              :render-icon="renderIcon(currentTheme === 'light' ? SunnyOutline : MoonOutline)"
              @click="toggleTheme"
            />
          </template>
          {{ currentTheme === "light" ? "切换为暗色" : "切换为亮色" }}
        </NTooltip>
        <NTooltip trigger="hover" placement="bottom">
          <template #trigger>
            <NButton quaternary @click="toggleLocale">
              {{ settings.locale === "zh" ? "中" : "EN" }}
            </NButton>
          </template>
          {{ settings.locale === "zh" ? "切换为英文" : "Switch to 中文" }}
        </NTooltip>
        <NTooltip trigger="hover" placement="bottom">
          <template #trigger>
            <NButton
              quaternary
              :render-icon="renderIcon(SettingsOutline)"
              @click="emit('openSettings')"
            />
          </template>
          {{ t("settings") }}
        </NTooltip>
      </NButtonGroup>

      <!-- Windows 窗口控制 -->
      <div class="window-controls" v-if="isWindows && isElectron">
        <button class="win-btn" @click="winMinimize">
          <NIcon :size="14">
            <svg viewBox="0 0 12 12">
              <rect y="5.5" width="10" height="1" fill="currentColor" />
            </svg>
          </NIcon>
        </button>
        <button class="win-btn" @click="winMaximize">
          <NIcon :size="12">
            <svg viewBox="0 0 12 12">
              <rect
                x="1.5"
                y="1.5"
                width="9"
                height="9"
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
              />
            </svg>
          </NIcon>
        </button>
        <button class="win-btn close-btn" @click="winClose">
          <NIcon :size="14">
            <svg viewBox="0 0 12 12">
              <path
                d="M2 2 L10 10 M10 2 L2 10"
                stroke="currentColor"
                stroke-width="1.4"
                fill="none"
              />
            </svg>
          </NIcon>
        </button>
      </div>
    </div>
  </header>
</template>

<style lang="less" scoped>
.app-header {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 1.5em;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  -webkit-app-region: drag;
  min-width: 0;
  overflow: hidden;
}

/* 拖拽区：给 macOS 红绿灯按钮留白 */
.header-drag-zone {
  width: 72px;
  min-width: 72px;
  height: 100%;
  -webkit-app-region: drag;
}

.header-brand {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-text);
  white-space: nowrap;
  transition: opacity var(--transition);

  &.brand-hidden {
    opacity: 0;
    width: 0;
    overflow: hidden;
  }
}

.header-menu {
  -webkit-app-region: no-drag;
  height: 100%;
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;

  :deep(.n-menu) {
    background: transparent;
    height: 100%;
    flex-wrap: nowrap !important;
    white-space: nowrap !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }

  :deep(.n-menu-item) {
    height: 100%;
    --n-item-height: 100%;
    flex-shrink: 0;
  }

  :deep(.n-menu-item-content) {
    padding: 0 0.8em;
    font-size: 14px;
    height: 100%;
    border-bottom: 2px solid transparent;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.n-menu-item-content__icon) {
    flex-shrink: 0;
  }

  :deep(.n-menu-item-content--selected) {
    font-weight: 600;
    border-bottom-color: var(--color-primary);
  }
}

.header-spacer {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5em;
  flex-shrink: 0;
  -webkit-app-region: no-drag;

  :deep(.n-button) {
    border-radius: var(--radius-sm);
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
  }
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
  transition:
    background 0.15s,
    color 0.15s;

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
