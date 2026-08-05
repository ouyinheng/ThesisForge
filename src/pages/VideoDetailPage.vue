<script setup lang="ts">
defineOptions({ name: "video-detail" })
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  NCard,
  NButton,
  NIcon,
  NSpin,
  NEmpty,
  NTag,
  NText,
  NSkeleton
} from "naive-ui"
import { ArrowBackOutline, PlayCircleOutline, DownloadOutline } from "@vicons/ionicons5"
import { useI18n } from "@/composables/i18n/useI18n"
import { useVideoStationStore } from "@/stores/videoStation"
import { getBaseUrl } from "@/services/videoStation/content"
import type { VideoMovie } from "@/services/videoStation/content"
import AppPage from "@/components/app/AppPage.vue"

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const videoStore = useVideoStationStore()

const loading = ref(true)
const movie = ref<VideoMovie | null>(null)

const movieId = computed(() => route.params.id as string)
const detailUrl = computed(() => {
  if (!movie.value) return ''
  return movie.value.url || `${getBaseUrl().replace(/\/$/, '')}/movie/${movieId.value}.html`
})

async function loadDetail(): Promise<void> {
  loading.value = true
  try {
    const partial = await videoStore.getDetail(movieId.value)
    if (partial) {
      movie.value = {
        id: movieId.value,
        title: partial.title || '',
        cover: partial.cover || '',
        url: partial.url || `${getBaseUrl().replace(/\/$/, '')}/movie/${movieId.value}.html`,
        ...partial,
      }
    }
  } catch {
    // 即使失败，也保留一个基本对象
    movie.value = {
      id: movieId.value,
      title: '',
      cover: '',
      url: `${getBaseUrl().replace(/\/$/, '')}/movie/${movieId.value}.html`,
    }
  } finally {
    loading.value = false
  }
}

function openExternal(url: string): void {
  window.open(url, '_blank')
}

function goBack(): void {
  router.push('/video')
}

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <AppPage>
    <div class="video-detail-page">
      <NCard :bordered="false" class="page-card">
        <!-- 返回 -->
        <div class="back-bar">
          <NButton text @click="goBack">
            <template #icon><NIcon :component="ArrowBackOutline" /></template>
            返回视频站
          </NButton>
        </div>

        <NSpin :show="loading">
          <div v-if="movie" class="detail-layout">
            <!-- 封面 -->
            <div class="detail-poster" v-if="movie.cover">
              <img :src="movie.cover" :alt="movie.title" />
            </div>
            <div class="detail-poster placeholder" v-else>
              <NIcon :size="64"><PlayCircleOutline /></NIcon>
            </div>

            <!-- 信息 -->
            <div class="detail-info">
              <h1 class="detail-title">{{ movie.title || '加载中...' }}</h1>
              <div class="detail-tags" v-if="movie.category || movie.rating || movie.badge">
                <NTag v-if="movie.badge" size="small" type="primary" :bordered="false">{{ movie.badge }}</NTag>
                <NTag v-if="movie.category" size="small" :bordered="false" round>{{ movie.category }}</NTag>
                <NTag v-if="movie.year" size="small" :bordered="false">{{ movie.year }}</NTag>
                <NText v-if="movie.rating" class="detail-rating">★ {{ movie.rating }}</NText>
              </div>

              <div class="detail-meta" v-if="movie.cast">
                <span class="meta-label">主演：</span>
                <span class="meta-value">{{ movie.cast }}</span>
              </div>

              <div class="detail-actions">
                <NButton type="primary" @click="openExternal(detailUrl)">
                  <template #icon><NIcon :component="PlayCircleOutline" /></template>
                  跳转播放
                </NButton>
              </div>

              <div class="detail-desc" v-if="movie.description">
                <NText depth="3">{{ movie.description }}</NText>
              </div>
            </div>
          </div>

          <!-- iframe 直接播放（可能受跨域限制） -->
          <div class="iframe-section">
            <NText depth="3" class="iframe-tip">提示：如受跨域限制无法播放，请点击上方「跳转播放」在原站观看</NText>
          </div>
        </NSpin>
      </NCard>
    </div>
  </AppPage>
</template>

<style lang="less" scoped>
.video-detail-page {
  height: 100%;
  overflow-y: auto;
  padding: 24px 32px;
}

.page-card {
  max-width: 1000px;
  margin: 0 auto;
}

.back-bar {
  margin-bottom: 16px;
}

.detail-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.detail-poster {
  width: 100%;
  aspect-ratio: 2/3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-tertiary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-tertiary);
  }
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-title {
  font-family: var(--font-serif);
  font-size: var(--fs-xl);
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
  line-height: 1.3;
}

.detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.detail-rating {
  font-size: var(--fs-sm);
  color: #f59e0b;
  font-weight: 600;
}

.detail-meta {
  font-size: var(--fs-sm);
  color: var(--color-text-secondary);
}

.meta-label {
  font-weight: 500;
}

.detail-desc {
  font-size: var(--fs-sm);
  line-height: 1.8;
  color: var(--color-text-secondary);
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.iframe-section {
  margin-top: 24px;
}

.iframe-tip {
  font-size: var(--fs-xs);
}

@media (max-width: 600px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
  .detail-poster {
    max-width: 200px;
    margin: 0 auto;
  }
}
</style>
