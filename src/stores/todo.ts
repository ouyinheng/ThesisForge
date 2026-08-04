import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Todo, CreateTodoDTO, UpdateTodoDTO } from '@/types/todo'

const STORAGE_KEY = 'pb-todos'

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useTodoStore = defineStore('todo', () => {
  const todos = ref<Todo[]>(loadTodos())

  // ── 计算属性 ──────────────────────────────────────────
  const pendingTodos = computed(() =>
    todos.value
      .filter((t) => !t.done)
      .sort((a, b) => {
        // 优先级高 → 更新时间近 排前
        const pa = a.priority === 'high' ? 2 : a.priority === 'normal' ? 1 : 0
        const pb = b.priority === 'high' ? 2 : b.priority === 'normal' ? 1 : 0
        if (pa !== pb) return pb - pa
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  )

  const doneTodos = computed(() =>
    todos.value
      .filter((t) => t.done)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
  )

  /** 今日待办 (含无日期) */
  const todayTodos = computed(() =>
    todos.value.filter((t) => !t.done && (!t.dueDate || t.dueDate === new Date().toISOString().slice(0, 10)))
  )

  /** 逾期待办 */
  const overdueTodos = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return todos.value.filter((t) => !t.done && t.dueDate && t.dueDate < today)
  })

  /** 明日待办 */
  const tomorrowTodos = computed(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return todos.value.filter((t) => !t.done && t.dueDate === d.toISOString().slice(0, 10))
  })

  /** 本周待办 (2~7 天后) */
  const upcomingTodos = computed(() => {
    const d1 = new Date()
    d1.setDate(d1.getDate() + 2)
    const d2 = new Date()
    d2.setDate(d2.getDate() + 7)
    const a = d1.toISOString().slice(0, 10)
    const b = d2.toISOString().slice(0, 10)
    return todos.value.filter((t) => !t.done && t.dueDate && t.dueDate >= a && t.dueDate <= b)
  })

  /** 更远期 (7天+) */
  const laterTodos = computed(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return todos.value.filter((t) => !t.done && t.dueDate && t.dueDate > d.toISOString().slice(0, 10))
  })

  /** 日历视图：按日期分组 */
  const todosByDate = computed(() => {
    const map: Record<string, Todo[]> = {}
    for (const t of todos.value) {
      const key = t.dueDate || t.createdAt.slice(0, 10)
      ;(map[key] ||= []).push(t)
    }
    return map
  })

  // ── Actions ───────────────────────────────────────────
  function addTodo(data: CreateTodoDTO): Todo {
    const now = new Date().toISOString()
    const todo: Todo = {
      id: genId(),
      title: data.title.trim(),
      done: false,
      priority: data.priority || 'normal',
      dueDate: data.dueDate || null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    }
    todos.value.unshift(todo)
    saveTodos(todos.value)
    return todo
  }

  function updateTodo(id: string, data: UpdateTodoDTO): Todo | null {
    const idx = todos.value.findIndex((t) => t.id === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    const current = todos.value[idx]
    const updated: Todo = {
      ...current,
      ...data,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: now,
      completedAt:
        data.done === true && !current.done
          ? now
          : data.done === false
            ? null
            : (data.completedAt ?? current.completedAt),
    }
    todos.value[idx] = updated
    saveTodos(todos.value)
    return updated
  }

  function toggleTodo(id: string): void {
    const todo = todos.value.find((t) => t.id === id)
    if (todo) updateTodo(id, { done: !todo.done })
  }

  function deleteTodo(id: string): void {
    todos.value = todos.value.filter((t) => t.id !== id)
    saveTodos(todos.value)
  }

  function clearDone(): void {
    todos.value = todos.value.filter((t) => !t.done)
    saveTodos(todos.value)
  }

  return {
    todos,
    pendingTodos,
    doneTodos,
    todayTodos,
    overdueTodos,
    tomorrowTodos,
    upcomingTodos,
    laterTodos,
    todosByDate,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    clearDone,
  }
})
