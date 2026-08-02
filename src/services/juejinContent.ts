// 抓取掘金文章页 HTML 并抽取正文（.article-viewer.markdown-body）。
// 用于在未登录态下获取正文，规避 detail 接口对 content_id/登录态的依赖。

const isElectron = typeof window !== 'undefined' && (window as any).__IS_ELECTRON__ === true

const JUEJIN_PAGE_BASE = import.meta.env.VITE_JUEJIN_PAGE_BASE || 'https://juejin.cn'

async function fetchPageHtml(url: string): Promise<string> {
  if (isElectron && (window as any).__fileBridge?.juejinGetPage) {
    const result = await (window as any).__fileBridge.juejinGetPage(url)
    if (!result.ok) throw new Error(result.error || 'fetch failed')
    return result.data
  }
  // 本地走 Vite 代理（/juejin-page），打包后走真实地址（VITE_JUEJIN_PAGE_BASE）
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

// 去除 <style>/<script>，并清理危险属性（on* 事件、javascript: 协议）
function sanitize(html: string): string {
  let out = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"(?:[^"]*)"/gi, '')
    .replace(/\son\w+\s*=\s*'(?:[^']*)'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:/gi, '$1=$2')
  return out
}

// 从整页 HTML 抽取正文容器内容
export function extractArticle(html: string): string {
  // 优先匹配 <div class="article-viewer markdown-body">
  const re = /<div[^>]*class="[^"]*article-viewer\s+markdown-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i
  const m = html.match(re)
  if (m) return sanitize(m[1])

  // 兜底：匹配任意 class 含 markdown-body 的容器
  const re2 = /<div[^>]*class="[^"]*markdown-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i
  const m2 = html.match(re2)
  if (m2) return sanitize(m2[1])

  // 再兜底：直接取 <article> 内部
  const re3 = /<article[^>]*>([\s\S]*?)<\/article>/i
  const m3 = html.match(re3)
  if (m3) return sanitize(m3[1])

  return ''
}

export async function getJuejinArticleContent(articleId: string): Promise<string> {
  const url = `https://juejin.cn/post/${articleId}`
  const html = await fetchPageHtml(url)
  return extractArticle(html)
}
