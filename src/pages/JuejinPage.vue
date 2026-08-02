<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  NCard,
  NButton,
  NIcon,
  NTabs,
  NTabPane,
  NEmpty,
  NSkeleton,
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { putJuejinArticle, type JuejinArticle } from '@/services/juejinCache'
import { useJuejinStore } from '@/stores/juejin'
import JuejinCard from '@/components/JuejinCard.vue'

const { t } = useI18n()
const router = useRouter()
const juejinStore = useJuejinStore()

const activeTab = ref<'recommend' | 'latest'>('recommend')

// 当前 tab 对应的 store 数据
const currentFeed = computed(() =>
  activeTab.value === 'recommend' ? juejinStore.recommend : juejinStore.latest
)

// 是否应显示无限滚动哨兵
const showSentinel = computed(() =>
  currentFeed.value.list.length > 0 && !currentFeed.value.finished
)

// loading / error 用 ref 单独管理（响应式）
const recommendLoading = ref(false)
const latestLoading = ref(false)
const recommendError = ref(false)
const latestError = ref(false)

function getLoading(tab: 'recommend' | 'latest') {
  return tab === 'recommend' ? recommendLoading.value : latestLoading.value
}
function getError(tab: 'recommend' | 'latest') {
  return tab === 'recommend' ? recommendError.value : latestError.value
}
function setLoading(tab: 'recommend' | 'latest', val: boolean) {
  if (tab === 'recommend') recommendLoading.value = val
  else latestLoading.value = val
}
function setError(tab: 'recommend' | 'latest', val: boolean) {
  if (tab === 'recommend') recommendError.value = val
  else latestError.value = val
}

const isElectron = typeof window !== 'undefined' && (window as any).__IS_ELECTRON__ === true
const JUEJIN_API_BASE = import.meta.env.VITE_JUEJIN_API_BASE || 'https://api.juejin.cn'
const RECOMMEND_URL =
  'https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed?aid=2608&uuid=7204388692608828987&spider=0'

async function requestJuejin(url: string, body: Record<string, unknown>): Promise<any> {
  if (isElectron && (window as any).__fileBridge?.juejinFetch) {
    const result = await (window as any).__fileBridge.juejinFetch({ url, method: 'POST', body })
    if (!result.ok) throw new Error(result.error || 'fetch failed')
    return result.data
  }
  const target = JUEJIN_API_BASE + url.replace('https://api.juejin.cn', '')
  const resp = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

function mapItem(item: any): JuejinArticle {
  const info = item.item_info ?? item
  const article = info.article_info ?? {}
  const author = info.author_user_info ?? {}
  const tags = (info.tags ?? []).map((tag: any) => ({ tag_name: tag.tag_name, color: tag.color || '' }))
  const mapped: JuejinArticle = {
    article_id: article.article_id || info.article_id,
    title: article.title || '无标题',
    brief_content: article.brief_content || '',
    web_html_content: article.web_html_content || article.content || '',
    cover_image: article.cover_image || '',
    view_count: article.view_count || 0,
    digg_count: article.digg_count || 0,
    comment_count: article.comment_count || 0,
    user_name: author.user_name || '掘金作者',
    tags,
  }
  // 始终缓存文章元数据（即使没有正文），供详情页立即展示
  putJuejinArticle(mapped)
  return mapped
}

// 加载更多（追加到 store）
async function loadMore(tab: 'recommend' | 'latest'): Promise<void> {
  const feed = tab === 'recommend' ? juejinStore.recommend : juejinStore.latest
  if (getLoading(tab) || feed.finished) return
  setLoading(tab, true)
  setError(tab, false)
  try {
    const json = await requestJuejin(RECOMMEND_URL, {
      id_type: 2,
      client_type: 2608,
      sort_type: tab === 'recommend' ? 200 : 300,
      cursor: feed.cursor,
      limit: 20,
    })
    if (json.err_no !== 0) throw new Error(json.err_msg || 'err')
    const items: JuejinArticle[] = (json.data || []).map(mapItem)
    feed.list.push(...items)
    const hasMore = json.has_more === 1 || json.has_more === true
    feed.cursor = json.cursor || String(Number(feed.cursor) + items.length)
    if (!hasMore || items.length === 0) feed.finished = true
  } catch {
    setError(tab, true)
  } finally {
    setLoading(tab, false)
  }
}

function onTabChange(key: string | number): void {
  activeTab.value = key as 'recommend' | 'latest'
  const tab = activeTab.value
  const feed = tab === 'recommend' ? juejinStore.recommend : juejinStore.latest
  // 首次切换到该 tab 且无数据时自动加载
  if (!feed.list.length && !getLoading(tab) && !getError(tab)) {
    loadMore(tab)
  }
  // 切换 tab 后重新观察哨兵
  nextTick(() => observeSentinel())
}

// 点击卡片跳转，同时把当前文章数据注入全局缓存（putJuejinArticle 已在 mapItem 做过）
function openArticle(article: JuejinArticle): void {
  router.push(`/juejin/${article.article_id}`)
}

// 刷新当前 tab
function refreshCurrent(): void {
  const tab = activeTab.value
  const feed = tab === 'recommend' ? juejinStore.recommend : juejinStore.latest
  feed.list = []
  feed.cursor = '0'
  feed.finished = false
  loadMore(tab)
}

// 无限滚动：IntersectionObserver + 哨兵元素
let sentinelObserver: IntersectionObserver | null = null
const sentinelEl = ref<HTMLElement | null>(null)

function setupObserver(): void {
  sentinelObserver?.disconnect()
  sentinelObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          loadMore(activeTab.value)
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
      // 先取消全部观察，再重新观察新的哨兵
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
  if (!juejinStore.recommend.list.length) {
    loadMore('recommend')
  }
  setupObserver()
})

onBeforeUnmount(() => {
  sentinelObserver?.disconnect()
})
</script>

<template>
  <div class="juejin-page">
    <NCard :bordered="false" class="page-card">
      <!-- 顶部品牌 -->
      <div class="juejin-header">
        <div class="juejin-brand">
          <div class="juejin-badge">掘</div>
          <div class="juejin-title-wrap">
            <h1 class="juejin-title">掘金</h1>
            <NText depth="3" class="juejin-sub">Juejin · 技术社区精选</NText>
          </div>
        </div>
      </div>

      <!-- Tabs + 刷新按钮 -->
      <div class="juejin-tabs-bar">
        <NTabs
          type="line"
          animated
          :value="activeTab"
          @update:value="onTabChange"
        >
          <!-- 推荐 -->
          <NTabPane name="recommend" :tab="t('juejin.recommend')">
            <div class="list-wrap">
              <NEmpty
                v-if="getError('recommend') && !juejinStore.recommend.list.length"
                description="加载失败（可能受跨域限制）"
              >
                <template #extra>
                  <NButton size="small" @click="loadMore('recommend')">重试</NButton>
                </template>
              </NEmpty>

              <div v-else class="waterfall">
                <span
                  v-for="article in juejinStore.recommend.list"
                  :key="article.article_id"
                  class="waterfall-item"
                >
                  <JuejinCard :article="article" @click="openArticle(article)" />
                </span>
              </div>

              <div class="list-footer" v-if="getLoading('recommend')">
                <NSkeleton height="16px" width="120px" :sharp="false" />
              </div>
              <NEmpty v-else-if="juejinStore.recommend.finished && juejinStore.recommend.list.length" :show-icon="false" description="没有更多了" />
            </div>
          </NTabPane>

          <!-- 最新 -->
          <NTabPane name="latest" :tab="t('juejin.latest')">
            <div class="list-wrap">
              <NEmpty
                v-if="getError('latest') && !juejinStore.latest.list.length"
                description="加载失败（可能受跨域限制）"
              >
                <template #extra>
                  <NButton size="small" @click="loadMore('latest')">重试</NButton>
                </template>
              </NEmpty>

              <div v-else class="waterfall">
                <span
                  v-for="article in juejinStore.latest.list"
                  :key="article.article_id"
                  class="waterfall-item"
                >
                  <JuejinCard :article="article" @click="openArticle(article)" />
                </span>
              </div>

              <div class="list-footer" v-if="getLoading('latest')">
                <NSkeleton height="16px" width="120px" :sharp="false" />
              </div>
              <NEmpty v-else-if="juejinStore.latest.finished && juejinStore.latest.list.length" :show-icon="false" description="没有更多了" />
            </div>
          </NTabPane>
          <template #suffix>
            <!-- 刷新按钮 -->
            <NButton quaternary circle size="small" class="refresh-btn" @click="refreshCurrent" title="刷新">
              <NIcon :size="16"><RefreshOutline /></NIcon>
            </NButton>
          </template>
        </NTabs>

      </div>

      <!-- 无限滚动哨兵 -->
      <div ref="sentinelEl" class="sentinel" v-if="showSentinel"></div>
    </NCard>
  </div>
</template>

<style lang="less" scoped>
.juejin-page {
  height: 100%;
  overflow-y: auto;
  padding: 1.5em 1em;
}

.page-card {
  display: block;
  margin: 0 auto;
  width: 100%;
  max-width: 1400px;
  min-width: 780px;
  padding: 1.5em 2em 2em;
}

/* 顶部品牌 */
.juejin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2em;
}

.juejin-brand {
  display: flex;
  align-items: center;
  gap: 0.8em;
}

.juejin-badge {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #1e80ff, #0066ff);
}

.juejin-title-wrap {
  display: flex;
  flex-direction: column;
}

.juejin-title {
  font-family: var(--font-serif) !important;
  font-size: 24px;
  margin: 0;
  line-height: 1.2;
}

.juejin-sub {
  font-size: 13px;
}

/* Tabs + 刷新按钮容器 */
.juejin-tabs-bar {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;

  :deep(.n-tabs) {
    flex: 1;
    min-width: 0;
  }

  :deep(.n-tabs-nav) {
    flex-shrink: 0;
  }

  :deep(.n-tab-pane) {
    display: flex;
    flex-direction: column;
  }
}

.refresh-btn {
  flex-shrink: 0;
  margin-top: 4px;
  color: var(--color-text-secondary);

  &:hover {
    color: var(--color-primary);
  }
}

.list-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding: 15px 0;
}

/* 瀑布流 */
.waterfall {
  column-count: 2;
  column-gap: 1em;
}

.waterfall-item {
  display: inline-block;
  width: 100%;
  break-inside: avoid;
  margin-bottom: 1em;
  vertical-align: top;
}

.sentinel {
  height: 1px;
  width: 100%;
}

.list-footer {
  display: flex;
  justify-content: center;
  padding: 0.6em;
}

/* 让 Tabs 内容区自适应 */
.page-card {
  :deep(.n-tabs) {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  :deep(.n-tabs-nav) {
    flex-shrink: 0;
  }

  :deep(.n-tab-pane) {
    display: flex;
    flex-direction: column;
    padding: 0;
  }
}
</style>
