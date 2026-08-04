<script setup lang="ts">
defineOptions({ name: "papers" });
import { computed, ref } from "vue";
import { NButton, NH1, NH2, NText, NTag, NEmpty } from "naive-ui";
import { SwapVerticalOutline } from "@vicons/ionicons5";
import { h, type Component } from "vue";
import { NIcon } from "naive-ui";
import { useI18n } from "@/composables/i18n/useI18n";
import { useBlogStore } from "@/stores/blog";
import { useSettingsStore } from "@/stores/settings";
import { useRouter, useRoute } from "vue-router";
import AppPage from "@/components/app/AppPage.vue";

const { t } = useI18n();
const blogStore = useBlogStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const route = useRoute();

const sortBy = ref<"date" | "title">("date");
const activeTag = computed<string | undefined>(() => {
  const tag = route.query.tag;
  return Array.isArray(tag) ? tag[0] || undefined : tag || undefined;
});

const displayedMetas = computed(() => {
  let metas = [...blogStore.sortedMetas];
  if (activeTag.value) {
    metas = metas.filter((m) => m.tags.includes(activeTag.value!));
  }
  if (sortBy.value === "title") {
    metas.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    metas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return metas;
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const loc = settingsStore.locale === "zh" ? "zh-CN" : "en-US";
  return date.toLocaleDateString(loc, { year: "numeric", month: "short", day: "numeric" });
}

function goToArticle(id: string): void {
  router.push(`/article/${id}`);
}

function clearFilter() {
  router.push("/papers");
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}
</script>

<template>
  <AppPage>
    <div class="articles-page">
      <div class="page-header">
        <NH1 class="page-title">{{ t("home.title") }}</NH1>
        <div class="header-actions">
          <NTag v-if="activeTag" type="primary" size="small" round closable @close="clearFilter">
            <div style="color: #666">#{{ activeTag }}</div>
          </NTag>
          <NButton
            size="small"
            tertiary
            :render-icon="renderIcon(SwapVerticalOutline)"
            @click="sortBy = sortBy === 'date' ? 'title' : 'date'"
          >
            {{ sortBy === "date" ? t("home.sortByDate") : t("home.sortByTitle") }}
          </NButton>
        </div>
      </div>

      <div class="articles-list" v-if="displayedMetas.length">
        <article
          class="article-card"
          v-for="meta in displayedMetas"
          :key="meta.id"
          @click="goToArticle(meta.id)"
        >
          <div class="card-main">
            <NH2 class="card-title">{{ meta.title }}</NH2>
            <NText depth="3" class="card-date">{{ formatDate(meta.createdAt) }}</NText>
            <NText depth="2" class="card-summary">{{ meta.summary }}</NText>
            <div class="card-tags" v-if="meta.tags.length">
              <NTag
                v-for="tag in meta.tags"
                :key="tag"
                size="small"
                :bordered="false"
                class="card-tag"
              >
                {{ tag }}
              </NTag>
            </div>
          </div>
          <NText depth="3" class="card-arrow">{{ t("nav.read") }}</NText>
        </article>
      </div>

      <NEmpty v-else :description="t('home.empty')" :style="{ marginTop: '80px' }" />
    </div>
  </AppPage>
</template>

<style lang="less" scoped>
.articles-page {
  width: 100%;
  max-width: 920px;
  margin-left: var(--content-ml, auto);
  margin-right: var(--content-mr, auto);
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2em;
}

.page-title {
  font-family: var(--font-serif) !important;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.8em;
}

.articles-list {
  display: flex;
  flex-direction: column;
}

.article-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--sp-5) 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: padding-left var(--transition-fast);
  &:hover {
    .card-title {
      color: var(--color-primary);
    }
    .card-arrow {
      transform: translateX(4px);
      color: var(--color-primary);
    }
  }
}

.card-main {
  flex: 1;
  padding-right: 1em;
}

.card-title {
  margin: 0 0 0.3em !important;
  font-family: var(--font-serif) !important;
  transition: color var(--transition-fast);
}

.card-date {
  font-size: var(--fs-xs);
  letter-spacing: 0.02em;
  color: var(--color-text-tertiary);
}

.card-summary {
  line-height: 1.65;
  margin: 0.5em 0 0.4em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.card-tags {
  display: flex;
  gap: 0.4em;
  flex-wrap: wrap;
}

.card-tag {
  cursor: default;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
}

.card-arrow {
  font-size: 13px;
  white-space: nowrap;
  transition:
    transform var(--transition-fast),
    color var(--transition-fast);
  align-self: flex-start;
  margin-top: 0.3em;
  color: var(--color-text-tertiary);
}
</style>
