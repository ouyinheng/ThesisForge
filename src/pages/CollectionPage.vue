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
import { AddOutline, SearchOutline, TrashOutline, EllipsisVerticalOutline } from '@vicons/ionicons5'
import AppPage from '@/components/AppPage.vue'
import BookmarkFormModal from '@/components/BookmarkFormModal.vue'
import { useCollectionStore } from '@/stores/collection'
import { useI18n } from '@/composables/useI18n'

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
    { key: store.ALL, label: t('collection.all'), count: store.bookmarks.length },
    { key: store.UNGROUPED, label: t('collection.ungrouped'), count: store.collectionCount(store.UNGROUPED) },
  ]
  tabs.push(
    ...store.sortedCollections.map((c) => ({
      key: c.id,
      label: `${c.icon} ${c.name}`,
      count: store.collectionCount(c.id),
      icon: c.icon,
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
</script>

<template>
  <AppPage>
    <div class="collection-page">
      <!-- 顶部栏 -->
      <div class="collect-header">
        <div class="header-left">
          <NH2 class="page-title">{{ t('collection.title') }}</NH2>
          <span class="bookmark-count">{{ store.bookmarks.length }}</span>
        </div>
        <div class="header-right">
          <NInput
            v-model:value="search"
            :placeholder="t('collection.search')"
            clearable
            size="small"
            style="width: 200px; margin-right: 8px"
            @input="resetPage"
          >
            <template #prefix>
              <NIcon :size="14"><SearchOutline /></NIcon>
            </template>
          </NInput>
          <NButton type="primary" size="small" @click="openAdd">
            <template #icon>
              <NIcon :size="14"><AddOutline /></NIcon>
            </template>
            {{ t('collection.addBookmark') }}
          </NButton>
        </div>
      </div>

      <!-- 分组 tabs -->
      <div class="group-tabs">
        <button
          v-for="tab in groupTabs"
          :key="tab.key"
          class="group-tab"
          :class="{ active: activeGroup === tab.key }"
          @click="activeGroup = tab.key; resetPage()"
        >
          <span>{{ tab.label }}</span>
          <span class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 书签网格 -->
      <div class="bookmarks-grid" v-if="pagedBookmarks.length">
        <div
          v-for="bm in pagedBookmarks"
          :key="bm.id"
          class="bm-card"
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
            <div class="bm-icon" :style="{ '--bg': groupColor(bm.groupId) }">
              <img
                v-if="bm.icon"
                :src="bm.icon"
                class="bm-favicon"
                alt=""
                @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
              />
              <span v-if="!bm.icon" class="bm-letter">{{ bm.letter }}</span>
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
            <div class="bm-url">{{ shortUrl(bm.url) }}</div>
          </a>

          <!-- 删除按钮（卡片右下角） -->
          <button
            class="bm-del"
            :title="t('collection.delete')"
            @click="confirmDelete(bm.id)"
          >
            <NIcon :size="11"><TrashOutline /></NIcon>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <NEmpty
        v-else
        class="empty-state"
        :description="search ? t('collection.noResults') : t('collection.empty')"
      />

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <NButton
          size="small"
          tertiary
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          ‹
        </NButton>
        <span class="page-indicator">{{ currentPage }} / {{ totalPages }}</span>
        <NButton
          size="small"
          tertiary
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          ›
        </NButton>
      </div>

      <!-- 表单弹窗 -->
      <BookmarkFormModal ref="formRef" v-model:show="showForm" />
    </div>
  </AppPage>
</template>

<style scoped>
.collection-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── 顶部栏 ────────────────────────────────────────── */
.collect-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}
.header-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.page-title {
  margin: 0;
  font-size: var(--fs-xl);
  font-weight: 600;
}
.bookmark-count {
  font-size: var(--fs-sm);
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  padding: 2px 8px;
  border-radius: 999px;
}
.header-right {
  display: flex;
  align-items: center;
}

/* ── 分组 tabs ──────────────────────────────────────── */
.group-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.group-tabs::-webkit-scrollbar {
  display: none;
}
.group-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  font-size: var(--fs-sm);
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.group-tab:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}
.group-tab.active {
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-color: var(--color-accent-light);
}
.tab-count {
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-tertiary);
}
.group-tab.active .tab-count {
  background: var(--color-accent);
  color: #fff;
}

/* ── 书签网格 ───────────────────────────────────────── */
.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
}

/* ── 书签卡片 ───────────────────────────────────────── */
.bm-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px 10px;
  border-radius: 12px;
  background: var(--color-bg-card, var(--color-bg-secondary));
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s, border-color 0.2s;
  overflow: hidden;
}
.bm-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--color-accent-light);
}

/* hover 显示右上角操作 */
.bm-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1;
}
.bm-card:hover .bm-actions {
  opacity: 1;
}
.bm-action-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--color-bg-tertiary);
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-text-secondary);
}
.bm-action-btn:hover {
  background: var(--color-accent-light);
  color: var(--color-accent);
}

/* 删除按钮 */
.bm-del {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  z-index: 1;
}
.bm-card:hover .bm-del {
  opacity: 1;
}
.bm-del:hover {
  color: #d12f2f;
  background: rgba(209, 47, 47, 0.08);
}

/* 链接区域 */
.bm-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
  width: 100%;
}

/* 图标 */
.bm-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--bg, var(--color-accent-light));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  margin-bottom: 8px;
  transition: transform 0.2s;
}
.bm-card:hover .bm-icon {
  transform: scale(1.08);
}
.bm-favicon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}
.bm-letter {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
}

/* 标题 */
.bm-title {
  font-size: var(--fs-sm);
  font-weight: 500;
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
  margin-top: 2px;
}

/* ── 空状态 ─────────────────────────────────────────── */
.empty-state {
  padding: 80px 0;
}

/* ── 分页 ───────────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 0 8px;
}
.page-indicator {
  font-size: var(--fs-sm);
  color: var(--color-text-secondary);
  min-width: 48px;
  text-align: center;
}
</style>
