// 全局外部链接管理：所有外部链接统一在 iframe 内打开，不改变当前路由。
// 用法：
//   import { openInIframe } from '@/composables/useExternalLink'
//   openInIframe('https://juejin.cn/post/xxx')

import { readonly, ref } from 'vue'

const visible = ref(false)
const url = ref('')
const title = ref('')

export function useExternalLink() {
  function open(target: string, label = ''): void {
    url.value = target
    title.value = label || target
    visible.value = true
  }

  function close(): void {
    visible.value = false
    url.value = ''
    title.value = ''
  }

  return {
    visible: readonly(visible),
    url: readonly(url),
    title: readonly(title),
    open,
    close,
  }
}

// 全局单例，方便非 setup 场景直接 import 使用
const external = useExternalLink()
export const openInIframe = external.open
export const closeIframe = external.close
export default useExternalLink
