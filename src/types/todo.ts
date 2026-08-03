export interface Todo {
  id: string
  title: string
  done: boolean
  priority: 'low' | 'normal' | 'high'
  dueDate: string | null       // yyyy-mm-dd
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type CreateTodoDTO = Pick<Todo, 'title'> &
  Partial<Pick<Todo, 'priority' | 'dueDate'>>

export type UpdateTodoDTO = Partial<
  Pick<Todo, 'title' | 'done' | 'priority' | 'dueDate' | 'completedAt'>
>

export type TodoFilter = 'pending' | 'done' | 'all'
