<script setup lang="ts">
defineOptions({ name: "article" });
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import {
  NButton,
  NH1,
  NText,
  NTag,
  NDivider,
  NSpin,
  NDropdown,
  NBackTop,
  NImageGroup,
  type DropdownOption
} from "naive-ui";
import {
  ArrowBackOutline,
  PencilOutline,
  TrashOutline,
  DownloadOutline,
  DocumentTextOutline,
  ImageOutline,
  DocumentOutline,
  ListOutline
} from "@vicons/ionicons5";
import { h, type Component } from "vue";
import { NIcon } from "naive-ui";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "@/composables/i18n/useI18n";
import { useBlogStore } from "@/stores/blog";
import { useSettingsStore } from "@/stores/settings";
import { useLayout } from "@/composables/layout/useLayout";
import { useContentReflow } from "@/composables/editor/useContentReflow";
import OutlinePanel from "@/components/editor/OutlinePanel.vue";
import AppPage from "@/components/app/AppPage.vue";
import { exportToMarkdown, exportToImage, exportToPDF, exportToHTML } from "@/services/exporter";
import type { Article } from "@/types";

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

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const blogStore = useBlogStore();
const settingsStore = useSettingsStore();

const article = ref<Article | null>(null);
const loading = ref<boolean>(true);
const exporting = ref<boolean>(false);
const showOutline = ref<boolean>(false);

// 图片预览
const previewVisible = ref(false);
const previewImgs = ref<string[]>([]);
const previewIdx = ref(0);

const { sidebarWidth, sidebarCollapsed } = useLayout();
const _sidebarRef = ref(sidebarWidth.value);
watch(sidebarWidth, (w) => {
  _sidebarRef.value = w;
});

// 自适应内容宽度与对齐
const contentReflow = useContentReflow(1100);

const articleId = computed(() => String(route.params.id));

// 文档大纲
const headings = computed(() => {
  if (!article.value?.content) return [];
  return extractHeadings(article.value.content);
});

function handleHeadingNavigate(id: string): void {
  // 由于内容通过 v-html 渲染，需要找到对应的标题并滚动过去
  const index = parseInt(id.replace("h-", ""));
  const headingEls = document.querySelectorAll(
    ".article-body h1, .article-body h2, .article-body h3, .article-body h4, .article-body h5, .article-body h6"
  );
  const el = headingEls[index] as HTMLElement | undefined;
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const loc = settingsStore.locale === "zh" ? "zh-CN" : "en-US";
  return date.toLocaleDateString(loc, { year: "numeric", month: "long", day: "numeric" });
}

function goBack(): void {
  router.back();
}

function goEdit(): void {
  if (article.value) router.push(`/editor/${article.value.id}`);
}

async function handleDelete(): Promise<void> {
  if (!article.value) return;
  if (confirm(t("article.confirmDelete"))) {
    await blogStore.deleteArticle(article.value.id);
    router.push("/");
  }
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

// 导出下拉菜单
const exportOptions = computed<DropdownOption[]>(() => [
  {
    label: t("article.exportHTML"),
    key: "html",
    icon: renderIcon(DocumentOutline)
  },
  {
    label: t("article.exportMarkdown"),
    key: "markdown",
    icon: renderIcon(DocumentTextOutline)
  },
  {
    label: t("article.exportImage"),
    key: "image",
    icon: renderIcon(ImageOutline)
  },
  {
    label: t("article.exportPDF"),
    key: "pdf",
    icon: renderIcon(DocumentOutline)
  }
]);

async function handleExportSelect(key: string | number): Promise<void> {
  if (!article.value) return;
  exporting.value = true;
  try {
    const title = article.value.title;
    if (key === "html") {
      const html = exportToHTML(article.value);
      downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${slugify(title)}.html`);
    } else if (key === "markdown") {
      const md = exportToMarkdown(article.value);
      downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), `${slugify(title)}.md`);
    } else if (key === "image") {
      const target = document.querySelector(".export-target") as HTMLElement;
      if (!target) return;
      const blob = await exportToImage(target, title);
      downloadBlob(blob, `${slugify(title)}.png`);
    } else if (key === "pdf") {
      const target = document.querySelector(".export-target") as HTMLElement;
      if (!target) return;
      const blob = await exportToPDF(target, title);
      downloadBlob(blob, `${slugify(title)}.pdf`);
    }
  } finally {
    exporting.value = false;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^\w一-龥]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "thesisforge"
  );
}

// 正文渲染完成后设置图片预览
function setupContentInteractions(rootEl: HTMLElement | null): void {
  if (!rootEl) return;
  const imgs = Array.from(rootEl.querySelectorAll("img"));
  previewImgs.value = imgs.map((img) => img.src);
  imgs.forEach((img, i) => {
    img.style.cursor = "zoom-in";
    img.onclick = () => {
      previewIdx.value = i;
      previewVisible.value = true;
    };
  });
}

onMounted(async () => {
  try {
    article.value = await blogStore.getArticleById(articleId.value);
  } finally {
    loading.value = false;
  }
  if (!article.value) {
    router.push("/");
    return;
  }
  nextTick(() => {
    const el = document.querySelector(".article-body") as HTMLElement | null;
    setupContentInteractions(el);
    contentReflow.start();
  });
});
</script>

<template>
  <AppPage>
    <div
      class="article-page"
      v-if="article && !loading"
      :style="{
        '--content-ml': 'auto',
        '--content-mr': contentReflow.align.value === 'right' ? '0' : 'auto'
      }"
    >
      <!-- 浮动大纲切换按钮（侧边栏模式显示）-->
      <button
        class="outline-float-btn"
        v-if="sidebarCollapsed && headings.length > 0"
        @click="showOutline = !showOutline"
        :style="{ left: _sidebarRef + 12 + 'px' }"
        :title="showOutline ? '隐藏大纲' : '打开大纲'"
      >
        <NIcon :size="18"><ListOutline /></NIcon>
      </button>

      <!-- 大纲面板 -->
      <OutlinePanel
        :visible="showOutline && sidebarCollapsed"
        :headings="headings"
        :sidebar-width="_sidebarRef"
        @close="showOutline = false"
        @navigate="handleHeadingNavigate"
      />

      <div class="article-actions">
        <!-- <NButton tertiary size="small" :render-icon="renderIcon(ArrowBackOutline)" @click="goBack">
          {{ t("nav.back") }}
        </NButton> -->
        <div></div>
        <div class="action-group">
          <NDropdown :options="exportOptions" trigger="click" @select="handleExportSelect">
            <NButton
              tertiary
              size="small"
              :loading="exporting"
              :render-icon="renderIcon(DownloadOutline)"
            >
              {{ t("article.export") }}
            </NButton>
          </NDropdown>
          <NButton tertiary size="small" :render-icon="renderIcon(PencilOutline)" @click="goEdit">
            {{ t("article.edit") }}
          </NButton>
          <NButton
            tertiary
            size="small"
            :render-icon="renderIcon(TrashOutline)"
            @click="handleDelete"
            class="delete-btn"
          >
            {{ t("article.delete") }}
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
              >{{ blogStore.getReadTime(article.content) }} {{ t("article.readTime") }}</NText
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

        <n-image-group
          v-if="article.content"
          v-model:show="previewVisible"
          v-model:current="previewIdx"
          :src-list="previewImgs"
          :show-toolbar="true"
          style="display: contents"
        >
          <div class="article-body article-content" v-html="article.content"></div>
        </n-image-group>
      </div>
    </div>
    <div class="article-loading" v-else-if="loading">
      <NSpin size="large" />
    </div>
  </AppPage>
</template>

<style lang="less" scoped>
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
    box-shadow var(--transition-fast),
    left 0.2s;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
    box-shadow: var(--shadow-md);
  }
}
.article-page {
  width: 100%;
  max-width: 1100px;
  // 默认居中对称，当 --content-align: right 时贴右
  margin-left: var(--content-ml, auto);
  margin-right: var(--content-mr, auto);
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
