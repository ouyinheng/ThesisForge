import { ref, watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const messages = {
  zh: {
    nav: {
      home: '首页',
      papers: '全部',
      write: '写文章',
      juejin: '掘金',
      about: '关于',
      external: '外站',
      read: '阅读全文',
      back: '返回',
      publish: '发布文章',
      articleCount: '篇论文',
    },
    juejin: {
      recommend: '推荐',
      latest: '最新',
    },
    tabs: {
      reload: '重新加载',
      close: '关闭',
      closeOthers: '关闭其他',
      closeLeft: '关闭左侧',
      closeRight: '关闭右侧',
      cannotCloseHome: '首页标签不能关闭',
    },
    home: {
      title: '全部',
      sortByDate: '按日期排序',
      sortByTitle: '按标题排序',
      empty: '暂无论文，点击"写文章"开始创作',
      readTime: '分钟阅读',
      // 工作台
      dashboard: '工作台',
      greetingMorning: '早上好',
      greetingAfternoon: '下午好',
      greetingEvening: '晚上好',
      statArticles: '文章总数',
      statTags: '标签数量',
      statWords: '总字数',
      statWeek: '本周发布',
      statActiveDays: '活跃天数',
      quickActions: '快捷创作',
      toolbox: '工具箱',
      recent: '最近文章',
      recentEmpty: '暂无文章，',
      recentCreate: '前往创作',
      activity: '写作活跃度',
      activityViewAll: '查看全部',
      activityEmpty: '还没有写作记录，今天开始第一篇吧',
      quoteRefresh: '换一句',
      footerSaved: '本地已保存',
      footerSynced: '已同步',
      footerVersion: '版本',
      weekPublish: '本周发布',
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
      exportHTML: 'HTML 网页',
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
      toolbar: {
        bold: '加粗',
        italic: '斜体',
        underline: '下划线',
        strike: '删除线',
        heading2: '二级标题',
        heading3: '三级标题',
        bulletList: '无序列表',
        orderedList: '有序列表',
        taskList: '任务列表',
        blockquote: '引用',
        codeBlock: '代码块',
        alignLeft: '左对齐',
        alignCenter: '居中对齐',
        alignRight: '右对齐',
        link: '插入链接',
        image: '插入图片',
        table: '插入表格',
        undo: '撤销',
        redo: '重做',
      },
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
    city: '天气城市',
    cityPlaceholder: '输入城市名，留空将自动定位',
    accentColor: '主题色',
    accentDefault: '默认',
    showTabs: '标签页',
    showTabsOn: '显示',
    showTabsOff: '隐藏',
    // 工具箱
    tools: {
      title: '工具箱',
      copied: '已复制到剪贴板',
      downloaded: '已下载',
      clear: '清空',
      copy: '复制',
      copyMd: '复制 MD',
      copyMdTip: '复制 Markdown 原文',
      copyHtml: '复制 HTML',
      copyHtmlTip: '复制渲染后的 HTML',
      copyStat: '复制统计',
      copyMatches: '复制匹配',
      download: '下载',
      // Markdown 工具
      markdown: {
        title: 'Markdown 预览',
        edit: '编辑',
        preview: '预览',
        placeholder: '在此输入 Markdown 文本...',
      },
      // 字数统计
      wordcount: {
        title: '字数统计',
        placeholder: '在此粘贴或输入文本...',
        empty: '输入文本以查看统计信息',
        letters: '总字符',
        noSpaces: '不含空格',
        chinese: '中文字数',
        english: '英文单词',
        words: '数字',
        punctuation: '标点',
        paragraphs: '段落数',
        readTime: '预计阅读',
        min: '分钟',
      },
      // JSON 工具
      json: {
        title: 'JSON 格式化',
        placeholder: '在此粘贴 JSON 字符串...',
        indent: '缩进',
        sortKeysOff: '原始排序',
        sortKeysOn: '排序键',
        result: '格式化结果',
        error: '解析错误',
        minify: '压缩',
        minified: '已压缩',
      },
      // URL 编码
      url: {
        title: 'URL 编解码',
        encode: '编码',
        decode: '解码',
        modeComp: '组件（推荐）',
        modeFull: '完整 URL',
        encodePlaceholder: '输入要编码的文本...',
        decodePlaceholder: '输入要解码的 URL 编码字符串...',
        resultPlaceholder: '结果显示在这里...',
        swap: '交换',
        swapped: '已交换',
        error: '编解码错误',
      },
      // 正则测试
      regex: {
        title: '正则测试',
        patternPlaceholder: '输入正则表达式...',
        textPlaceholder: '在此输入待匹配的文本...',
        selectPreset: '选择常用正则...',
        presets: {
          email: '邮箱',
          phone: '手机号',
          url: 'URL 链接',
          ipv4: 'IPv4 地址',
          date: '日期 (YYYY-MM-DD)',
        },
        matches: '匹配数',
        noMatch: '无匹配结果',
        error: '正则错误',
      },
      // 图片转 PDF
      pdf: {
        title: '图片转 PDF',
        dragTip: '点击或拖入图片文件',
        supportTip: '支持 JPG / PNG / WebP，可多选',
        remove: '移除',
        paperSize: '纸张大小',
        generate: '生成 PDF',
        success: 'PDF 生成成功',
        error: '生成失败',
      },
      // 天气
      weather: {
        loading: '加载中...',
        locate: '定位中...',
        locFailed: '定位失败，请手动选择',
        switchCity: '切换城市',
        feelsLike: '体感',
        humidity: '湿度',
        wind: '风速',
        high: '高',
        low: '低',
      },
      // 一言
      quote: {
        loading: '加载中...',
        refresh: '换一句',
        error: '加载失败，显示本地名言',
      },
    },
  },
  en: {
    nav: {
      home: 'Home',
      papers: 'Papers',
      write: 'Write',
      juejin: 'Juejin',
      about: 'About',
      external: 'External',
      read: 'Read →',
      back: 'Back',
      publish: 'Publish',
      articleCount: 'papers',
    },
    juejin: {
      recommend: 'Recommended',
      latest: 'Latest',
    },
    tabs: {
      reload: 'Reload',
      close: 'Close',
      closeOthers: 'Close Others',
      closeLeft: 'Close Left',
      closeRight: 'Close Right',
      cannotCloseHome: 'Home tab cannot be closed',
    },
    home: {
      title: 'All Papers',
      sortByDate: 'Sort by date',
      sortByTitle: 'Sort by title',
      empty: 'No papers yet. Click "Write" to start.',
      readTime: 'min read',
      // Dashboard
      dashboard: 'Dashboard',
      greetingMorning: 'Good morning',
      greetingAfternoon: 'Good afternoon',
      greetingEvening: 'Good evening',
      statArticles: 'Total Articles',
      statTags: 'Tags',
      statWords: 'Total Words',
      statWeek: 'Published This Week',
      statActiveDays: 'Active Days',
      quickActions: 'Quick Actions',
      toolbox: 'Toolbox',
      recent: 'Recent Articles',
      recentEmpty: 'No articles yet, ',
      recentCreate: 'start writing',
      activity: 'Writing Activity',
      activityViewAll: 'View all',
      activityEmpty: 'No writing records yet. Start your first draft today.',
      quoteRefresh: 'Shuffle',
      footerSaved: 'Saved locally',
      footerSynced: 'Synced',
      footerVersion: 'v',
      weekPublish: 'Published this week',
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
      exportHTML: 'HTML Page',
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
      toolbar: {
        bold: 'Bold',
        italic: 'Italic',
        underline: 'Underline',
        strike: 'Strikethrough',
        heading2: 'Heading 2',
        heading3: 'Heading 3',
        bulletList: 'Bullet List',
        orderedList: 'Ordered List',
        taskList: 'Task List',
        blockquote: 'Blockquote',
        codeBlock: 'Code Block',
        alignLeft: 'Align Left',
        alignCenter: 'Align Center',
        alignRight: 'Align Right',
        link: 'Insert Link',
        image: 'Insert Image',
        table: 'Insert Table',
        undo: 'Undo',
        redo: 'Redo',
      },
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
    city: 'Weather City',
    cityPlaceholder: 'Enter a city name, empty for auto-locate',
    accentColor: 'Accent Color',
    accentDefault: 'Default',
    showTabs: 'Tabs',
    showTabsOn: 'Show',
    showTabsOff: 'Hide',
    // Toolbox
    tools: {
      title: 'Toolbox',
      copied: 'Copied to clipboard',
      downloaded: 'Downloaded',
      clear: 'Clear',
      copy: 'Copy',
      copyMd: 'Copy MD',
      copyMdTip: 'Copy raw Markdown',
      copyHtml: 'Copy HTML',
      copyHtmlTip: 'Copy rendered HTML',
      copyStat: 'Copy stats',
      copyMatches: 'Copy matches',
      download: 'Download',
      // Markdown tool
      markdown: {
        title: 'Markdown Preview',
        edit: 'Edit',
        preview: 'Preview',
        placeholder: 'Type Markdown here...',
      },
      // Word count
      wordcount: {
        title: 'Word Counter',
        placeholder: 'Paste or type text here...',
        empty: 'Enter text to see statistics',
        letters: 'Characters',
        noSpaces: 'No spaces',
        chinese: 'Chinese',
        english: 'English Words',
        words: 'Numbers',
        punctuation: 'Punctuation',
        paragraphs: 'Paragraphs',
        readTime: 'Read time',
        min: 'min',
      },
      // JSON tool
      json: {
        title: 'JSON Formatter',
        placeholder: 'Paste JSON string here...',
        indent: 'Indent',
        sortKeysOff: 'Original order',
        sortKeysOn: 'Sort keys',
        result: 'Formatted result',
        error: 'Parse error',
        minify: 'Minify',
        minified: 'Minified',
      },
      // URL encode
      url: {
        title: 'URL Encode/Decode',
        encode: 'Encode',
        decode: 'Decode',
        modeComp: 'Component (recommended)',
        modeFull: 'Full URL',
        encodePlaceholder: 'Enter text to encode...',
        decodePlaceholder: 'Enter URL-encoded string to decode...',
        resultPlaceholder: 'Result appears here...',
        swap: 'Swap',
        swapped: 'Swapped',
        error: 'Encode/decode error',
      },
      // Regex tester
      regex: {
        title: 'Regex Tester',
        patternPlaceholder: 'Enter regex pattern...',
        textPlaceholder: 'Enter test string here...',
        selectPreset: 'Select common pattern...',
        presets: {
          email: 'Email',
          phone: 'Phone',
          url: 'URL',
          ipv4: 'IPv4 Address',
          date: 'Date (YYYY-MM-DD)',
        },
        matches: 'Matches',
        noMatch: 'No matches found',
        error: 'Regex error',
      },
      // Images to PDF
      pdf: {
        title: 'Images to PDF',
        dragTip: 'Click or drag image files',
        supportTip: 'Supports JPG / PNG / WebP, multiple allowed',
        remove: 'Remove',
        paperSize: 'Paper size',
        generate: 'Generate PDF',
        success: 'PDF generated successfully',
        error: 'Generation failed',
      },
      // Weather
      weather: {
        loading: 'Loading...',
        locate: 'Locating...',
        locFailed: 'Location failed, please select manually',
        switchCity: 'Switch city',
        feelsLike: 'Feels like',
        humidity: 'Humidity',
        wind: 'Wind',
        high: 'H',
        low: 'L',
      },
      // Quote
      quote: {
        loading: 'Loading...',
        refresh: 'Shuffle',
        error: 'Failed to load, showing local quote',
      },
    },
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
