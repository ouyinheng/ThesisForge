import { defineStore } from 'pinia'
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type {
  Article,
  ArticleMeta,
  CreateArticleDTO,
  UpdateArticleDTO,
  TagInfo,
} from '@/types'
import {
  getAllArticleMetas,
  getArticleById as storageGetById,
  createArticle as storageCreate,
  updateArticle as storageUpdate,
  deleteArticle as storageDelete,
} from '@/services/storage'

export const useBlogStore = defineStore('blog', () => {
  // 列表只存元数据（不含 content）
  const articleMetas: Ref<ArticleMeta[]> = ref<ArticleMeta[]>([])
  const loaded: Ref<boolean> = ref(false)

  async function loadArticles(): Promise<void> {
    if (loaded.value) return
    articleMetas.value = await getAllArticleMetas()
    loaded.value = true
  }

  async function createArticle(data: CreateArticleDTO): Promise<Article> {
    const article = await storageCreate(data)
    articleMetas.value.unshift({
      id: article.id,
      title: article.title,
      summary: article.summary,
      tags: article.tags,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    })
    return article
  }

  async function updateArticle(
    id: string,
    data: UpdateArticleDTO
  ): Promise<Article | null> {
    const updated = await storageUpdate(id, data)
    if (updated) {
      const index = articleMetas.value.findIndex((m) => m.id === id)
      if (index !== -1) {
        articleMetas.value[index] = {
          id: updated.id,
          title: updated.title,
          summary: updated.summary,
          tags: updated.tags,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        }
      }
    }
    return updated
  }

  async function deleteArticle(id: string): Promise<boolean> {
    const result = await storageDelete(id)
    if (result) {
      articleMetas.value = articleMetas.value.filter((m) => m.id !== id)
    }
    return result
  }

  // 详情按需从存储层读取（内容较大，不在 store 中缓存）
  async function getArticleById(id: string): Promise<Article | null> {
    return await storageGetById(id)
  }

  const sortedMetas: ComputedRef<ArticleMeta[]> = computed(() => {
    return [...articleMetas.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  })

  const allTags: ComputedRef<TagInfo[]> = computed(() => {
    const tagMap: Record<string, number> = {}
    articleMetas.value.forEach((m) => {
      m.tags.forEach((tag) => {
        tagMap[tag] = (tagMap[tag] || 0) + 1
      })
    })
    return Object.entries(tagMap).map(([name, count]) => ({ name, count }))
  })

  // 本周（最近 7 天，含今天）内更新的文章数量
  const weekCount: ComputedRef<number> = computed(() => {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 6) // 含今天共 7 天
    return articleMetas.value.filter((m) => {
      const t = new Date(m.updatedAt).getTime()
      return t >= start.getTime() && t <= now.getTime()
    }).length
  })

  // 按日期（YYYY-MM-DD）聚合更新次数，用于工作台热力图
  const activityMap: ComputedRef<Record<string, number>> = computed(() => {
    const map: Record<string, number> = {}
    articleMetas.value.forEach((m) => {
      const d = new Date(m.updatedAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`
      map[key] = (map[key] || 0) + 1
    })
    return map
  })

  function getReadTime(html: string): number {
    const text = html.replace(/<[^>]*>/g, '')
    const wordsPerMinute = 300
    const words = text.length / 2
    return Math.max(1, Math.ceil(words / wordsPerMinute))
  }

  return {
    articleMetas,
    loadArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    getArticleById,
    sortedMetas,
    allTags,
    weekCount,
    activityMap,
    getReadTime,
  }
})
