<script setup lang="ts">
import { useSharedLayout } from '@/composables/layout/useSharedLayout'
import SideBar from './sidebar/index.vue'
import AppHeader from './header/index.vue'

const { sidebarCollapsed } = useSharedLayout()
</script>

<template>
  <div class="wh-full flex">
    <aside
      class="flex-col flex-shrink-0 transition-width"
      :class="sidebarCollapsed ? 'w-64' : 'w-220'"
      style="border-right: 1px solid var(--color-border)"
    >
      <SideBar />
    </aside>

    <article class="w-0 flex-col flex-1 overflow-hidden">
      <AppHeader class="h-60 flex-shrink-0" />
      <div class="flex-1 overflow-y-auto">
        <slot />
      </div>
    </article>
  </div>
</template>
