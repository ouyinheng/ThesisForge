// 视频站状态：按分类缓存已加载的电影列表

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCategoryList, fetchMovieDetail, searchMovies, type VideoMovie } from '@/services/videoStation/content'

interface CategoryCache {
  list: VideoMovie[]
  page: number
  finished: boolean
  loading: boolean
  error: boolean
}

function emptyCache(): CategoryCache {
  return { list: [], page: 1, finished: false, loading: false, error: false }
}

export const useVideoStationStore = defineStore('videoStation', () => {
  const categories = ref<Record<string, CategoryCache>>({})
  const search = ref<{ keyword: string; list: VideoMovie[]; loading: boolean; error: boolean }>({
    keyword: '',
    list: [],
    loading: false,
    error: false,
  })

  function getOrCreate(key: string): CategoryCache {
    if (!categories.value[key]) {
      categories.value[key] = emptyCache()
    }
    return categories.value[key]
  }

  /** 加载某分类第一页 */
  async function loadCategory(key: string, path: string): Promise<void> {
    const cache = getOrCreate(key)
    if (cache.loading) return
    cache.loading = true
    cache.error = false
    try {
      const items = await fetchCategoryList(path)
      cache.list = items
      cache.page = 1
      cache.finished = items.length < 20
    } catch {
      cache.error = true
    } finally {
      cache.loading = false
    }
  }

  /** 重试加载 */
  function retry(key: string, path: string): void {
    const cache = getOrCreate(key)
    cache.list = []
    cache.page = 1
    cache.finished = false
    cache.error = false
    loadCategory(key, path)
  }

  /** 搜索 */
  async function doSearch(keyword: string): Promise<void> {
    const kw = keyword.trim()
    if (!kw) {
      search.value = { keyword: '', list: [], loading: false, error: false }
      return
    }
    search.value.keyword = kw
    search.value.loading = true
    search.value.error = false
    try {
      const items = await searchMovies(kw)
      search.value.list = items
    } catch {
      search.value.error = true
    } finally {
      search.value.loading = false
    }
  }

  /** 退出搜索 */
  function exitSearch(): void {
    search.value = { keyword: '', list: [], loading: false, error: false }
  }

  /** 获取单部电影详情 */
  async function getDetail(id: string): Promise<Partial<VideoMovie> | null> {
    try {
      return await fetchMovieDetail(id)
    } catch {
      return null
    }
  }

  return {
    categories,
    search,
    getOrCreate,
    loadCategory,
    retry,
    doSearch,
    exitSearch,
    getDetail,
  }
})
