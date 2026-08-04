<script setup lang="ts">
defineOptions({ name: "juejin-article" });
import { ref, computed, onMounted, onUnmounted, watch, h, nextTick, createApp } from "vue";
import { openInIframe } from "@/composables/link/useExternalLink";
import {
  NButton,
  NText,
  NTag,
  NIcon,
  NSpin,
  NSkeleton,
  NDivider,
  NEmpty,
  NImageGroup,
  NBackTop,
  useMessage
} from "naive-ui";
import { ArrowBackOutline, BookmarkOutline, ListOutline, CopyOutline } from "@vicons/ionicons5";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "@/composables/i18n/useI18n";
import { getJuejinArticle, type JuejinArticle } from "@/services/juejin/juejinCache";
import { getJuejinArticleContent } from "@/services/juejin/juejinContent";
import { useBlogStore } from "@/stores/blog";
import { useLayout } from "@/composables/layout/useLayout";
import { useContentReflow } from "@/composables/editor/useContentReflow";
import OutlinePanel from "@/components/editor/OutlinePanel.vue";
import AppPage from "@/components/app/AppPage.vue";
import type { Component } from "vue";

const { sidebarCollapsed, sidebarWidth } = useLayout();
const _sidebarRef = ref(sidebarWidth.value);
watch(sidebarWidth, (w) => {
  _sidebarRef.value = w;
});

// 自适应内容宽度与对齐（掘金页 max-width 820px）
const contentReflow = useContentReflow(820);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const blogStore = useBlogStore();
const message = useMessage();

const articleId = computed(() => String(route.params.id));
const loading = ref(false);
const notFound = ref(false);
const article = ref<JuejinArticle | null>(null);
const saving = ref(false);

// 图片预览
const previewVisible = ref(false);
const previewImgs = ref<string[]>([]);
const previewIdx = ref(0);

// "回到顶部" 监听滚动容器 ref
const articlePageRef = ref<HTMLElement>();

// 代码复制
const copiedId = ref("");

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

// 将 Naive UI Icon 渲染为 SVG 字符串（预计算一次）
let iconSvg = "";
function ensureIconSvg(): string {
  if (iconSvg) return iconSvg;
  const tmp = document.createElement("div");
  tmp.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  document.body.appendChild(tmp);
  const app = createApp({ render: () => h(NIcon, { size: 14, component: CopyOutline }) });
  const host = document.createElement("span");
  tmp.appendChild(host);
  app.mount(host);
  iconSvg = host.innerHTML;
  app.unmount();
  document.body.removeChild(tmp);
  return iconSvg;
}

// 正文渲染完成后预制交互（图片预览 + 代码复制）
function setupContentInteractions(rootEl: HTMLElement | null): void {
  if (!rootEl) return;
  // 收集所有图片
  const imgs = Array.from(rootEl.querySelectorAll("img"));
  previewImgs.value = imgs.map((img) => img.src);
  imgs.forEach((img, i) => {
    img.style.cursor = "zoom-in";
    img.onclick = () => {
      previewIdx.value = i;
      previewVisible.value = true;
    };
  });

  // 为代码块添加复制按钮（仅当不存在时插入）
  const pres = Array.from(rootEl.querySelectorAll("pre"));
  pres.forEach((pre, idx) => {
    if (pre.querySelector(":scope > .code-copy-btn")) return;
    if (getComputedStyle(pre).position === "static") {
      pre.style.position = "relative";
    }
    const id = `jcode-${idx}-${(pre.textContent ?? "").length}`;
    const btn = document.createElement("button");
    btn.className = "code-copy-btn";
    btn.dataset.copiedId = id;
    btn.type = "button";
    btn.title = "复制代码";
    btn.innerHTML = ensureIconSvg();
    btn.onclick = (e) => {
      e.stopPropagation();
      copyCode(pre.textContent ?? "", id);
    };
    pre.appendChild(btn);
  });
}

// 复制代码块
async function copyCode(code: string, id: string): Promise<void> {
  let ok = false;
  try {
    await navigator.clipboard.writeText(code);
    ok = true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      ok = true;
    } catch {
      // ignore
    }
  }
  if (!ok) {
    message?.error?.("复制失败");
    return;
  }
  copiedId.value = id;
  const btn = document.querySelector(`button.code-copy-btn[data-copied-id="${id}"]`);
  if (btn) {
    btn.setAttribute("data-copied", "true");
    // 将对勾图标注入
    const svg = btn.querySelector("svg");
    if (svg) {
      svg.outerHTML = `<svg viewBox="0 0 512 512" width="14" height="14" fill="none" stroke="currentColor" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"><path d="M416 128L192 384l-96-96"/></svg>`;
    }
  }
  setTimeout(() => {
    copiedId.value = "";
    if (btn) {
      btn.removeAttribute("data-copied");
      const svg = btn.querySelector("svg");
      if (svg) svg.outerHTML = ensureIconSvg();
    }
  }, 1600);
}

// 大纲面板
const showOutline = ref(false);

// 提取文档标题结构
function extractHeadings(html: string): Array<{ level: number; text: string; id: string }> {
  if (!html) return [];
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headingsInDoc = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headingsInDoc.forEach((el, i) => {
    const level = parseInt(el.tagName[1]);
    const text = el.textContent?.trim() || `标题${i + 1}`;
    const id = `h-${i}`;
    headings.push({ level, text, id });
  });
  return headings;
}

// 清理掘金正文 HTML：移除不需要的元素
function sanitizeHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const removeSelectors = [
    "#sidebar-container",
    ".sidebar-container",
    ".toc-container",
    ".article-catalog",
    ".article-suspended-btns",
    ".article-catalog-block",
    ".sticky-block",
    ".article-end-block"
  ];
  removeSelectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => el.remove());
  });
  return doc.body.innerHTML;
}

const headings = computed(() => {
  if (!article.value?.web_html_content) return [];
  return extractHeadings(article.value.web_html_content);
});

function handleHeadingNavigate(id: string): void {
  const index = parseInt(id.replace("h-", ""));
  const headingEls = document.querySelectorAll(
    ".article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6"
  );
  const el = headingEls[index] as HTMLElement | undefined;
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function load(): Promise<void> {
  // 同一篇文章已加载完整 → 跳过（keep-alive 或 articleId 不变时避免重复请求）
  if (article.value?.article_id === articleId.value && article.value.web_html_content) {
    return;
  }

  loading.value = true;
  notFound.value = false;
  article.value = null;

  // 优先从缓存取元数据（列表页已注入），立即展示标题/作者/统计等
  const cached = getJuejinArticle(articleId.value);
  if (cached) {
    article.value = {
      ...cached,
      web_html_content: cached.web_html_content ? sanitizeHtml(cached.web_html_content) : ""
    };
    // 有完整正文缓存且已清理，直接返回
    if (cached.web_html_content) {
      loading.value = false;
      nextTick(() => {
        const el = document.querySelector(".article-content") as HTMLElement | null;
        setupContentInteractions(el);
      });
      return;
    }
  }

  // 缓存没有正文 → 抓取文章详情页解析
  try {
    const rawHtml = await getJuejinArticleContent(articleId.value);
    const html = sanitizeHtml(rawHtml || "");
    if (!html) {
      if (!article.value) notFound.value = true;
      loading.value = false;
      return;
    }
    if (article.value) {
      // 有缓存元数据 → 只补正文
      article.value.web_html_content = html;
    } else {
      // 没有缓存（直接打开详情页），用基本信息构造
      article.value = {
        article_id: articleId.value,
        title: document.title?.replace(/ - 掘金$/, "") || "无标题",
        brief_content: "",
        web_html_content: html,
        cover_image: "",
        view_count: 0,
        digg_count: 0,
        comment_count: 0,
        user_name: "",
        tags: []
      };
    }
    nextTick(() => {
      const el = document.querySelector(".article-content") as HTMLElement | null;
      setupContentInteractions(el);
    });
  } catch {
    if (!article.value) notFound.value = true;
  } finally {
    loading.value = false;
  }
}

function goBack(): void {
  if (window.history.length > 1) router.back();
  else router.push("/juejin");
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  return String(n);
}

function openOriginalArticle(id: string): void {
  openInIframe(`https://juejin.cn/post/${id}`, "掘金原文");
}

// 保存为本地文章（标注来源掘金）
async function saveAsLocalArticle(): Promise<void> {
  if (!article.value) return;
  saving.value = true;
  try {
    const sourceUrl = `https://juejin.cn/post/${article.value.article_id}`;
    const summary = article.value.brief_content || "";
    const fromLine = `\n\n---\n> 来源：[掘金 · ${article.value.user_name || "掘金作者"}](${sourceUrl})`;
    await blogStore.createArticle({
      title: article.value.title,
      summary: summary + fromLine,
      content: article.value.web_html_content || "",
      tags: ["掘金", ...(article.value.tags.map((tg) => tg.tag_name) || [])]
    });
    message.success("已保存到本地草稿");
  } catch {
    message.error("保存失败");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  load();
  nextTick(() => contentReflow.start());
});
// watch(articleId, load)
</script>

<template>
  <AppPage>
    <div
      ref="articlePageRef"
      class="juejin-article"
      :style="{
        '--content-ml': 'auto',
        '--content-mr': contentReflow.align.value === 'right' ? '0' : 'auto'
      }"
    >
      <!-- 大纲浮动按钮 -->
      <button
        v-if="sidebarCollapsed && headings.length > 0"
        class="outline-float-btn"
        @click="showOutline = !showOutline"
        :style="{ left: _sidebarRef + 12 + 'px' }"
        :title="showOutline ? '隐藏大纲' : '打开大纲'"
      >
        <NIcon :size="18"><ListOutline /></NIcon>
      </button>

      <!-- 大纲面板 -->
      <OutlinePanel
        :visible="showOutline"
        :headings="headings"
        :sidebar-width="_sidebarRef"
        @close="showOutline = false"
        @navigate="handleHeadingNavigate"
      />

      <div class="article-actions">
        <NButton tertiary size="small" :render-icon="renderIcon(ArrowBackOutline)" @click="goBack">
          {{ t("nav.back") }}
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
          <NButton size="small" @click="goBack">{{ t("nav.back") }}</NButton>
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

        <n-image-group
          v-if="article.web_html_content"
          v-model:show="previewVisible"
          v-model:current="previewIdx"
          :src-list="previewImgs"
          :show-toolbar="true"
          style="display: contents"
        >
          <div class="article-content" v-html="article.web_html_content"></div>
        </n-image-group>
        <div v-else class="article-preview">
          <p class="preview-brief">{{ article.brief_content || "（暂无正文预览）" }}</p>
          <NButton type="primary" size="small" @click="openOriginalArticle(article.article_id)">
            在掘金查看原文 ↗
          </NButton>
        </div>
      </div>

      <!-- NImageGroup 会渲染预览，无需额外 DOM -->
    </div>
  </AppPage>
</template>

<style lang="less" scoped>
.juejin-article {
  max-width: 920px;
  margin-left: var(--content-ml, auto);
  margin-right: var(--content-mr, auto);
}

.outline-float-btn {
  position: fixed;
  top: 72px;
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
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);

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
    transition:
      background var(--transition-fast),
      color var(--transition-fast);
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

/* 正文内部：让复制按钮 hover 显示 */
.article-content {
  :deep(pre) {
    border-radius: 8px;

    &:hover .code-copy-btn {
      opacity: 1;
    }
  }

  :deep(.code-copy-btn) {
    position: absolute;
    top: 8px;
    right: 8px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.92);
    color: #4b5563;
    font-size: 12px;
    font-family: var(--font-sans);
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 0.2s,
      background 0.2s,
      color 0.2s,
      border-color 0.2s;
    z-index: 2;
    backdrop-filter: blur(4px);

    svg {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
    }

    &[data-copied="true"] {
      color: #18a058;
      border-color: #18a058;
      background: rgba(24, 160, 88, 0.12);
    }

    &:hover {
      background: #fff;
      color: #1f2937;
    }
  }
}
</style>
