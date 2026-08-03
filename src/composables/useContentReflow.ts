import { ref, onUnmounted } from 'vue'

/**
 * 监听 .app-main 容器的可用宽度，据此输出
 * - align: 内容对齐方向（right | left）
 *   - 右侧剩余空白 >= minRightGap → 正常（left / 居中）
 *   - 右侧剩余空白 < minRightGap  → 右对齐（吃掉右侧剩余）
 * - overflowX: 'auto' | 'visible'
 *   - 容器宽度不足以容纳最小内容宽度（200px） → 横向溢出滚动
 */
export function useContentReflow(contentMaxWidth: number, minRightGap = 200) {
  const align = ref<'left' | 'right'>('left')
  const overflowX = ref<'visible' | 'auto'>('visible')
  const containerWidth = ref(0)

  let ro: ResizeObserver | null = null
  let mainEl: HTMLElement | null = null
  let origOverflowX = ''
  let stopped = false

  function compute(contentW: number) {
    containerWidth.value = contentW
    const rightGap = contentW - contentMaxWidth
    if (rightGap >= minRightGap) {
      align.value = 'left'
      overflowX.value = 'visible'
    } else if (contentW > 200) {
      align.value = 'right'
      overflowX.value = 'visible'
    } else {
      align.value = 'right'
      overflowX.value = 'auto'
    }
    if (mainEl) mainEl.style.overflowX = overflowX.value
  }

  function start(): void {
    const main = document.querySelector('.app-main') as HTMLElement | null
    if (!main || typeof ResizeObserver === 'undefined') return
    mainEl = main
    origOverflowX = main.style.overflowX

    ro = new ResizeObserver((entries) => {
      for (const e of entries) compute(e.contentRect.width)
    })
    ro.observe(main)
    compute(main.clientWidth)
  }

  function stop(): void {
    if (stopped) return
    stopped = true
    ro?.disconnect()
    ro = null
    if (mainEl) mainEl.style.overflowX = origOverflowX
  }

  onUnmounted(stop)

  return { align, overflowX, containerWidth, start, stop }
}
