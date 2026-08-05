export type NovelStatus = 'draft' | 'ongoing' | 'finished'

export interface NovelChapter {
  id: string
  title: string
  content: string
  words: number
  order: number
  createdAt: string
  updatedAt: string
}

export interface Novel {
  id: string
  title: string
  category: string
  intro: string
  status: NovelStatus
  pinned: boolean
  dailyGoal: number
  words: number
  chapters: NovelChapter[]
  createdAt: string
  updatedAt: string
}

export interface CreateNovelDTO {
  title: string
  category?: string
  intro?: string
  status?: NovelStatus
  dailyGoal?: number
}

export interface UpdateNovelDTO {
  title?: string
  category?: string
  intro?: string
  status?: NovelStatus
  dailyGoal?: number
  pinned?: boolean
}

export interface CreateChapterDTO {
  title?: string
  content?: string
}
