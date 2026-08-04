// 掘金文章内存缓存：列表加载时把文章元数据存入，
// 详情页优先从缓存读取元数据，避免重复请求不稳定的详情接口。

export interface JuejinArticle {
  article_id: string
  title: string
  brief_content: string
  web_html_content: string
  cover_image: string
  view_count: number
  digg_count: number
  comment_count: number
  user_name: string
  tags: { tag_name: string; color: string }[]
}

const cache = new Map<string, JuejinArticle>()

export function putJuejinArticle(article: JuejinArticle): void {
  // 合并：已存在的保留 web_html_content（可能之前已抓取全文）
  const existing = cache.get(article.article_id)
  if (existing?.web_html_content && !article.web_html_content) {
    article.web_html_content = existing.web_html_content
  }
  cache.set(article.article_id, article)
}

export function getJuejinArticle(id: string): JuejinArticle | undefined {
  return cache.get(id)
}

export function hasJuejinArticle(id: string): boolean {
  return cache.has(id)
}

export function getAllCachedArticles(): JuejinArticle[] {
  return Array.from(cache.values())
}
