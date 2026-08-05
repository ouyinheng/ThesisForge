<script setup lang="ts">
defineOptions({ name: "novel-bookshelf" })
import { ref, computed, onMounted } from "vue"
import {
  NButton,
  NIcon,
  NInput,
  NForm,
  NFormItem,
  NModal,
  NSelect,
  NInputNumber,
  NTag,
  NEmpty,
  NPopconfirm,
  useMessage,
  NText,
} from "naive-ui"
import {
  CreateOutline,
  LibraryOutline,
  AddOutline,
  PencilOutline,
  TrashOutline,
  PinOutline,
  TimeOutline,
  ListOutline,
  BookOutline,
  StatsChartOutline,
  TrendingUpOutline,
} from "@vicons/ionicons5"
import { useRouter } from "vue-router"
import { useNovelStore, type NovelMeta } from "@/stores/novel"
import { useI18n } from "@/composables/i18n/useI18n"
import type { NovelStatus, CreateNovelDTO } from "@/types/novel"

const router = useRouter()
const { t } = useI18n()
const store = useNovelStore()
const message = useMessage()

const showModal = ref(false)
const modalEditing = ref<NovelMeta | null>(null)
const modalTitle = ref("")
const modalCategory = ref("")
const modalIntro = ref("")
const modalStatus = ref<NovelStatus>("draft")
const modalGoal = ref(2000)

// 今日进度目标取第一个作品的每日目标（无作品则默认 2000）
const todayGoal = computed(() => {
  const meta = store.sortedMetas[0]
  return meta ? meta.dailyGoal : 2000
})

const statusOptions = computed(() => [
  { label: t("novel.statusDraft"), value: "draft" },
  { label: t("novel.statusOngoing"), value: "ongoing" },
  { label: t("novel.statusFinished"), value: "finished" },
])

const categoryOptions = computed(() =>
  t("novel.categoryPresets")
    .split(/[、,，]/)
    .map((c) => ({ label: c, value: c }))
)

function openCreate() {
  modalEditing.value = null
  modalStatus.value = "draft"
  modalTitle.value = ""
  modalCategory.value = ""
  modalIntro.value = ""
  modalGoal.value = 2000
  showModal.value = true
}

function openEdit(meta: NovelMeta) {
  modalEditing.value = meta
  modalStatus.value = meta.status
  modalTitle.value = meta.title
  modalCategory.value = meta.category
  modalIntro.value = meta.intro
  modalGoal.value = meta.dailyGoal
  showModal.value = true
}

function submit() {
  const title = modalTitle.value.trim()
  if (!title) {
    message.warning(t("novel.enterTitle"))
    return
  }
  const data: CreateNovelDTO = {
    title,
    category: modalCategory.value,
    intro: modalIntro.value,
    status: modalStatus.value,
    dailyGoal: modalGoal.value,
  }
  if (modalEditing.value) {
    store.update(modalEditing.value.id, data)
    message.success(t("novel.updateSuccess"))
    showModal.value = false
  } else {
    const novel = store.create(data)
    message.success(t("novel.created"))
    showModal.value = false
    openNovel(novel.id)
  }
}

function openNovel(id: string) {
  router.push(`/novel/${id}`)
}

function handleDelete(id: string) {
  store.remove(id)
  message.success(t("novel.deleted"))
}

function statusTagType(status: NovelStatus): "default" | "info" | "success" {
  if (status === "ongoing") return "info"
  if (status === "finished") return "success"
  return "default"
}

function statusLabel(status: NovelStatus): string {
  if (status === "ongoing") return t("novel.statusOngoing")
  if (status === "finished") return t("novel.statusFinished")
  return t("novel.statusDraft")
}

function formatWords(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + t("novel.unitYi")
  if (n >= 10000) return (n / 10000).toFixed(1) + t("novel.unitWan")
  if (n >= 1000) return (n / 1000).toFixed(1) + t("novel.unitQian")
  return String(n)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}
</script>

<template>
  <div class="novel-bookshelf">
    <!-- ── 顶部统计区 ─────────────────────────────────── -->
    <section class="stats-row">
      <div class="stat-card">
        <NIcon :size="18" class="stat-icon icon-novel"><CreateOutline /></NIcon>
        <div class="stat-body">
          <span class="stat-num">{{ store.totalNovels }}</span>
          <span class="stat-label">{{ t("novel.statNovels") }}</span>
        </div>
      </div>
      <div class="stat-card">
        <NIcon :size="18" class="stat-icon icon-chapter"><ListOutline /></NIcon>
        <div class="stat-body">
          <span class="stat-num">{{ store.totalChapters }}</span>
          <span class="stat-label">{{ t("novel.statChapters") }}</span>
        </div>
      </div>
      <div class="stat-card">
        <NIcon :size="18" class="stat-icon icon-words"><BookOutline /></NIcon>
        <div class="stat-body">
          <span class="stat-num">{{ formatWords(store.totalWords) }}</span>
          <span class="stat-label">{{ t("novel.statWords") }}</span>
        </div>
      </div>
      <div class="stat-card today-card">
        <NIcon :size="18" class="stat-icon icon-today"><TrendingUpOutline /></NIcon>
        <div class="stat-body">
          <span class="stat-num">{{ store.todayWords }}</span>
          <span class="stat-label">{{ t("novel.statToday") }}</span>
          <div class="today-bar">
            <div class="today-bar-fill" :style="{ width: Math.min(100, (store.todayWords / todayGoal) * 100) + '%' }" />
          </div>
        </div>
      </div>
    </section>

    <!-- ── 工具栏 ─────────────────────────────────────── -->
    <div class="toolbar">
      <h2 class="page-title">{{ t("nav.novelBooks") }}</h2>
      <NButton type="primary" size="small" @click="openCreate">
        <template #icon><NIcon :size="14"><AddOutline /></NIcon></template>
        {{ t("novel.newNovel") }}
      </NButton>
    </div>

    <!-- ── 作品网格 ───────────────────────────────────── -->
    <div class="novel-grid" v-if="store.sortedMetas.length">
      <div v-for="meta in store.sortedMetas" :key="meta.id" class="novel-card" @click="openNovel(meta.id)">
        <div class="card-top">
          <div class="novel-cover" :class="'cover-' + (meta.id.charCodeAt(0) % 4)" @click.stop="router.push(`/novel/${meta.id}`)">
            <span class="cover-letter">{{ meta.title.charAt(0) }}</span>
          </div>
          <div class="novel-info">
            <h3 class="novel-title" @click="router.push(`/novel/${meta.id}`)">{{ meta.title }}</h3>
            <p class="novel-intro">{{ meta.intro || t("novel.noIntro") }}</p>
          </div>
          <button class="pin-btn" @click.stop="store.togglePin(meta.id)">
            <NIcon :size="16" :class="{ pinned: meta.pinned }"><PinOutline /></NIcon>
          </button>
        </div>

        <div class="meta-tags">
          <NTag v-if="meta.category" size="small" bordered round>{{ meta.category }}</NTag>
          <NTag :type="statusTagType(meta.status)" size="small" round bordered>
            {{ statusLabel(meta.status) }}
          </NTag>
        </div>

        <div class="card-stats">
          <div class="cs-item">
            <span class="cs-value">{{ formatWords(meta.words) }}</span>
            <span class="cs-label">{{ t("novel.statWordsShort") }}</span>
          </div>
          <div class="cs-divider" />
          <div class="cs-item">
            <span class="cs-value">{{ meta.chapterCount }}</span>
            <span class="cs-label">{{ t("novel.statChaptersShort") }}</span>
          </div>
          <div class="cs-divider" />
          <div class="cs-item">
            <span class="cs-value">{{ formatDate(meta.updatedAt) }}</span>
            <span class="cs-label"><NIcon :size="11"><TimeOutline /></NIcon> {{ t("novel.updatedAt") }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button class="card-action-btn" @click.stop="openEdit(meta)">
            <NIcon :size="14"><PencilOutline /></NIcon>
          </button>
          <NPopconfirm @positive-click="handleDelete(meta.id)" :positive-text="t('novel.confirm')" :negative-text="t('novel.cancel')">
            <template #trigger>
              <button class="card-action-btn del" @click.stop><NIcon :size="14"><TrashOutline /></NIcon></button>
            </template>
            {{ t("novel.deleteConfirm") }}
          </NPopconfirm>
        </div>
      </div>
    </div>

    <NEmpty v-else :description="t('novel.empty')" size="large" class="novel-empty">
      <template #extra>
        <NButton type="primary" size="small" @click="openCreate">
          <template #icon><NIcon :size="14"><AddOutline /></NIcon></template>
          {{ t("novel.newNovel") }}
        </NButton>
      </template>
    </NEmpty>

    <!-- ── 新建/编辑弹窗 ─────────────────────────────── -->
    <NModal
      v-model:show="showModal"
      preset="card"
      :style="{ width: '520px', maxWidth: '95vw' }"
      :bordered="false"
      size="medium"
      :mask-closable="true"
    >
      <template #header>
        <div class="modal-header">
          <div class="modal-icon"><NIcon :size="18"><CreateOutline /></NIcon></div>
          <h3 class="modal-title">{{ modalEditing ? t("novel.editNovel") : t("novel.newNovel") }}</h3>
        </div>
      </template>

      <NForm :label-placement="'top'" class="modal-form">
        <NFormItem :label="t('novel.title')">
          <NInput v-model:value="modalTitle" :placeholder="t('novel.titlePlaceholder')" autofocus />
        </NFormItem>

        <NFormItem :label="t('novel.category')">
          <NSelect
            v-model:value="modalCategory"
            :options="categoryOptions"
            :placeholder="t('novel.categoryPlaceholder')"
            filterable
            tag
            clearable
          />
        </NFormItem>

        <NFormItem :label="t('novel.status')">
          <NSelect v-model:value="modalStatus" :options="statusOptions" />
        </NFormItem>

        <NFormItem :label="t('novel.dailyGoal')">
          <NInputNumber v-model:value="modalGoal" :min="0" :step="500" style="width: 100%" />
        </NFormItem>

        <NFormItem :label="t('novel.intro')">
          <NInput v-model:value="modalIntro" type="textarea" :rows="3" :placeholder="t('novel.introPlaceholder')" />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="modal-footer">
          <NButton size="small" @click="showModal = false">{{ t("novel.cancel") }}</NButton>
          <NButton type="primary" size="small" :disabled="!modalTitle.trim()" @click="submit">
            {{ modalEditing ? t("novel.update") : t("novel.create") }}
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style lang="less" scoped>
.novel-bookshelf {
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px 8px 40px;
}

// ── 统计区 ──────────────────────────────────────
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }
}

.stat-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.stat-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-num {
  font-family: var(--font-mono);
  font-size: var(--fs-xl);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);
}

.today-card .today-bar {
  margin-top: 4px;
  height: 4px;
  width: 100%;
  max-width: 120px;
  background: var(--color-bg-tertiary);
  border-radius: 999px;
  overflow: hidden;

  .today-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), #F87171);
    border-radius: 999px;
    transition: width 0.3s ease;
  }
}

// ── 工具栏 ──────────────────────────────────────
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-family: var(--font-serif);
  font-size: var(--fs-xl);
  margin: 0;
  color: var(--color-text);
}

// ── 作品网格 ────────────────────────────────────
.novel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.novel-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.card-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.novel-cover {
  flex-shrink: 0;
}

.cover-letter {
  width: 52px;
  height: 68px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(160deg, #d12f2f, #7f1d1d);
  box-shadow: var(--shadow-sm);

  &.cover-0 { background: linear-gradient(160deg, #d12f2f, #7f1d1d); }
  &.cover-1 { background: linear-gradient(160deg, #2563eb, #1e3a8a); }
  &.cover-2 { background: linear-gradient(160deg, #059669, #064e3b); }
}

.novel-info {
  flex: 1;
  min-width: 0;
}

.novel-title {
  font-family: var(--font-serif);
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 4px;
  cursor: pointer;
  line-height: 1.3;

  &:hover { color: var(--color-primary); }
}

.novel-intro {
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pin-btn {
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  opacity: 0.4;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover { opacity: 1; }

  .pinned {
    color: #F59E0B;
    opacity: 1;
  }
}

.meta-tags {
  display: flex;
  gap: 6px;
}

.card-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px dashed var(--color-border);
}

.cs-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.cs-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border);
}

.cs-value {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-text);
}

.cs-label {
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

// ── 卡片操作 ────────────────────────────────────
.card-actions {
  position: absolute;
  top: 12px;
  right: 44px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.novel-card:hover .card-actions { opacity: 1; }

.card-action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-bg);
    color: var(--color-primary);
  }

  &.del:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
  }
}

.novel-empty {
  padding: 60px 0;
}

// ── 弹窗 ──────────────────────────────────────
.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--color-primary-light), #fecaca);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.modal-title {
  font-size: var(--fs-lg);
  font-weight: 600;
  margin: 0;
}

.modal-form {
  padding-top: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// ── 响应式 ──────────────────────────────────────
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .novel-grid {
    grid-template-columns: 1fr;
  }
}
</style>