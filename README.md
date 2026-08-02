# PaperBlog — 学术论文风格博客系统

简约、专业的个人学术论文发布平台。支持文章管理、富文本编辑、双主题切换、布局切换、中英文国际化，数据持久化存储。未来计划支持 Electron 桌面端。

---

## 快速开始

```bash
yarn install     # 安装依赖
yarn dev         # 启动网页端开发服务器（http://localhost:5173）
yarn dev:electron  # 启动 Electron 桌面端（自动启动 vite + electron）
yarn build       # 网页端生产构建
yarn build:electron  # Electron 打包（vite build + electron-builder）
yarn type:check  # TypeScript 类型检查
```

### Electron 桌面端

```bash
yarn dev:electron
```

会自动启动 Vite 开发服务器（端口 5178）和 Electron 窗口。数据存储位置：
- macOS: `~/Library/Application Support/paperblog/articles.json`
- Windows: `%APPDATA%/paperblog/articles.json`
- Linux: `~/.config/paperblog/articles.json`

### 打包发布

```bash
yarn build:electron
```

输出在 `release/` 目录下，支持 macOS (dmg)、Windows (nsis)、Linux (AppImage)。

---

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 框架 | Vue 3 (Composition API + `<script setup>`) |
| 状态管理 | Pinia |
| 路由 | Vue Router (Hash 模式) |
| 构建工具 | Vite 5 |
| CSS 方案 | UnoCSS + Less |
| 富文本编辑 | Tiptap 2 |
| 代码高亮 | Lowlight |
| 图标 | Iconify (Carbon) |

---

## 项目结构

```
PaperBlog/
├── index.html                  # 入口 HTML (引入 Google Fonts)
├── package.json                # 依赖配置 + electron-builder 配置
├── vite.config.js              # Vite + Vue + UnoCSS + Electron 文件拷贝
├── uno.config.js               # UnoCSS 预设配置
├── tailwind.config.js          # Tailwind 兼容配置 (preflight 禁用)
├── postcss.config.js           # PostCSS 配置
├── tsconfig.json               # TypeScript 配置
├── jsconfig.json               # 路径别名 @ → src/
├── electron/
│   ├── main.ts                 # Electron 主进程 (TypeScript 源码)
│   ├── main.cjs                # Electron 主进程 (CommonJS 运行文件)
│   └── preload.cjs             # 预加载脚本 (暴露 __fileBridge API)
└── src/
    ├── main.ts                 # Vue 应用入口
    ├── env.d.ts                 # 环境类型声明 (全局类型)
    ├── types/index.ts           # 全局共享类型 (Article/Electron 等)
    ├── App.vue                  # 根组件 (布局切换: sidebar/topbar)
    ├── router/index.ts          # 路由配置 (Hash 模式)
    ├── services/
    │   └── storage.ts           # ⚠️ 统一存储服务层 (Web/Electron 唯一改动点)
    ├── stores/
    │   └── blog.ts              # Pinia 文章数据管理
    ├── composables/
    │   ├── useTheme.ts          # 主题切换 composable
    │   ├── useLayout.ts         # 布局切换 composable
    │   └── useI18n.ts           # 国际化 composable (中/英)
    ├── components/
    │   ├── AppHeader.vue        # 顶部导航栏
    │   ├── AppSidebar.vue       # 侧边栏导航
    │   └── TiptapEditor.vue     # 富文本编辑器封装
    ├── pages/
    │   ├── HomePage.vue         # 首页 (论文列表)
    │   ├── ArticlePage.vue      # 论文详情/阅读
    │   ├── EditorPage.vue       # 编辑器 (创建/编辑)
    │   └── AboutPage.vue        # 关于页面
    └── styles/
        └── main.less            # 全局样式 (CSS 变量 + 双主题)
```

---

## 核心架构：统一存储服务 (`src/services/storage.js`)

整个项目的数据持久化封装在此文件中。通过环境检测自动选择底层实现：

- **网页端** → `localStorage`
- **Electron 桌面端** → 文件读写（通过 `window.__fileBridge` IPC 桥接）

### API 清单

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `isDesktop()` | - | `boolean` | 检测是否 Electron 环境 |
| `isFileSystemAvailable()` | - | `boolean` | 文件服务是否就绪 |
| `getAllArticles()` | - | `Promise<Article[]>` | 获取所有文章 |
| `getArticleById(id)` | `string id` | `Promise<Article\|null>` | 获取单篇文章 |
| `createArticle(data)` | `{title, summary?, content, tags?}` | `Promise<Article>` | 创建文章（summary 为空自动提取正文前 200 字） |
| `updateArticle(id, data)` | `string id, {title?, summary?, content?, tags?}` | `Promise<Article\|null>` | 更新文章 |
| `deleteArticle(id)` | `string id` | `Promise<boolean>` | 删除文章 |
| `getTheme()` | - | `Promise<'light'\|'dark'>` | 获取主题偏好 |
| `setTheme(theme)` | `'light'\|'dark'` | `Promise<void>` | 保存主题偏好 |
| `getLayout()` | - | `Promise<'sidebar'\|'topbar'>` | 获取布局偏好 |
| `setLayout(layout)` | `'sidebar'\|'topbar'` | `Promise<void>` | 保存布局偏好 |
| `getLocale()` | - | `Promise<'zh'\|'en'>` | 获取语言偏好 |
| `setLocale(locale)` | `'zh'\|'en'` | `Promise<void>` | 保存语言偏好 |
| `forceStorageMode(mode)` | `'web'\|'desktop'` | `void` | 测试用：强制切换模式 |
| `resetAll()` | - | `Promise<void>` | 清除所有数据 |

### 环境检测逻辑

按优先级检测：
1. `window.__IS_ELECTRON__` — Electron 主进程注入
2. `window.process?.versions?.electron` — Electron 内置
3. `navigator.userAgent.includes('Electron')` — 渲染进程 userAgent

### 迁移 Electron 指南

唯一需要改动的文件是 `src/services/storage.js`。Electron 端需要：

1. **主进程** 启动时设置 `webPreferences.preload` 和注入 `__IS_ELECTRON__`
2. **preload.js** 暴露 `window.__fileBridge`:
   ```javascript
   contextBridge.exposeInMainWorld('__fileBridge', {
     readJSON: (filename) => ipcRenderer.invoke('file:readJSON', filename),
     writeJSON: (filename, content) => ipcRenderer.invoke('file:writeJSON', filename),
     deleteFile: (filename) => ipcRenderer.invoke('file:deleteFile', filename),
     getUserDataPath: () => ipcRenderer.invoke('file:userDataPath'),
   });
   ```
3. **主进程** 处理 IPC:
   ```javascript
   ipcMain.handle('file:readJSON', async (_, filename) => {
     const filePath = path.join(app.getPath('userData'), filename)
     try { return await fs.readFile(filePath, 'utf-8') } catch { return null }
   })
   ```

偏好数据（主题/布局/语言）存储在 `preferences.json`，文章数据存储在 `articles.json`。

---

## 数据模型

```typescript
interface Article {
  id: string;        // 自动生成 (时间戳 + 随机字符)
  title: string;     // 论文标题
  summary: string;   // 摘要（可选，留空自动从正文提取前 200 字）
  content: string;   // HTML 格式的富文本内容
  tags: string[];    // 分类标签数组
  createdAt: string; // ISO 8601 创建时间
  updatedAt: string; // ISO 8601 更新时间
}
```

---

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 论文列表（按日期/标题排序，标签筛选） |
| `/article/:id` | ArticlePage | 论文详情/阅读 |
| `/editor` | EditorPage | 创建新论文 |
| `/editor/:id` | EditorPage | 编辑已有论文 |
| `/about` | AboutPage | 关于页面 |

---

## 设计风格

**调性**：学术、克制、内容优先、无装饰（无阴影/圆角/渐变）

**色彩**：主色 `#D12F2F`（中国红），双主题（亮/暗）通过 CSS 变量 + `[data-theme]` 驱动

**字体**：
- 正文：Source Serif 4（衬线字体，提升阅读体验）
- UI：IBM Plex Sans
- 代码：IBM Plex Mono

**布局**：两种模式（侧边栏 240px / 顶栏），偏好存于 storage

---

## 功能清单

- [x] 文章 CRUD（创建、读取、更新、删除）
- [x] 富文本编辑（粗体/斜体/下划线/删除线、标题 H2/H3、列表、任务列表、引用、代码块、表格、图片、链接、对齐、撤销/重做）
- [x] 双主题切换（亮/暗，自动检测系统 + 手动切换 + 记忆偏好）
- [x] 布局切换（侧边栏/顶栏，记忆偏好）
- [x] 国际化（中/英，记忆偏好，切换时更新 `<html lang>`）
- [x] 文章排序（按日期/标题）
- [x] 标签筛选
- [x] 数据持久化（localStorage / 未来 Electron 文件系统）
- [x] 预置示例数据（首次访问加载 3 篇经典论文）
- [ ] 搜索功能
- [ ] 标签管理（创建/重命名/合并）
- [ ] Markdown 导入/导出
- [ ] Electron 打包

---

## 注意事项

1. **Hash 路由**：必须使用 `createWebHashHistory()`，确保静态部署和 Electron file:// 协议下路由正常
2. **CSS 变量**：所有颜色必须通过 CSS 自定义属性，不能在组件中硬编码色值
3. **UnoCSS 图标**：使用 `i-carbon:xxx` 格式引用 Carbon 图标
4. **Tailwind 冲突**：`tailwind.config.js` 必须设置 `corePlugins: { preflight: false }`
5. **异步存储**：storage.js 所有方法返回 Promise，调用请使用 `await`
6. **数据初始化**：`main.js` 中使用 `await blogStore.loadArticles()` 后再 mount 应用
7. **组件命名**：Vue 组件 PascalCase，composable camelCase + `use` 前缀
