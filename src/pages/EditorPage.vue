<script setup lang="ts">
defineOptions({ name: "editor" });
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "@/composables/i18n/useI18n";
import { useBlogStore } from "@/stores/blog";
import { useSettingsStore } from "@/stores/settings";
import TiptapEditor from "@/components/editor/TiptapEditor.vue";
import { NInput, NDynamicTags, NButton, NText, NDivider, NH3, useMessage } from "naive-ui";
import { ArrowBackOutline, PaperPlaneOutline } from "@vicons/ionicons5";
import { h, type Component } from "vue";
import { NIcon } from "naive-ui";
import { isDesktop } from "@/services/storage";
import AppPage from "@/components/app/AppPage.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const blogStore = useBlogStore();
const settings = useSettingsStore();
const message = useMessage();

const isDesktopApp = isDesktop();
const storagePathSet = computed(() => !isDesktopApp || !!settings.storagePath?.trim());

const isEditing = computed(() => !!route.params.id);
const pageTitle = computed(() => (isEditing.value ? t("editor.editTitle") : t("editor.newTitle")));

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
  <AppPage
    ref="articlePageRef"
    class="editor-page"
    :style="{
      '--content-ml': 'auto',
      '--content-mr': 'auto'
    }"
  >
    <!-- 未设置存储路径时的提示横幅 -->
    <div class="path-warning-banner" v-if="isDesktopApp && !storagePathSet">
      <NText depth="2">{{ t("pathRequired") }}</NText>
      <NButton size="tiny" type="primary" @click="openSettings">
        {{ t("settings") }}
      </NButton>
    </div>

    <div class="editor-toolbar">
      <!-- <NButton
        tertiary
        size="small"
        :render-icon="renderIcon(ArrowBackOutline)"
        @click="router.back()"
      >
        {{ t("nav.back") }}
      </NButton> -->
      <div></div>
      <div></div>
      <!-- <NH3 class="toolbar-title" :style="{ margin: 0 }">{{ pageTitle }}</NH3> -->
      <NButton
        type="primary"
        size="small"
        :render-icon="renderIcon(PaperPlaneOutline)"
        @click="handlePublish"
      >
        {{ t("nav.publish") }}
      </NButton>
    </div>

    <div class="editor-form">
      <NInput
        v-model:value="title"
        :placeholder="t('editor.titlePlaceholder')"
        size="large"
        class="title-input"
      />

      <NInput
        v-model:value="summary"
        type="textarea"
        :placeholder="t('editor.summaryPlaceholder')"
        :autosize="{ minRows: 3, maxRows: 5 }"
        class="summary-textarea"
      />

      <NDivider />

      <TiptapEditor
        :key="editorKey"
        v-model="content"
        :placeholder="'Start writing your paper...'"
      />

      <div class="tag-section">
        <NText depth="2" class="tag-label">Tags</NText>
        <NDynamicTags v-model:value="tags" size="small" />
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
      </div>
    </div>
  </AppPage>
</template>

<style lang="less" scoped>
.editor-page {
  width: 100%;
  max-width: 920px;
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
  font-size: 13px;
  color: #d46b08;
}

[data-theme="dark"] .path-warning-banner {
  background: #2c1d0d;
  border-color: #613409;
  color: #d89614;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sp-5);

  :deep(.n-button) {
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);
  }
}

.toolbar-title {
  font-size: 14px;
  font-weight: normal;
  color: var(--color-text-secondary);
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.title-input {
  font-family: var(--font-serif) !important;
  :deep(.n-input__input-el) {
    font-size: var(--fs-xl);
    font-weight: 600;
  }
}

.summary-textarea {
  :deep(&.n-input .n-input-wrapper) {
    background-color: var(--color-bg-secondary);
  }
  :deep(.n-input__textarea-el) {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
  }
}

.tag-section {
  margin-top: var(--sp-5);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--color-border);
}

.tag-label {
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 0.6em;
  display: block;
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
