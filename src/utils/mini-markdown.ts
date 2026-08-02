// 轻量 Markdown -> HTML 渲染器（工具箱专用，无需额外依赖）
// 支持：标题、段落、粗体、斜体、删除线、行内代码、代码块、链接、
// 图片、无序列表、有序列表、引用、分割线

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderMiniMarkdown(src: string): string {
  let text = src

  // 1. 提取代码块，避免被其他规则干扰
  const codeBlocks: string[] = []
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    codeBlocks.push(`<pre><code>${escapeHtml(code.trimEnd())}</code></pre>`)
    return `\u0000CODE${codeBlocks.length - 1}\u0000`
  })

  // 2. 提取行内代码
  const inlineCodes: string[] = []
  text = text.replace(/`([^`\n]+)`/g, (_m, code) => {
    inlineCodes.push(escapeHtml(code))
    return `\u0000IC${inlineCodes.length - 1}\u0000`
  })

  // 3. Escape HTML 实体
  text = escapeHtml(text)

  // 4. 恢复行内代码占位符
  text = text.replace(/\u0000IC(\d+)\u0000/g, (_m, i) => `<code>${inlineCodes[+i]}</code>`)

  // 5. 恢复代码块占位符
  text = text.replace(/\u0000CODE(\d+)\u0000/g, (_m, i) => codeBlocks[+i])

  // 6. 粗体+斜体 ***text***
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  // 粗体 **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // 斜体 *text*（排除已处理的粗体内部）
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  // 删除线 ~~text~~
  text = text.replace(/~~(.+?)~~/g, '<del>$1</del>')

  // 7. 链接 [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  )
  // 图片 ![alt](url)
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%"/>'
  )

  // 8. 标题 h1-h6
  text = text.replace(/^(#{1,6})\s+(.+)$/gm, (_m, hashes: string, content: string) => {
    const level = hashes.length
    return `<h${level}>${content}</h${level}>`
  })

  // 9. 引用 >
  text = text.replace(/^&gt;\s?(.*)$/gm, (_m, t) => `<blockquote><p>${t}</p></blockquote>`)

  // 10. 分割线
  text = text.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr/>')

  // 11. 无序列表
  text = text.replace(/^[-*+]\s+(.+)$/gm, '<ul-li>$1</ul-li>')
  // 有序列表
  text = text.replace(/^(\d+)\.\s+(.+)$/gm, '<ol-li>$2</ol-li>')

  // 合并相邻 <ul-li> 为 <ul>...</ul>
  text = text.replace(/(?:<ul-li>.*?<\/ul-li>\n?)+/g, (block) => {
    const items = block
      .split('\n')
      .filter(Boolean)
      .map((l) => l.replace(/<ul-li>(.*)<\/ul-li>/, '<li>$1</li>'))
    return `<ul>${items.join('')}</ul>`
  })
  // 合并相邻 <ol-li> 为 <ol>...</ol>
  text = text.replace(/(?:<ol-li>.*?<\/ol-li>\n?)+/g, (block) => {
    const items = block
      .split('\n')
      .filter(Boolean)
      .map((l) => l.replace(/<ol-li>(.*)<\/ol-li>/, '<li>$1</li>'))
    return `<ol>${items.join('')}</ol>`
  })

  // 12. 处理段落：将连续非空行且不以标签开头的文本包裹为 <p>
  const lines = text.split('\n')
  const result: string[] = []
  let buffer: string[] = []

  const flushBuffer = () => {
    if (buffer.length === 0) return
    const content = buffer.join('<br/>').trimEnd()
    if (content) result.push(`<p>${content}</p>`)
    buffer = []
  }

  const isBlockLine = (line: string): boolean => {
    const t = line.trim()
    if (!t) return false
    return /^<(h[1-6]|ul|ol|blockquote|pre|hr)/.test(t)
  }

  for (const line of lines) {
    if (line.trim() === '') {
      flushBuffer()
      continue
    }
    if (isBlockLine(line)) {
      flushBuffer()
      result.push(line)
    } else if (/^<\//.test(line.trim())) {
      flushBuffer()
      result.push(line)
    } else {
      buffer.push(line)
    }
  }
  flushBuffer()

  return result.join('\n').replace(/\n{3,}/g, '\n\n')
}
