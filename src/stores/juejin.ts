import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { JuejinArticle } from '@/services/juejinCache'

interface FeedCache {
  list: JuejinArticle[]
  cursor: string
  finished: boolean
  error: boolean
}

export interface SearchCache {
  keyword: string
  list: JuejinArticle[]
  cursor: string
  finished: boolean
  loading: boolean
  error: boolean
}

export const useJuejinStore = defineStore('juejin', () => {
  const recommend = ref<FeedCache>({ list: [], cursor: '0', finished: false, error: false })
  const latest = ref<FeedCache>({ list: [], cursor: '0', finished: false, error: false })
  const search = ref<SearchCache>({ keyword: '', list: [], cursor: '0', finished: false, loading: false, error: false })

  function resetRecommend(): void {
    recommend.value = { list: [], cursor: '0', finished: false, error: false }
  }

  function resetLatest(): void {
    latest.value = { list: [], cursor: '0', finished: false, error: false }
  }

  function resetSearch(): void {
    search.value = { keyword: '', list: [], cursor: '0', finished: false, loading: false, error: false }
  }

  function appendSearch(items: JuejinArticle[], cursor: string, hasMore: boolean): void {
    search.value.list.push(...items)
    search.value.cursor = cursor
    search.value.finished = !hasMore
  }

  return {
    recommend,
    latest,
    search,
    resetRecommend,
    resetLatest,
    resetSearch,
    appendSearch,
  }
})
