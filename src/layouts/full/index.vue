<script setup lang="ts">
import { useSharedLayout } from '@/composables/useSharedLayout'
import SideBar from './sidebar/index.vue'
import AppHeader from './header/index.vue'
import AppTabs from '@/components/AppTabs.vue'
import { useTabsStore } from '@/stores/tabs'

const { sidebarCollapsed } = useSharedLayout()
const tabsStore = useTabsStore()
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
      <div v-if="tabsStore.showTabs" class="flex-shrink-0" style="border-bottom: 1px solid var(--color-border); padding: 0 12px;">
        <AppTabs />
      </div>
      <div class="flex-1 overflow-y-auto">
        <slot />
      </div>
    </article>
  </div>
</template>
