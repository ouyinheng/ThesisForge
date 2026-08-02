<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton,
  NH1,
  NText,
  NTag,
  NDivider,
  NSpin,
  NDropdown,
  type DropdownOption,
} from 'naive-ui'
import {
  ArrowBackOutline,
  PencilOutline,
  TrashOutline,
  DownloadOutline,
  DocumentTextOutline,
  ImageOutline,
  DocumentOutline,
  ListOutline,
} from '@vicons/ionicons5'
import { h, type Component } from 'vue'
import { NIcon } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useBlogStore } from '@/stores/blog'
import { useSettingsStore } from '@/stores/settings'
import { useLayout } from '@/composables/useLayout'
import OutlinePanel from '@/components/OutlinePanel.vue'
import { exportToMarkdown, exportToImage, exportToPDF } from '@/services/exporter'
import type { Article } from '@/types'

// 提取文档标题结构
function extractHeadings(html: string): Array<{ level: number; text: string; id: string }> {
  if (!html) return []
  const headings: Array<{ level: number; text: string; id: string }> = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headingsInDoc = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headingsInDoc.forEach((el, i) => {
    const level = parseInt(el.tagName[1])
    const text = el.textContent?.trim() || `标题${i + 1}`
    const id = `h-${i}`
    headings.push({ level, text, id })
  })
  return headings
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()
const settingsStore = useSettingsStore()

const article = ref<Article | null>(null)
const loading = ref<boolean>(true)
const exporting = ref<boolean>(false)
const showOutline = ref<boolean>(false)

const { currentLayout } = useLayout()
const articleId = computed(() => String(route.params.id))

// 文档大纲
const headings = computed(() => {
  if (!article.value?.content) return []
  return extractHeadings(article.value.content)
})

// 在侧边栏模式下的大纲面板可见性
const sidebarCollapsed = computed(() => currentLayout.value === 'sidebar')

function handleHeadingNavigate(id: string): void {
  // 由于内容通过 v-html 渲染，需要找到对应的标题并滚动过去
  const index = parseInt(id.replace('h-', ''))
  const headingEls = document.querySelectorAll('.article-body h1, .article-body h2, .article-body h3, .article-body h4, .article-body h5, .article-body h6')
  const el = headingEls[index] as HTMLElement | undefined
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const loc = settingsStore.locale === 'zh' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' })
}

function goBack(): void {
  router.back()
}

function goEdit(): void {
  if (article.value) router.push(`/editor/${article.value.id}`)
}

async function handleDelete(): Promise<void> {
  if (!article.value) return
  if (confirm(t('article.confirmDelete'))) {
    await blogStore.deleteArticle(article.value.id)
    router.push('/')
  }
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 导出下拉菜单
const exportOptions = computed<DropdownOption[]>(() => [
  {
    label: t('article.exportMarkdown'),
    key: 'markdown',
    icon: renderIcon(DocumentTextOutline),
  },
  {
    label: t('article.exportImage'),
    key: 'image',
    icon: renderIcon(ImageOutline),
  },
  {
    label: t('article.exportPDF'),
    key: 'pdf',
    icon: renderIcon(DocumentOutline),
  },
])

async function handleExportSelect(key: string | number): Promise<void> {
  if (!article.value) return
  exporting.value = true
  try {
    const title = article.value.title
    if (key === 'markdown') {
      const md = exportToMarkdown(article.value)
      downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${slugify(title)}.md`)
    } else if (key === 'image') {
      const target = document.querySelector('.export-target') as HTMLElement
      if (!target) return
      const blob = await exportToImage(target, title)
      downloadBlob(blob, `${slugify(title)}.png`)
    } else if (key === 'pdf') {
      const target = document.querySelector('.export-target') as HTMLElement
      if (!target) return
      const blob = await exportToPDF(target, title)
      downloadBlob(blob, `${slugify(title)}.pdf`)
    }
  } finally {
    exporting.value = false
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^\w一-龥]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'paperblog'
  )
}

onMounted(async () => {
  try {
    article.value = await blogStore.getArticleById(articleId.value)
  } finally {
    loading.value = false
  }
  if (!article.value) {
    router.push('/')
  }
})
</script>

<template>
  <div class="article-page" v-if="article && !loading">
    <!-- 浮动大纲切换按钮（侧边栏模式显示）-->
    <button
      class="outline-float-btn"
      v-if="sidebarCollapsed && headings.length > 0"
      @click="showOutline = !showOutline"
      :title="showOutline ? '隐藏大纲' : '打开大纲'"
    >
      <NIcon :size="18"><ListOutline /></NIcon>
    </button>

    <!-- 大纲面板 -->
    <OutlinePanel
      :visible="showOutline && sidebarCollapsed"
      :headings="headings"
      @close="showOutline = false"
      @navigate="handleHeadingNavigate"
    />

    <div class="article-actions">
      <NButton
        tertiary
        size="small"
        :render-icon="renderIcon(ArrowBackOutline)"
        @click="goBack"
      >
        {{ t('nav.back') }}
      </NButton>
      <div class="action-group">
        <NDropdown
          :options="exportOptions"
          trigger="click"
          @select="handleExportSelect"
        >
          <NButton
            tertiary
            size="small"
            :loading="exporting"
            :render-icon="renderIcon(DownloadOutline)"
          >
            {{ t('article.export') }}
          </NButton>
        </NDropdown>
        <NButton
          tertiary
          size="small"
          :render-icon="renderIcon(PencilOutline)"
          @click="goEdit"
        >
          {{ t('article.edit') }}
        </NButton>
        <NButton
          tertiary
          size="small"
          :render-icon="renderIcon(TrashOutline)"
          @click="handleDelete"
          class="delete-btn"
        >
          {{ t('article.delete') }}
        </NButton>
      </div>
    </div>

    <div class="export-target">
      <header class="article-header">
        <NH1 class="article-title">{{ article.title }}</NH1>
        <div class="article-meta">
          <NText depth="3">{{ formatDate(article.createdAt) }}</NText>
          <NText depth="3" class="meta-dot">·</NText>
          <NText depth="3"
            >{{ blogStore.getReadTime(article.content) }} {{ t('article.readTime') }}</NText
          >
        </div>
        <NTag
          v-for="tag in article.tags"
          :key="tag"
          size="small"
          :bordered="false"
          class="article-tag"
        >
          {{ tag }}
        </NTag>
      </header>

      <div class="article-summary-block" v-if="article.summary">
        <NText depth="2">{{ article.summary }}</NText>
      </div>

      <NDivider />

      <div class="article-body article-content" v-html="article.content"></div>
    </div>
  </div>

  <div class="article-loading" v-else-if="loading">
    <NSpin size="large" />
  </div>
</template>

<style lang="less" scoped>
.outline-float-btn {
  position: fixed;
  top: 56px;
  left: 68px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-sm);
  z-index: 48;
  transition: background var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast), left 0.2s;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
    box-shadow: var(--shadow-md);
  }
}

.app-main.sidebar-collapsed ~ .article-page .outline-float-btn {
  left: 68px;
}

.article-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sp-5);

  :deep(.n-button) {
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast), color var(--transition-fast);
  }
}

.action-group {
  display: flex;
  gap: 0.3em;
  flex-wrap: wrap;
}

.delete-btn {
  &:hover {
    color: #dc2626 !important;
    background: var(--color-quote-bg) !important;
  }
}

.article-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.export-target {
  padding: var(--sp-7) var(--sp-6);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.article-header {
  margin-bottom: var(--sp-5);
}

.article-title {
  font-family: var(--font-serif) !important;
  font-size: var(--fs-2xl);
  line-height: 1.25;
  letter-spacing: -0.01em;
  margin-bottom: 0.5em !important;
  color: var(--color-text);
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 0;
  font-size: var(--fs-sm);
  color: var(--color-text-tertiary);
  margin-bottom: 0.6em;
}

.meta-dot {
  margin: 0 0.4em;
}

.article-tag {
  margin-right: 6px;
  margin-top: 0.3em;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
}

.article-summary-block {
  border-left: 3px solid var(--color-primary);
  padding: 0.7em 1.2em;
  background: var(--color-quote-bg);
  margin-bottom: var(--sp-5);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-style: italic;
  color: var(--color-text-secondary);
}

.article-body {
  margin-bottom: 3em;
}
</style>
