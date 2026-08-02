<script setup lang="ts">
defineOptions({ name: "juejin" });
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  onActivated,
  onDeactivated,
  watch,
  nextTick
} from "vue";
import {
  NCard,
  NButton,
  NIcon,
  NTabs,
  NTabPane,
  NEmpty,
  NSkeleton,
  NInput,
  NBackTop
} from "naive-ui";
import { RefreshOutline, SearchOutline, CloseCircleOutline } from "@vicons/ionicons5";
import { useRouter } from "vue-router";
import { useI18n } from "@/composables/useI18n";
import { putJuejinArticle, type JuejinArticle } from "@/services/juejinCache";
import { useJuejinStore } from "@/stores/juejin";
import JuejinCard from "@/components/JuejinCard.vue";

const { t } = useI18n();
const router = useRouter();
const juejinStore = useJuejinStore();

const activeTab = ref<"recommend" | "latest">("recommend");

// 当前 tab 对应的 store 数据
const currentFeed = computed(() =>
  activeTab.value === "recommend" ? juejinStore.recommend : juejinStore.latest
);

// 是否应显示无限滚动哨兵
const showSentinel = computed(() => {
  if (isSearchMode.value) {
    return juejinStore.search.list.length > 0 && !juejinStore.search.finished;
  }
  return currentFeed.value.list.length > 0 && !currentFeed.value.finished;
});

// loading / error 用 ref 单独管理（响应式）
const recommendLoading = ref(false);
const latestLoading = ref(false);
const recommendError = ref(false);
const latestError = ref(false);

// 回到顶部的滚动容器 ref
const juejinPageRef = ref<HTMLElement>();

function getLoading(tab: "recommend" | "latest") {
  return tab === "recommend" ? recommendLoading.value : latestLoading.value;
}
function getError(tab: "recommend" | "latest") {
  return tab === "recommend" ? recommendError.value : latestError.value;
}
function setLoading(tab: "recommend" | "latest", val: boolean) {
  if (tab === "recommend") recommendLoading.value = val;
  else latestLoading.value = val;
}
function setError(tab: "recommend" | "latest", val: boolean) {
  if (tab === "recommend") recommendError.value = val;
  else latestError.value = val;
}

// ---- 搜索 ----
const searchKeyword = ref("");
const isSearchMode = computed(() => juejinStore.search.keyword.length > 0);

function performSearch(): void {
  const kw = searchKeyword.value.trim();
  if (!kw) {
    exitSearch();
    return;
  }
  juejinStore.resetSearch();
  juejinStore.search.keyword = kw;
  juejinStore.search.loading = true;
  juejinStore.search.error = false;
  searchJuejin({ keyword: kw, cursor: "0", limit: 20 })
    .then((json) => {
      if (json.err_no !== 0) throw new Error(json.err_msg || "err");
      const items: JuejinArticle[] = (json.data || []).map((it: any) =>
        mapItem({ item_info: it.result_model })
      );
      const hasMore = json.has_more === 1 || json.has_more === true;
      juejinStore.appendSearch(items, json.cursor || "", hasMore);
    })
    .catch(() => {
      juejinStore.search.error = true;
    })
    .finally(() => {
      juejinStore.search.loading = false;
    });
}

function loadMoreSearch(): Promise<void> {
  const s = juejinStore.search;
  if (s.loading || s.finished || !s.keyword) return Promise.resolve();
  s.loading = true;
  s.error = false;
  return searchJuejin({ keyword: s.keyword, cursor: s.cursor, limit: 20 })
    .then((json) => {
      if (json.err_no !== 0) throw new Error(json.err_msg || "err");
      const items: JuejinArticle[] = (json.data || []).map((it: any) =>
        mapItem({ item_info: it.result_model })
      );
      const hasMore = json.has_more === 1 || json.has_more === true;
      juejinStore.appendSearch(items, json.cursor || "", hasMore);
    })
    .catch(() => {
      s.error = true;
    })
    .finally(() => {
      s.loading = false;
    });
}

function exitSearch(): void {
  searchKeyword.value = "";
  juejinStore.resetSearch();
}

const isElectron = typeof window !== "undefined" && (window as any).__IS_ELECTRON__ === true;
const JUEJIN_API_BASE = import.meta.env.VITE_JUEJIN_API_BASE || "https://api.juejin.cn";
const RECOMMEND_URL =
  "https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed?aid=2608&uuid=7204388692608828987&spider=0";

async function requestJuejin(url: string, body: Record<string, unknown>): Promise<any> {
  return requestJuejinGeneric({ url, method: "POST", body });
}

interface RequestOptions {
  url: string;
  method: "POST" | "GET";
  body?: Record<string, unknown>;
  params?: Record<string, string | number>;
}

async function requestJuejinGeneric(opts: RequestOptions): Promise<any> {
  let fullUrl = opts.url;
  if (opts.params) {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.params)) searchParams.set(k, String(v));
    const sep = fullUrl.includes("?") ? "&" : "?";
    fullUrl = fullUrl + sep + searchParams.toString();
  }
  if (isElectron && (window as any).__fileBridge?.juejinFetch) {
    const result = await (window as any).__fileBridge.juejinFetch({
      url: fullUrl,
      method: opts.method,
      body: opts.body
    });
    if (!result.ok) throw new Error(result.error || "fetch failed");
    return result.data;
  }
  const target = JUEJIN_API_BASE + fullUrl.replace("https://api.juejin.cn", "");
  const fetchOpts: RequestInit = { method: opts.method };
  if (opts.method === "POST") {
    fetchOpts.headers = { "Content-Type": "application/json" };
    fetchOpts.body = JSON.stringify(opts.body);
  }
  const resp = await fetch(target, fetchOpts);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

async function searchJuejin(params: {
  keyword: string;
  cursor: string;
  limit: number;
}): Promise<any> {
  return requestJuejinGeneric({
    url: "https://api.juejin.cn/search_api/v1/search",
    method: "GET",
    params: {
      aid: 2608,
      uuid: "7204388692608828987",
      spider: 0,
      query: params.keyword,
      id_type: 0,
      cursor: params.cursor,
      limit: params.limit,
      search_type: 0,
      sort_type: 0,
      version: 1
    }
  });
}

function mapItem(item: any): JuejinArticle {
  const info = item.item_info ?? item;
  const article = info.article_info ?? {};
  const author = info.author_user_info ?? {};
  const tags = (info.tags ?? []).map((tag: any) => ({
    tag_name: tag.tag_name,
    color: tag.color || ""
  }));
  const mapped: JuejinArticle = {
    article_id: article.article_id || info.article_id,
    title: article.title || "无标题",
    brief_content: article.brief_content || "",
    web_html_content: article.web_html_content || article.content || "",
    cover_image: article.cover_image || "",
    view_count: article.view_count || 0,
    digg_count: article.digg_count || 0,
    comment_count: article.comment_count || 0,
    user_name: author.user_name || "掘金作者",
    tags
  };
  // 始终缓存文章元数据（即使没有正文），供详情页立即展示
  putJuejinArticle(mapped);
  return mapped;
}

// 加载更多（追加到 store）
async function loadMore(tab: "recommend" | "latest"): Promise<void> {
  const feed = tab === "recommend" ? juejinStore.recommend : juejinStore.latest;
  if (getLoading(tab) || feed.finished) return;
  setLoading(tab, true);
  setError(tab, false);
  try {
    const json = await requestJuejin(RECOMMEND_URL, {
      id_type: 2,
      client_type: 2608,
      sort_type: tab === "recommend" ? 200 : 300,
      cursor: feed.cursor,
      limit: 20
    });
    if (json.err_no !== 0) throw new Error(json.err_msg || "err");
    const items: JuejinArticle[] = (json.data || []).map(mapItem);
    feed.list.push(...items);
    const hasMore = json.has_more === 1 || json.has_more === true;
    feed.cursor = json.cursor || String(Number(feed.cursor) + items.length);
    if (!hasMore || items.length === 0) feed.finished = true;
  } catch {
    setError(tab, true);
  } finally {
    setLoading(tab, false);
  }
}

function onTabChange(key: string | number): void {
  activeTab.value = key as "recommend" | "latest";
  const tab = activeTab.value;
  const feed = tab === "recommend" ? juejinStore.recommend : juejinStore.latest;
  // 首次切换到该 tab 且无数据时自动加载
  if (!feed.list.length && !getLoading(tab) && !getError(tab)) {
    loadMore(tab);
  }
  // 切换 tab 后重新观察哨兵
  nextTick(() => observeSentinel());
}

// 点击卡片跳转，同时把当前文章数据注入全局缓存（putJuejinArticle 已在 mapItem 做过）
function openArticle(article: JuejinArticle): void {
  router.push(`/juejin/${article.article_id}`);
}

// 刷新当前 tab
function refreshCurrent(): void {
  const tab = activeTab.value;
  const feed = tab === "recommend" ? juejinStore.recommend : juejinStore.latest;
  feed.list = [];
  feed.cursor = "0";
  feed.finished = false;
  loadMore(tab);
}

// 无限滚动：IntersectionObserver + 哨兵元素
let sentinelObserver: IntersectionObserver | null = null;
const sentinelEl = ref<HTMLElement | null>(null);

function setupObserver(): void {
  sentinelObserver?.disconnect();
  sentinelObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (isSearchMode.value) loadMoreSearch();
          else loadMore(activeTab.value);
          break;
        }
      }
    },
    { threshold: 0.1 }
  );
  observeSentinel();
}

function observeSentinel(): void {
  nextTick(() => {
    if (sentinelObserver) {
      // 先取消全部观察，再重新观察新的哨兵
      sentinelObserver.disconnect();
      if (sentinelEl.value) {
        sentinelObserver.observe(sentinelEl.value);
      }
    }
  });
}

watch(activeTab, () => {
  observeSentinel();
});

onMounted(() => {
  if (!juejinStore.recommend.list.length) {
    loadMore("recommend");
  }
  setupObserver();
});

// keep-alive 恢复时重新挂上滚动哨兵
onActivated(() => {
  observeSentinel();
});

onDeactivated(() => {
  sentinelObserver?.disconnect();
});

onBeforeUnmount(() => {
  sentinelObserver?.disconnect();
});
</script>

<template>
  <div ref="juejinPageRef" class="juejin-page">
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

      <!-- Tabs + 搜索框 + 刷新按钮 -->
      <div class="juejin-tabs-bar">
        <NTabs type="line" animated :value="activeTab" @update:value="onTabChange">
          <!-- 推荐 -->
          <NTabPane name="recommend" :tab="t('juejin.recommend')">
            <!-- 搜索中的结果头部 -->
            <div v-if="isSearchMode" class="search-banner">
              <span class="search-banner-text">
                <NIcon :size="14" :component="SearchOutline" />
                搜索 "<strong>{{ juejinStore.search.keyword }}</strong
                >" · 共 {{ juejinStore.search.list.length }} 条
              </span>
              <NButton text size="small" @click="exitSearch">
                <template #icon><NIcon :component="CloseCircleOutline" /></template>
                退出搜索
              </NButton>
            </div>
            <div class="list-wrap">
              <!-- 搜索错误提示 -->
              <NEmpty
                v-if="juejinStore.search.error && !juejinStore.search.list.length"
                description="搜索失败（可能受跨域限制）"
              >
                <template #extra>
                  <NButton size="small" @click="performSearch">重试</NButton>
                </template>
              </NEmpty>
              <!-- 搜索空结果 -->
              <NEmpty
                v-else-if="
                  !juejinStore.search.loading &&
                  juejinStore.search.finished &&
                  !juejinStore.search.list.length &&
                  isSearchMode
                "
                description="暂无搜索结果"
              />
              <!-- 搜索瀑布流 -->
              <div v-else-if="isSearchMode && juejinStore.search.list.length" class="waterfall">
                <span
                  v-for="article in juejinStore.search.list"
                  :key="'search-' + article.article_id"
                  class="waterfall-item"
                >
                  <JuejinCard :article="article" @click="openArticle(article)" />
                </span>
              </div>
              <!-- 搜索 loading 行 -->
              <div
                v-if="isSearchMode && juejinStore.search.loading && !juejinStore.search.list.length"
                class="search-init-loading"
              >
                <!-- <NSkeleton height="16px" width="200px" :sharp="false" /> -->
                <n-spin size="small" />
              </div>

              <!-- 默认推荐瀑布流 (非搜索模式) -->
              <template v-if="!isSearchMode">
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
              </template>

              <!-- loading -->
              <div
                class="list-footer"
                v-if="
                  (getLoading('recommend') && !isSearchMode) ||
                  (isSearchMode && juejinStore.search.loading && juejinStore.search.list.length)
                "
              >
                <!-- <NSkeleton height="16px" width="120px" :sharp="false" /> -->
                <n-spin size="small" />
              </div>
              <!-- 没有更多了 -->
              <NEmpty
                v-else-if="
                  !isSearchMode &&
                  juejinStore.recommend.finished &&
                  juejinStore.recommend.list.length
                "
                :show-icon="false"
                description="没有更多了"
              />
              <NEmpty
                v-else-if="
                  isSearchMode && juejinStore.search.finished && juejinStore.search.list.length
                "
                :show-icon="false"
                description="没有更多了"
              />
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
                <n-spin size="small" />
                <!-- <NSkeleton height="16px" width="120px" :sharp="false" /> -->
              </div>
              <NEmpty
                v-else-if="juejinStore.latest.finished && juejinStore.latest.list.length"
                :show-icon="false"
                description="没有更多了"
              />
            </div>
          </NTabPane>
          <template #suffix>
            <!-- 搜索框（位于刷新按钮左侧） -->
            <NInput
              class="search-input"
              clearable
              round
              size="small"
              placeholder="搜索掘金文章..."
              v-model:value="searchKeyword"
              @keyup.enter="performSearch"
              @clear="exitSearch"
            >
              <template #prefix>
                <NIcon :size="14" :component="SearchOutline" />
              </template>
            </NInput>
            <!-- 刷新按钮 -->
            <NButton
              quaternary
              circle
              size="small"
              class="refresh-btn"
              @click="refreshCurrent"
              title="刷新"
            >
              <NIcon :size="16"><RefreshOutline /></NIcon>
            </NButton>
          </template>
        </NTabs>
      </div>

      <!-- 无限滚动哨兵 -->
      <div ref="sentinelEl" class="sentinel" v-if="showSentinel"></div>
    </NCard>
  </div>

  <n-back-top :listen-to="juejinPageRef" :right="32" :bottom="40" :visibility-height="300" />
</template>

<style lang="less" scoped>
.juejin-page {
  width: 100%;
  max-width: 1100px;
  min-width: 600px;
  height: 100%;
  overflow-y: auto;
}

.page-card {
  display: block;
  width: 100%;
  min-height: 60vh;
  box-sizing: border-box;
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

/* 搜索框 */
.search-input {
  width: 220px;
  flex-shrink: 0;
  align-self: center;
  margin-right: 0.5em;

  :deep(.n-input__prefix) {
    margin-right: 4px;
  }
}

/* 搜索结果头部 */
.search-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4em 0.2em 0.8em;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1em;
}

.search-banner-text {
  display: flex;
  align-items: center;
  gap: 0.4em;
  font-size: 13px;
  color: var(--color-text-secondary);

  strong {
    color: var(--color-primary);
  }
}

.search-init-loading {
  display: flex;
  justify-content: center;
  padding: 1em 0;
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
