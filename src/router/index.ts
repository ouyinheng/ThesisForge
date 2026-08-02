import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import ArticlePage from '@/pages/ArticlePage.vue'
import EditorPage from '@/pages/EditorPage.vue'
import AboutPage from '@/pages/AboutPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/article/:id', name: 'article', component: ArticlePage },
  { path: '/editor', name: 'editor-new', component: EditorPage },
  { path: '/editor/:id', name: 'editor-edit', component: EditorPage },
  { path: '/about', name: 'about', component: AboutPage },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
