<script setup lang="ts">
/**
 * AppPage — 内容区容器组件（对齐 vue-naive-admin 的 AppPage）
 *
 * 职责：
 * 1. 撑满 header/tabs 以下的剩余高度（h-full flex-col flex-1）
 * 2. 自身作为滚动容器（cus-scroll）
 * 3. 统一内容外边距（m-12 = 12px）
 * 4. 内置回到顶部按钮
 *
 * 用法：每个页面组件的最外层套上 <AppPage> 即可
 */
import { NBackTop } from 'naive-ui'

defineProps<{
  /** 内容区域是否撑满（不需要 m-12 边距时设为 true） */
  full?: boolean
}>()
</script>

<template>
  <main class="app-page app-main cus-scroll">
    <div :class="{ 'app-page-full': full, 'app-page-inner': !full }">
      <slot />
    </div>
    <slot name="footer" />
    <NBackTop :bottom="20" />
  </main>
</template>

<style scoped>
.app-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* 关键：让 flex 子项正确收缩，允许滚动 */
}
.app-page-inner {
  margin: 12px;
  flex: 1;
}
.app-page-full {
  flex: 1;
}
</style>
