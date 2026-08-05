<script setup lang="ts">
defineOptions({ name: "novel-write" })
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  NButton,
  NIcon,
  NInput,
  NPopconfirm,
  useMessage,
  NTag,
} from "naive-ui"
import {
  ArrowBackOutline,
  AddOutline,
  TrashOutline,
  ArrowUpOutline,
  ArrowDownOutline,
  CreateOutline,
  TrendingUpOutline,
  CheckmarkCircleOutline,
  TimeOutline,
  ScanOutline,
  PencilOutline,
} from "@vicons/ionicons5"
import { useNovelStore } from "@/stores/novel"
import { useI18n } from "@/composables/i18n/useI18n"
import type { NovelChapter } from "@/types/novel"

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const store = useNovelStore()
const message = useMessage()

const novelId = route.params.id as string
const novel = ref(store.getById(novelId))
if (!novel.value) router.replace("/novel")

const chapters = computed(() => (novel.value ? [...novel.value.chapters].sort((a, b) => a.order - b.order) : []))
const currentChapterId = ref<string>("")
const chapterTitle = ref("")
const chapterContent = ref("")

const focusMode = ref(false)
const saveStatus = ref<"idle" | "saving" | "saved">("idle")
let saveTimer: ReturnType<typeof setTimeout> | null = null

// 章节重命名状态
const renamingId = ref("")
const renameDraft = ref("")

function startRename(ch: NovelChapter) {
  renamingId.value = ch.id
  renameDraft.value = ch.title
}

function commitRename(ch: NovelChapter) {
  const title = renameDraft.value.trim()
  if (title && title !== ch.title) renameChapterInput(ch, title)
  renamingId.value = ""
}

// ── 当前章节 ───────────────────────────────────────
const currentChapter = computed(() =>
  chapters.value.find((c) => c.id === currentChapterId.value)
)

const currentWords = computed(() => {
  const ch = currentChapter.value
  return ch ? ch.words : 0
})

const chapterGoal = computed(() => novel.value?.dailyGoal || 2000)
const goalPercent = computed(() => Math.min(100, Math.round((currentWords.value / chapterGoal.value) * 100)))

// ── 章节选择 ───────────────────────────────────────
function selectChapter(ch: NovelChapter) {
  commitSave()
  currentChapterId.value = ch.id
  chapterTitle.value = ch.title
  chapterContent.value = ch.content
  saveStatus.value = "saved"
}

function addNewChapter() {
  if (!novel.value) return
  const ch = store.addChapter(novel.value.id)
  if (ch) {
    novel.value = store.getById(novelId)
    currentChapterId.value = ch.id
    chapterTitle.value = ""
    chapterContent.value = ""
    saveStatus.value = "saved"
    nextTick(() => document.getElementById("chapter-title-input")?.focus())
  }
}

function deleteChapter(ch: NovelChapter) {
  if (!novel.value) return
  store.removeChapter(novel.value.id, ch.id)
  novel.value = store.getById(novelId)
  if (currentChapterId.value === ch.id) {
    const rest = chapters.value
    if (rest.length) selectChapter(rest[0])
    else {
      currentChapterId.value = ""
      chapterTitle.value = ""
      chapterContent.value = ""
    }
  }
  message.success(t("novel.chapterDeleted"))
}

function moveChapter(ch: NovelChapter, dir: -1 | 1) {
  if (!novel.value) return
  store.moveChapter(novel.value.id, ch.id, dir)
  novel.value = store.getById(novelId)
}

function renameChapterInput(ch: NovelChapter, newTitle: string) {
  if (!novel.value || !newTitle.trim()) return
  store.renameChapter(novel.value.id, ch.id, newTitle)
  novel.value = store.getById(novelId)
  if (ch.id === currentChapterId.value) chapterTitle.value = newTitle
}

// ── 自动保存 ───────────────────────────────────────
function scheduleSave() {
  saveStatus.value = "saving"
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(commitSave, 900)
}

function commitSave() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (!novel.value || !currentChapterId.value) return
  const before = chapterContent.value
  const stored = novel.value.chapters.find((c) => c.id === currentChapterId.value)
  if (!stored || (stored.content === before && stored.title === chapterTitle.value)) {
    saveStatus.value = "saved"
    return
  }
  store.updateChapter(novel.value.id, currentChapterId.value, before)
  if (stored.title !== chapterTitle.value) {
    store.renameChapter(novel.value.id, currentChapterId.value, chapterTitle.value)
  }
  novel.value = store.getById(novelId)
  saveStatus.value = "saved"
}

// 输入时调度保存
watch(chapterContent, () => scheduleSave())
watch(chapterTitle, () => scheduleSave())

// 离开页面时强制保存
function handleBeforeUnload() {
  commitSave()
}
onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload)
  if (novel.value) {
    if (chapters.value.length === 0) {
      const ch = store.addChapter(novel.value.id)
      novel.value = store.getById(novelId)
      if (ch) currentChapterId.value = ch.id
    } else {
      selectChapter(chapters.value[chapters.value.length - 1])
    }
  }
})
onBeforeUnmount(() => {
  commitSave()
  window.removeEventListener("beforeunload", handleBeforeUnload)
})

// ── 状态显示 ───────────────────────────────────────
function saveStatusLabel(): string {
  if (saveStatus.value === "saving") return t("novel.saving")
  if (saveStatus.value === "idle") return t("novel.notSaved")
  return t("novel.saved")
}

function statusLabel(status: string): string {
  if (status === "ongoing") return t("novel.statusOngoing")
  if (status === "finished") return t("novel.statusFinished")
  return t("novel.statusDraft")
}

function goBack() {
  commitSave()
  router.push("/novel")
}

function novelWords(): number {
  return novel.value ? novel.value.words : 0
}

function formatWords(n: number): string {
  if (n >= 100000000) return (n / 100000000).toFixed(1) + t("novel.unitYi")
  if (n >= 10000) return (n / 10000).toFixed(1) + t("novel.unitWan")
  if (n >= 1000) return (n / 1000).toFixed(1) + t("novel.unitQian")
  return String(n)
}
</script>

<template>
  <div v-if="novel" class="writer" :class="{ 'focus-mode': focusMode }">
    <!-- ── 顶部工具栏 ─────────────────────────────────── -->
    <header class="writer-toolbar">
      <button class="toolbar-icon-btn" @click="goBack" :title="t('novel.backToShelf')">
        <NIcon :size="18"><ArrowBackOutline /></NIcon>
      </button>

      <div class="novel-title-group">
        <span class="novel-title-text">{{ novel.title }}</span>
        <NTag size="tiny" :bordered="false" round class="novel-status-tag">
          {{ statusLabel(novel.status) }}
        </NTag>
      </div>

      <div class="toolbar-stats">
        <span class="tb-stat" :title="t('novel.statToday')">
          <NIcon :size="14"><TrendingUpOutline /></NIcon>
          <b class="tb-stat-num today">{{ store.todayWords }}</b>
          <span class="tb-stat-label">{{ t("novel.todayShort") }}</span>
        </span>
        <span class="tb-stat" :title="t('novel.statWords')">
          <NIcon :size="14"><CreateOutline /></NIcon>
          <b class="tb-stat-num">{{ formatWords(novelWords()) }}</b>
          <span class="tb-stat-label">{{ t("novel.wordsShort") }}</span>
        </span>
        <span class="tb-stat" :title="t('novel.statChapters')">
          <NIcon :size="14"><ScanOutline /></NIcon>
          <b class="tb-stat-num">{{ novel.chapters.length }}</b>
          <span class="tb-stat-label">{{ t("novel.chaptersShort") }}</span>
        </span>
      </div>

      <div class="toolbar-right">
        <span class="save-indicator" :class="saveStatus">
          <NIcon :size="13">
            <CheckmarkCircleOutline v-if="saveStatus === 'saved'" />
            <TimeOutline v-else />
          </NIcon>
          {{ saveStatusLabel() }}
        </span>
        <NButton size="tiny" :type="focusMode ? 'primary' : 'default'" @click="focusMode = !focusMode">
          {{ focusMode ? t("novel.exitFocus") : t("novel.focusMode") }}
        </NButton>
      </div>
    </header>

    <!-- ── 主体：章节列表 + 编辑器 ─────────────────────── -->
    <div class="writer-main">
      <!-- 左栏：章节列表 -->
      <aside class="chapter-panel" v-show="!focusMode">
        <div class="panel-header">
          <span class="panel-title">{{ t("novel.chapters") }}</span>
          <span class="panel-count">{{ chapters.length }}</span>
          <button class="panel-add" @click="addNewChapter" :title="t('novel.newChapter')">
            <NIcon :size="14"><AddOutline /></NIcon>
          </button>
        </div>

        <div class="chapter-list cus-scroll" v-if="chapters.length">
          <div
            v-for="(ch, idx) in chapters"
            :key="ch.id"
            class="chapter-item"
            :class="{ active: ch.id === currentChapterId }"
            @click="selectChapter(ch)"
          >
            <span class="chapter-no">{{ idx + 1 }}</span>
            <NInput
              v-if="renamingId === ch.id"
              v-model:value="renameDraft"
              size="tiny"
              autofocus
              @blur="commitRename(ch)"
              @keydown.enter="commitRename(ch)"
              @keydown.esc="renamingId = ''"
              @click.stop
            />
            <template v-else>
              <div class="chapter-main">
                <span class="chapter-title">{{ ch.title || t("novel.untitled") }}</span>
                <span class="chapter-words">{{ ch.words }}</span>
              </div>
              <div class="chapter-ops" @click.stop>
                <button class="op-btn" @click="startRename(ch)"><NIcon :size="11"><PencilOutline /></NIcon></button>
                <button class="op-btn" :disabled="idx === 0" @click="moveChapter(ch, -1)"><NIcon :size="11"><ArrowUpOutline /></NIcon></button>
                <button class="op-btn" :disabled="idx === chapters.length - 1" @click="moveChapter(ch, 1)"><NIcon :size="11"><ArrowDownOutline /></NIcon></button>
                <NPopconfirm @positive-click="deleteChapter(ch)" :positive-text="t('novel.confirm')" :negative-text="t('novel.cancel')">
                  <template #trigger>
                    <button class="op-btn del"><NIcon :size="11"><TrashOutline /></NIcon></button>
                  </template>
                  {{ t("novel.deleteChapterConfirm") }}
                </NPopconfirm>
              </div>
            </template>
          </div>
        </div>
        <div v-else class="panel-empty">
          <p>{{ t("novel.noChapters") }}</p>
          <NButton size="tiny" type="primary" @click="addNewChapter">
            <template #icon><NIcon :size="12"><AddOutline /></NIcon></template>
            {{ t("novel.newChapter") }}
          </NButton>
        </div>
      </aside>

      <!-- 中栏：编辑器 -->
      <main class="editor-panel">
        <template v-if="currentChapter">
          <div class="editor-header">
            <input
              id="chapter-title-input"
              v-model="chapterTitle"
              class="chapter-title-input"
              :placeholder="t('novel.chapterTitlePlaceholder')"
            />
            <div class="editor-words">
              <NIcon :size="14"><CreateOutline /></NIcon>
              <b>{{ currentWords }}</b>
              <span>{{ t("novel.wordsShort") }}</span>
            </div>
          </div>

          <div class="editor-body cus-scroll">
            <textarea
              v-model="chapterContent"
              class="chapter-textarea"
              :placeholder="t('novel.contentPlaceholder')"
              spellcheck="false"
            ></textarea>
          </div>

          <!-- 底部：目标进度 -->
          <footer class="editor-footer">
            <div class="goal-bar-wrap">
              <span class="goal-label">{{ t("novel.chapterGoal") }}</span>
              <div class="goal-bar">
                <div class="goal-bar-fill" :style="{ width: goalPercent + '%' }"></div>
              </div>
              <span class="goal-value">{{ goalPercent }}% ({{ currentWords }}/{{ chapterGoal }})</span>
            </div>
          </footer>
        </template>

        <div v-else class="editor-empty">
          <NIcon :size="40" class="empty-icon"><CreateOutline /></NIcon>
          <p>{{ t("novel.noChapters") }}</p>
        </div>
      </main>
    </div>
  </div>
</template>

<style lang="less" scoped>
.writer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

// ── 顶部工具栏 ──────────────────────────────────────
.writer-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

.toolbar-icon-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  background: transparent;
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.novel-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.novel-title-text {
  font-family: var(--font-serif);
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.novel-status-tag {
  flex-shrink: 0;
}

.toolbar-stats {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.tb-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-tertiary);
  font-size: var(--fs-xs);
}

.tb-stat-num {
  font-family: var(--font-mono);
  color: var(--color-text);
  font-weight: 600;

  &.today { color: var(--color-primary); }
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.save-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);

  &.saved { color: #059669; }
  &.saving { color: #D97706; }
}

// ── 主体 ──────────────────────────────────────────
.writer-main {
  flex: 1;
  display: flex;
  min-height: 0;
}

// 左栏章节列表
.chapter-panel {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.panel-title {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.panel-count {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  padding: 1px 7px;
  border-radius: 999px;
}

.panel-add {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--color-primary);
    color: #fff;
  }
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
  border-left: 2px solid transparent;

  &:hover {
    background: var(--color-bg-tertiary);

    .chapter-ops { opacity: 1; }
  }

  &.active {
    background: var(--color-bg-tertiary);
    border-left-color: var(--color-primary);

    .chapter-title { color: var(--color-primary); }
  }
}

.chapter-no {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.chapter-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chapter-title {
  font-size: var(--fs-sm);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.chapter-words {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.chapter-ops {
  display: flex;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.op-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) { color: var(--color-primary); background: var(--color-bg); }
  &.del:hover { color: #ef4444; background: rgba(239, 68, 68, 0.08); }
  &:disabled { opacity: 0.25; cursor: not-allowed; }
}

.panel-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-tertiary);
  font-size: var(--fs-sm);
  padding: 20px;

  p { margin: 0; }
}

// 中栏编辑器
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--color-bg);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px 10px;
  flex-shrink: 0;
}

.chapter-title-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-serif);
  font-size: var(--fs-xl);
  font-weight: 700;
  color: var(--color-text);
  padding: 4px 0;

  &::placeholder { color: var(--color-text-tertiary); }
}

.editor-words {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-tertiary);
  font-size: var(--fs-xs);
  flex-shrink: 0;

  b {
    font-family: var(--font-mono);
    color: var(--color-text);
  }
}

.editor-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 24px 12px;
  min-height: 0;
}

.chapter-textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-family: var(--font-serif);
  font-size: var(--fs-lg);
  line-height: 2;
  color: var(--color-text);

  &::placeholder {
    color: var(--color-text-tertiary);
    opacity: 0.6;
  }
}

.editor-footer {
  flex-shrink: 0;
  padding: 10px 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.goal-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 560px;
  margin: 0 auto;
}

.goal-label {
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.goal-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg-tertiary);
  border-radius: 999px;
  overflow: hidden;
}

.goal-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-primary), #F87171);
  transition: width 0.3s ease;
}

.goal-value {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-tertiary);

  p { margin: 0; }
}

.empty-icon {
  color: var(--color-primary-light);
}

// ── 专注模式 ──────────────────────────────────────
.focus-mode {
  .chapter-panel { display: none; }
  .editor-header { padding-top: 16px; }
}

// ── 响应式 ──────────────────────────────────────
@media (max-width: 768px) {
  .chapter-panel { width: 180px; }
  .toolbar-stats { display: none; }
  .editor-header { padding: 10px 14px 8px; }
  .editor-body { padding: 2px 14px 10px; }
}
</style>