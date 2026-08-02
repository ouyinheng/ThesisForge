import type {
  Article,
  ArticleMeta,
  CreateArticleDTO,
  UpdateArticleDTO,
  Theme,
  LayoutMode,
  Locale,
} from '@/types'

// ---------------------------------------------------------------------------
// 文件结构（桌面端）
//   <storagePath>/articles/index.json    -> ArticleMeta[]（仅元数据，不含 content）
//   <storagePath>/articles/<id>.json     -> Article（含 content） 单篇文章
//   <storagePath>/preferences.json       -> { blog-theme, blog-layout, blog-locale }
//
// Web (localStorage) 用相同结构但 key 带前缀：
//   blog_articles_index  -> 元数据数组
//   blog_article_<id>    -> 单篇文章
//   blog-theme/layout/locale -> 偏好设置
// ---------------------------------------------------------------------------

const SAMPLE_ARTICLES: Article[] = [
  {
    id: 'sample_001',
    title: 'Attention Is All You Need',
    summary:
      'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer.',
    content:
      '<h2>Abstract</h2><p>The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.</p><h2>1. Introduction</h2><p>Recurrent neural networks, long short-term memory and gated recurrent neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation.</p><h2>2. Model Architecture</h2><p>The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder.</p><h2>Conclusion</h2><p>In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention.</p>',
    tags: ['Machine Learning', 'NLP'],
    createdAt: '2017-06-12T00:00:00.000Z',
    updatedAt: '2017-06-12T00:00:00.000Z',
  },
  {
    id: 'sample_002',
    title: 'MapReduce: Simplified Data Processing on Large Clusters',
    summary:
      'MapReduce is a programming model and an associated implementation for processing and generating large data sets. Users specify a map function and a reduce function.',
    content:
      '<h2>Abstract</h2><p>MapReduce is a programming model and an associated implementation for processing and generating large data sets. Users specify a map function that processes a key/value pair to generate a set of intermediate key/value pairs, and a reduce function that merges all intermediate values associated with the same intermediate key.</p><h2>1. Introduction</h2><p>Over the past five years, the authors and many others at Google have implemented hundreds of special-purpose computations that process large amounts of raw data.</p><h2>2. Programming Model</h2><p>The computation takes a set of input key/value pairs, and produces a set of output key/value pairs. The user of the MapReduce library expresses the computation as two functions: Map and Reduce.</p><h2>Conclusion</h2><p>The MapReduce programming model has been successfully used at Google for many different purposes including web search, machine translation, and machine learning.</p>',
    tags: ['Systems', 'Databases'],
    createdAt: '2004-12-01T00:00:00.000Z',
    updatedAt: '2004-12-01T00:00:00.000Z',
  },
  {
    id: 'sample_003',
    title: 'The PageRank Citation Ranking: Bringing Order to the Web',
    summary:
      'PageRank is a method for computing a ranking for every Web page based on the graph of the Web.',
    content:
      '<h2>Abstract</h2><p>The importance of a Web page is an inherently subjective matter. But there is still much that can be said objectively about the relative importance of Web pages. In this paper, we present PageRank, a method for computing a ranking for every Web page based on the graph of the Web.</p><h2>1. Introduction</h2><p>The World Wide Web creates many new challenges for information retrieval. The Web is a vast collection of completely uncontrolled heterogeneous documents.</p><h2>2. A Ranking for Every Page</h2><p>We assume page A has pages T1...Tn which point to it. The parameter d is a damping factor which can be set between 0 and 1.</p><h2>Conclusions</h2><p>We have developed PageRank, a link analysis algorithm that provides an objective measure of the importance of Web pages.</p>',
    tags: ['Theory', 'Systems'],
    createdAt: '1998-01-29T00:00:00.000Z',
    updatedAt: '1998-01-29T00:00:00.000Z',
  },
]

const PREF_KEYS = {
  THEME: 'blog-theme',
  LAYOUT: 'blog-layout',
  LOCALE: 'blog-locale',
} as const

const INDEX_KEY = 'blog_articles_index'
const ARTICLE_PREFIX = 'blog_article_'

function toMeta(a: Article): ArticleMeta {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary,
    tags: a.tags,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// ---------------------------------------------------------------------------
// 环境探测
// ---------------------------------------------------------------------------

export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false
  if (window.__IS_ELECTRON__) return true
  if (window.process?.versions?.electron) return true
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')) return true
  return false
}

export function isFileSystemAvailable(): boolean {
  if (!isDesktop()) return false
  return typeof window.__fileBridge !== 'undefined' && window.__fileBridge !== null
}

// ---------------------------------------------------------------------------
// 存储路径管理（仅桌面端有意义）
// ---------------------------------------------------------------------------

const STORAGE_PATH_KEY = 'blog-storage-path'

export function getStoredPath(): string {
  if (typeof window === 'undefined' || !window.localStorage) return ''
  return window.localStorage.getItem(STORAGE_PATH_KEY) || ''
}

export function setStoredPath(path: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  if (path) {
    window.localStorage.setItem(STORAGE_PATH_KEY, path)
  } else {
    window.localStorage.removeItem(STORAGE_PATH_KEY)
  }
}

export async function getStoragePath(): Promise<string> {
  const local = getStoredPath()
  if (local) return local
  if (isFileSystemAvailable()) {
    return await window.__fileBridge!.getStoragePath()
  }
  return ''
}

export async function getDefaultStoragePath(): Promise<string> {
  // 返回 Electron 默认路径作为占位建议，但不会自动使用
  if (isFileSystemAvailable()) {
    return await window.__fileBridge!.getUserDataPath()
  }
  return ''
}

export async function setStoragePath(newPath: string): Promise<void> {
  setStoredPath(newPath)
  if (isFileSystemAvailable()) {
    await window.__fileBridge!.setStoragePath(newPath)
  }
}

export async function migrateStorage(fromPath: string, toPath: string): Promise<void> {
  if (!isFileSystemAvailable()) return
  await window.__fileBridge!.migrateStorage(fromPath, toPath)
}

/**
 * 弹出系统文件夹选择对话框（仅桌面端有效）。
 * 返回选中的目录路径；用户取消或环境不支持时返回空字符串。
 */
export async function selectDirectory(): Promise<string> {
  if (!isFileSystemAvailable()) return ''
  try {
    return (await window.__fileBridge!.selectDirectory()) || ''
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// 底层存储后端
// ---------------------------------------------------------------------------

interface StorageBackend {
  // 文章索引
  readIndex(): Promise<ArticleMeta[]>
  writeIndex(index: ArticleMeta[]): Promise<void>
  // 单篇文章
  readArticle(id: string): Promise<Article | null>
  writeArticle(article: Article): Promise<void>
  deleteArticle(id: string): Promise<void>
  // 设置
  getPref(key: string): Promise<unknown>
  setPref(key: string, value: unknown): Promise<void>
  removePref(key: string): Promise<void>
}

const webBackend: StorageBackend = {
  async readIndex(): Promise<ArticleMeta[]> {
    const raw = localStorage.getItem(INDEX_KEY)
    return raw ? (JSON.parse(raw) as ArticleMeta[]) : []
  },
  async writeIndex(index: ArticleMeta[]): Promise<void> {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  },
  async readArticle(id: string): Promise<Article | null> {
    const raw = localStorage.getItem(ARTICLE_PREFIX + id)
    return raw ? (JSON.parse(raw) as Article) : null
  },
  async writeArticle(article: Article): Promise<void> {
    localStorage.setItem(ARTICLE_PREFIX + article.id, JSON.stringify(article))
  },
  async deleteArticle(id: string): Promise<void> {
    localStorage.removeItem(ARTICLE_PREFIX + id)
  },
  async getPref(key: string): Promise<unknown> {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  },
  async setPref(key: string, value: unknown): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value))
  },
  async removePref(key: string): Promise<void> {
    localStorage.removeItem(key)
  },
}

const desktopBackend: StorageBackend = {
  async readIndex(): Promise<ArticleMeta[]> {
    try {
      const raw = await window.__fileBridge!.readJSON('articles/index.json')
      return raw ? (JSON.parse(raw) as ArticleMeta[]) : []
    } catch {
      return []
    }
  },
  async writeIndex(index: ArticleMeta[]): Promise<void> {
    await window.__fileBridge!.writeJSON('articles/index.json', JSON.stringify(index, null, 2))
  },
  async readArticle(id: string): Promise<Article | null> {
    try {
      const raw = await window.__fileBridge!.readJSON(`articles/${id}.json`)
      return raw ? (JSON.parse(raw) as Article) : null
    } catch {
      return null
    }
  },
  async writeArticle(article: Article): Promise<void> {
    await window.__fileBridge!.writeJSON(
      `articles/${article.id}.json`,
      JSON.stringify(article, null, 2)
    )
  },
  async deleteArticle(id: string): Promise<void> {
    try {
      await window.__fileBridge!.deleteFile?.(`articles/${id}.json`)
    } catch {
      /* ignore */
    }
  },
  async getPref(key: string): Promise<unknown> {
    try {
      const filename =
        key === PREF_KEYS.THEME || key === PREF_KEYS.LAYOUT || key === PREF_KEYS.LOCALE
          ? 'preferences.json'
          : `${key}.json`
      const raw = await window.__fileBridge!.readJSON(filename)
      if (!raw) return null
      const prefs = JSON.parse(raw) as Record<string, unknown>
      return prefs?.[key] ?? null
    } catch {
      return null
    }
  },
  async setPref(key: string, value: unknown): Promise<void> {
    const filename =
      key === PREF_KEYS.THEME || key === PREF_KEYS.LAYOUT || key === PREF_KEYS.LOCALE
        ? 'preferences.json'
        : `${key}.json`
    let prefs: Record<string, unknown> = {}
    try {
      const raw = await window.__fileBridge!.readJSON(filename)
      if (raw) prefs = JSON.parse(raw) as Record<string, unknown>
    } catch {
      /* ignore */
    }
    prefs[key] = value
    await window.__fileBridge!.writeJSON(filename, JSON.stringify(prefs, null, 2))
  },
  async removePref(key: string): Promise<void> {
    try {
      const filename =
        key === PREF_KEYS.THEME || key === PREF_KEYS.LAYOUT || key === PREF_KEYS.LOCALE
          ? 'preferences.json'
          : `${key}.json`
      let prefs: Record<string, unknown> = {}
      const raw = await window.__fileBridge!.readJSON(filename)
      if (raw) prefs = JSON.parse(raw) as Record<string, unknown>
      delete prefs[key]
      await window.__fileBridge!.writeJSON(filename, JSON.stringify(prefs, null, 2))
    } catch {
      /* ignore */
    }
  },
}

const backend: StorageBackend = isFileSystemAvailable() ? desktopBackend : webBackend

// ---------------------------------------------------------------------------
// 内部工具
// ---------------------------------------------------------------------------

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function extractPlainText(html: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || ''
  }
  return html.replace(/<[^>]*>/g, '').trim()
}

async function ensureSamples(): Promise<ArticleMeta[]> {
  let index = await backend.readIndex()
  if (index.length > 0) return index
  // 初次启动：写入示例文章到独立文件 + index
  const metas: ArticleMeta[] = []
  for (const a of SAMPLE_ARTICLES) {
    await backend.writeArticle(a)
    metas.push(toMeta(a))
  }
  await backend.writeIndex(metas)
  return metas
}

// ---------------------------------------------------------------------------
// 公开 API（文章 CRUD）
// ---------------------------------------------------------------------------

export async function getAllArticleMetas(): Promise<ArticleMeta[]> {
  return await ensureSamples()
}

export async function getArticleById(id: string): Promise<Article | null> {
  return await backend.readArticle(id)
}

export async function createArticle(data: CreateArticleDTO): Promise<Article> {
  if (!data.title?.trim()) throw new Error('title is required')
  if (!data.content?.trim()) throw new Error('content is required')

  const now = new Date().toISOString()
  const article: Article = {
    id: generateId(),
    title: data.title.trim(),
    summary: data.summary?.trim() || extractPlainText(data.content).slice(0, 200),
    content: data.content,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
  }
  // 写单篇文件
  await backend.writeArticle(article)
  // 更新索引
  const index = await backend.readIndex()
  index.unshift(toMeta(article))
  await backend.writeIndex(index)
  return article
}

export async function updateArticle(
  id: string,
  data: UpdateArticleDTO
): Promise<Article | null> {
  const current = await backend.readArticle(id)
  if (!current) return null

  const updated: Article = {
    ...current,
    title: data.title?.trim() || current.title,
    summary:
      data.summary?.trim() ||
      (data.content ? extractPlainText(data.content).slice(0, 200) : current.summary),
    content: data.content ?? current.content,
    tags: data.tags ?? current.tags,
    updatedAt: new Date().toISOString(),
  }
  await backend.writeArticle(updated)
  // 更新索引
  const index = await backend.readIndex()
  const idx = index.findIndex((m) => m.id === id)
  if (idx >= 0) index[idx] = toMeta(updated)
  await backend.writeIndex(index)
  return updated
}

export async function deleteArticle(id: string): Promise<boolean> {
  const current = await backend.readArticle(id)
  if (!current) return false
  // 删除单篇文件
  await backend.deleteArticle(id)
  // 更新索引
  const index = (await backend.readIndex()).filter((m) => m.id !== id)
  await backend.writeIndex(index)
  return true
}

// ---------------------------------------------------------------------------
// 偏好设置（主题 / 布局 / 语言）
// ---------------------------------------------------------------------------

export async function getTheme(): Promise<Theme> {
  const theme = (await backend.getPref(PREF_KEYS.THEME)) as Theme | null
  return theme || getSystemTheme()
}

export async function setTheme(theme: Theme): Promise<void> {
  await backend.setPref(PREF_KEYS.THEME, theme)
}

export async function getLayout(): Promise<LayoutMode> {
  const layout = (await backend.getPref(PREF_KEYS.LAYOUT)) as LayoutMode | null
  return layout || 'sidebar'
}

export async function setLayout(layout: LayoutMode): Promise<void> {
  await backend.setPref(PREF_KEYS.LAYOUT, layout)
}

export async function getLocale(): Promise<Locale> {
  const locale = (await backend.getPref(PREF_KEYS.LOCALE)) as Locale | null
  return locale || 'zh'
}

export async function setLocale(locale: Locale): Promise<void> {
  await backend.setPref(PREF_KEYS.LOCALE, locale)
}

export async function resetAll(): Promise<void> {
  const index = await backend.readIndex()
  for (const m of index) {
    await backend.deleteArticle(m.id)
  }
  await backend.writeIndex([])
  await backend.removePref(PREF_KEYS.THEME)
  await backend.removePref(PREF_KEYS.LAYOUT)
  await backend.removePref(PREF_KEYS.LOCALE)
}

export default {
  isDesktop,
  isFileSystemAvailable,
  getStoragePath,
  getDefaultStoragePath,
  setStoragePath,
  migrateStorage,
  getAllArticleMetas,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getTheme,
  setTheme,
  getLayout,
  setLayout,
  getLocale,
  setLocale,
  resetAll,
}
