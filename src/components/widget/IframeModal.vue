<script setup lang="ts">
import { NIcon, NButton } from 'naive-ui'
import { CloseOutline, RefreshOutline, OpenOutline } from '@vicons/ionicons5'
import { ref } from 'vue'
import { useExternalLink } from '@/composables/link/useExternalLink'

const { visible, url, title, close } = useExternalLink()
const iframeKey = ref(0)

function reload(): void {
  iframeKey.value++
}

function openInNewTab(): void {
  window.open(url.value, '_blank', 'noopener')
}
</script>

<template>
  <Transition name="iframe-modal">
    <div v-if="visible" class="iframe-overlay" @click.self="close">
      <div class="iframe-container">
        <header class="iframe-header">
          <span class="iframe-title">{{ title }}</span>
          <div class="iframe-actions">
            <NButton quaternary size="small" @click="reload" title="刷新">
              <template #icon><NIcon :component="RefreshOutline" /></template>
            </NButton>
            <NButton quaternary size="small" @click="openInNewTab" title="新标签页打开">
              <template #icon><NIcon :component="OpenOutline" /></template>
            </NButton>
            <NButton quaternary size="small" @click="close" title="关闭">
              <template #icon><NIcon :component="CloseOutline" /></template>
            </NButton>
          </div>
        </header>
        <div class="iframe-body">
          <iframe
            :key="iframeKey"
            :src="url"
            class="iframe-frame"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerpolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.iframe-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.iframe-container {
  width: 92vw;
  height: 90vh;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.iframe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6em 1em;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

.iframe-title {
  font-size: 13px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.iframe-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.iframe-body {
  flex: 1;
  position: relative;
  background: #fff;
}

.iframe-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* transition */
.iframe-modal-enter-active,
.iframe-modal-leave-active {
  transition: opacity 0.2s ease;
}
.iframe-modal-enter-from,
.iframe-modal-leave-to {
  opacity: 0;
}
</style>
