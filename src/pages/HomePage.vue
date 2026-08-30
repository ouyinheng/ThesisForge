<script setup lang="ts">
defineOptions({ name: "home" })
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { NH1, NH3, NText, NTag, NDivider, NIcon, NButton } from 'naive-ui'
import {
  DocumentTextOutline,
  TimeOutline,
  LibraryOutline,
  BarChartOutline,
  TrendingUpOutline,
} from '@vicons/ionicons5'
import { useI18n } from '@/composables/i18n/useI18n'
import { useBlogStore } from '@/stores/blog'
import { useSettingsStore } from '@/stores/settings'
import { useRouter } from 'vue-router'
// 内容区容器
import AppPage from '@/components/app/AppPage.vue'

const { t } = useI18n()
const blogStore = useBlogStore()
const settings = useSettingsStore()
const router = useRouter()

// 时钟
const now = ref(new Date())
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))

const timeStr = computed(() => {
  return now.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const dateStr = computed(() => {
  return now.value.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
})

// 问候语
const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 6) return t('home.greetingEvening')
  if (h < 12) return t('home.greetingMorning')
  if (h < 14) return t('home.greetingAfternoon')
  if (h < 18) return t('home.greetingAfternoon')
  if (h < 22) return t('home.greetingEvening')
  return t('home.greetingEvening')
})

// 文章统计
const totalArticles = computed(() => blogStore.articleMetas.length)
const totalTags = computed(() => blogStore.allTags.length)
const weekCount = computed(() => blogStore.weekCount)

const activeDays = computed(() => {
  const nowTime = Date.now()
  const map = blogStore.activityMap
  let days = 0
  for (const key of Object.keys(map)) {
    const t = new Date(key + 'T00:00:00').getTime()
    if (nowTime - t <= 30 * 86400000 && nowTime - t >= 0) days++
  }
  return days
})

// 写作活跃度热力图：最近 13 周（91 天），每列=一周，行=周日..周六
const activityWeeks = computed(() => {
  const map = blogStore.activityMap
  const today = new Date()
  const day = today.getDay() // 0=Sun
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  start.setDate(today.getDate() - day - 12 * 7) // 13 周前的周日
  const cells: Array<{ key: string; count: number; level: number }> = []
  for (let i = 0; i < 13 * 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    const count = map[key] || 0
    const level = count === 0 ? 0 : count >= 4 ? 3 : count >= 2 ? 2 : 1
    cells.push({ key, count, level })
  }
  return cells
})

// 最近文章（扩展为 5 条）
const recentArticles = computed(() => {
  return [...blogStore.articleMetas]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
})

// 快捷操作
function goWrite() { router.push('/editor') }
function goPapers() { router.push('/papers') }
function goArticle(id: string) { router.push(`/article/${id}`) }

const version = '1.0.0'
</script>

<template>
  <AppPage>
    <div class="dashboard">
    <!-- 顶部欢迎区 -->
    <section class="dashboard-hero">
      <div class="hero-left">
        <div class="hero-greeting">
          <NH1 class="hero-title">{{ greeting }}</NH1>
          <NText v-if="settings.nickname" class="hero-nickname">，{{ settings.nickname }}</NText>
        </div>
        <NText class="hero-subtitle">{{ dateStr }}</NText>
        <NText class="hero-time">{{ timeStr }}</NText>
      </div>
    </section>

    <!-- 数据统计：4 卡 -->
    <section class="dashboard-stats">
      <div class="stat-card">
        <NIcon :size="24" class="stat-icon"><DocumentTextOutline /></NIcon>
        <div class="stat-content">
          <span class="stat-value">{{ totalArticles }}</span>
          <span class="stat-label">{{ t('home.statArticles') }}</span>
        </div>
      </div>
      <div class="stat-card">
        <NIcon :size="24" class="stat-icon"><LibraryOutline /></NIcon>
        <div class="stat-content">
          <span class="stat-value">{{ totalTags }}</span>
          <span class="stat-label">{{ t('home.statTags') }}</span>
        </div>
      </div>
      <div class="stat-card">
        <NIcon :size="24" class="stat-icon"><TrendingUpOutline /></NIcon>
        <div class="stat-content">
          <span class="stat-value">{{ weekCount }}</span>
          <span class="stat-label">{{ t('home.statWeek') }}</span>
        </div>
      </div>
      <div class="stat-card">
        <NIcon :size="24" class="stat-icon"><BarChartOutline /></NIcon>
        <div class="stat-content">
          <span class="stat-value">{{ activeDays }}</span>
          <span class="stat-label">{{ t('home.statActiveDays') }}</span>
        </div>
      </div>
    </section>

    <!-- 最近文章 + 写作活跃度 -->
    <div class="dashboard-grid">
      <!-- 最近文章 -->
      <section class="dashboard-panel">
        <NH3 class="panel-title">
          <NIcon :size="18"><TimeOutline /></NIcon>
          {{ t('home.recent') }}
        </NH3>
        <NDivider :style="{ margin: '8px 0 12px' }" />
        <div class="recent-list" v-if="recentArticles.length">
          <article
            class="recent-item"
            v-for="article in recentArticles"
            :key="article.id"
            @click="goArticle(article.id)"
          >
            <div class="recent-main">
              <NText class="recent-title">{{ article.title }}</NText>
              <NText depth="3" class="recent-meta">{{ article.updatedAt?.slice(0, 10) }}</NText>
            </div>
            <div class="recent-tags" v-if="article.tags.length">
              <NTag v-for="tag in article.tags.slice(0, 2)" :key="tag" size="tiny" :bordered="false">
                {{ tag }}
              </NTag>
            </div>
          </article>
        </div>
        <NText depth="3" v-else :style="{ textAlign: 'center', padding: '24px 0', display: 'block' }">
          {{ t('home.recentEmpty') }}
          <NButton text type="primary" size="small" @click="goWrite">{{ t('home.recentCreate') }}</NButton>
        </NText>
      </section>

      <!-- 写作活跃度 -->
      <section class="dashboard-panel">
        <div class="panel-title-row">
          <NH3 class="panel-title">
            <NIcon :size="18"><BarChartOutline /></NIcon>
            {{ t('home.activity') }}
          </NH3>
          <NButton text size="tiny" type="primary" @click="goPapers">{{ t('home.activityViewAll') }} →</NButton>
        </div>
        <NDivider :style="{ margin: '8px 0 12px' }" />
        <div class="heatmap" v-if="activityWeeks.length">
          <div class="heatmap-cell" v-for="cell in activityWeeks" :key="cell.key"
               :class="'level-' + cell.level"
               :title="`${cell.key}: ${cell.count}`"></div>
        </div>
        <NText depth="3" v-else :style="{ display: 'block', padding: '12px 0' }">{{ t('home.activityEmpty') }}</NText>
        <div class="heatmap-legend">
          <span class="legend-label">{{ t('home.activity') }}</span>
          <div class="heatmap-cell level-0"></div>
          <div class="heatmap-cell level-1"></div>
          <div class="heatmap-cell level-2"></div>
          <div class="heatmap-cell level-3"></div>
        </div>
      </section>
    </div>

    <!-- Footer 状态条 -->
    <footer class="dashboard-footer">
      <span>{{ t('home.footerSaved') }} {{ totalArticles }} {{ t('home.statArticles') }}</span>
      <span class="footer-dot"></span>
      <span class="footer-synced"><span class="sync-dot"></span>{{ t('home.footerSynced') }}</span>
      <span class="footer-dot"></span>
      <span>{{ t('home.footerVersion') }} {{ version }}</span>
    </footer>
  </div>
  </AppPage>
</template>

<style lang="less" scoped>
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
}

// 顶部欢迎区
.dashboard-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2em 0 1.5em;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1.5em;
}

.hero-title {
  font-family: var(--font-serif) !important;
  font-size: var(--fs-3xl);
  margin: 0 !important;
  line-height: 1.2;
  color: var(--color-text);
  display: inline;
}

.hero-greeting {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
}

.hero-nickname {
  font-family: var(--font-serif);
  font-size: var(--fs-2xl);
  font-weight: 500;
  color: var(--color-primary);
  line-height: 1.2;
}

.hero-subtitle {
  display: block;
  margin-top: 4px;
  font-size: var(--fs-sm);
  color: var(--color-text-tertiary);
}

.hero-time {
  display: block;
  margin-top: 8px;
  font-size: var(--fs-2xl);
  font-family: var(--font-mono);
  color: var(--color-primary);
  letter-spacing: 0.05em;
}

.weather-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
  }
}

.weather-icon {
  color: var(--color-primary);
}

.weather-info {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.weather-temp {
  font-family: var(--font-mono);
  font-size: var(--fs-xl);
  font-weight: 600;
  color: var(--color-text);
}

.weather-desc {
  font-size: var(--fs-sm);
  color: var(--color-text-secondary);
}

.weather-extra {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

// 数据统计 4 卡
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 1.5em;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast), box-shadow var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
    box-shadow: var(--shadow-sm);
  }
}

.stat-icon {
  color: var(--color-primary);
  opacity: 0.8;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: var(--fs-2xl);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.1;
}

.stat-label {
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

// 双栏栅格
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 1.5em;
}

.dashboard-panel {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 1.25em 1.5em;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 !important;

  :deep(.n-icon) {
    color: var(--color-primary);
  }
}

.panel-subtitle {
  margin: 1em 0 0.6em !important;
  font-size: var(--fs-base);
  color: var(--color-text-secondary);
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// 快捷创作主按钮
.primary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 0.5em;
}

// 工具箱
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);

  :deep(.n-icon) {
    color: var(--accent);
  }

  .action-name {
    font-size: var(--fs-xs);
    color: var(--color-text-secondary);
  }

  &:hover {
    border-color: var(--accent);
    background: var(--color-bg-tertiary);

    .action-name {
      color: var(--accent);
    }
  }
}

// 最近文章
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);

    .recent-title {
      color: var(--color-primary);
    }
  }
}

.recent-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.recent-title {
  font-size: var(--fs-base);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-meta {
  font-size: 11px;
  margin-top: 2px;
}

.recent-tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

// 写作活跃度热力图
.heatmap {
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: column;
  gap: 4px;
  margin-bottom: 10px;
}

.heatmap-cell {
  aspect-ratio: 1 / 1;
  border-radius: 2px;
  background: var(--color-bg-tertiary);
  transition: transform var(--transition-fast);

  &:hover {
    transform: scale(1.15);
  }
}

.heatmap-cell.level-0 { background: var(--color-bg-tertiary); }
.heatmap-cell.level-1 { background: var(--color-primary-light); }
.heatmap-cell.level-2 { background: #E97B7B; }
.heatmap-cell.level-3 { background: var(--color-primary); }

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);

  .heatmap-cell {
    width: 12px;
    height: 12px;
  }

  .legend-label {
    margin-right: 6px;
  }
}

// 每日一言
.dashboard-quote {
  display: flex;
  flex-direction: column;
  border-left: 3px solid var(--color-primary);
  position: relative;
}

.quote-icon {
  color: var(--color-primary);
  margin-bottom: 8px;
}

.quote-content {
  flex: 1;
}

.quote-text {
  display: block;
  font-family: var(--font-serif);
  font-size: var(--fs-base);
  line-height: 1.7;
  color: var(--color-text);
}

.quote-author {
  display: block;
  margin-top: 10px;
  text-align: right;
  font-size: var(--fs-xs);
}

.quote-refresh {
  align-self: flex-end;
  margin-top: 10px;
}

// Footer 状态条
.dashboard-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 1em;
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);
}

.footer-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  opacity: 0.5;
}

.footer-synced {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
}

// 响应式
@media (max-width: 1100px) {
  .dashboard-stats {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
