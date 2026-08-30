import type { Article } from '@/types'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
})
turndown.use(gfm)

function yamlEscape(s: string): string {
  if (/[:"\n]/.test(s)) return `"${s.replace(/"/g, '\\"')}"`
  return s
}

export function exportToHTML(article: Article): string {
  const theme = document.documentElement.getAttribute('data-theme') || 'light'
  const isDark = theme === 'dark'
  const css = `
*,*::before,*::after{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.75;color:${isDark ? '#e5e7eb' : '#1f2937'};background:${isDark ? '#1a1a1a' : '#ffffff'};max-width:820px;margin:0 auto;padding:2em 1.5em}
h1,h2,h3,h4,h5,h6{font-family:Georgia,'Times New Roman',serif;line-height:1.3;margin:1.5em 0 0.5em;font-weight:700}h1{font-size:1.8em}h2{font-size:1.5em}h3{font-size:1.25em}
p{margin:0.75em 0}
a{color:${isDark ? '#f87171' : '#d12f2f'};text-decoration:none}
a:hover{text-decoration:underline}
code{background:${isDark ? '#2d2d2d' : '#f3f4f6'};padding:0.15em 0.4em;border-radius:3px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:0.9em}
pre{background:${isDark ? '#1e1e1e' : '#f8f9fa'};padding:1em 1.25em;border-radius:6px;overflow-x:auto;margin:1em 0}
pre code{background:none;padding:0}
blockquote{border-left:3px solid ${isDark ? '#f87171' : '#d12f2f'};padding:0.5em 1em;margin:1em 0;color:${isDark ? '#9ca3af' : '#6b7280'};font-style:italic}
img{max-width:100%;border-radius:4px}
table{border-collapse:collapse;width:100%;margin:1em 0}
th,td{border:1px solid ${isDark ? '#374151' : '#e5e7eb'};padding:0.5em 0.75em;text-align:left}
th{background:${isDark ? '#2d2d2d' : '#f8f9fa'}}
ul,ol{padding-left:1.5em}
li{margin:0.25em 0}
hr{border:none;border-top:1px solid ${isDark ? '#374151' : '#e5e7eb'};margin:2em 0}
.article-meta{color:${isDark ? '#6b7280' : '#9ca3af'};font-size:0.875em;margin-bottom:0.5em}
.article-tag{display:inline-block;background:${isDark ? '#2d2d2d' : '#f3f4f6'};color:${isDark ? '#d1d5db' : '#4b5563'};padding:0.1em 0.6em;border-radius:3px;margin-right:6px;font-size:0.8em}
.article-summary{border-left:3px solid ${isDark ? '#f87171' : '#d12f2f'};padding:0.7em 1.2em;background:${isDark ? '#252525' : '#fef2f2'};margin:1.5em 0;border-radius:0 4px 4px 0;font-style:italic;color:${isDark ? '#9ca3af' : '#6b7280'}}
`
  const tags = article.tags.map(t => `<span class="article-tag">${escapeHtml(t)}</span>`).join('')
  const meta = `<div class="article-meta">${formatDate(article.createdAt)}</div>`
  const summary = article.summary ? `<div class="article-summary">${escapeHtml(article.summary)}</div>` : ''

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(article.title)}</title>
<style>${css}</style>
</head>
<body>
<article>
<h1>${escapeHtml(article.title)}</h1>
${meta}${tags ? '<div style="margin-bottom:1em">' + tags + '</div>' : ''}${summary}${article.content}
</article>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) } catch { return d }
}

export function exportToMarkdown(article: Article): string {
  const meta = [
    '---',
    `title: ${yamlEscape(article.title)}`,
    `date: ${article.createdAt}`,
    `updated: ${article.updatedAt}`,
    `tags: [${article.tags.join(', ')}]`,
    '---',
    '',
  ].join('\n')
  const summary = article.summary ? `> ${article.summary}\n\n` : ''
  const body = turndown.turndown(article.content)
  return meta + summary + body + '\n'
}

export async function exportToImage(element: HTMLElement, _title: string, opts: { scale?: number; backgroundColor?: string } = {}): Promise<Blob> {
  const { scale = 2, backgroundColor = '#ffffff' } = opts
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor,
    useCORS: true,
    logging: false,
    allowTaint: true,
  })
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('toBlob failed'))
    }, 'image/png')
  })
}

export async function exportToPDF(element: HTMLElement, title: string, opts: { backgroundColor?: string; margin?: number } = {}): Promise<Blob> {
  const { backgroundColor = '#ffffff', margin = 10 } = opts
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor,
    useCORS: true,
    logging: false,
    allowTaint: true,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const contentW = pageW - margin * 2
  const ratio = contentW / canvas.width
  const contentH = canvas.height * ratio
  const usableH = pageH - margin * 2
  const pages = Math.max(1, Math.ceil(contentH / usableH))

  for (let i = 0; i < pages; i++) {
    if (i > 0) pdf.addPage()
    const sourceY = (i * usableH) / ratio
    const currentPageH = Math.min(usableH, contentH - i * usableH)
    const sourceH = currentPageH / ratio

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = Math.ceil(sourceH)
    const ctx = pageCanvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      ctx.drawImage(canvas, 0, Math.floor(sourceY), canvas.width, Math.ceil(sourceH), 0, 0, canvas.width, Math.ceil(sourceH))
    }
    const data = pageCanvas.toDataURL('image/png')
    pdf.addImage(data, 'PNG', margin, margin, contentW, currentPageH)
  }

  pdf.setFontSize(9)
  pdf.setTextColor(160)
  pdf.text(title || 'ThesisForge', margin, 8)

  return pdf.output('blob')
}
