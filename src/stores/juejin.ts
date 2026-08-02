import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { JuejinArticle } from '@/services/juejinCache'

interface FeedCache {
  list: JuejinArticle[]
  cursor: string
  finished: boolean
  error: boolean
}

export const useJuejinStore = defineStore('juejin', () => {
  const recommend = ref<FeedCache>({ list: [], cursor: '0', finished: false, error: false })
  const latest = ref<FeedCache>({ list: [], cursor: '0', finished: false, error: false })

  function resetRecommend(): void {
    recommend.value = { list: [], cursor: '0', finished: false, error: false }
  }

  function resetLatest(): void {
    latest.value = { list: [], cursor: '0', finished: false, error: false }
  }

  return {
    recommend,
    latest,
    resetRecommend,
    resetLatest,
  }
})
