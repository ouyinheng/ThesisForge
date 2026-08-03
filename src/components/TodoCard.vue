<script setup lang="ts">
import { computed } from 'vue'
import { NText, NButton, NIcon, NCheckbox, NTag, NEmpty } from 'naive-ui'
import { CheckboxOutline, ChevronForwardOutline } from '@vicons/ionicons5'
import { useTodoStore } from '@/stores/todo'
import { useRouter } from 'vue-router'

const todoStore = useTodoStore()
const router = useRouter()

const todos = computed(() => todoStore.pendingTodos.slice(0, 5))
const totalPending = computed(() => todoStore.pendingTodos.length)

function goTodos() {
  router.push('/todos')
}

function formatDue(d: string | null): string {
  if (!d) return ''
  const today = new Date().toISOString().slice(0, 10)
  if (d === today) return '今'
  const [, m, day] = d.split('-')
  return `${parseInt(m)}/${parseInt(day)}`
}
</script>

<template>
  <section class="dashboard-panel todo-card">
    <div class="todo-card-header">
      <NIcon :size="16" class="todo-card-icon"><CheckboxOutline /></NIcon>
      <NText class="todo-card-title">To-Do</NText>
      <NText depth="3" class="todo-card-count" v-if="totalPending">{{ totalPending }}</NText>
    </div>

    <template v-if="todos.length">
      <div class="todo-card-list">
        <div
          v-for="todo in todos"
          :key="todo.id"
          class="todo-card-item"
          :class="`priority-${todo.priority}`"
          @click="todoStore.toggleTodo(todo.id)"
        >
          <NCheckbox :checked="false" size="small" @click.stop />
          <NText class="todo-card-item-title">{{ todo.title }}</NText>
          <NTag v-if="todo.dueDate" size="tiny" :bordered="false" class="todo-card-due">
            {{ formatDue(todo.dueDate) }}
          </NTag>
        </div>
      </div>
      <NButton text type="primary" size="small" class="todo-card-more" @click="goTodos">
        查看全部 <NIcon :size="12"><ChevronForwardOutline /></NIcon>
      </NButton>
    </template>

    <NEmpty v-else description="今天没有待办" size="small" class="todo-card-empty">
      <template #extra>
        <NButton text type="primary" size="tiny" @click="goTodos">前往添加</NButton>
      </template>
    </NEmpty>
  </section>
</template>

<style scoped>
.dashboard-panel {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 1.25em 1.5em;
}
.todo-card {
  display: flex;
  flex-direction: column;
  border-left: 3px solid var(--color-primary);
  position: relative;
}
.todo-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.todo-card-icon {
  color: var(--color-primary);
}
.todo-card-title {
  font-weight: 600;
  font-size: var(--fs-base);
}
.todo-card-count {
  font-size: var(--fs-sm);
  margin-left: auto;
}
.todo-card-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.todo-card-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.todo-card-item:hover {
  background: var(--color-bg-tertiary);
}
.todo-card-item.priority-high { border-left-color: #ef4444; }
.todo-card-item.priority-low { border-left-color: #94a3b8; }
.todo-card-item-title {
  flex: 1;
  font-size: var(--fs-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.todo-card-due {
  flex-shrink: 0;
}
.todo-card-more {
  align-self: flex-end;
  margin-top: 6px;
}
.todo-card-empty {
  padding: 8px 0;
}
</style>
