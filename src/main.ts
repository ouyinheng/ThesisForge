import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router/index'
import { useBlogStore } from '@/stores/blog'
import { useSettingsStore } from '@/stores/settings'
import 'virtual:uno.css'
import './styles/main.less'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(naive)

const blogStore = useBlogStore(pinia)
const settingsStore = useSettingsStore(pinia)

Promise.all([
  blogStore.loadArticles(),
  settingsStore.load(),
]).then(() => {
  app.mount('#app')
})
