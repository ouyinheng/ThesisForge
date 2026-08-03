export interface Article {
  id: string
  title: string
  summary: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type ArticleMeta = Omit<Article, 'content'>

export interface CreateArticleDTO {
  title: string
  summary?: string
  content: string
  tags?: string[]
}

export interface UpdateArticleDTO {
  title?: string
  summary?: string
  content?: string
  tags?: string[]
}

export type Theme = 'light' | 'dark'
export type LayoutMode = 'normal' | 'full' | 'simple' | 'empty'
export type Locale = 'zh' | 'en'

export interface TagInfo {
  name: string
  count: number
}
