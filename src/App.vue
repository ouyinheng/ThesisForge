<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  provide,
  markRaw,
  defineAsyncComponent
} from "vue";
import { NConfigProvider, NMessageProvider } from "naive-ui";
import { useRoute, useRouter } from "vue-router";
import { useTabsStore, reloadKeyMap } from "@/stores/tabs";
import { useSettingsStore } from "@/stores/settings";
import { useNaiveTheme } from "@/theme/naive-theme";
import { openInIframe } from "@/composables/link/useExternalLink";
import SettingsModal from "@/components/modal/SettingsModal.vue";
import IframeModal from "@/components/widget/IframeModal.vue";
import { useSharedLayout } from "@/composables/layout/useSharedLayout";

const route = useRoute();
const router = useRouter();
const tabs = useTabsStore();
const settingsStore = useSettingsStore();
const { themeOverrides } = useNaiveTheme();
const { sidebarCollapsed } = useSharedLayout();

const showSettings = ref(false);

// 路由切换时同步 tab
router.afterEach((to) => {
  tabs.addTab(to, settingsStore.locale as string);
});

// ── 布局缓存（与 vue-naive-admin 一致，避免重新加载闪烁）
const layoutCache = new Map();
function getLayout(name: string) {
  if (layoutCache.has(name)) return layoutCache.get(name);
  const map: Record<string, () => Promise<any>> = {
    normal: () => import("@/layouts/normal/index.vue"),
    full: () => import("@/layouts/full/index.vue"),
    simple: () => import("@/layouts/simple/index.vue"),
    empty: () => import("@/layouts/empty/index.vue")
  };
  const loader = map[name] || map.normal;
  const comp = markRaw(defineAsyncComponent(loader));
  layoutCache.set(name, comp);
  return comp;
}

// 根据 route.meta.layout 或 settingsStore.layout 决定使用哪个布局
const Layout = computed(() => {
  if (!route.matched?.length) return null;
  const name = (route.meta?.layout as string) || settingsStore.layout;
  return getLayout(name);
});

// 文章页/掘金内容页自动收起侧边栏
watch(
  () => route.path,
  (path) => {
    const currentLayout = (route.meta?.layout as string) || settingsStore.layout;
    if (
      currentLayout !== "empty" &&
      currentLayout !== "simple" &&
      (path.startsWith("/article/") || path.startsWith("/juejin/"))
    ) {
      sidebarCollapsed.value = true;
    }
  }
);

// 全局事件：打开设置
if (typeof window !== "undefined") {
  window.addEventListener("open-settings-global", () => {
    showSettings.value = true;
  });
}

// 全局拦截外部链接
function interceptExternalLinks(e: MouseEvent) {
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
    /* ignore */
  }
}

onMounted(() => {
  document.addEventListener("click", interceptExternalLinks, true);
});
onUnmounted(() => {
  document.removeEventListener("click", interceptExternalLinks, true);
});

// 暴露给子组件调用：打开设置弹窗
function openSettings() {
  showSettings.value = true;
}

// provide 给后代（Header、Sidebar 等需要调用 openSettings）
provide("openSettings", openSettings);
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides" class="wh-full">
    <NMessageProvider>
      <router-view v-if="Layout" v-slot="{ Component, route: curRoute }">
        <component :is="Layout">
          <transition name="fade-slide" mode="out-in" appear>
            <keep-alive :include="tabs.cachedNames">
              <component
                :is="Component"
                :key="curRoute.fullPath + (reloadKeyMap[curRoute.fullPath] || 0)"
              />
            </keep-alive>
          </transition>
        </component>
      </router-view>

      <SettingsModal v-model:show="showSettings" />
      <IframeModal />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style lang="less">
/* 全局 transition (fade-slide) */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(2%);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-2%);
}
</style>
