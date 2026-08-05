import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Novel,
  NovelChapter,
  CreateNovelDTO,
  UpdateNovelDTO,
} from '@/types/novel'

/**
 * 码字台存储设计（与 blog 模块一致的分片策略）：
 *   - `pb_novels_index`   -> NovelMeta[]（仅元数据，不含章节内容）
 *   - `pb_novel_<id>`     -> Novel（含全部章节正文）；章节体量大，单作品独立 key
 *   - `pb_novel_daily`    -> Record<YYYY-MM-DD, words> 每日写作字数（增量累积）
 */

const INDEX_KEY = 'pb_novels_index'
const NOVEL_PREFIX = 'pb_novel_'
const DAILY_KEY = 'pb_novel_daily'

export interface NovelMeta {
  id: string
  title: string
  category: string
  intro: string
  status: Novel['status']
  pinned: boolean
  dailyGoal: number
  words: number
  chapterCount: number
  createdAt: string
  updatedAt: string
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 统计中文字数：中文字符逐个计，连续英文/数字串计 1 */
export function countWords(text: string): number {
  const t = text.replace(/\s+/g, '')
  const zh = t.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g)
  const en = t.match(/[a-zA-Z0-9]+/g) || []
  return (zh ? zh.length : 0) + en.length
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function toMeta(n: Novel): NovelMeta {
  return {
    id: n.id,
    title: n.title,
    category: n.category,
    intro: n.intro,
    status: n.status,
    pinned: n.pinned,
    dailyGoal: n.dailyGoal,
    words: n.words,
    chapterCount: n.chapters.length,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }
}

export const useNovelStore = defineStore('novel', () => {
  const metas = ref<NovelMeta[]>(load<NovelMeta[]>(INDEX_KEY, []))
  const dailyLog = ref<Record<string, number>>(load<Record<string, number>>(DAILY_KEY, {}))

  // ── 计算属性 ────────────────────────────────────────
  const sortedMetas = computed(() =>
    [...metas.value].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  )

  const totalNovels = computed(() => metas.value.length)
  const totalChapters = computed(() =>
    metas.value.reduce((sum, m) => sum + m.chapterCount, 0)
  )
  const totalWords = computed(() => metas.value.reduce((sum, m) => sum + m.words, 0))
  const todayWords = computed(() => dailyLog.value[todayStr()] || 0)

  // ── 内部工具 ────────────────────────────────────────
  function readNovel(id: string): Novel | null {
    return load<Novel | null>(NOVEL_PREFIX + id, null)
  }

  function writeNovel(novel: Novel): void {
    save(NOVEL_PREFIX + novel.id, novel)
    const idx = metas.value.findIndex((m) => m.id === novel.id)
    const meta = toMeta(novel)
    if (idx >= 0) metas.value[idx] = meta
    else metas.value.unshift(meta)
    save(INDEX_KEY, metas.value)
  }

  /** 累加每日写作字数（章节增量） */
  function recordDailyDelta(delta: number): void {
    if (!delta) return
    const day = todayStr()
    dailyLog.value[day] = (dailyLog.value[day] || 0) + delta
    save(DAILY_KEY, dailyLog.value)
  }

  // ── 作品 CRUD ───────────────────────────────────────
  function create(data: CreateNovelDTO): Novel {
    const now = new Date().toISOString()
    const novel: Novel = {
      id: genId(),
      title: data.title.trim(),
      category: data.category?.trim() || '',
      intro: data.intro?.trim() || '',
      status: data.status || 'draft',
      pinned: false,
      dailyGoal: data.dailyGoal || 2000,
      words: 0,
      chapters: [],
      createdAt: now,
      updatedAt: now,
    }
    writeNovel(novel)
    return novel
  }

  function getById(id: string): Novel | null {
    return readNovel(id)
  }

  function update(id: string, data: UpdateNovelDTO): Novel | null {
    const novel = readNovel(id)
    if (!novel) return null
    if (data.title !== undefined) novel.title = data.title.trim()
    if (data.category !== undefined) novel.category = data.category.trim()
    if (data.intro !== undefined) novel.intro = data.intro.trim()
    if (data.status !== undefined) novel.status = data.status
    if (data.dailyGoal !== undefined) novel.dailyGoal = data.dailyGoal
    if (data.pinned !== undefined) novel.pinned = data.pinned
    novel.updatedAt = new Date().toISOString()
    writeNovel(novel)
    return novel
  }

  function remove(id: string): void {
    localStorage.removeItem(NOVEL_PREFIX + id)
    metas.value = metas.value.filter((m) => m.id !== id)
    save(INDEX_KEY, metas.value)
  }

  function togglePin(id: string): void {
    const novel = readNovel(id)
    if (novel) update(id, { pinned: !novel.pinned })
  }

  // ── 章节 CRUD ───────────────────────────────────────
  function addChapter(id: string, title = ''): NovelChapter | null {
    const novel = readNovel(id)
    if (!novel) return null
    const now = new Date().toISOString()
    const chapter: NovelChapter = {
      id: genId(),
      title: title.trim(),
      content: '',
      words: 0,
      order: novel.chapters.length,
      createdAt: now,
      updatedAt: now,
    }
    novel.chapters.push(chapter)
    refreshNovelStats(novel)
    return chapter
  }

  function removeChapter(id: string, chapterId: string): void {
    const novel = readNovel(id)
    if (!novel) return
    novel.chapters = novel.chapters
      .filter((c) => c.id !== chapterId)
      .map((c, i) => ({ ...c, order: i }))
    refreshNovelStats(novel)
  }

  function renameChapter(id: string, chapterId: string, title: string): void {
    const novel = readNovel(id)
    if (!novel) return
    const ch = novel.chapters.find((c) => c.id === chapterId)
    if (!ch) return
    ch.title = title.trim()
    ch.updatedAt = new Date().toISOString()
    refreshNovelStats(novel)
  }

  /**
   * 更新章节正文（书写场景频繁调用）。返回最新章节对象供 UI 即时回显。
   * 每日字数 = 内容字数增量累积。
   */
  function updateChapter(
    id: string,
    chapterId: string,
    content: string
  ): NovelChapter | null {
    const novel = readNovel(id)
    if (!novel) return null
    const ch = novel.chapters.find((c) => c.id === chapterId)
    if (!ch) return null
    const oldWords = ch.words
    ch.content = content
    ch.words = countWords(content)
    ch.updatedAt = new Date().toISOString()
    recordDailyDelta(ch.words - oldWords)
    refreshNovelStats(novel)
    return ch
  }

  function moveChapter(id: string, chapterId: string, dir: -1 | 1): void {
    const novel = readNovel(id)
    if (!novel) return
    const idx = novel.chapters.findIndex((c) => c.id === chapterId)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= novel.chapters.length) return
    const [ch] = novel.chapters.splice(idx, 1)
    novel.chapters.splice(target, 0, ch)
    novel.chapters = novel.chapters.map((c, i) => ({ ...c, order: i }))
    refreshNovelStats(novel)
  }

  /** 刷新作品总字数 / 更新时间并回写索引 */
  function refreshNovelStats(novel: Novel): void {
    novel.words = novel.chapters.reduce((sum, c) => sum + c.words, 0)
    novel.updatedAt = new Date().toISOString()
    writeNovel(novel)
  }

  return {
    metas,
    sortedMetas,
    totalNovels,
    totalChapters,
    totalWords,
    todayWords,
    create,
    getById,
    update,
    remove,
    togglePin,
    addChapter,
    removeChapter,
    renameChapter,
    updateChapter,
    moveChapter,
  }
})