<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NIcon, NText, NScrollbar } from 'naive-ui'
import { ListOutline, ChevronBackOutline } from '@vicons/ionicons5'
import { h, type Component } from 'vue'
import { useI18n } from '@/composables/i18n/useI18n'

const props = defineProps<{
  visible: boolean
  headings: Array<{ level: number; text: string; id: string }>
  sidebarWidth?: number
}>()

const _sidebarW = computed(() => props.sidebarWidth ?? 64)

const emit = defineEmits<{
  close: []
  navigate: [id: string]
}>()

const { t } = useI18n()

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function handleNav(id: string): void {
  emit('navigate', id)
}

function handleClose(): void {
  emit('close')
}

const indentMap: Record<number, string> = {
  1: '0',
  2: '0.4em',
  3: '0.8em',
  4: '1.2em',
  5: '1.6em',
  6: '2em',
}
</script>

<template>
  <div class="outline-panel" :class="{ visible }" :style="{ left: (_sidebarW + 12) + 'px' }">
    <div class="outline-header">
      <NButton quaternary size="small" :render-icon="renderIcon(ListOutline)" disabled>
        大纲
      </NButton>
      <NButton quaternary circle size="small" class="outline-toggle" :class="{ collapsed: !visible }" @click="handleClose">
        <NIcon :size="14"><ChevronBackOutline /></NIcon>
      </NButton>
    </div>
    <NScrollbar class="outline-content">
      <button
        v-for="(h, idx) in headings"
        :key="h.id"
        class="outline-item"
        :style="{ textIndent: indentMap[h.level] || '0.8em', '--i': idx }"
        :title="h.text"
        @click="handleNav(h.id)"
      >
        <NText depth="2">{{ h.text }}</NText>
      </button>
      <div v-if="!headings.length" class="outline-empty">
        <NText depth="3">无标题结构</NText>
      </div>
    </NScrollbar>
  </div>
</template>

<style lang="less" scoped>
.outline-panel {
  position: fixed;
  top: 60px;
  width: 200px;
  height: calc(100vh - 60px);
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  z-index: 49;
  display: flex;
  flex-direction: column;
  padding: 1.2em 0.8em 1.5em;
  transform: translateX(-100%);
  opacity: 0;
  transition: transform 0.25s ease, opacity 0.25s ease;
  pointer-events: none;
}

.outline-panel.visible {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.8em;
  padding: 0 0.2em;
}

/* 收起按钮：图标随面板状态旋转，体现展开/收起 */
.outline-toggle {
  transition: transform 0.25s ease;
}
.outline-toggle.collapsed {
  transform: rotate(180deg);
}

.outline-content {
  flex: 1;
  overflow-y: auto;
}

.outline-item {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: var(--fs-sm);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s, color 0.15s;

  /* 展开时逐项淡入上移 */
  opacity: 0;
  transform: translateX(-6px);
}

.outline-panel.visible .outline-item {
  animation: outline-item-in 0.28s ease forwards;
  animation-delay: calc(0.06s * var(--i, 0));
}

@keyframes outline-item-in {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.outline-empty {
  padding: 1em;
  text-align: center;
}
</style>
