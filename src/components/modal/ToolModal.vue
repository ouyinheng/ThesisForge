<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NCard, NTabs, NTabPane, NInput, NButton, NSpace, NDivider, NTooltip, useMessage } from 'naive-ui'
import { renderMiniMarkdown } from '@/utils/mini-markdown'
import { useI18n } from '@/composables/i18n/useI18n'
import { CopyOutline, DownloadOutline, RefreshOutline } from '@vicons/ionicons5'

const { t } = useI18n()
const message = useMessage()

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()

// ---- Markdown 状态 ----
const mdInput = ref(`# 工具箱欢迎使用

这是一个**实时 Markdown 预览**工具。支持以下语法：

## 基础语法

- **粗体文本**
- *斜体文本*
- ~~删除线~~
- \`行内代码\`

## 列表示例

1. 有序列表第一项
2. 有序列表第二项
3. 第三项

- 无序列表 A
- 无序列表 B

## 引用

> 知识就是力量。 —— 培根

## 代码块

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`
}
console.log(greet('World'))
\`\`\`

## 链接

[Open-Meteo 天气 API](https://open-meteo.com)
`)

const mdHtml = computed(() => renderMiniMarkdown(mdInput.value))

// 复制 HTML
function copyHtml() {
  navigator.clipboard.writeText(mdHtml.value).then(() => {
    message.success(t('tools.copied'))
  })
}

// 复制 Markdown 原文
function copyMd() {
  navigator.clipboard.writeText(mdInput.value).then(() => {
    message.success(t('tools.copied'))
  })
}

// 下载为 .md 文件
function downloadMd() {
  const blob = new Blob([mdInput.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `document-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(url)
  message.success(t('tools.downloaded'))
}

function close() {
  emit('update:show', false)
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    :style="{ width: '900px', maxWidth: '95vw' }"
    :title="t('tools.markdown.title')"
    :bordered="false"
    @update:show="emit('update:show', $event)"
    @close="close"
  >
    <n-tabs type="line" animated>
      <n-tab-pane name="edit" :tab="t('tools.markdown.edit')">
        <n-space vertical>
          <n-input
            v-model:value="mdInput"
            type="textarea"
            :placeholder="t('tools.markdown.placeholder')"
            :autosize="{ minRows: 14, maxRows: 24 }"
            style="font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace; font-size: var(--fs-sm)"
          />
        </n-space>
      </n-tab-pane>

      <n-tab-pane name="preview" :tab="t('tools.markdown.preview')">
        <div class="md-preview" v-html="mdHtml"></div>
      </n-tab-pane>
    </n-tabs>

    <template #footer>
      <n-space justify="space-between">
        <n-space>
          <n-tooltip>
            <template #trigger>
              <n-button size="small" @click="copyMd">
                <template #icon><n-icon :component="CopyOutline" /></template>
                {{ t('tools.copyMd') }}
              </n-button>
            </template>
            {{ t('tools.copyMdTip') }}
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button size="small" @click="copyHtml">
                <template #icon><n-icon :component="CopyOutline" /></template>
                {{ t('tools.copyHtml') }}
              </n-button>
            </template>
            {{ t('tools.copyHtmlTip') }}
          </n-tooltip>
        </n-space>
        <n-button size="small" secondary @click="downloadMd">
          <template #icon><n-icon :component="DownloadOutline" /></template>
          {{ t('tools.download') }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.md-preview {
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  padding: 8px 4px;
  line-height: 1.75;
  font-size: var(--fs-base);
}
.md-preview :deep(h1) { font-size: 1.6em; font-weight: 700; margin: 0.8em 0 0.4em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
.md-preview :deep(h2) { font-size: 1.35em; font-weight: 600; margin: 0.8em 0 0.4em; }
.md-preview :deep(h3) { font-size: 1.2em; font-weight: 600; margin: 0.6em 0 0.3em; }
.md-preview :deep(ul), .md-preview :deep(ol) { padding-left: 1.5em; margin: 0.5em 0; }
.md-preview :deep(li) { margin: 0.2em 0; }
.md-preview :deep(blockquote) { border-left: 3px solid #d12f2f; padding: 0.2em 1em; margin: 0.6em 0; color: #555; }
.md-preview :deep(code) { background: #f3f4f6; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
.md-preview :deep(pre) { background: #1e1e1e; color: #d4d4d4; padding: 12px 16px; border-radius: 6px; overflow-x: auto; margin: 0.6em 0; }
.md-preview :deep(pre code) { background: none; color: inherit; padding: 0; }
.md-preview :deep(a) { color: #d12f2f; text-decoration: none; }
.md-preview :deep(a:hover) { text-decoration: underline; }
.md-preview :deep(img) { max-width: 100%; border-radius: 4px; }
.md-preview :deep(hr) { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
</style>
