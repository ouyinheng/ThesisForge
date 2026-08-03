import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Bookmark,
  Collection,
  CreateBookmarkDTO,
  UpdateBookmarkDTO,
  CreateCollectionDTO,
} from '@/types/collection'

const BOOKMARK_KEY = 'pb-bookmarks'
const COLLECTION_KEY = 'pb-collections'

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useCollectionStore = defineStore('collection', () => {
  const bookmarks = ref<Bookmark[]>(load<Bookmark>(BOOKMARK_KEY))
  const collections = ref<Collection[]>(load<Collection>(COLLECTION_KEY))

  // 默认分组
  const ALL = '__all__'
  const UNGROUPED = '__ungrouped__'

  // ── 计算属性 ────────────────────────────────────────
  const sortedCollections = computed(() =>
    [...collections.value].sort((a, b) => a.order - b.order)
  )

  const totalBookmarks = computed(() => bookmarks.value.length)

  function bookmarksByGroup(groupId: string): Bookmark[] {
    if (groupId === ALL) return bookmarks.value
    if (groupId === UNGROUPED) return bookmarks.value.filter((b) => !b.groupId)
    return bookmarks.value.filter((b) => b.groupId === groupId)
  }

  function collectionName(groupId: string): string {
    const c = collections.value.find((c) => c.id === groupId)
    return c ? c.name : ''
  }

  function collectionCount(groupId: string): number {
    return bookmarksByGroup(groupId).length
  }

  // ── Bookmark Actions ────────────────────────────────
  function extractLetter(title: string, url: string): string {
    if (title.trim()) return title.trim().charAt(0).toUpperCase()
    try {
      const d = new URL(url).hostname
      return d.charAt(0).toUpperCase()
    } catch {
      return '?'
    }
  }

  function addBookmark(data: CreateBookmarkDTO): Bookmark {
    const now = new Date().toISOString()
    const bm: Bookmark = {
      id: genId(),
      title: data.title.trim(),
      url: data.url.trim(),
      icon: data.icon || '',
      letter: extractLetter(data.title, data.url),
      groupId: data.groupId || '',
      createdAt: now,
      updatedAt: now,
    }
    bookmarks.value.unshift(bm)
    save(BOOKMARK_KEY, bookmarks.value)
    return bm
  }

  function updateBookmark(id: string, data: UpdateBookmarkDTO): Bookmark | null {
    const idx = bookmarks.value.findIndex((b) => b.id === id)
    if (idx === -1) return null
    const current = bookmarks.value[idx]
    const title = data.title ?? current.title
    const url = data.url ?? current.url
    const updated: Bookmark = {
      ...current,
      ...data,
      id: current.id,
      title: title.trim(),
      url: url.trim(),
      letter: extractLetter(title, url),
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }
    bookmarks.value[idx] = updated
    save(BOOKMARK_KEY, bookmarks.value)
    return updated
  }

  function deleteBookmark(id: string): void {
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id)
    save(BOOKMARK_KEY, bookmarks.value)
  }

  function getBookmark(id: string): Bookmark | undefined {
    return bookmarks.value.find((b) => b.id === id)
  }

  // ── Collection Actions ──────────────────────────────
  function addCollection(data: CreateCollectionDTO): Collection {
    const colors = ['#D12F2F', '#2563EB', '#059669', '#9333EA', '#F57C00', '#00796B']
    const icons = ['📁', '📂', '⭐', '🔖', '📌', '💼', '🎯']
    const now = new Date().toISOString()
    const col: Collection = {
      id: genId(),
      name: data.name.trim(),
      icon: data.icon || icons[collections.value.length % icons.length],
      color: data.color || colors[collections.value.length % colors.length],
      createdAt: now,
      updatedAt: now,
      order: collections.value.length,
    }
    collections.value.push(col)
    save(COLLECTION_KEY, collections.value)
    return col
  }

  function updateCollection(id: string, data: Partial<CreateCollectionDTO>): void {
    const idx = collections.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    collections.value[idx] = {
      ...collections.value[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    save(COLLECTION_KEY, collections.value)
  }

  function deleteCollection(id: string): void {
    collections.value = collections.value.filter((c) => c.id !== id)
    // 将该分组下的书签移到未分组
    bookmarks.value.forEach((b) => {
      if (b.groupId === id) b.groupId = ''
    })
    save(COLLECTION_KEY, collections.value)
    save(BOOKMARK_KEY, bookmarks.value)
  }

  return {
    bookmarks,
    collections,
    sortedCollections,
    totalBookmarks,
    ALL,
    UNGROUPED,
    bookmarksByGroup,
    collectionName,
    collectionCount,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    getBookmark,
    addCollection,
    updateCollection,
    deleteCollection,
  }
})
