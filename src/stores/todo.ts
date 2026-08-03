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

  /** 今日到期 / 今日创建的待办 */
  const todayTodos = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return todos.value.filter(
      (t) => !t.done && (t.dueDate === today || (!t.dueDate && t.createdAt.slice(0, 10) === today))
    )
  })

  /** 日历视图：按日期分组 */
  const todosByDate = computed(() => {
    const map: Record<string, Todo[]> = {}
    for (const t of todos.value) {
      const key = t.dueDate || t.createdAt.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(t)
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
    todosByDate,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    clearDone,
  }
})
