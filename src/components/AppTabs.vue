<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NDropdown, NTag, NIcon } from 'naive-ui'
import { CloseOutline, RefreshOutline, CloseCircleOutline, ArrowBackOutline, ArrowForwardOutline } from '@vicons/ionicons5'
import { useTabsStore } from '@/stores/tabs'
import { useRouter } from 'vue-router'

const tabs = useTabsStore()
const router = useRouter()

const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextTab = ref('')

const menuOptions = computed(() => [
  {
    label: '刷新当前页',
    key: 'refresh',
    icon: () => h(NIcon, null, { default: () => h(RefreshOutline) }),
  },
  {
    label: '关闭当前页',
    key: 'close',
    icon: () => h(NIcon, null, { default: () => h(CloseOutline) }),
  },
  { type: 'divider' as const },
  {
    label: '关闭其他页',
    key: 'closeOthers',
    icon: () => h(NIcon, null, { default: () => h(CloseCircleOutline) }),
  },
  {
    label: '关闭左侧',
    key: 'closeLeft',
    icon: () => h(NIcon, null, { default: () => h(ArrowBackOutline) }),
  },
  {
    label: '关闭右侧',
    key: 'closeRight',
    icon: () => h(NIcon, null, { default: () => h(ArrowForwardOutline) }),
  },
])

function handleTabClick(fullPath: string): void {
  if (fullPath !== tabs.activeKey) {
    tabs.syncActive(fullPath)
    router.push(fullPath)
  }
}

function handleClose(e: MouseEvent, fullPath: string): void {
  e.stopPropagation()
  tabs.closeTab(fullPath)
  if (tabs.activeKey) {
    router.push(tabs.activeKey)
  } else {
    router.push('/')
  }
}

function handleContextMenu(e: MouseEvent, fullPath: string): void {
  e.preventDefault()
  contextTab.value = fullPath
  contextMenuX.value = e.clientX
  contextMenuY.value = e.clientY
  contextMenuVisible.value = true
}

function handleMenuSelect(key: string): void {
  contextMenuVisible.value = false
  const target = contextTab.value
  if (!target) return

  switch (key) {
    case 'refresh':
      // 刷新：通过 key 变化强制重建缓存组件
      refreshTab(target)
      break
    case 'close':
      tabs.closeTab(target)
      if (tabs.activeKey) router.push(tabs.activeKey)
      else router.push('/')
      break
    case 'closeOthers':
      tabs.closeOthers(target)
      break
    case 'closeLeft':
      tabs.closeLeft(target)
      break
    case 'closeRight':
      tabs.closeRight(target)
      break
  }
}

// cache-busting map for refresh
const refreshKey = ref<Record<string, number>>({})
function refreshTab(fullPath: string): void {
  refreshKey.value[fullPath] = (refreshKey.value[fullPath] || 0) + 1
}

function getComponentKey(fullPath: string): string {
  return `${fullPath}@${refreshKey.value[fullPath] || 0}`
}

function handleMenuClickoutside(): void {
  contextMenuVisible.value = false
}
</script>

<template>
  <div class="app-tabs">
    <div class="tabs-list">
      <div
        v-for="tab in tabs.tabs"
        :key="tab.fullPath"
        class="tab-item"
        :class="{ active: tabs.activeKey === tab.fullPath }"
        @click="handleTabClick(tab.fullPath)"
        @contextmenu="handleContextMenu($event, tab.fullPath)"
      >
        <span class="tab-title">{{ tab.title }}</span>
        <button
          v-if="tabs.tabs.length > 1"
          class="tab-close"
          @click="handleClose($event, tab.fullPath)"
          title="关闭"
        >
          <n-icon :size="11"><CloseOutline /></n-icon>
        </button>
      </div>
    </div>

    <!-- 右键菜单 -->
    <n-dropdown
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

<style scoped>
.app-tabs {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  height: 36px;
  flex-shrink: 0;
  scrollbar-width: none;
}
.app-tabs::-webkit-scrollbar { display: none; }

.tabs-list {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 0 1em;
  min-height: 100%;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  user-select: none;
  white-space: nowrap;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.tab-item:hover {
  color: var(--color-text);
}
.tab-item.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 500;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast), background var(--transition-fast);
}
.tab-item:hover .tab-close { opacity: 1; }
.tab-close:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}
</style>
