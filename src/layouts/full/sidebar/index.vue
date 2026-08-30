<script setup lang="ts">
import AppSidebar from '@/components/app/AppSidebar.vue'
import { useSharedLayout } from '@/composables/layout/useSharedLayout'

const { sidebarCollapsed } = useSharedLayout()
</script>

<template>
  <AppSidebar class="mt-4 flex-1" :collapsed="sidebarCollapsed" />
</template>
