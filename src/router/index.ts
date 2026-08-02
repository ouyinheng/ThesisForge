import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import ArticlePage from '@/pages/ArticlePage.vue'
import EditorPage from '@/pages/EditorPage.vue'
import AboutPage from '@/pages/AboutPage.vue'
import JuejinPage from '@/pages/JuejinPage.vue'
import JuejinArticlePage from '@/pages/JuejinArticlePage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/article/:id', name: 'article', component: ArticlePage },
  { path: '/editor', name: 'editor-new', component: EditorPage },
  { path: '/editor/:id', name: 'editor-edit', component: EditorPage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/juejin', name: 'juejin', component: JuejinPage },
  { path: '/juejin/:id', name: 'juejin-article', component: JuejinArticlePage },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
