import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import ArticlesPage from "@/pages/ArticlesPage.vue";
import ArticlePage from "@/pages/ArticlePage.vue";
import EditorPage from "@/pages/EditorPage.vue";
import AboutPage from "@/pages/AboutPage.vue";
import JuejinPage from "@/pages/JuejinPage.vue";
import JuejinArticlePage from "@/pages/JuejinArticlePage.vue";
import TodoPage from "@/pages/TodoPage.vue";
import CollectionPage from "@/pages/CollectionPage.vue";
import VideoStationPage from "@/pages/VideoStationPage.vue";
import VideoDetailPage from "@/pages/VideoDetailPage.vue";

const routes: RouteRecordRaw[] = [
  // 首页 default layout (由 settingsStore.layout 决定，默认 'normal')
  { path: "/", name: "home", component: HomePage },

  // 内容页 default layout (sidebar + header + tab)
  { path: "/papers", name: "papers", component: ArticlesPage },
  { path: "/article/:id", name: "article", component: ArticlePage },
  { path: "/about", name: "about", component: AboutPage },

  // 待办页
  { path: "/todos", name: "todos", component: TodoPage },

  // 收藏夹
  { path: "/collections", name: "collections", component: CollectionPage },

  // 编辑器沉浸式（无 header/sidebar）
  { path: "/editor", name: "editor-new", component: EditorPage },
  { path: "/editor/:id", name: "editor-edit", component: EditorPage },

  // 掘金
  { path: "/juejin", name: "juejin", component: JuejinPage },
  { path: "/juejin/:id", name: "juejin-article", component: JuejinArticlePage },

  // 视频站
  { path: "/video", name: "video-station", component: VideoStationPage },
  { path: "/video/:id", name: "video-detail", component: VideoDetailPage },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
