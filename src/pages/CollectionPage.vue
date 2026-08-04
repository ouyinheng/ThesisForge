<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NInput,
  NButton,
  NIcon,
  NH2,
  NEmpty,
  NDropdown,
  useMessage,
} from 'naive-ui'
import { AddOutline, SearchOutline, TrashOutline, EllipsisVerticalOutline, BookmarkOutline, FolderOpenOutline, StarOutline } from '@vicons/ionicons5'
import AppPage from '@/components/app/AppPage.vue'
import BookmarkFormModal from '@/components/modal/BookmarkFormModal.vue'
import { useCollectionStore } from '@/stores/collection'
import { useI18n } from '@/composables/i18n/useI18n'

const { t } = useI18n()
const store = useCollectionStore()
const message = useMessage()

// ── 状态 ──────────────────────────────────────────────
const search = ref('')
const activeGroup = ref(store.ALL)  // '__all__' | '__ungrouped__' | collectionId
const currentPage = ref(1)
const pageSize = 24
const showForm = ref(false)
const formRef = ref<InstanceType<typeof BookmarkFormModal> | null>(null)
const manageMode = ref(false)

// ── 计算属性 ──────────────────────────────────────────
const filteredBookmarks = computed(() => {
  const all = store.bookmarksByGroup(activeGroup.value)
  if (!search.value.trim()) return all
  const kw = search.value.trim().toLowerCase()
  return all.filter(
    (b) => b.title.toLowerCase().includes(kw) || b.url.toLowerCase().includes(kw)
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredBookmarks.value.length / pageSize)))

const pagedBookmarks = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredBookmarks.value.slice(start, start + pageSize)
})

// 重置页码当筛选条件变化
function resetPage() {
  currentPage.value = 1
}

// ── 分组 tabs ─────────────────────────────────────────
interface GroupTab {
  key: string
  label: string
  count: number
  icon?: string
  color?: string
}

const groupTabs = computed<GroupTab[]>(() => {
  const tabs: GroupTab[] = [
    { key: store.ALL, label: t('collection.all'), count: store.bookmarks.length, icon: '📚' },
    { key: store.UNGROUPED, label: t('collection.ungrouped'), count: store.collectionCount(store.UNGROUPED), icon: '📄' },
  ]
  tabs.push(
    ...store.sortedCollections.map((c) => ({
      key: c.id,
      label: `${c.icon} ${c.name}`,
      count: store.collectionCount(c.id),
      icon: c.icon,
      color: c.color,
    }))
  )
  return tabs
})

// ── 操作 ──────────────────────────────────────────────
function openAdd() {
  showForm.value = true
  formRef.value?.openAdd()
}

function openEdit(id: string) {
  showForm.value = true
  formRef.value?.openEdit(id)
}

function confirmDelete(id: string) {
  store.deleteBookmark(id)
  message.success(t('collection.deleted'))
  // 如果当前页无数据且不是第一页，回退一页
  if (pagedBookmarks.value.length === 0 && currentPage.value > 1) {
    currentPage.value--
  }
}

function goToUrl(url: string, e: MouseEvent) {
  e.preventDefault()
  if (manageMode.value) return
  openLink(url)
}

function openLink(url: string) {
  const href = url.startsWith('http') ? url : `https://${url}`
  window.open(href, '_blank', 'noopener')
}

/** 截短域名 */
function shortUrl(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url.length > 30 ? url.slice(0, 30) + '…' : url
  }
}

/** 获取当前分组颜色 */
function groupColor(id: string): string {
  const c = store.collections.find((c) => c.id === id)
  return c?.color || 'var(--color-accent)'
}

/** 所有书签数量 */
const totalCount = computed(() => store.bookmarks.length)

/** 当前分组名称 */
const currentGroupName = computed(() => {
  if (activeGroup.value === store.ALL) return t('collection.all')
  if (activeGroup.value === store.UNGROUPED) return t('collection.ungrouped')
  const c = store.collections.find(c => c.id === activeGroup.value)
  return c ? c.name : ''
})
</script>

<template>
  <AppPage>
    <div class="collection-page">
      <!-- 顶部栏 -->
      <div class="collect-header">
        <div class="header-left">
          <div class="title-group">
            <div class="title-icon-wrap">
              <NIcon :size="18"><BookmarkOutline /></NIcon>
            </div>
            <NH2 class="page-title">{{ t('collection.title') }}</NH2>
          </div>
          <span class="bookmark-count">
            <NIcon :size="12"><FolderOpenOutline /></NIcon>
            {{ totalCount }} 个书签
          </span>
        </div>
        <div class="header-right">
          <div class="search-wrapper">
            <NInput
              v-model:value="search"
              :placeholder="t('collection.search')"
              clearable
              size="small"
              class="search-input"
              @input="resetPage"
            >
              <template #prefix>
                <NIcon :size="14" class="search-icon"><SearchOutline /></NIcon>
              </template>
            </NInput>
          </div>
          <NButton type="primary" size="small" @click="openAdd" class="btn-add">
            <template #icon>
              <NIcon :size="14"><AddOutline /></NIcon>
            </template>
            {{ t('collection.addBookmark') }}
          </NButton>
        </div>
      </div>

      <!-- 分组 tabs -->
      <div class="group-tabs-wrapper">
        <div class="group-tabs">
          <button
            v-for="tab in groupTabs"
            :key="tab.key"
            class="group-tab"
            :class="{ active: activeGroup === tab.key }"
            :style="activeGroup === tab.key && tab.color ? { '--tab-accent': tab.color } : undefined"
            @click="activeGroup = tab.key; resetPage()"
          >
            <span class="tab-label">{{ tab.label }}</span>
            <span class="tab-count" :class="{ 'active-count': activeGroup === tab.key }">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <!-- 书签网格 -->
      <TransitionGroup name="bookmark-card" tag="div" class="bookmarks-grid" v-if="pagedBookmarks.length">
        <div
          v-for="bm in pagedBookmarks"
          :key="bm.id"
          class="bm-card"
          :style="{ '--card-accent': groupColor(bm.groupId) }"
        >
          <!-- 操作按钮 -->
          <div class="bm-actions">
            <NDropdown
              trigger="click"
              :options="[
                { label: t('collection.open'), key: 'open' },
                { label: t('collection.edit'), key: 'edit' },
                { label: t('collection.delete'), key: 'delete' },
              ]"
              @select="(key) => {
                if (key === 'open') openLink(bm.url)
                else if (key === 'edit') openEdit(bm.id)
                else confirmDelete(bm.id)
              }"
            >
              <button class="bm-action-btn" @click.stop>
                <NIcon :size="12"><EllipsisVerticalOutline /></NIcon>
              </button>
            </NDropdown>
          </div>

          <!-- 图标 -->
          <a
            class="bm-link"
            :href="bm.url"
            target="_blank"
            rel="noopener"
            @click="goToUrl(bm.url, $event)"
          >
            <div class="bm-icon">
              <div class="bm-icon-inner">
                <img
                  v-if="bm.icon"
                  :src="bm.icon"
                  class="bm-favicon"
                  alt=""
                  @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
                />
                <span v-if="!bm.icon" class="bm-letter">{{ bm.letter }}</span>
              </div>
              <div class="bm-icon-ring"></div>
            </div>
          </a>

          <!-- 标题 & URL -->
          <a
            class="bm-link"
            :href="bm.url"
            target="_blank"
            rel="noopener"
            :title="bm.title"
            @click="goToUrl(bm.url, $event)"
          >
            <div class="bm-title">{{ bm.title }}</div>
            <div class="bm-url">
              <NIcon :size="10"><StarOutline /></NIcon>
              {{ shortUrl(bm.url) }}
            </div>
          </a>

          <!-- 删除按钮（卡片右下角） -->
          <button
            class="bm-del"
            :title="t('collection.delete')"
            @click.stop="confirmDelete(bm.id)"
          >
            <NIcon :size="11"><TrashOutline /></NIcon>
          </button>
        </div>
      </TransitionGroup>

      <!-- 空状态 -->
      <div v-else class="empty-wrapper">
        <div class="empty-state">
          <div class="empty-icon">
            <NIcon :size="48"><FolderOpenOutline /></NIcon>
          </div>
          <p class="empty-text">{{ search ? t('collection.noResults') : t('collection.empty') }}</p>
          <NButton
            v-if="!search"
            type="primary"
            size="small"
            class="empty-btn"
            @click="openAdd"
          >
            <template #icon><NIcon :size="14"><AddOutline /></NIcon></template>
            添加第一个书签
          </NButton>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <NButton
          size="small"
          tertiary
          :disabled="currentPage <= 1"
          @click="currentPage--"
          class="page-btn"
        >
          ‹
        </NButton>
        <span class="page-indicator">{{ currentPage }} / {{ totalPages }}</span>
        <NButton
          size="small"
          tertiary
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
          class="page-btn"
        >
          ›
        </NButton>
      </div>

      <!-- 表单弹窗 -->
      <BookmarkFormModal ref="formRef" v-model:show="showForm" />
    </div>
  </AppPage>
</template>

<style lang="less" scoped>
.collection-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ── 顶部栏 ──────────────────────────────────────────
.collect-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, #FECACA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.page-title {
  margin: 0;
  font-size: var(--fs-xl);
  font-weight: 600;
  font-family: var(--font-serif);
  letter-spacing: -0.01em;
}

.bookmark-count {
  font-size: var(--fs-sm);
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  padding: 4px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-wrapper {
  position: relative;
}

.search-input {
  width: 200px;
  transition: width 0.25s ease;

  &:focus-within {
    width: 260px;
  }
}

.search-icon {
  color: var(--color-text-tertiary);
}

.btn-add {
  :deep(.n-button__content) {
    gap: 4px;
  }
}

// ── 分组 tabs ────────────────────────────────────────
.group-tabs-wrapper {
  overflow: hidden;
}

.group-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 4px 2px 8px;
  scrollbar-width: none;
}
.group-tabs::-webkit-scrollbar {
  display: none;
}

.group-tab {
  --tab-accent: var(--color-primary);

  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: var(--fs-sm);
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.25s ease;
  font-weight: 500;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
    border-color: var(--tab-accent);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &.active {
    background: var(--tab-accent);
    color: #fff;
    border-color: var(--tab-accent);
    box-shadow: 0 3px 12px color-mix(in srgb, var(--tab-accent) 30%, transparent);
    transform: translateY(-1px);

    .tab-label {
      color: #fff;
    }
  }
}

.tab-label {
  transition: color 0.2s;
}

.tab-count {
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
  font-weight: 600;
  transition: all 0.2s;
}

.tab-count.active-count {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

// ── 书签网格 ─────────────────────────────────────────
.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  position: relative;
}

// ── 书签卡片 ─────────────────────────────────────────
.bm-card {
  --card-accent: var(--color-primary);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 10px 12px;
  border-radius: 14px;
  background: var(--color-bg-card, var(--color-bg));
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: cardFadeIn 0.4s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--card-accent);
    opacity: 0;
    transition: opacity 0.25s;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: transparent;

    &::before {
      opacity: 1;
    }

    .bm-icon-ring {
      transform: scale(1.05);
      opacity: 1;
    }

    .bm-icon-inner {
      transform: scale(1.08);
    }
  }
}

// hover 显示右上角操作
.bm-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.25s ease;
  z-index: 2;
}
.bm-card:hover .bm-actions {
  opacity: 1;
  transform: translateY(0);
}
.bm-action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--color-bg-tertiary);
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  backdrop-filter: blur(8px);
}
.bm-action-btn:hover {
  background: var(--card-accent);
  color: #fff;
  transform: scale(1.1);
}

// 删除按钮
.bm-del {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.25s ease;
  z-index: 2;
}
.bm-card:hover .bm-del {
  opacity: 1;
  transform: scale(1);
}
.bm-del:hover {
  color: #fff;
  background: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

// 链接区域
.bm-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
  width: 100%;
  gap: 2px;
}

// 图标
.bm-icon {
  position: relative;
  margin-bottom: 10px;
}

.bm-icon-inner {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--card-accent) 0%, color-mix(in srgb, var(--card-accent) 60%, white) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--card-accent) 25%, transparent);
}

.bm-icon-ring {
  position: absolute;
  inset: -3px;
  border-radius: 17px;
  border: 2px solid var(--card-accent);
  opacity: 0.3;
  transition: all 0.25s ease;
  pointer-events: none;
}

.bm-favicon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
}
.bm-letter {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

// 标题
.bm-title {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}
.bm-url {
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3px;
  margin-top: 1px;
}

// ── 空状态 ───────────────────────────────────────────
.empty-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: fadeIn 0.5s ease;
}

.empty-icon {
  color: var(--color-text-tertiary);
  opacity: 0.4;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: var(--fs-base);
  color: var(--color-text-tertiary);
  margin: 0;
}

.empty-btn {
  margin-top: 4px;
}

// ── 分页 ─────────────────────────────────────────────
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 0 8px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.1);
  }
}

.page-indicator {
  font-size: var(--fs-sm);
  color: var(--color-text-secondary);
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

// ── 动画 ───────────────────────────────────────────
.bookmark-card-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.bookmark-card-leave-active {
  transition: all 0.2s ease;
  position: absolute;
}
.bookmark-card-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}
.bookmark-card-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.bookmark-card-move {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// ── 响应式 ───────────────────────────────────────────
@media (max-width: 640px) {
  .collect-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-right {
    width: 100%;
  }

  .search-input {
    width: 100%;

    &:focus-within {
      width: 100%;
    }
  }

  .bookmarks-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }
}
</style>
