<script setup lang="ts">
import { useSharedLayout } from '@/composables/layout/useSharedLayout'
import SideBar from './sidebar/index.vue'
import AppTitleBar from '@/components/app/AppTitleBar.vue'

const { sidebarCollapsed } = useSharedLayout()
</script>

<template>
  <div class="wh-full flex-col">
    <!-- 顶部：从左至右的全宽标题栏（窗口控制/logo/标题/拖拽） -->
    <AppTitleBar class="flex-shrink-0" />

    <!-- 主体：与标题栏之间夹着 5px 的 #e0e3e2 边框，内容区带圆角 -->
    <div class="body-wrap flex-1 min-h-0" style="background: #e0e3e2; padding: 5px">
      <div class="flex h-full overflow-hidden rounded-xl" style="background: var(--color-bg)">
        <aside
          class="flex-col flex-shrink-0 transition-width"
          :class="sidebarCollapsed ? 'w-64' : 'w-220'"
          style="border-right: 1px solid var(--color-border)"
        >
          <SideBar />
        </aside>

        <article class="w-0 flex-col flex-1 overflow-hidden">
          <div class="flex-1 min-h-0 overflow-y-auto">
            <slot />
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
