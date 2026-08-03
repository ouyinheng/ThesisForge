import type { Ref } from 'vue'

export interface FetchResult {
  title: string
  icon: string
  ok: boolean
}

/** 从 URL 提取域名 */
export function getDomain(url: string): string {
  try {
    return new URL(url.trim()).hostname
  } catch {
    return ''
  }
}

/** 生成 favicon 候选地址列表 */
function faviconCandidates(domain: string): string[] {
  if (!domain) return []
  return [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icon.horse/icon/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ]
}

/** 预加载图片，返回是否加载成功 */
function tryImgLoad(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/**
 * 尝试获取书签信息。
 * 浏览器 CORS 下无法直接 fetch 页面 HTML，因此：
 *  - icon: 使用 Google favicon 服务 + icon.horse 兜底
 *  - title: 尝试通过 DOMParser 解析同域（Electron / 同源时有效），
 *           否则回退为 domain 首字母大写
 */
export async function fetchBookmarkInfo(rawUrl: string): Promise<FetchResult> {
  let url = rawUrl.trim()
  if (!url) return { title: '', icon: '', ok: false }
  // 自动补全 https://
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url

  const domain = getDomain(url)
  if (!domain) return { title: '', icon: '', ok: false }

  // 1) 图标：按优先级试 favicon 服务，找到可加载的就用
  const candidates = faviconCandidates(domain)
  let icon = ''
  for (const c of candidates) {
    if (await tryImgLoad(c)) {
      icon = c
      break
    }
  }

  // 2) title：先试 fetch + DOMParser；失败回退为 domain
  let title = ''
  try {
    const resp = await fetch(url, { mode: 'cors', credentials: 'omit' })
    if (resp.ok) {
      const html = await resp.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      title = doc.querySelector('title')?.textContent?.trim() || ''
    }
  } catch {
    /* CORS blocked */
  }

  if (!title) {
    // 兜底：二级域名作为标题，如 www.github.com -> github
    const parts = domain.split('.')
    title = parts.length > 2 ? parts[parts.length - 2] : parts[0]
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  return { title, icon, ok: true }
}

// 同步导出，方便模板用
export { faviconCandidates }
