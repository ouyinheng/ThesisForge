<script setup lang="ts">
defineOptions({ name: 'todos' })
import { ref, computed } from 'vue'
import {
  NTabs,
  NTabPane,
  NInput,
  NButton,
  NIcon,
  NCheckbox,
  NTag,
  NPopconfirm,
  NSelect,
  NDatePicker,
  NEmpty,
  NText,
  useMessage,
  NDropdown,
} from 'naive-ui'
import {
  AddOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  TrashOutline,
  CalendarOutline,
  PencilOutline,
  EllipsisVerticalOutline,
} from '@vicons/ionicons5'
import { useTodoStore } from '@/stores/todo'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
const todoStore = useTodoStore()
const message = useMessage()

// ── 视图模式 ────────────────────────────────────────
type ViewMode = 'list' | 'calendar'
const viewMode = ref<ViewMode>('list')
const activeTab = ref<'pending' | 'done'>('pending')

// ── 新增待办 ────────────────────────────────────────
const newTitle = ref('')
const newPriority = ref<'low' | 'normal' | 'high'>('normal')
const newDueDate = ref<any>(null)

function handleAdd() {
  const title = newTitle.value.trim()
  if (!title) return
  const dueDate = typeof newDueDate.value === 'string' ? newDueDate.value : null
  todoStore.addTodo({
    title,
    priority: newPriority.value,
    dueDate,
  })
  newTitle.value = ''
  newPriority.value = 'normal'
  newDueDate.value = null
  message.success(t('todo.added'))
}

// ── 编辑中 ──────────────────────────────────────────
const editId = ref<string | null>(null)
const editDraft = ref('')

function startEdit(id: string, title: string) {
  editId.value = id
  editDraft.value = title
}
function commitEdit() {
  if (editId.value && editDraft.value.trim()) {
    todoStore.updateTodo(editId.value, { title: editDraft.value.trim() })
  }
  editId.value = null
  editDraft.value = ''
}
function cancelEdit() {
  editId.value = null
  editDraft.value = ''
}

// ── 日历视图 ────────────────────────────────────────
const calCursor = ref(new Date())
const calYear = computed(() => calCursor.value.getFullYear())
const calMonth = computed(() => calCursor.value.getMonth())

const calMonthLabel = computed(() => {
  return `${calYear.value}年 ${calMonth.value + 1}月`
})

function calShiftMonth(delta: number) {
  const d = new Date(calCursor.value)
  d.setMonth(d.getMonth() + delta)
  calCursor.value = d
}

/** 日历格子数据 */
interface CalCell {
  date: string          // yyyy-mm-dd
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  todos: Array<{ id: string; title: string; priority: string; done: boolean }>
}

const calendarCells = computed(() => {
  const year = calYear.value
  const month = calMonth.value
  const today = new Date().toISOString().slice(0, 10)

  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay() // 0=Sun
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startWeekday)

  const lastDay = new Date(year, month + 1, 0)

  const cells: CalCell[] = []
  const byDate = todoStore.todosByDate

  // 6 行 x 7 列 = 42 格
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    cells.push({
      date: dateStr,
      day: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      isToday: dateStr === today,
      todos: (byDate[dateStr] || []).map((td) => ({
        id: td.id,
        title: td.title,
        priority: td.priority,
        done: td.done,
      })),
    })
  }
  return cells
})

// ── 优先级选项 ──────────────────────────────────────
const priorityOptions = [
  { label: t('todo.priorityHigh'), value: 'high' },
  { label: t('todo.priorityNormal'), value: 'normal' },
  { label: t('todo.priorityLow'), value: 'low' },
]

function priorityTagType(p: string) {
  if (p === 'high') return 'error'
  if (p === 'low') return 'info'
  return 'default'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr === today) return t('todo.today')
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

const priorityFilterValue = ref<string | null>(null)

function handleSetPriority(id: string, p: 'low' | 'normal' | 'high') {
  todoStore.updateTodo(id, { priority: p })
}

function handleSetDueDate(id: string, ts: number | null) {
  todoStore.updateTodo(id, {
    dueDate: ts ? new Date(ts).toISOString().slice(0, 10) : null,
  })
}

// NDatePicker 禁用过去的日期
function disablePastDate(ts: number): boolean {
  return ts < Date.now() - 86400000
}
</script>

<template>
  <div class="todo-page">
    <!-- 头部 -->
    <div class="todo-header">
      <h2 class="todo-title">To-Do</h2>
      <div class="todo-view-toggle">
        <NButton
          quaternary
          size="small"
          :type="viewMode === 'list' ? 'primary' : 'default'"
          @click="viewMode = 'list'"
        >
          <template #icon><NIcon><PencilOutline /></NIcon></template>
          {{ t('todo.listView') }}
        </NButton>
        <NButton
          quaternary
          size="small"
          :type="viewMode === 'calendar' ? 'primary' : 'default'"
          @click="viewMode = 'calendar'"
        >
          <template #icon><NIcon><CalendarOutline /></NIcon></template>
          {{ t('todo.calendarView') }}
        </NButton>
      </div>
    </div>

    <!-- 列表视图 -->
    <div class="todo-content" v-if="viewMode === 'list'">
      <!-- Tabs -->
      <NTabs v-model:value="activeTab" type="line" animated class="todo-tabs">
        <NTabPane name="pending" :tab="`${t('todo.pending')} (${todoStore.pendingTodos.length})`">
          <!-- 输入区 -->
          <div class="todo-input-row">
            <NInput
              v-model:value="newTitle"
              :placeholder="t('todo.addPlaceholder')"
              size="small"
              @keydown.enter="handleAdd"
              class="todo-input"
            />
            <NSelect
              v-model:value="newPriority"
              :options="priorityOptions"
              size="small"
              style="width: 90px"
            />
            <NDatePicker
              v-model:value="newDueDate"
              type="date"
              size="small"
              style="width: 120px"
              :placeholder="t('todo.dueDate')"
              :is-date-disabled="disablePastDate"
              value-format="yyyy-MM-dd"
              clearable
            />
            <NButton type="primary" size="small" @click="handleAdd">
              <template #icon><NIcon><AddOutline /></NIcon></template>
              {{ t('todo.add') }}
            </NButton>
          </div>

          <!-- 待办列表 -->
          <div class="todo-list" v-if="todoStore.pendingTodos.length">
            <div
              v-for="todo in todoStore.pendingTodos"
              :key="todo.id"
              class="todo-item"
              :class="`priority-${todo.priority}`"
            >
              <NCheckbox
                :checked="false"
                @update:checked="todoStore.toggleTodo(todo.id)"
              />

              <div class="todo-item-main">
                <!-- 编辑状态 -->
                <NInput
                  v-if="editId === todo.id"
                  v-model:value="editDraft"
                  size="small"
                  @keydown.enter="commitEdit"
                  @keydown.esc="cancelEdit"
                  @blur="commitEdit"
                  autofocus
                />
                <!-- 显示状态 -->
                <NText v-else class="todo-item-title" @dblclick="startEdit(todo.id, todo.title)">
                  {{ todo.title }}
                </NText>
              </div>

              <NTag
                :type="priorityTagType(todo.priority)"
                size="small"
                class="todo-priority"
              >
                {{ t(`todo.priority${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`) }}
              </NTag>

              <NText depth="3" class="todo-due" v-if="todo.dueDate">
                <NIcon :size="12"><CalendarOutline /></NIcon>
                {{ formatDate(todo.dueDate) }}
              </NText>

              <!-- 操作菜单 -->
              <NDropdown
                trigger="click"
                :options="[
                  { key: 'high', label: '⭐ ' + t('todo.priorityHigh') },
                  { key: 'normal', label: '● ' + t('todo.priorityNormal') },
                  { key: 'low', label: '○ ' + t('todo.priorityLow') },
                ]"
                @select="(k: string) => handleSetPriority(todo.id, k as any)"
              >
                <NButton text size="tiny" class="todo-action-btn">
                  <NIcon><EllipsisVerticalOutline /></NIcon>
                </NButton>
              </NDropdown>

              <NPopconfirm
                @positive-click="todoStore.deleteTodo(todo.id)"
                :positive-text="t('todo.confirm')"
                :negative-text="t('todo.cancel')"
              >
                <template #trigger>
                  <NButton text size="tiny" class="todo-action-btn delete-btn">
                    <NIcon><TrashOutline /></NIcon>
                  </NButton>
                </template>
              </NPopconfirm>
            </div>
          </div>

          <NEmpty v-else :description="t('todo.emptyPending')" />
        </NTabPane>

        <NTabPane name="done" :tab="`${t('todo.done')} (${todoStore.doneTodos.length})`">
          <div class="todo-list" v-if="todoStore.doneTodos.length">
            <div
              v-for="todo in todoStore.doneTodos"
              :key="todo.id"
              class="todo-item todo-done-item"
            >
              <NCheckbox
                :checked="true"
                @update:checked="todoStore.toggleTodo(todo.id)"
              />
              <div class="todo-item-main">
                <NText class="todo-item-title todo-done-title">{{ todo.title }}</NText>
              </div>
              <NText depth="3" class="todo-completed-at">
                {{ todo.completedAt?.slice(0, 10) }}
              </NText>
              <NButton
                text
                size="tiny"
                class="todo-action-btn delete-btn"
                @click="todoStore.deleteTodo(todo.id)"
              >
                <NIcon><TrashOutline /></NIcon>
              </NButton>
            </div>
          </div>
          <NEmpty v-else :description="t('todo.emptyDone')" />
        </NTabPane>
      </NTabs>
    </div>

    <!-- 日历视图 -->
    <div class="todo-calendar" v-else>
      <div class="cal-header">
        <NButton text size="small" @click="calShiftMonth(-1)">◀</NButton>
        <span class="cal-title">{{ calMonthLabel }}</span>
        <NButton text size="small" @click="calShiftMonth(1)">▶</NButton>
        <NButton text size="tiny" @click="calCursor = new Date()">{{ t('todo.today') }}</NButton>
      </div>

      <div class="cal-grid">
        <div class="cal-weekday">日</div>
        <div class="cal-weekday">一</div>
        <div class="cal-weekday">二</div>
        <div class="cal-weekday">三</div>
        <div class="cal-weekday">四</div>
        <div class="cal-weekday">五</div>
        <div class="cal-weekday">六</div>

        <div
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          class="cal-cell"
          :class="{
            'cal-cell-otherMonth': !cell.isCurrentMonth,
            'cal-cell-today': cell.isToday,
          }"
        >
          <span class="cal-day">{{ cell.day }}</span>
          <div class="cal-todos" v-if="cell.todos.length">
            <div
              v-for="td in cell.todos.slice(0, 3)"
              :key="td.id"
              class="cal-todo-dot"
              :class="[`dot-${td.priority}`, { 'dot-done': td.done }]"
              :title="td.title"
            />
            <span v-if="cell.todos.length > 3" class="cal-more">+{{ cell.todos.length - 3 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.todo-page {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sp-5);
}

.todo-title {
  font-size: var(--fs-2xl);
  font-family: var(--font-serif);
  margin: 0;
  color: var(--color-text);
}

.todo-view-toggle {
  display: flex;
  gap: 4px;
}

.todo-content {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--sp-5);
}

.todo-tabs {
  :deep(.n-tab-pane) {
    padding-top: var(--sp-4);
  }
}

// 输入行
.todo-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: var(--sp-4);
  align-items: center;
  flex-wrap: wrap;
}
.todo-input {
  flex: 1;
  min-width: 200px;
}

// 待办列表
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  border-left: 3px solid transparent;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
    .todo-action-btn { opacity: 1; }
  }
}

.todo-item.priority-high {
  border-left-color: #ef4444;
}
.todo-item.priority-low {
  border-left-color: #94a3b8;
}

.todo-item-main {
  flex: 1;
  min-width: 0;
}

.todo-item-title {
  font-size: var(--fs-base);
  color: var(--color-text);
  cursor: text;
}

.todo-done-item {
  opacity: 0.55;
}
.todo-done-title {
  text-decoration: line-through;
}

.todo-priority {
  flex-shrink: 0;
}

.todo-due {
  flex-shrink: 0;
  font-size: var(--fs-xs);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.todo-completed-at {
  flex-shrink: 0;
  font-size: var(--fs-xs);
}

.todo-action-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.delete-btn:hover {
  color: #ef4444;
}

// 日历视图
.todo-calendar {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--sp-5);
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: var(--sp-4);
}
.cal-title {
  font-size: var(--fs-lg);
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cal-weekday {
  text-align: center;
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  padding: 4px 0;
}

.cal-cell {
  aspect-ratio: 1 / 1;
  min-height: 60px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  border: 1px solid transparent;
  transition: border-color var(--transition-fast);

  &:hover {
    border-color: var(--color-border);
  }
}

.cal-cell-otherMonth {
  opacity: 0.35;
}

.cal-cell-today {
  background: var(--color-primary-light);
  .cal-day {
    font-weight: 700;
    color: var(--color-primary);
  }
}

.cal-day {
  font-size: var(--fs-xs);
  color: var(--color-text-secondary);
}

.cal-todos {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  margin-top: 2px;
}

.cal-todo-dot {
  height: 5px;
  border-radius: 2px;
  background: var(--color-primary);
  opacity: 0.8;

  &.dot-high { background: #ef4444; }
  &.dot-low { background: #94a3b8; }
  &.dot-done { opacity: 0.35; }
}

.cal-more {
  font-size: 10px;
  color: var(--color-text-tertiary);
}
</style>
