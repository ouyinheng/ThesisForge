import { defineAsyncComponent, markRaw } from 'vue'

// 已加载的布局缓存（防止重新加载闪烁）
const layoutCache = new Map()

/**
 * 根据布局名称异步加载对应的布局组件。
 * 布局名称与 vue-naive-admin 对齐：'normal' | 'full' | 'simple' | 'empty'
 * - normal：sidebar + header (tabs 在 header 内)  —默认
 * - full：  sidebar + header + 独立 tabs + 内容
 * - simple：sidebar + 内容（无 header）
 * - empty：纯 slot（编辑器/沉浸式）
 */
export function getLayout(name) {
  if (layoutCache.has(name)) return layoutCache.get(name)
  const map = {
    normal: () => import('./normal/index.vue'),
    full: () => import('./full/index.vue'),
    simple: () => import('./simple/index.vue'),
    empty: () => import('./empty/index.vue'),
  }
  const loader = map[name] || map.normal
  const comp = markRaw(defineAsyncComponent(loader))
  layoutCache.set(name, comp)
  return comp
}
