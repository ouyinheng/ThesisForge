<script setup lang="ts">
defineOptions({ name: "video-station" })
import { ref, computed, onMounted, onBeforeUnmount, onActivated, onDeactivated, watch, nextTick, inject } from "vue"
import {
  NCard,
  NButton,
  NIcon,
  NTabs,
  NTabPane,
  NEmpty,
  NSkeleton,
  NInput,
  NBackTop,
  NText,
  NSelect
} from "naive-ui"
import { RefreshOutline, SearchOutline, CloseCircleOutline, PlayCircleOutline } from "@vicons/ionicons5"
import { useRouter } from "vue-router"
import { useI18n } from "@/composables/i18n/useI18n"
import { useVideoStationStore } from "@/stores/videoStation"
import { VIDEO_CATEGORIES } from "@/services/videoStation/content"
import VideoMovieCard from "@/components/widget/VideoMovieCard.vue"
import AppPage from "@/components/app/AppPage.vue"

const router = useRouter()
const { t } = useI18n()
const videoStore = useVideoStationStore()
const openSettings = inject<(() => void) | null>('openSettings', null)

const activeTab = ref(VIDEO_CATEGORIES[0].key)
const searchKeyword = ref("")
const pageRef = ref<HTMLElement>()
const sentinelEl = ref<HTMLElement | null>(null)

// 当前分类缓存
const currentCache = computed(() => videoStore.getOrCreate(activeTab.value))
const isSearchMode = computed(() => videoStore.search.keyword.length > 0)

// 刷新
function refreshCurrent(): void {
  const cat = VIDEO_CATEGORIES.find(c => c.key === activeTab.value)
  if (cat) videoStore.retry(activeTab.value, cat.path)
}

// tab 切换
function onTabChange(key: string | number): void {
  activeTab.value = key as string
  const cat = VIDEO_CATEGORIES.find(c => c.key === activeTab.value)
  if (cat) {
    const cache = videoStore.getOrCreate(activeTab.value)
    if (!cache.list.length && !cache.loading && !cache.error) {
      videoStore.loadCategory(activeTab.value, cat.path)
    }
  }
  nextTick(() => observeSentinel())
}

// 搜索
function performSearch(): void {
  const kw = searchKeyword.value.trim()
  if (!kw) {
    videoStore.exitSearch()
    return
  }
  videoStore.doSearch(kw)
}

function exitSearch(): void {
  searchKeyword.value = ""
  videoStore.exitSearch()
}

// 打开详情
function openMovie(id: string): void {
  router.push(`/video/${id}`)
}

// 无限滚动哨兵
let sentinelObserver: IntersectionObserver | null = null

function setupObserver(): void {
  sentinelObserver?.disconnect()
  sentinelObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // 视频站 API 目前只支持滚动重刷（没有分页 cursor）
          // 哨兵触发时仅提示：当前分类已是全部
          break
        }
      }
    },
    { threshold: 0.1 }
  )
  observeSentinel()
}

function observeSentinel(): void {
  nextTick(() => {
    if (sentinelObserver) {
      sentinelObserver.disconnect()
      if (sentinelEl.value) {
        sentinelObserver.observe(sentinelEl.value)
      }
    }
  })
}

watch(activeTab, () => {
  observeSentinel()
})

onMounted(() => {
  const cat = VIDEO_CATEGORIES[0]
  if (!videoStore.getOrCreate(cat.key).list.length) {
    videoStore.loadCategory(cat.key, cat.path)
  }
  setupObserver()
})

onActivated(() => {
  observeSentinel()
})

onDeactivated(() => {
  sentinelObserver?.disconnect()
})

onBeforeUnmount(() => {
  sentinelObserver?.disconnect()
})
</script>

<template>
  <AppPage>
    <div ref="pageRef" class="video-page">
      <NCard :bordered="false" class="page-card">
        <!-- 顶部品牌 -->
        <div class="video-header">
          <div class="video-brand">
            <div class="video-badge"><NIcon :size="18"><PlayCircleOutline /></NIcon></div>
            <div class="video-title-wrap">
              <h1 class="video-title">视频站</h1>
              <NText depth="3" class="video-sub">厂长资源 · 影视聚合</NText>
            </div>
          </div>
        </div>

        <!-- Tabs + 搜索 -->
        <div class="video-tabs-bar">
          <NTabs type="line" animated :value="activeTab" @update:value="onTabChange">
            <NTabPane
              v-for="cat in VIDEO_CATEGORIES"
              :key="cat.key"
              :name="cat.key"
              :tab="cat.label"
            />
          </NTabs>
          <div class="video-toolbar">
            <NInput
              v-model:value="searchKeyword"
              size="small"
              :placeholder="'搜索影视...'"
              clearable
              style="width: 200px"
              @keyup.enter="performSearch"
            >
              <template #suffix>
                <NIcon :component="SearchOutline" class="cursor-pointer" @click="performSearch" />
              </template>
            </NInput>
            <NButton size="small" quaternary @click="refreshCurrent">
              <template #icon><NIcon :component="RefreshOutline" /></template>
            </NButton>
          </div>
        </div>

        <!-- 搜索 banner -->
        <div v-if="isSearchMode" class="search-banner">
          <span class="search-banner-text">
            <NIcon :size="14" :component="SearchOutline" />
            搜索 "<strong>{{ videoStore.search.keyword }}</strong>" · 共 {{ videoStore.search.list.length }} 条
          </span>
          <NButton text size="small" @click="exitSearch">
            <template #icon><NIcon :component="CloseCircleOutline" /></template>
            退出搜索
          </NButton>
        </div>

        <!-- 错误 -->
        <NEmpty
          v-if="!isSearchMode && currentCache.error && !currentCache.list.length"
          description="加载失败，请检查厂长资源地址是否正确"
        >
          <template #extra>
            <div class="error-actions">
              <NButton size="small" type="primary" @click="openSettings?.()">去设置</NButton>
              <NButton size="small" @click="refreshCurrent">重试</NButton>
            </div>
          </template>
        </NEmpty>

        <!-- 搜索错误 -->
        <NEmpty
          v-else-if="isSearchMode && videoStore.search.error"
          description="搜索失败"
        >
          <template #extra>
            <NButton size="small" @click="performSearch">重试</NButton>
          </template>
        </NEmpty>

        <!-- 搜索空 -->
        <NEmpty
          v-else-if="isSearchMode && !videoStore.search.loading && !videoStore.search.list.length"
          description="暂无搜索结果"
        />

        <!-- loading -->
        <div v-else-if="(isSearchMode ? videoStore.search.loading : currentCache.loading) && !(isSearchMode ? videoStore.search.list : currentCache.list).length" class="skeleton-grid">
          <div v-for="n in 12" :key="n" class="skeleton-item">
            <NSkeleton height="280px" />
            <NSkeleton text style="margin-top: 8px" />
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-else-if="isSearchMode && videoStore.search.list.length" class="waterfall">
          <span
            v-for="movie in videoStore.search.list"
            :key="'search-' + movie.id"
            class="waterfall-item"
          >
            <VideoMovieCard :movie="movie" @click="openMovie(movie.id)" />
          </span>
        </div>

        <!-- 列表 -->
        <div v-else-if="!isSearchMode && currentCache.list.length" class="waterfall">
          <span
            v-for="movie in currentCache.list"
            :key="movie.id"
            class="waterfall-item"
          >
            <VideoMovieCard :movie="movie" @click="openMovie(movie.id)" />
          </span>
          <div ref="sentinelEl" class="list-sentinel" />
        </div>

        <!-- 空状态 -->
        <NEmpty
          v-else-if="!isSearchMode && !currentCache.loading && !currentCache.error"
          description="暂无内容"
        />
      </NCard>
      <NBackTop :listen-to="pageRef" :right="40" :bottom="40" />
    </div>
  </AppPage>
</template>

<style lang="less" scoped>
.video-page {
  height: 100%;
  overflow-y: auto;
  padding: 24px 32px;
}

.page-card {
  max-width: 1400px;
  margin: 0 auto;
}

.video-header {
  margin-bottom: 16px;
}

.video-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.video-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-title-wrap {
  display: flex;
  flex-direction: column;
}

.video-title {
  font-family: var(--font-serif);
  font-size: var(--fs-xl);
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  color: var(--color-text);
}

.video-sub {
  font-size: var(--fs-xs);
}

.video-tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.video-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}

.search-banner-text {
  font-size: var(--fs-sm);
  color: var(--color-text-secondary);
}

.waterfall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.waterfall-item {
  display: block;
  min-width: 0;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.skeleton-item {
  display: flex;
  flex-direction: column;
}

.list-sentinel {
  grid-column: 1 / -1;
  height: 20px;
}

.error-block {
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 8px;
}
</style>
