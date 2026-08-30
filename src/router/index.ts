import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import ArticlesPage from "@/pages/ArticlesPage.vue";
import ArticlePage from "@/pages/ArticlePage.vue";
import EditorPage from "@/pages/EditorPage.vue";
import AboutPage from "@/pages/AboutPage.vue";
import JuejinPage from "@/pages/JuejinPage.vue";
import JuejinArticlePage from "@/pages/JuejinArticlePage.vue";

const routes: RouteRecordRaw[] = [
  // 首页 default layout (由 settingsStore.layout 决定，默认 'normal')
  { path: "/", name: "home", component: HomePage },

  // 内容页 default layout (sidebar + header + tab)
  { path: "/papers", name: "papers", component: ArticlesPage },
  { path: "/article/:id", name: "article", component: ArticlePage },
  { path: "/about", name: "about", component: AboutPage },

  // 编辑器沉浸式（无 header/sidebar）
  { path: "/editor", name: "editor-new", component: EditorPage },
  { path: "/editor/:id", name: "editor-edit", component: EditorPage },

  // 掘金
  { path: "/juejin", name: "juejin", component: JuejinPage },
  { path: "/juejin/:id", name: "juejin-article", component: JuejinArticlePage },

  // 兜底：被删除模块的旧链接或未定义路径一律回首页，避免空白页
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
