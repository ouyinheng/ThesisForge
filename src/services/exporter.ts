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
  pdf.text(title || 'PaperBlog', margin, 8)

  return pdf.output('blob')
}
