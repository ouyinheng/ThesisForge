import { ref, watch } from 'vue'

// 单例：跨组件共享侧边栏状态（App 写入，内容页读取）
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
let _persisted = false

if (typeof window !== 'undefined' && !_persisted) {
  _persisted = true
  watch(sidebarCollapsed, (val) => {
    localStorage.setItem('sidebarCollapsed', String(val))
  })
}

export function useSharedLayout() {
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  return { sidebarCollapsed, toggleSidebar }
}
