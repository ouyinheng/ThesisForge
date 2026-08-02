import { ref, watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const messages = {
  zh: {
    nav: {
      papers: '全部论文',
      write: '写文章',
      juejin: '掘金',
      about: '关于',
      read: '阅读全文',
      back: '返回',
      publish: '发布文章',
      articleCount: '篇论文',
    },
    juejin: {
      recommend: '推荐',
      latest: '最新',
    },
    home: {
      title: '全部论文',
      sortByDate: '按日期排序',
      sortByTitle: '按标题排序',
      empty: '暂无论文，点击"写文章"开始创作',
      readTime: '分钟阅读',
    },
    article: {
      delete: '删除',
      edit: '编辑',
      confirmDelete: '确定要删除这篇文章吗？此操作不可撤销。',
      readTime: '分钟阅读',
      export: '导出',
      exportMarkdown: 'Markdown',
      exportImage: 'PNG 图片',
      exportPDF: 'PDF 文档',
    },
    editor: {
      newTitle: '新建论文',
      editTitle: '编辑论文',
      titlePlaceholder: '输入论文标题...',
      summaryPlaceholder: '输入摘要（可选，留空则自动从正文提取）',
      tagPlaceholder: '输入标签后按回车添加',
      tagSuggestions: '常用标签',
      emptyTitle: '请输入论文标题',
      emptyContent: '请输入论文内容',
      publishSuccess: '发布成功',
    },
    about: {
      title: '关于 PaperBlog',
      description:
        'PaperBlog 是一个简约、专业的学术论文风格博客平台。专注于内容本身的写作与发布体验。',
      features: '核心功能',
      featureList: [
        '富文本编辑器，支持代码块、表格、图片等丰富格式',
        '亮色/暗色双主题切换',
        '侧边栏/顶栏两种布局',
        '中英文国际化',
        '本地数据持久化存储',
      ],
      footer: '简约学术发布平台',
    },
    sidebar: {
      academic: '简约学术发布平台',
      articles: '篇文章',
    },
    display: {
      light: '亮色',
      dark: '暗色',
    },
    settings: '设置',
    theme: '主题',
    layout: '布局',
    language: '语言',
    storagePath: '存储路径',
    storagePathDesc: '更改文章数据的存放位置（仅桌面版生效）',
    resetPath: '恢复默认',
    changePath: '更改',
    editPath: '点击修改',
    save: '保存',
    cancel: '取消',
    pathSaved: '存储路径已更新',
    pathNotSet: '未设置',
    pathRequired: '请先设置存储路径再保存文章',
  },
  en: {
    nav: {
      papers: 'Papers',
      write: 'Write',
      juejin: 'Juejin',
      about: 'About',
      read: 'Read →',
      back: 'Back',
      publish: 'Publish',
      articleCount: 'papers',
    },
    juejin: {
      recommend: 'Recommended',
      latest: 'Latest',
    },
    home: {
      title: 'All Papers',
      sortByDate: 'Sort by date',
      sortByTitle: 'Sort by title',
      empty: 'No papers yet. Click "Write" to start.',
      readTime: 'min read',
    },
    article: {
      delete: 'Delete',
      edit: 'Edit',
      confirmDelete:
        'Are you sure you want to delete this article? This action cannot be undone.',
      readTime: 'min read',
      export: 'Export',
      exportMarkdown: 'Markdown',
      exportImage: 'PNG Image',
      exportPDF: 'PDF Document',
    },
    editor: {
      newTitle: 'New Paper',
      editTitle: 'Edit Paper',
      titlePlaceholder: 'Enter paper title...',
      summaryPlaceholder: 'Enter summary (optional, auto-generated from content if empty)',
      tagPlaceholder: 'Type a tag and press Enter',
      tagSuggestions: 'Suggested tags',
      emptyTitle: 'Please enter a title',
      emptyContent: 'Please enter content',
      publishSuccess: 'Published successfully',
    },
    about: {
      title: 'About PaperBlog',
      description:
        'PaperBlog is a minimal, professional academic-style blog platform. Focused on content-first writing and publishing experience.',
      features: 'Features',
      featureList: [
        'Rich text editor with code blocks, tables, images',
        'Light/Dark theme toggle',
        'Side/Topbar layout options',
        'Chinese/English i18n',
        'Local storage persistence',
      ],
      footer: 'Minimal Academic Publishing',
    },
    sidebar: {
      academic: 'Minimal academic publishing platform',
      articles: 'papers',
    },
    display: {
      light: 'Light',
      dark: 'Dark',
    },
    settings: 'Settings',
    theme: 'Theme',
    layout: 'Layout',
    language: 'Language',
    storagePath: 'Storage Path',
    storagePathDesc: 'Change where article data is stored (desktop only)',
    resetPath: 'Reset',
    changePath: 'Change',
    editPath: 'Click to edit',
    save: 'Save',
    cancel: 'Cancel',
    pathSaved: 'Storage path updated',
    pathNotSet: 'Not set',
    pathRequired: 'Please set a storage path before saving articles',
  },
} as const

type Messages = typeof messages
type NestedKeyOf<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object
    ? K | `${K}.${NestedKeyOf<T[K]>}`
    : K
  : never
type MessageKey = NestedKeyOf<Messages['zh']>

export function useI18n() {
  const settings = useSettingsStore()
  const currentLocale = settings.locale

  watchEffect(() => {
    document.documentElement.lang = settings.locale === 'zh' ? 'zh-CN' : 'en'
  })

  function setLocaleLang(locale: 'zh' | 'en'): void {
    settings.setLocaleLang(locale)
  }

  function toggleLocale(): void {
    settings.toggleLocale()
  }

  function t(key: string): string {
    const keys = key.split('.')
    const localeMessages = messages[settings.locale] as Record<string, unknown>
    let value: unknown = localeMessages
    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return key
      }
    }
    return (value as string) || key
  }

  return {
    currentLocale,
    setLocale: setLocaleLang,
    toggleLocale,
    t,
  }
}
