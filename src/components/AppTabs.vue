<script setup lang="ts">
import { ref, computed, h } from "vue";
import { NTabs, NTab, NDropdown, NIcon } from "naive-ui";
import {
  CloseOutline,
  RefreshOutline,
  CloseCircleOutline,
  ArrowBackOutline,
  ArrowForwardOutline,
} from "@vicons/ionicons5";
import { useTabsStore } from "@/stores/tabs";
import { useRouter } from "vue-router";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();
const tabsStore = useTabsStore();
const router = useRouter();

const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextTab = ref<{ fullPath: string; pinned: boolean } | null>(null);

/** 当前右键 tab 在 tabs 数组中的索引 */
const contextTabIndex = computed(() => {
  if (!contextTab.value) return -1;
  return tabsStore.tabs.findIndex(
    (tab) => tab.fullPath === contextTab.value!.fullPath
  );
});

/** 是否为最后一个 tab（只有首页） */
const isOnlyOneTab = computed(() => tabsStore.tabs.length <= 1);

/** 是否为第一个非 pinned tab */
const isFirstNonPinned = computed(() => {
  if (contextTabIndex.value <= 0) return true;
  // 如果前面全是 pinned，也算第一个有效 tab
  const beforeCurrent = tabsStore.tabs.slice(0, contextTabIndex.value);
  return beforeCurrent.every((tab) => tab.pinned);
});

/** 是否为最后一个 tab */
const isLastTab = computed(() => {
  return contextTabIndex.value >= tabsStore.tabs.length - 1;
});

const menuOptions = computed(() => [
  {
    label: t("tabs.reload"),
    key: "reload",
    icon: () => h(NIcon, null, { default: () => h(RefreshOutline) }),
  },
  {
    label: t("tabs.close"),
    key: "close",
    icon: () => h(NIcon, null, { default: () => h(CloseOutline) }),
    disabled:
      contextTab.value?.pinned || isOnlyOneTab.value,
  },
  { type: "divider" as const, key: "divider-1" },
  {
    label: t("tabs.closeOthers"),
    key: "closeOthers",
    icon: () => h(NIcon, null, { default: () => h(CloseCircleOutline) }),
    disabled: isOnlyOneTab.value,
  },
  {
    label: t("tabs.closeLeft"),
    key: "closeLeft",
    icon: () => h(NIcon, null, { default: () => h(ArrowBackOutline) }),
    disabled: isFirstNonPinned.value,
  },
  {
    label: t("tabs.closeRight"),
    key: "closeRight",
    icon: () => h(NIcon, null, { default: () => h(ArrowForwardOutline) }),
    disabled: isLastTab.value,
  },
]);

function handleUpdateValue(key: string | number): void {
  const k = String(key);
  if (k !== tabsStore.activeKey) {
    tabsStore.syncActive(k);
    router.push(k);
  }
}

function handleClose(key: string | number): void {
  const k = String(key);
  if (k === "/") return;
  tabsStore.closeTab(k);
  if (tabsStore.activeKey) router.push(tabsStore.activeKey);
  else router.push("/");
}

function handleTabClose(panelName: string | number): void {
  handleClose(panelName);
}

function handleContextMenu(e: MouseEvent, tab: { fullPath: string; pinned: boolean }): void {
  e.preventDefault();
  contextTab.value = tab;
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuVisible.value = true;
}

function handleMenuSelect(key: string): void {
  contextMenuVisible.value = false;
  const target = contextTab.value?.fullPath;
  if (!target) return;

  switch (key) {
    case "reload":
      tabsStore.reloadTab(target);
      break;
    case "close":
      if (target !== "/") {
        tabsStore.closeTab(target);
        if (tabsStore.activeKey) router.push(tabsStore.activeKey);
        else router.push("/");
      }
      break;
    case "closeOthers":
      tabsStore.closeOthers(target);
      break;
    case "closeLeft":
      tabsStore.closeLeft(target);
      break;
    case "closeRight":
      tabsStore.closeRight(target);
      break;
  }
}

function handleMenuClickoutside(): void {
  contextMenuVisible.value = false;
}

// Closable: not pinned and tabs > 1
function isClosable(tab: { pinned?: boolean }): boolean {
  return !tab.pinned && tabsStore.tabs.length > 1;
}
</script>

<template>
  <div class="app-tabs">
    <NTabs
      :value="tabsStore.activeKey"
      type="card"
      :closable="false"
      :tabs-padding="0"
      :on-update:value="handleUpdateValue"
      class="custom-tabs"
      style="
        --n-close-color-hover: var(--color-bg-tertiary);
        --n-close-color-pressed: var(--color-border);
        --n-close-icon-color-hover: var(--color-text);
      "
      @close="handleTabClose"
    >
      <NTab
        v-for="tab in tabsStore.tabs"
        :key="tab.fullPath"
        :name="tab.fullPath"
        :closable="isClosable(tab)"
        @contextmenu="handleContextMenu($event, tab)"
      >
        <div class="tab-inner">
          <svg
            v-if="tab.pinned"
            class="tab-pin"
            viewBox="0 0 12 12"
            width="10"
            height="10"
          >
            <path
              d="M8.5 1L11 3.5L7.5 7L8 10.5L6 12L1 7L0 2L2 0L8.5 1Z"
              fill="currentColor"
            />
          </svg>
          <span class="tab-name">{{ tab.title }}</span>
        </div>
      </NTab>
    </NTabs>

    <!-- 右键菜单 -->
    <NDropdown
      trigger="manual"
      :show="contextMenuVisible"
      :options="menuOptions"
      :x="contextMenuX"
      :y="contextMenuY"
      placement="bottom-start"
      @clickoutside="handleMenuClickoutside"
      @select="handleMenuSelect"
    />
  </div>
</template>

<style lang="less" scoped>
.app-tabs {
  --tabs-h: 38px;
  height: var(--tabs-h);
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  overflow: hidden; /* 绝对禁止任何内部滚动 */
  padding: 0 12px;
  background: transparent;
  :deep(.n-tabs-pad) {
    border-bottom: none !important;
  }
}

.app-tabs :deep(.custom-tabs) {
  height: 100%;
  flex: 1;
  min-width: 0;
}

/* Nav 容器 */
.app-tabs :deep(.custom-tabs .n-tabs-nav) {
  background: transparent !important;
}

.app-tabs :deep(.custom-tabs .n-tabs-rail) {
  padding: 0 !important;
  margin: 0 !important;
  height: 100% !important;
  box-sizing: border-box !important;
}

.app-tabs :deep(.custom-tabs .n-tabs-nav) {
  height: var(--tabs-h) !important;
}

.app-tabs :deep(.custom-tabs .n-tabs-nav__prefix),
.app-tabs :deep(.custom-tabs .n-tabs-nav__suffix) {
  flex-shrink: 0;
}

.app-tabs :deep(.custom-tabs .n-tabs-tab-wrapper) {
  margin: 0 !important;
}

/* 隐藏默认 tab 分隔符 */
.app-tabs :deep(.custom-tabs .n-tabs-tab-pad) {
  display: none !important;
}

/* ── 单个 Tab ── */
.app-tabs :deep(.custom-tabs .n-tabs-tab) {
  --radius-tab: 6px 6px 0 0;
  height: var(--tabs-h) !important;
  min-width: 72px;
  max-width: 180px;
  padding: 0 !important;
  margin: 0 0 0 2px !important;
  border-radius: var(--radius-tab) !important;
  border: 1px solid transparent !important;
  border-bottom: none !important;
  background: transparent !important;
  font-size: 13px;
  color: var(--color-text-secondary);
  position: relative;
  transition: color 0.15s ease, background-color 0.15s ease;
  box-sizing: border-box !important;
  overflow: hidden;
}

.app-tabs :deep(.custom-tabs .n-tabs-tab:hover) {
  background: var(--color-bg-tertiary) !important;
  color: var(--color-text);
}

.app-tabs :deep(.custom-tabs .n-tabs-tab--active) {
  position: relative;
  background: var(--color-bg-secondary) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text) !important;
  font-weight: 500;
}

.app-tabs :deep(.custom-tabs .n-tabs-tab--active::after) {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-bg-secondary);
}

.app-tabs :deep(.custom-tabs .n-tabs-tab--active .n-tabs-tab__close) {
  z-index: 1;
}

/* ── Tab 内容区 ── */
.tab-inner {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  height: 100%;
  min-width: 0;
}

.tab-pin {
  flex-shrink: 0;
  color: var(--color-primary);
  opacity: 0.7;
}

.tab-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 关闭按钮 ── */
.app-tabs :deep(.custom-tabs .n-tabs-tab__close) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  font-size: 14px !important;
  color: var(--color-text-tertiary) !important;
  border-radius: 3px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.app-tabs :deep(.custom-tabs .n-tabs-tab__close:hover) {
  color: var(--color-text) !important;
  background-color: transparent !important;
}

/* ── card 类型下的调整 ── */
.app-tabs :deep(.custom-tabs.n-tabs--card-type .n-tabs-tab) {
  padding: 0 !important;
  height: var(--tabs-h) !important;
}
.app-tabs :deep(.custom-tabs.n-tabs--card-type .n-tabs-tab-pad) {
  display: none !important;
}
.app-tabs :deep(.custom-tabs.n-tabs--card-type .n-tabs-tab--active) {
  border-bottom-color: var(--color-bg-secondary) !important;
}
</style>
