declare module 'turndown' {
  interface TurndownOptions {
    headingStyle?: 'setext' | 'atx'
    hr?: string
    bulletListMarker?: string
    codeBlockStyle?: 'indented' | 'fenced'
    fence?: string
    emDelimiter?: string
    strongDelimiter?: string
    linkStyle?: 'inlined' | 'referenced'
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut'
    br?: string
    blankReplacement?: (content: string, node: Node) => string
    keepReplacement?: (content: string, node: Node) => string
    defaultReplacement?: (content: string, node: Node) => string
    preprocess?: (doc: Document) => Document
  }

  interface Plugin {
    (turndown: TurndownService): void
  }

  class TurndownService {
    constructor(options?: TurndownOptions)
    turndown(html: string | Node): string
    use(plugin: Plugin): this
    addRule(key: string, rule: unknown): this
    keep(filter: string | string[]): this
    remove(filter: string | string[]): this
    escape(content: string): string
  }

  export default TurndownService
}

declare module 'turndown-plugin-gfm' {
  export const gfm: import('turndown').Plugin
  export const strikethrough: import('turndown').Plugin
  export const tables: import('turndown').Plugin
  export const taskListItems: import('turndown').Plugin
}
