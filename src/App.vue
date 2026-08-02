<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { NConfigProvider, NMessageProvider } from "naive-ui";
import { useLayout } from "@/composables/useLayout";
import { useNaiveTheme } from "@/theme/naive-theme";
import { useRoute, useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import AppSidebar from "@/components/AppSidebar.vue";
import AppTabs from "@/components/AppTabs.vue";
import SettingsModal from "@/components/SettingsModal.vue";
import IframeModal from "@/components/IframeModal.vue";
import { openInIframe } from "@/composables/useExternalLink";
import { isDesktop } from "@/services/storage";
import { useTabsStore } from "@/stores/tabs";
import { useSettingsStore } from "@/stores/settings";

const { currentLayout } = useLayout();
const route = useRoute();
const router = useRouter();
const showSettings = ref(false);
const { themeOverrides } = useNaiveTheme();
const tabs = useTabsStore();
const settingsStore = useSettingsStore();

// 路由切换时同步 tab
router.afterEach((to) => {
  tabs.addTab(to, settingsStore.locale as string);
});

// 侧边栏收起状态（localStorage 持久化）
const sidebarCollapsed = ref(localStorage.getItem("sidebarCollapsed") === "true");

watch(sidebarCollapsed, (val) => {
  localStorage.setItem("sidebarCollapsed", String(val));
});

// 文章页/掘金内容页自动收起侧边栏
watch(
  () => route.path,
  (path) => {
    if (
      currentLayout.value === "sidebar" &&
      (path.startsWith("/article/") || path.startsWith("/juejin/"))
    ) {
      sidebarCollapsed.value = true;
    }
  }
);

// 切换布局时重置 sidebar 状态
watch(currentLayout, (layout) => {
  if (layout === "topbar") {
    sidebarCollapsed.value = false;
  }
});

const isElectron = isDesktop();

const outlineVisible = computed(
  () =>
    sidebarCollapsed.value &&
    route.path.startsWith("/article/") &&
    currentLayout.value === "sidebar"
);

if (typeof window !== "undefined") {
  window.addEventListener("open-settings-global", () => {
    showSettings.value = true;
  });
}

// 全局拦截：所有 external 链接（hostname !== 当前）统一在 iframe 打开
function interceptExternalLinks(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
  if (!anchor) return;
  try {
    const linkUrl = new URL(anchor.href, window.location.origin);
    if (linkUrl.hostname && linkUrl.hostname !== window.location.hostname) {
      e.preventDefault();
      openInIframe(linkUrl.href, anchor.textContent?.trim() || linkUrl.hostname);
    }
  } catch {
    // 忽略无效 URL
  }
}

onMounted(() => {
  document.addEventListener("click", interceptExternalLinks, true);
});
onUnmounted(() => {
  document.removeEventListener("click", interceptExternalLinks, true);
});

// Sidebar 宽度变量
const sidebarWidth = computed(() => {
  if (currentLayout.value !== "sidebar") return 0;
  return sidebarCollapsed.value ? 64 : 220;
});
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NMessageProvider>
      <!-- 根容器：sidebar mode / topbar mode / electron 的不同状态 -->
      <div
        class="app-root"
        :class="{
          'sidebar-mode': currentLayout === 'sidebar',
          'topbar-mode': currentLayout === 'topbar',
          'is-electron': isElectron,
          'sidebar-collapsed':
            currentLayout === 'sidebar' && sidebarCollapsed,
          'outline-visible': outlineVisible,
        }"
        :style="{ '--sidebar-w': sidebarWidth + 'px' }"
      >
        <!-- ========== 顶部栏（全宽） ========== -->
        <div class="app-header-bar">
          <AppHeader @open-settings="showSettings = true" />
        </div>

        <!-- ========== 主体区域（header 下方） ========== -->
        <div class="app-body">
          <!-- 侧边栏（固定定位在 header 下方左侧） -->
          <AppSidebar
            v-if="currentLayout === 'sidebar'"
            :collapsed="sidebarCollapsed"
            @toggle-collapse="sidebarCollapsed = $event"
          />

          <!-- Tab + Content 的容器，左边距 = sidebar width -->
          <div class="app-content-area">
            <!-- Tab 栏（紧贴侧边栏右边缘，向左右延伸） -->
            <div class="app-tabs-bar" v-if="tabs.showTabs">
              <AppTabs />
            </div>

            <!-- 主内容区 -->
            <main class="app-main">
              <router-view v-slot="{ Component }">
                <keep-alive :include="tabs.cachedNames">
                  <component :is="Component" :key="route.fullPath" class="route-anim" />
                </keep-alive>
              </router-view>
            </main>
          </div>
        </div>
      </div>

      <SettingsModal v-model:show="showSettings" />
      <IframeModal />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style lang="less" scoped>
/* 
 * 布局策略：
 * - 顶部栏 position: fixed，全宽
 * - 主体区域 margin-top: 48px（或者 header height），自然流
 * - 侧边栏 position: fixed，top: 48px, bottom: 0, left: 0
 * - .app-content-area margin-left = sidebar width（展开/收起）
 * - Tab 栏自然填充 .app-content-area
 * - 内容区自然滚动（依靠 body 滚动）
 */

.app-root {
  --header-h: 48px;
  --sidebar-w: 220px;
  min-height: 100vh;
  background: var(--color-bg);
}

/* ========== 顶部栏 ========== */
.app-header-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-h);
  z-index: 100;
}

/* ========== 主体区域 ========== */
.app-body {
  margin-top: var(--header-h);
  display: flex;
  min-height: calc(100vh - var(--header-h));
}

/* ========== 内容区域（包含 tabs + main） ========== */
.app-content-area {
  flex: 1;
  margin-left: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  transition: margin-left var(--transition);
}

/* ========== Tab 栏 ========== */
.app-tabs-bar {
  position: sticky;
  top: var(--header-h);
  z-index: 50;
  background: var(--color-bg);
  flex-shrink: 0;
}

/* ========== 主内容（所有页面统一宽度） ========== */
.app-main {
  flex: 1;
  padding: 2em 3em;
  max-width: 1100px;
  box-sizing: border-box;
}

/* ========== 侧边栏模式：内容区居中 ========== */
.app-root.sidebar-mode .app-main {
  width: 100%;
  flex: 1 1 auto;
  margin: 0 auto;
  max-width: 1100px;
}

/* ========== 侧边栏收起时 ========== */
.app-root.sidebar-collapsed {
  --sidebar-w: 64px;
}

/* ========== 顶栏模式 ========== */
.app-root.topbar-mode .app-content-area {
  margin-left: 0;
}

.app-root.topbar-mode .app-main {
  margin: 0 auto;
}

/* ========== Electron 自定义标题栏 ========== */
.app-root.is-electron {
  --header-h: 60px;
}

/* ========== 大纲面板展开时 ========== */
.app-root.outline-visible {
  --sidebar-w: 256px;
}
</style>

<style lang="less">
/* 无 scoped 全局 */
html,
body,
#app {
  margin: 0;
  min-height: 100vh;
}

/* ========== 路由过渡动画：淡入淡出 + 水平滑动 ========== */
@keyframes route-enter {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.route-anim {
  animation: route-enter 0.25s ease both;
}
</style>
