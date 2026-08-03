<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSharedLayout } from '@/composables/useSharedLayout'

const router = useRouter()
const { sidebarCollapsed } = useSharedLayout()
</script>

<template>
  <router-link class="side-logo" to="/">
    <span class="brand-mark">P</span>
    <h2
      v-show="!sidebarCollapsed"
      class="brand-text ml-10 max-w-140 flex-shrink-0 text-16 color-primary font-bold"
    >
      PaperBlog
    </h2>
  </router-link>
</template>

<style scoped>
.side-logo {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
  text-decoration: none;
}
.brand-mark {
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.brand-text {
  font-family: var(--font-serif);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}
</style>
