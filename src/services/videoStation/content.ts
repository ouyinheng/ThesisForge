// 视频站（厂长资源）内容抓取与解析
// 策略：
//   - electron：直连厂长资源（无跨域问题）
//   - web：通过 /video-station 代理（Vite dev server 转发，绕过 CORS）
//   1) fetch HTML（web 端走 /video-station 前缀；electron 走真实 URL）
//   2) 用 DOMParser 解析 HTML
//   3) 用选择器提取影视条目列表

import { useSettingsStore } from '@/stores/settings'

const isElectron = typeof window !== 'undefined' && (window as any).__IS_ELECTRON__ === true

/* ----------------------------- 类型定义 ----------------------------- */

export interface VideoMovie {
  id: string           // 原始 ID，如 "20294"
  title: string        // 标题
  cover: string        // 封面图 URL
  url: string          // 详情页 URL
  badge?: string       // 1080P / 4K 等标识
  category?: string    // 分类标签
  rating?: string      // 评分
  year?: string        // 年份
  cast?: string        // 主演（详情页才有）
  description?: string // 简介（详情页才有）
}

export interface VideoCategory {
  key: string
  label: string
  path: string
}

/** 视频站内置分类表（基于 4kcz.com 路径） */
export const VIDEO_CATEGORIES: VideoCategory[] = [
  { key: 'recommend', label: '厂长推荐', path: '/movie_bt' },
  { key: 'movie', label: '最新电影', path: '/zuixindianying' },
  { key: 'gcj', label: '国产剧', path: '/movie_bt_series/guochanju' },
  { key: 'meiju', label: '美剧', path: '/movie_bt_series/mj' },
  { key: 'hanju', label: '韩剧', path: '/movie_bt_series/hj' },
  { key: 'fanju', label: '番剧', path: '/fanju' },
  { key: 'dongman', label: '剧场版', path: '/dongmanjuchangban' },
  { key: 'riju', label: '日剧', path: '/movie_bt_series/rj' },
]

/* ----------------------------- 数据获取 ----------------------------- */

/**
 * 构建请求 URL：
 *   - electron：直接访问真实 URL（无跨域限制）
 *   - web 开发模式：通过 Vite proxy（/video-station 前缀）绕过 CORS
 */
function buildRequestUrl(targetUrl: string): string {
  if (isElectron) return targetUrl
  // web 端用 Vite 代理前缀；targetUrl 为相对路径（如 /movie_bt）则直接拼接
  if (targetUrl.startsWith('http')) {
    try {
      const u = new URL(targetUrl)
      return `/video-station${u.pathname}${u.search}`
    } catch {
      return targetUrl
    }
  }
  return `/video-station${targetUrl}`
}

/** 带超时的 fetch */
async function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

/* ----------------------------- HTML 解析 ----------------------------- */

/**
 * 从列表页 HTML 提取影视条目
 * 4kcz 列表页（2026 WordPress 模板）结构：
 *   <a href="/movie/{id}.html">
 *     <img src="blank.gif" data-src="{真实封面}" alt="{title}" />
 *     <span class="pic-text">{badge}</span>
 *   </a>
 * 注意：img src 为占位图 blank.gif，真实地址在 data-src 或 data-lazy-src 上
 */
export function parseMovieList(html: string, baseUrl: string): VideoMovie[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const movies: VideoMovie[] = []
  const seen = new Set<string>()

  // 策略：找所有 <a> 指向 /movie/{id}.html 的链接
  const links = doc.querySelectorAll('a[href*="/movie/"]')
  for (const link of links) {
    const href = link.getAttribute('href') || ''
    const m = href.match(/\/movie\/(\d+)\.html/)
    if (!m) continue
    const id = m[1]
    if (seen.has(id)) continue

    // 提取图片（优先 data-src / data-lazy-src，避免取到 blank.gif 占位图）
    const img = link.querySelector('img')
    const srcAttr = img?.getAttribute('src') || ''
    const dataSrc = img?.getAttribute('data-src') || img?.getAttribute('data-lazy-src') || ''
    const isPlaceholder = /blank|placeholder|loading|1x1|\.gif(\?|$)/i.test(srcAttr) || srcAttr.startsWith('data:')
    const cover = dataSrc || (isPlaceholder ? '' : srcAttr)
    const title = (img?.getAttribute('alt') || '').trim()

    // 提取 badge（1080P / 4K / 更新状态）
    const badgeEl = link.querySelector('.pic-text, .badge, [class*="text-right"]')
    const badge = badgeEl?.textContent?.trim() || ''

    if (!title || !href) continue

    seen.add(id)
    movies.push({
      id,
      title,
      cover,
      url: href.startsWith('http') ? href : `${baseUrl.replace(/\/$/, '')}${href}`,
      badge,
    })
  }

  // 补充分类与评分
  const titleEls = doc.querySelectorAll('.title.text-ellipsis, .title')
  const ratingEls = doc.querySelectorAll('.rating.text-ellipsis, .rating')
  if (movies.length > 0 && titleEls.length > 0) {
    const labels: string[] = []
    titleEls.forEach(el => {
      const t = el.textContent?.trim() || ''
      if (t) labels.push(t)
    })
    let li = 0
    for (const label of labels) {
      if (li >= movies.length) break
      if (label.length < 30 && !movies.some(mv => mv.title === label)) {
        if (!movies[li].category) movies[li].category = label
        li++
      }
    }
  }
  if (movies.length > 0 && ratingEls.length > 0) {
    const ratings: string[] = []
    ratingEls.forEach(el => {
      const t = el.textContent?.trim() || ''
      if (t && /^[\d.]+$/.test(t)) ratings.push(t)
    })
    for (let i = 0; i < Math.min(movies.length, ratings.length); i++) {
      movies[i].rating = ratings[i]
    }
  }

  console.log('[VideoStation] 解析到', movies.length, '条')
  if (movies.length > 0) {
    console.log('[VideoStation] 前3条示例:', movies.slice(0, 3).map(m => ({ id: m.id, title: m.title, cover: m.cover })))
    const withoutCover = movies.filter(m => !m.cover)
    if (withoutCover.length > 0) {
      console.warn('[VideoStation] 有', withoutCover.length, '条缺少封面:', withoutCover.slice(0, 3).map(m => m.title))
    }
  }
  return movies
}

/**
 * 从详情页 HTML 提取详细信息
 */
export function parseMovieDetail(html: string): Partial<VideoMovie> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const result: Partial<VideoMovie> = {}

  // 片名
  const h1 = doc.querySelector('h1, .movie-title, .article-title')
  if (h1) result.title = h1.textContent?.trim() || ''

  // 封面
  const poster = doc.querySelector('.movie-poster img, .pic img, .article-content img')
  if (poster) result.cover = poster.getAttribute('src') || poster.getAttribute('data-src') || ''

  // 主演 / 描述
  const infoEls = doc.querySelectorAll('.movie-info p, .article-info p, .infobox p, dl dt, dl dd')
  for (const el of infoEls) {
    const text = el.textContent?.trim() || ''
    if (text.includes('主演') || text.includes('演员')) {
      result.cast = text.replace(/^[^：:]+[：:]\s*/, '')
    } else if (text.includes('简介') || text.includes('剧情')) {
      result.description = text.replace(/^[^：:]+[：:]\s*/, '')
    } else if (text.includes('年份')) {
      result.year = text.replace(/^[^：:]+[：:]\s*/, '')
    }
  }

  // 描述兜底：取 article-content 的首段
  if (!result.description) {
    const intro = doc.querySelector('.article-content, .movie-intro, .content')
    if (intro) {
      const p = intro.querySelector('p')
      result.description = p?.textContent?.trim() || (intro.textContent?.slice(0, 300) || '')
    }
  }

  return result
}

/* ----------------------------- 公共 API ----------------------------- */

/** 获取视频站基础 URL */
export function getBaseUrl(): string {
  const settingsStore = useSettingsStore()
  return settingsStore.videoStation.trim() || 'https://www.4kcz.com'
}

export async function fetchCategoryList(categoryPath: string): Promise<VideoMovie[]> {
  const settingsStore = useSettingsStore()
  const configuredBase = settingsStore.videoStation.trim() || 'https://www.4kcz.com'
  let target: string
  if (isElectron) {
    target = `${configuredBase.replace(/\/$/, '')}${categoryPath}`
  } else {
    // web 端：只取路径部分，经 /video-station 代理
    try {
      const u = new URL(`${configuredBase.replace(/\/$/, '')}${categoryPath}`)
      target = `${u.pathname}${u.search}`
    } catch {
      target = categoryPath
    }
  }
  const fetchedUrl = buildRequestUrl(target)
  const resp = await fetchWithTimeout(fetchedUrl)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const html = await resp.text()
  return parseMovieList(html, isElectron ? configuredBase : 'https://www.4kcz.com')
}

/** 加载影视详情（返回 Partial 合并到已有数据上） */
export async function fetchMovieDetail(id: string): Promise<Partial<VideoMovie>> {
  const settingsStore = useSettingsStore()
  const configuredBase = settingsStore.videoStation.trim() || 'https://www.4kcz.com'
  let target: string
  if (isElectron) {
    target = `${configuredBase.replace(/\/$/, '')}/movie/${id}.html`
  } else {
    try {
      const u = new URL(`${configuredBase.replace(/\/$/, '')}/movie/${id}.html`)
      target = `${u.pathname}${u.search}`
    } catch {
      target = `/movie/${id}.html`
    }
  }
  const fetchedUrl = buildRequestUrl(target)
  const resp = await fetchWithTimeout(fetchedUrl)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const html = await resp.text()
  return parseMovieDetail(html)
}

/** 搜索（通过站内搜索路径 ?s=keyword） */
export async function searchMovies(keyword: string): Promise<VideoMovie[]> {
  const settingsStore = useSettingsStore()
  const configuredBase = settingsStore.videoStation.trim() || 'https://www.4kcz.com'
  const kw = encodeURIComponent(keyword)
  let target: string
  if (isElectron) {
    target = `${configuredBase.replace(/\/$/, '')}/?s=${kw}`
  } else {
    try {
      const u = new URL(`${configuredBase.replace(/\/$/, '')}/`)
      target = `${u.pathname}?s=${kw}`
    } catch {
      target = `/?s=${kw}`
    }
  }
  const fetchedUrl = buildRequestUrl(target)
  const resp = await fetchWithTimeout(fetchedUrl)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const html = await resp.text()
  return parseMovieList(html, isElectron ? configuredBase : 'https://www.4kcz.com')
}

// --- keep a helper for VideoDetailPage ---
