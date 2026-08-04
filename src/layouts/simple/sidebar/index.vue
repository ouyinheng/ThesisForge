<script setup lang="ts">
import SideLogo from '@/layouts/components/SideLogo.vue'
import AppSidebar from '@/components/app/AppSidebar.vue'
import { useSharedLayout } from '@/composables/layout/useSharedLayout'

const { sidebarCollapsed } = useSharedLayout()
</script>

<template>
  <SideLogo />
  <AppSidebar class="mt-4 flex-1" :collapsed="sidebarCollapsed" />
</template>
