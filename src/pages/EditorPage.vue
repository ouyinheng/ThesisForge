<script setup lang="ts">
defineOptions({ name: "editor" });
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "@/composables/i18n/useI18n";
import { useBlogStore } from "@/stores/blog";
import { useSettingsStore } from "@/stores/settings";
import TiptapEditor from "@/components/editor/TiptapEditor.vue";
import { NInput, NDynamicTags, NButton, NText, NDivider, useMessage } from "naive-ui";
import { ArrowBackOutline } from "@vicons/ionicons5";
import { h, type Component } from "vue";
import { NIcon } from "naive-ui";
import { isDesktop } from "@/services/storage";
import AppPage from "@/components/app/AppPage.vue";
import { usePublishAction } from "@/composables/editor/usePublishAction";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const blogStore = useBlogStore();
const settings = useSettingsStore();
const message = useMessage();

const isDesktopApp = isDesktop();
const storagePathSet = computed(() => !isDesktopApp || !!settings.storagePath?.trim());

const isEditing = computed(() => !!route.params.id);

// 进入编辑器（新建或编辑）即把发布动作注册给布局 header，供顶栏"发布文章"按钮复用
const { registerEditor, unregisterEditor } = usePublishAction();
registerEditor(handlePublish);
onBeforeUnmount(unregisterEditor);

// 编辑器实例的唯一 key：编辑模式用文章 id，新建模式用带时间戳的唯一值确保每次新建都重建编辑器
const editorKey = ref((route.params.id as string) || `new-${Date.now()}`);

const title = ref("");
const summary = ref("");
const content = ref("");
const tags = ref<string[]>([]);

// 重置表单到新建状态
function resetForm() {
  title.value = "";
  summary.value = "";
  content.value = "";
  tags.value = [];
  editorKey.value = `new-${Date.now()}`;
}

// 监听路由变化：编辑→新建 或 新建→编辑 时确保表单状态正确
watch(
  () => route.path,
  () => {
    if (!isEditing.value) {
      resetForm();
    }
  }
);

const suggestedTags = [
  "Machine Learning",
  "Systems",
  "Theory",
  "NLP",
  "Databases",
  "Security",
  "Networks",
  "AI"
];

onMounted(async () => {
  if (isEditing.value) {
    const article = await blogStore.getArticleById(String(route.params.id));
    if (article) {
      title.value = article.title;
      summary.value = article.summary;
      content.value = article.content;
      tags.value = [...article.tags];
    } else {
      router.push("/");
    }
  }
});

async function handlePublish() {
  if (!title.value.trim()) {
    message.error(t("editor.emptyTitle"));
    return;
  }
  if (!content.value.trim() || content.value === "<p></p>") {
    message.error(t("editor.emptyContent"));
    return;
  }

  // 桌面模式下必须先设置存储路径
  if (isDesktopApp && !settings.storagePath?.trim()) {
    message.warning(t("pathRequired"));
    openSettings();
    return;
  }

  if (isEditing.value) {
    await blogStore.updateArticle(String(route.params.id), {
      title: title.value.trim(),
      summary: summary.value.trim(),
      content: content.value,
      tags: tags.value
    });
  } else {
    await blogStore.createArticle({
      title: title.value.trim(),
      summary: summary.value.trim(),
      content: content.value,
      tags: tags.value
    });
  }

  message.success(t("editor.publishSuccess"));
  router.push("/");
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

function addSuggestedTag(tag: string): void {
  if (!tags.value.includes(tag)) {
    tags.value.push(tag);
  }
}

function openSettings(): void {
  window.dispatchEvent(new CustomEvent("open-settings-global"));
}
</script>

<template>
  <AppPage class="editor-page">
    <!-- 未设置存储路径时的提示横幅 -->
    <div class="path-warning-banner" v-if="isDesktopApp && !storagePathSet">
      <NText depth="2">{{ t("pathRequired") }}</NText>
      <NButton size="tiny" type="primary" @click="openSettings">
        {{ t("settings") }}
      </NButton>
    </div>

    <!-- 返回条（仅编辑模式显示，仅保留返回） -->
    <div class="editor-toolbar" v-if="isEditing">
      <div class="toolbar-left">
        <NButton
          quaternary
          size="small"
          :render-icon="renderIcon(ArrowBackOutline)"
          @click="router.back()"
        >
          {{ t("nav.back") }}
        </NButton>
      </div>
    </div>

    <!-- 主体：写作区 + 元信息侧栏 -->
    <div class="editor-body">
      <!-- 写作区 -->
      <div class="editor-main">
        <NInput
          v-model:value="title"
          :placeholder="t('editor.titlePlaceholder')"
          class="title-input"
        />
        <TiptapEditor
          :key="editorKey"
          v-model="content"
          :placeholder="'Start writing your paper...'"
        />
      </div>

      <!-- 元信息侧栏 -->
      <aside class="editor-meta">
        <NText depth="2" class="meta-label">摘要</NText>
        <NInput
          v-model:value="summary"
          type="textarea"
          :rows="4"
          :placeholder="t('editor.summaryPlaceholder')"
          class="meta-block"
        />

        <NDivider :style="{ margin: '12px 0' }" />

        <NText depth="2" class="meta-label">标签</NText>
        <NDynamicTags v-model:value="tags" size="small" class="meta-block" />
        <div
          class="tag-suggestions"
          v-if="suggestedTags.filter((tag) => !tags.includes(tag)).length"
        >
          <NText depth="3" class="suggestions-label">{{ t("editor.tagSuggestions") }}:</NText>
          <NButton
            v-for="tag in suggestedTags.filter((t) => !tags.includes(t))"
            :key="tag"
            size="tiny"
            dashed
            class="suggestion-btn"
            @click="addSuggestedTag(tag)"
          >
            + {{ tag }}
          </NButton>
        </div>
      </aside>
    </div>
  </AppPage>
</template>

<style lang="less" scoped>
.editor-page {
  width: 100%;
  max-width: 1040px;
  margin-left: var(--content-ml, auto);
  margin-right: var(--content-mr, auto);
}
.path-warning-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
  padding: 0.6em 1em;
  margin-bottom: 1em;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  font-size: var(--fs-sm);
  color: #d46b08;
}

[data-theme="dark"] .path-warning-banner {
  background: #2c1d0d;
  border-color: #613409;
  color: #d89614;
}

.editor-toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1em;
  padding: 0.6em 0.2em;
  margin-bottom: var(--sp-5);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.6em;
    min-width: 0;
  }

  :deep(.n-button) {
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
  }
}

.toolbar-title {
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主体：写作区 + 元信息侧栏 */
.editor-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: start;
}

.editor-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.editor-meta {
  position: sticky;
  top: 72px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-secondary);

  .meta-label {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
  }
}

.title-input {
  font-family: var(--font-serif) !important;

  :deep(.n-input__input-el) {
    font-size: var(--fs-2xl);
    font-weight: 600;
    line-height: 1.35;
  }
}

@media (max-width: 860px) {
  .editor-body {
    grid-template-columns: 1fr;
  }
  .editor-meta {
    position: static;
    order: 2;
  }
  .editor-main {
    order: 1;
  }
}

.tag-suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4em;
  margin-top: 0.6em;
}

.suggestions-label {
  font-size: var(--fs-xs);
}

.suggestion-btn {
  --n-color-hover: var(--color-primary) !important;
  --n-border-hover: 1px dashed var(--color-primary) !important;
}
</style>
