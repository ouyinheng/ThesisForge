<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import {
  NButton,
  NText,
  NTag,
  NIcon,
  NSpin,
  NSkeleton,
  NDivider,
  NEmpty,
  useMessage,
} from 'naive-ui'
import {
  ArrowBackOutline,
  BookmarkOutline,
  ListOutline,
} from '@vicons/ionicons5'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { getJuejinArticle, type JuejinArticle } from '@/services/juejinCache'
import { getJuejinArticleContent } from '@/services/juejinContent'
import { useBlogStore } from '@/stores/blog'
import OutlinePanel from '@/components/OutlinePanel.vue'
import type { Component } from 'vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()
const message = useMessage()

const articleId = computed(() => String(route.params.id))
const loading = ref(false)
const notFound = ref(false)
const article = ref<JuejinArticle | null>(null)
const saving = ref(false)

// 大纲面板
const showOutline = ref(false)

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

// 清理掘金正文 HTML：移除不需要的元素
function sanitizeHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const removeSelectors = [
    '#sidebar-container',
    '.sidebar-container',
    '.toc-container',
    '.article-catalog',
    '.article-suspended-btns',
    '.article-catalog-block',
    '.sticky-block',
    '.article-end-block',
  ]
  removeSelectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => el.remove())
  })
  return doc.body.innerHTML
}

const headings = computed(() => {
  if (!article.value?.web_html_content) return []
  return extractHeadings(article.value.web_html_content)
})

function handleHeadingNavigate(id: string): void {
  const index = parseInt(id.replace('h-', ''))
  const headingEls = document.querySelectorAll(
    '.article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6'
  )
  const el = headingEls[index] as HTMLElement | undefined
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

async function load(): Promise<void> {
  loading.value = true
  notFound.value = false
  article.value = null

  // 优先从缓存取元数据（列表页已注入），立即展示标题/作者/统计等
  const cached = getJuejinArticle(articleId.value)
  if (cached) {
    article.value = {
      ...cached,
      web_html_content: cached.web_html_content ? sanitizeHtml(cached.web_html_content) : '',
    }
    // 有完整正文缓存且已清理，直接返回
    if (cached.web_html_content) {
      loading.value = false
      return
    }
  }

  // 缓存没有正文 → 抓取文章详情页解析
  try {
    const rawHtml = await getJuejinArticleContent(articleId.value)
    const html = sanitizeHtml(rawHtml || '')
    if (!html) {
      if (!article.value) notFound.value = true
      loading.value = false
      return
    }
    if (article.value) {
      // 有缓存元数据 → 只补正文
      article.value.web_html_content = html
    } else {
      // 没有缓存（直接打开详情页），用基本信息构造
      article.value = {
        article_id: articleId.value,
        title: document.title?.replace(/ - 掘金$/, '') || '无标题',
        brief_content: '',
        web_html_content: html,
        cover_image: '',
        view_count: 0,
        digg_count: 0,
        comment_count: 0,
        user_name: '',
        tags: [],
      }
    }
  } catch {
    if (!article.value) notFound.value = true
  } finally {
    loading.value = false
  }
}

function goBack(): void {
  if (window.history.length > 1) router.back()
  else router.push('/juejin')
}

function goEditSaved(id: string): void {
  router.push(`/editor/${id}`)
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  return String(n)
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 保存为本地文章（标注来源掘金）
async function saveAsLocalArticle(): Promise<void> {
  if (!article.value) return
  saving.value = true
  try {
    const sourceUrl = `https://juejin.cn/post/${article.value.article_id}`
    const summary = article.value.brief_content || ''
    const fromLine = `\n\n---\n> 来源：[掘金 · ${article.value.user_name || '掘金作者'}](${sourceUrl})`
    const saved = await blogStore.createArticle({
      title: article.value.title,
      summary: summary + fromLine,
      content: article.value.web_html_content || '',
      tags: ['掘金', ...(article.value.tags.map((tg) => tg.tag_name) || [])],
    })
    message.success('已保存到本地草稿')
    setTimeout(() => goEditSaved(saved.id), 300)
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
watch(articleId, load)
</script>

<template>
  <div class="juejin-article">
    <!-- 大纲浮动按钮 -->
    <button
      v-if="headings.length > 0"
      class="outline-float-btn"
      @click="showOutline = !showOutline"
      :title="showOutline ? '隐藏大纲' : '打开大纲'"
    >
      <NIcon :size="18"><ListOutline /></NIcon>
    </button>

    <!-- 大纲面板 -->
    <OutlinePanel
      :visible="showOutline"
      :headings="headings"
      @close="showOutline = false"
      @navigate="handleHeadingNavigate"
    />

    <div class="article-actions">
      <NButton tertiary size="small" :render-icon="renderIcon(ArrowBackOutline)" @click="goBack">
        {{ t('nav.back') }}
      </NButton>
      <div class="action-group">
        <NButton
          tertiary
          size="small"
          :loading="saving"
          :render-icon="renderIcon(BookmarkOutline)"
          @click="saveAsLocalArticle"
          class="save-btn"
        >
          保存
        </NButton>
      </div>
    </div>

    <!-- 加载中（只在完全没有缓存时显示整页 spin）-->
    <div v-if="loading && !article" class="article-loading">
      <NSpin size="large" />
    </div>

    <NEmpty v-else-if="notFound && !article" :description="'内容加载失败，请返回列表查看'">
      <template #extra>
        <NButton size="small" @click="goBack">{{ t('nav.back') }}</NButton>
      </template>
    </NEmpty>

    <div v-else-if="article" class="article-card">
      <header class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <NText depth="3" v-if="article.user_name">{{ article.user_name }}</NText>
          <NText depth="3" v-if="article.user_name" class="meta-dot">·</NText>
          <NText depth="3">
            {{ formatCount(article.view_count) }} 阅读 · {{ formatCount(article.digg_count) }} 赞
          </NText>
        </div>
        <div class="article-tags" v-if="article.tags.length">
          <NTag
            v-for="tag in article.tags"
            :key="tag.tag_name"
            size="small"
            :bordered="false"
            class="article-tag"
          >
            {{ tag.tag_name }}
          </NTag>
        </div>
      </header>

      <NDivider />

      <!-- 正文加载中骨架（有缓存元数据但正文在抓取中）-->
      <div v-if="loading && !article.web_html_content" class="content-loading">
        <NSkeleton height="20px" width="80%" :sharp="false" />
        <NSkeleton height="16px" width="90%" :sharp="false" />
        <NSkeleton height="16px" width="60%" :sharp="false" />
      </div>

      <div v-else-if="article.web_html_content" class="article-content" v-html="article.web_html_content"></div>
      <div v-else class="article-preview">
        <p class="preview-brief">{{ article.brief_content || '（暂无正文预览）' }}</p>
        <NButton
          type="primary"
          size="small"
          @click="window.open('https://juejin.cn/post/' + article.article_id, '_blank', 'noopener')"
        >
          在掘金查看原文 ↗
        </NButton>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.juejin-article {
  max-width: 820px;
  margin: 0 auto;
}

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
  transition: background var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
    box-shadow: var(--shadow-md);
  }
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
}

.article-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.content-loading {
  display: flex;
  flex-direction: column;
  gap: 0.8em;
  padding: 1em 0;
}

.article-card {
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

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.article-tag {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
}

.article-preview {
  display: flex;
  flex-direction: column;
  gap: 1.2em;
  align-items: flex-start;
}

.preview-brief {
  font-size: var(--fs-base);
  line-height: 1.8;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
}
</style>
