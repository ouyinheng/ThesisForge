// 掘金文章正文获取 —— 多策略兼容：
//   1) detail API（稳定，仅非 markdown 文章返回正文）
//   2) 抓页面 HTML + 正则抽取容器（.article-viewer / markdown-body / article 等）
//   3) 兜底：把整页 body 清理后塞进一个 <div> 返回（保证有内容）

const isElectron = typeof window !== 'undefined' && (window as any).__IS_ELECTRON__ === true
const JUEJIN_API_BASE = import.meta.env.VITE_JUEJIN_API_BASE || 'https://api.juejin.cn'
const JUEJIN_PAGE_BASE = import.meta.env.VITE_JUEJIN_PAGE_BASE || 'https://juejin.cn'

/* ----------------------------- 通用 request ----------------------------- */

async function requestJuejin(opts: {
  url: string
  method: 'POST' | 'GET'
  params?: Record<string, string | number>
  body?: Record<string, unknown>
}): Promise<any> {
  let fullUrl = opts.url
  if (opts.params) {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(opts.params)) sp.set(k, String(v))
    const sep = fullUrl.includes('?') ? '&' : '?'
    fullUrl = fullUrl + sep + sp.toString()
  }
  if (isElectron && (window as any).__fileBridge?.juejinFetch) {
    const result = await (window as any).__fileBridge.juejinFetch({
      url: fullUrl,
      method: opts.method,
      body: opts.body,
    })
    if (!result.ok) throw new Error(result.error || 'fetch failed')
    return result.data
  }
  const target = JUEJIN_API_BASE + fullUrl.replace('https://api.juejin.cn', '')
  const fetchOpts: RequestInit = { method: opts.method }
  if (opts.method === 'POST') {
    fetchOpts.headers = { 'Content-Type': 'application/json' }
    fetchOpts.body = JSON.stringify(opts.body)
  }
  const resp = await fetch(target, fetchOpts)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

/* ------------------------- 策略 1：detail API -------------------------- */

export async function fetchArticleDetail(articleId: string): Promise<string> {
  const json = await requestJuejin({
    url: 'https://api.juejin.cn/content_api/v1/article/detail',
    method: 'POST',
    body: {
      article_id: String(articleId),
      client_type: 2608,
      aid: 2608,
      req_from: 1,
      forbid_count: false,
      is_pre_load: false,
      need_theme: true,
    },
  })
  if (json.err_no !== 0) throw new Error(`detail api err_no=${json.err_no} ${json.err_msg || ''}`)
  const info = json.data?.article_info
  if (!info) throw new Error('no article_info')
  if (Number(info.column_id) > 0) throw new Error('column article, skip')
  // markdown 文章 content 为空
  if (!info.content || !info.content.trim()) throw new Error('empty content')
  return info.content
}

/* ------------------------- 策略 2：页面 HTML 抓取 ---------------------------- */

async function fetchPageHtml(url: string): Promise<string> {
  if (isElectron && (window as any).__fileBridge?.juejinGetPage) {
    const result = await (window as any).__fileBridge.juejinGetPage(url)
    if (!result.ok) throw new Error(result.error || 'fetch failed')
    return result.data
  }
  const target = JUEJIN_PAGE_BASE + url.replace('https://juejin.cn', '')
  const resp = await fetch(target, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.text()
}

function sanitize(html: string): string {
  let out = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"(?:[^"]*)"/gi, '')
    .replace(/\son\w+\s*=\s*'(?:[^']*)'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:/gi, '$1=$2')
  // 掘金反爬：src 是 data:image 占位的真实链接在 data-src/srcset 上
  out = out.replace(/\sdata-src="([^"]+)"/gi, ' src="$1"')
  return out
}

/** 按优先级尝试多种容器选择器 */
export function extractArticle(html: string): string {
  const patterns: Array<RegExp> = [
    /<div[^>]*class="[^"]*article-viewer\b[^"]*"[^>]*>(?:\s*<style>[\s\S]*?<\/style>\s*)([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i,
    /<div[^>]*class="[^"]*markdown-body\b[^"]*"[^>]*>(?:\s*<style>[\s\S]*?<\/style>\s*)([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i,
    /<div[^>]*id="article-root"[^>]*>([\s\S]*?)(?=<\/div>\s*<div[^>]*class="sidebar)/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m && m[1] && m[1].trim().length > 50) return sanitize(m[1])
  }
  return ''
}

/* ------------------------- 策略 3：全文 body 兜底 ---------------------------- */

function extractBody(html: string): string {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  if (!m) return ''
  let body = m[1]
  // 移除导航 / 侧边栏 / 底部等噪音
  body = body
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<div[^>]*id="sidebar-container"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*article-catalog[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*article-end[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"(?:[^"]*)"/gi, '')
    .replace(/\son\w+\s*=\s*'(?:[^']*)'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:/gi, '$1=$2')
    .replace(/\sdata-src="([^"]+)"/gi, ' src="$1"')
  return body.trim()
}

/* ------------------------------ 入口 ------------------------------ */

export async function getJuejinArticleContent(articleId: string): Promise<string> {
  // 1. detail API
  try {
    const c = await fetchArticleDetail(articleId)
    if (c && c.trim()) return c
  } catch {}

  // 2. 抓取文章页 + 容器正则提取
  try {
    const html = await fetchPageHtml(`https://juejin.cn/post/${articleId}`)
    if (!html) return ''
    const extracted = extractArticle(html)
    if (extracted && extracted.trim().length > 100) return extracted

    // 3. 最后一招：把 body 作为兜底
    const body = extractBody(html)
    if (body && body.length > 200) {
      return `<div class="juejin-body-fallback">${body}</div>`
    }
  } catch {}

  return ''
}
