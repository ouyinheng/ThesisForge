<script setup lang="ts">
defineOptions({ name: 'todos' })
import { ref, computed } from 'vue'
import {
  NInput,
  NButton,
  NIcon,
  NCheckbox,
  NTag,
  NPopconfirm,
  NDatePicker,
  NSelect,
  NEmpty,
  NText,
  useMessage,
  NDropdown,
  NModal,
  NForm,
  NFormItem,
  NSpace,
} from 'naive-ui'
import {
  AddOutline,
  CheckmarkCircle,
  TrashOutline,
  CalendarOutline,
  FlameOutline,
  SparklesOutline,
  TrophyOutline,
  TimeOutline,
  ChevronDownOutline,
  StarOutline,
  PencilOutline,
  AlertCircleOutline,
  FlagOutline,
  CloseOutline,
} from '@vicons/ionicons5'
import { useTodoStore } from '@/stores/todo'
import { useI18n } from '@/composables/i18n/useI18n'

const { t } = useI18n()
const store = useTodoStore()
const message = useMessage()

// ── 添加弹窗 ────────────────────────────────────────
const showAddModal = ref(false)
const modalTitle = ref('')
const modalPriority = ref<'low' | 'normal' | 'high'>('normal')
const modalDueDate = ref<number | null>(null)

function openAddModal() {
  modalTitle.value = ''
  modalPriority.value = 'normal'
  modalDueDate.value = null
  showAddModal.value = true
}

function handleModalAdd() {
  const title = modalTitle.value.trim()
  if (!title) return
  store.addTodo({
    title,
    priority: modalPriority.value,
    dueDate: modalDueDate.value ? new Date(modalDueDate.value).toISOString().slice(0, 10) : null,
  })
  showAddModal.value = false
  message.success(t('todo.added'), { duration: 1500 })
  triggerCelebrateIfAllDone()
}

function triggerCelebrateIfAllDone() {
  if (store.pendingTodos.length === 0 && store.doneTodos.length > 0) {
    triggerCelebrate()
  }
}

// ── 编辑任务 ────────────────────────────────────────
const editId = ref<string | null>(null)
const editDraft = ref('')

function startEdit(id: string, title: string) {
  editId.value = id
  editDraft.value = title
}
function commitEdit() {
  if (editId.value && editDraft.value.trim()) {
    store.updateTodo(editId.value, { title: editDraft.value.trim() })
  }
  editId.value = null
  editDraft.value = ''
}
function cancelEdit() {
  editId.value = null
  editDraft.value = ''
}

// ── 进度环 ──────────────────────────────────────────
const pendingCount = computed(() => store.pendingTodos.length)
const doneCount = computed(() => store.doneTodos.length)
const todayCount = computed(() => store.todayTodos.length)
const completionRate = computed(() => {
  const total = store.todos.length
  return total ? Math.round((doneCount.value / total) * 100) : 0
})

const RADIUS = 52
const CIRCUM = 2 * Math.PI * RADIUS
const dashOffset = computed(() => CIRCUM * (1 - completionRate.value / 100))

// ── 完成庆祝 ────────────────────────────────────────
const showCelebrate = ref(false)
let celebrateTimer: ReturnType<typeof setTimeout>

function handleToggle(id: string, wasDone: boolean) {
  store.toggleTodo(id)
  if (!wasDone) {
    if (store.pendingTodos.length === 0 && store.todos.length > 0) {
      triggerCelebrate()
    }
  }
}

function triggerCelebrate() {
  showCelebrate.value = true
  clearTimeout(celebrateTimer)
  celebrateTimer = setTimeout(() => (showCelebrate.value = false), 3000)
}

// ── 日期标签 ──────────────────────────────────────────
function dateLabel(dateStr: string | null): string {
  if (!dateStr) return ''
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr === today) return t('todo.today')
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

function formatSectionDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}月${parseInt(d)}日`
}

const priorityOptions = [
  { label: t('todo.priorityHigh'), value: 'high' },
  { label: t('todo.priorityNormal'), value: 'normal' },
  { label: t('todo.priorityLow'), value: 'low' },
]

const modalPriorityOptions = [
  { label: '⭐ ' + t('todo.priorityHigh'), value: 'high' },
  { label: '● ' + t('todo.priorityNormal'), value: 'normal' },
  { label: '○ ' + t('todo.priorityLow'), value: 'low' },
]

function priorityTagType(p: string) {
  if (p === 'high') return 'error' as const
  if (p === 'low') return 'info' as const
  return 'default' as const
}

function priorityIcon(p: string) {
  if (p === 'high') return AlertCircleOutline
  if (p === 'low') return ChevronDownOutline
  return FlagOutline
}

// ── 已完成区展开 ────────────────────────────────────
const showAllDone = ref(false)
const visibleDone = computed(() => {
  return showAllDone.value ? store.doneTodos : store.doneTodos.slice(0, 5)
})

// ── 快捷设置 ──────────────────────────────────────────
function setPriority(id: string, p: 'low' | 'normal' | 'high') {
  store.updateTodo(id, { priority: p })
}

function disablePastDate(ts: number) {
  return ts < Date.now() - 86400000
}

// ── 问候语 ──────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
</script>

<template>
  <div class="todo-app">
    <!-- ── 顶部焦点区 ─────────────────────────────────── -->
    <section class="hero">
      <div class="hero-greet">
        <NText class="greet-text">{{ greeting }}</NText>
        <NText class="greet-sub" depth="3">
          <NIcon :size="12"><TimeOutline /></NIcon>
          {{ new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }) }}
        </NText>
      </div>

      <!-- SVG 进度圆环 -->
      <div class="progress-ring">
        <svg :width="132" :height="132" :viewBox="`0 0 132 132`">
          <circle cx="66" cy="66" :r="RADIUS" fill="none" stroke="var(--color-bg-tertiary)" stroke-width="8" />
          <circle
            cx="66"
            cy="66"
            :r="RADIUS"
            fill="none"
            stroke="url(#progressGrad)"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="CIRCUM"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 66 66)"
            class="ring-bar"
          />
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--color-primary)" />
              <stop offset="100%" stop-color="#F87171" />
            </linearGradient>
          </defs>
        </svg>
        <div class="ring-center">
          <span class="ring-percent">{{ completionRate }}</span>
          <span class="ring-percent-sign">%</span>
        </div>
      </div>

      <!-- 数字统计 -->
      <div class="hero-stats">
        <div class="hero-stat">
          <span class="hs-num pending">{{ pendingCount }}</span>
          <span class="hs-label">待办</span>
        </div>
        <div class="hero-stat-divider" />
        <div class="hero-stat">
          <span class="hs-num done">{{ doneCount }}</span>
          <span class="hs-label">已完成</span>
        </div>
        <div class="hero-stat-divider" />
        <div class="hero-stat">
          <span class="hs-num today">{{ todayCount }}</span>
          <span class="hs-label">今日</span>
        </div>
      </div>
    </section>

    <!-- ── 添加按钮 ─────────────────────────────────── -->
    <button class="add-trigger" @click="openAddModal">
      <NIcon :size="16"><AddOutline /></NIcon>
      <span>新建任务</span>
      <NIcon :size="12" class="add-shortcut"><SparklesOutline /></NIcon>
    </button>

    <!-- ── 时间线主体 ─────────────────────────────────── -->
    <div class="timeline">
      <!-- 逾期 -->
      <section class="tl-section overdue" v-if="store.overdueTodos.length">
        <div class="tl-header">
          <NIcon :size="14" class="section-icon overdue-icon"><AlertCircleOutline /></NIcon>
          <span class="tl-title">已逾期</span>
          <span class="tl-count">{{ store.overdueTodos.length }}</span>
        </div>
        <TransitionGroup name="tl-item" tag="div" class="tl-list">
          <div v-for="todo in store.overdueTodos" :key="todo.id" class="tl-card overdue-card">
            <div class="card-check" @click="handleToggle(todo.id, todo.done)">
              <NCheckbox :checked="false" />
            </div>
            <div class="card-body">
              <NInput
                v-if="editId === todo.id"
                v-model:value="editDraft"
                size="small"
                @keydown.enter="commitEdit"
                @keydown.esc="cancelEdit"
                @blur="commitEdit"
                autofocus
              />
              <span v-else class="card-title" @dblclick="startEdit(todo.id, todo.title)">{{ todo.title }}</span>
            </div>
            <NTag size="small" type="error" round class="card-tag overdue-tag">
              {{ dateLabel(todo.dueDate) }}
            </NTag>
            <div class="card-actions">
              <NPopconfirm @positive-click="store.deleteTodo(todo.id)" :positive-text="t('todo.confirm')" :negative-text="t('todo.cancel')">
                <template #trigger>
                  <button class="card-action-btn del"><NIcon :size="12"><TrashOutline /></NIcon></button>
                </template>
              </NPopconfirm>
            </div>
          </div>
        </TransitionGroup>
      </section>

      <!-- 今日焦点 -->
      <section class="tl-section today">
        <div class="tl-header">
          <NIcon :size="14" class="section-icon today-icon"><FlameOutline /></NIcon>
          <span class="tl-title">今日焦点</span>
          <span class="tl-count">{{ store.todayTodos.length }}</span>
        </div>
        <TransitionGroup name="tl-item" tag="div" class="tl-list" v-if="store.todayTodos.length">
          <div v-for="todo in store.todayTodos" :key="todo.id" class="tl-card today-card">
            <div class="card-check" @click="handleToggle(todo.id, todo.done)">
              <NCheckbox :checked="false" />
            </div>
            <div class="card-body">
              <NInput
                v-if="editId === todo.id"
                v-model:value="editDraft"
                size="small"
                @keydown.enter="commitEdit"
                @keydown.esc="cancelEdit"
                @blur="commitEdit"
                autofocus
              />
              <span v-else class="card-title" @dblclick="startEdit(todo.id, todo.title)">{{ todo.title }}</span>
            </div>
            <NTag :type="priorityTagType(todo.priority)" size="small" round class="card-tag">
              <NIcon :size="10"><component :is="priorityIcon(todo.priority)" /></NIcon>
              {{ t(`todo.priority${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`) }}
            </NTag>
            <div class="card-actions">
              <NDropdown
                trigger="click"
                :options="[
                  { key: 'high', label: '⭐ ' + t('todo.priorityHigh') },
                  { key: 'normal', label: '● ' + t('todo.priorityNormal') },
                  { key: 'low', label: '○ ' + t('todo.priorityLow') },
                ]"
                @select="(k: string) => setPriority(todo.id, k as any)"
              >
                <button class="card-action-btn"><NIcon :size="12"><StarOutline /></NIcon></button>
              </NDropdown>
              <button class="card-action-btn" @click="startEdit(todo.id, todo.title)">
                <NIcon :size="12"><PencilOutline /></NIcon>
              </button>
              <NPopconfirm @positive-click="store.deleteTodo(todo.id)" :positive-text="t('todo.confirm')" :negative-text="t('todo.cancel')">
                <template #trigger>
                  <button class="card-action-btn del"><NIcon :size="12"><TrashOutline /></NIcon></button>
                </template>
              </NPopconfirm>
            </div>
          </div>
        </TransitionGroup>
        <NEmpty v-else :description="t('todo.emptyPending')" size="small" class="section-empty" />
      </section>

      <!-- 明日预告 -->
      <section class="tl-section tomorrow" v-if="store.tomorrowTodos.length">
        <div class="tl-header">
          <NIcon :size="14" class="section-icon tmr-icon"><CalendarOutline /></NIcon>
          <span class="tl-title">明日预告</span>
          <span class="tl-count">{{ store.tomorrowTodos.length }}</span>
        </div>
        <TransitionGroup name="tl-item" tag="div" class="tl-list">
          <div v-for="todo in store.tomorrowTodos" :key="todo.id" class="tl-card">
            <div class="card-check" @click="handleToggle(todo.id, todo.done)">
              <NCheckbox :checked="false" />
            </div>
            <div class="card-body">
              <span class="card-title" @dblclick="startEdit(todo.id, todo.title)">{{ todo.title }}</span>
            </div>
            <div class="card-actions">
              <NPopconfirm @positive-click="store.deleteTodo(todo.id)" :positive-text="t('todo.confirm')" :negative-text="t('todo.cancel')">
                <template #trigger>
                  <button class="card-action-btn del"><NIcon :size="12"><TrashOutline /></NIcon></button>
                </template>
              </NPopconfirm>
            </div>
          </div>
        </TransitionGroup>
      </section>

      <!-- 本周 -->
      <section class="tl-section upcoming" v-if="store.upcomingTodos.length">
        <div class="tl-header">
          <NIcon :size="14" class="section-icon upcoming-icon"><SparklesOutline /></NIcon>
          <span class="tl-title">本周计划</span>
          <span class="tl-count">{{ store.upcomingTodos.length }}</span>
        </div>
        <TransitionGroup name="tl-item" tag="div" class="tl-list">
          <div v-for="todo in store.upcomingTodos" :key="todo.id" class="tl-card">
            <div class="card-check" @click="handleToggle(todo.id, todo.done)">
              <NCheckbox :checked="false" />
            </div>
            <div class="card-body">
              <span class="card-title" @dblclick="startEdit(todo.id, todo.title)">{{ todo.title }}</span>
            </div>
            <NTag size="small" tertiary round class="card-tag">{{ formatSectionDate(todo.dueDate!) }}</NTag>
            <div class="card-actions">
              <NPopconfirm @positive-click="store.deleteTodo(todo.id)" :positive-text="t('todo.confirm')" :negative-text="t('todo.cancel')">
                <template #trigger>
                  <button class="card-action-btn del"><NIcon :size="12"><TrashOutline /></NIcon></button>
                </template>
              </NPopconfirm>
            </div>
          </div>
        </TransitionGroup>
      </section>

      <!-- 更远期 -->
      <section class="tl-section later" v-if="store.laterTodos.length">
        <div class="tl-header">
          <NIcon :size="14" class="section-icon later-icon"><CalendarOutline /></NIcon>
          <span class="tl-title">未来规划</span>
          <span class="tl-count">{{ store.laterTodos.length }}</span>
        </div>
        <TransitionGroup name="tl-item" tag="div" class="tl-list">
          <div v-for="todo in store.laterTodos" :key="todo.id" class="tl-card">
            <div class="card-check" @click="handleToggle(todo.id, todo.done)">
              <NCheckbox :checked="false" />
            </div>
            <div class="card-body">
              <span class="card-title" @dblclick="startEdit(todo.id, todo.title)">{{ todo.title }}</span>
            </div>
            <NTag size="small" tertiary round class="card-tag">{{ formatSectionDate(todo.dueDate!) }}</NTag>
            <div class="card-actions">
              <NPopconfirm @positive-click="store.deleteTodo(todo.id)" :positive-text="t('todo.confirm')" :negative-text="t('todo.cancel')">
                <template #trigger>
                  <button class="card-action-btn del"><NIcon :size="12"><TrashOutline /></NIcon></button>
                </template>
              </NPopconfirm>
            </div>
          </div>
        </TransitionGroup>
      </section>

      <!-- ── 已完成 ─────────────────────────────────── -->
      <section class="tl-section completed" v-if="store.doneTodos.length">
        <div class="tl-header">
          <NIcon :size="14" class="section-icon done-icon"><CheckmarkCircle /></NIcon>
          <span class="tl-title">{{ t('todo.done') }}</span>
          <span class="tl-count">{{ doneCount }}</span>
        </div>
        <TransitionGroup name="tl-item" tag="div" class="tl-list">
          <div v-for="todo in visibleDone" :key="todo.id" class="tl-card done-card">
            <div class="card-check" @click="handleToggle(todo.id, todo.done)">
              <NCheckbox :checked="true" />
            </div>
            <div class="card-body">
              <span class="card-title done-title">{{ todo.title }}</span>
            </div>
            <NPopconfirm @positive-click="store.deleteTodo(todo.id)" :positive-text="t('todo.confirm')" :negative-text="t('todo.cancel')">
              <template #trigger>
                <button class="card-action-btn del"><NIcon :size="12"><TrashOutline /></NIcon></button>
              </template>
            </NPopconfirm>
          </div>
        </TransitionGroup>
        <button v-if="store.doneTodos.length > 5" class="show-more" @click="showAllDone = !showAllDone">
          {{ showAllDone ? '收起' : `显示全部 (${store.doneTodos.length})` }}
          <NIcon :size="12"><ChevronDownOutline /></NIcon>
        </button>
      </section>
    </div>

    <!-- ── 全部完成空状态 ───────────────────────────────── -->
    <div class="all-clear" v-if="!pendingCount && !doneCount">
      <NIcon :size="40" class="clear-icon"><SparklesOutline /></NIcon>
      <p class="clear-text">今天还没有任务<br />点击「新建任务」，开启专注的一天</p>
    </div>

    <!-- ── 完成庆祝动画 ───────────────────────────────────── -->
    <Transition name="celebrate">
      <div v-if="showCelebrate" class="celebrate-overlay" @click="showCelebrate = false">
        <div class="celebrate-content" @click.stop>
          <div class="confetti">🎉</div>
          <NIcon :size="48" class="trophy"><TrophyOutline /></NIcon>
          <h2 class="celebrate-title">完成全部待办!</h2>
          <p class="celebrate-sub">今天的一切都已搞定，给自己一点掌声</p>
          <NButton type="primary" round @click="showCelebrate = false">太棒了</NButton>
        </div>
      </div>
    </Transition>

    <!-- ── 清理已完成 ─────────────────────────────────────── -->
    <footer class="todo-footer" v-if="doneCount > 0">
      <NPopconfirm @positive-click="store.clearDone()" :positive-text="t('todo.confirm')" :negative-text="t('todo.cancel')">
        <template #trigger>
          <NButton text size="tiny" type="error" class="clear-all-btn">
            <template #icon><NIcon :size="12"><TrashOutline /></NIcon></template>
            清除已完成 ({{ doneCount }})
          </NButton>
        </template>
        确定要清除所有已完成的任务吗？
      </NPopconfirm>
    </footer>

    <!-- ── 添加弹窗 ─────────────────────────────────── -->
    <NModal
      v-model:show="showAddModal"
      preset="card"
      :style="{ width: '480px', maxWidth: '95vw' }"
      :bordered="false"
      size="medium"
      :mask-closable="true"
      class="add-modal"
    >
      <template #header>
        <div class="modal-header">
          <div class="modal-icon"><NIcon :size="18"><AddOutline /></NIcon></div>
          <h3 class="modal-title">新建任务</h3>
        </div>
      </template>

      <NForm :label-placement="'top'" class="modal-form">
        <NFormItem :label="'任务名称'">
          <NInput
            v-model:value="modalTitle"
            placeholder="想做点什么？"
            autofocus
            @keydown.enter="handleModalAdd"
          />
        </NFormItem>

        <NFormItem :label="'优先级'">
          <NSelect
            v-model:value="modalPriority"
            :options="modalPriorityOptions"
          />
        </NFormItem>

        <NFormItem :label="'截止日期 (可选)'">
          <NDatePicker
            v-model:value="modalDueDate"
            type="date"
            style="width: 100%"
            :placeholder="'选择截止日期'"
            :is-date-disabled="disablePastDate"
            clearable
          />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="modal-footer">
          <NButton size="small" @click="showAddModal = false">取消</NButton>
          <NButton type="primary" size="small" @click="handleModalAdd" :disabled="!modalTitle.trim()">
            <template #icon><NIcon :size="12"><AddOutline /></NIcon></template>
            创建
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style lang="less" scoped>
.todo-app {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 8px;
  padding-bottom: 32px;
  position: relative;
}

// ── 顶部焦点区 ──────────────────────────────────────
.hero {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 28px 32px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%);
    opacity: 0.5;
    pointer-events: none;
  }
}

.hero-greet {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1;
}

.greet-text {
  font-family: var(--font-serif);
  font-size: var(--fs-2xl);
  font-weight: 700;
  color: var(--color-text);
}

.greet-sub {
  font-size: var(--fs-sm);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

// SVG 圆环
.progress-ring {
  position: relative;
  width: 132px;
  height: 132px;
  flex-shrink: 0;
  z-index: 1;
}

.ring-bar {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-percent {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.ring-percent-sign {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

// 数字统计
.hero-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1;
}

.hero-stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.hs-num {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);

  &.pending { color: var(--color-primary); }
  &.done { color: #059669; }
  &.today { color: #D97706; }
}

.hs-label {
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);
}

.hero-stat-divider {
  width: 100%;
  height: 1px;
  background: var(--color-border);
}

// ── 新建任务按钮 ──────────────────────────────────────
.add-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  background: var(--color-bg-secondary);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--fs-sm);
  font-weight: 500;
  transition: all 0.25s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-bg-tertiary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .add-shortcut {
    margin-left: auto;
    opacity: 0.4;
  }
}

// ── 时间线主体 ──────────────────────────────────────
.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tl-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tl-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}

.section-icon { font-size: 14px; }
.overdue-icon { color: #ef4444; }
.today-icon { color: var(--color-primary); }
.tmr-icon { color: #D97706; }
.upcoming-icon { color: #7c3aed; }
.later-icon { color: #64748b; }
.done-icon { color: #059669; }

.tl-title {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.tl-count {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--color-text-tertiary);
  background: var(--color-bg-tertiary);
  padding: 1px 7px;
  border-radius: 999px;
}

.tl-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.section-empty {
  padding: 24px 0;
}

// ── 卡片 ──────────────────────────────────────────
.tl-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  border-left: 3px solid var(--color-bg-tertiary);
  transition: all 0.2s ease;
  animation: cardEnter 0.35s ease;

  &:hover {
    background: var(--color-bg-tertiary);
    transform: translateX(3px);
    box-shadow: var(--shadow-sm);

    .card-action-btn { opacity: 1; }
  }
}

.today-card {
  border-left-color: var(--color-primary);
  background: linear-gradient(90deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);

  &:hover {
    background: linear-gradient(90deg, var(--color-bg-tertiary) 0%, var(--color-bg-secondary) 100%);
  }
}

.overdue-card {
  border-left-color: #ef4444;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.04), var(--color-bg-secondary));
}

.done-card {
  opacity: 0.55;
  padding: 8px 16px;

  &:hover {
    opacity: 0.75;
  }
}

.card-check {
  flex-shrink: 0;
  cursor: pointer;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: var(--fs-sm);
  color: var(--color-text);
  cursor: text;
  line-height: 1.4;
}

.done-title {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

.card-tag {
  flex-shrink: 0;
}

.overdue-tag {
  animation: pulse-tag 2s ease infinite;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.card-action-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: 4px;
  opacity: 0;
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

.show-more {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 14px;
  font-size: var(--fs-xs);
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

// ── 全部完成空状态 ──────────────────────────────────
.all-clear {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 0;
  text-align: center;
}

.clear-icon {
  color: var(--color-primary-light);
}

.clear-text {
  font-size: var(--fs-sm);
  color: var(--color-text-tertiary);
  line-height: 1.6;
  margin: 0;
}

// ── 完成庆祝 ──────────────────────────────────────
.celebrate-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.celebrate-content {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 48px 64px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-md);
  animation: celebratePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confetti {
  font-size: 48px;
  animation: bounce 0.6s ease infinite alternate;
}

.trophy {
  color: #F59E0B;
  filter: drop-shadow(0 2px 8px rgba(245, 158, 11, 0.4));
}

.celebrate-title {
  font-family: var(--font-serif);
  font-size: var(--fs-xl);
  margin: 0;
  color: var(--color-text);
}

.celebrate-sub {
  font-size: var(--fs-sm);
  color: var(--color-text-tertiary);
  margin: 0 0 8px;
}

// ── Footer ──────────────────────────────────────────
.todo-footer {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.clear-all-btn {
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover { opacity: 1; }
}

// ── 弹窗 ──────────────────────────────────────────
.add-modal {
  :deep(.n-card-header) {
    padding-bottom: 0;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--color-primary-light), #FECACA);
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
  padding-top: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// ── 动画 ──────────────────────────────────────────
.tl-item-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.tl-item-leave-active {
  transition: all 0.2s ease;
  position: absolute;
  width: 100%;
}
.tl-item-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.tl-item-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.tl-item-move {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.celebrate-enter-active {
  transition: opacity 0.3s ease;
}
.celebrate-leave-active {
  transition: opacity 0.5s ease;
}
.celebrate-enter-from,
.celebrate-leave-to {
  opacity: 0;
}

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-tag {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}

@keyframes celebratePop {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

// ── 响应式 ──────────────────────────────────────────
@media (max-width: 640px) {
  .hero {
    flex-wrap: wrap;
    gap: 16px;
    padding: 20px;
  }

  .progress-ring {
    width: 100px;
    height: 100px;
  }

  .tl-card {
    padding: 10px 12px;
  }
}
</style>
