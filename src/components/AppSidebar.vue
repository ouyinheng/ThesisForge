<script setup lang="ts">
import { h, type Component } from 'vue'
import { NButton, NText, NDivider, NTag, NIcon, NTooltip } from 'naive-ui'
import {
  HomeOutline,
  DocumentTextOutline,
  PencilOutline,
  InformationCircleOutline,
  NewspaperOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
} from '@vicons/ionicons5'
import { useI18n } from '@/composables/useI18n'
import { useBlogStore } from '@/stores/blog'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggleCollapse: []
}>()

const { t } = useI18n()
const blogStore = useBlogStore()
const router = useRouter()
const route = useRoute()

const activeTag = computed<string | undefined>(() => {
  const tag = route.query.tag
  return Array.isArray(tag) ? tag[0] || undefined : tag || undefined
})

function goHome(): void {
  router.push('/')
}

function goPapers(): void {
  router.push('/papers')
}

function goWrite(): void {
  router.push('/editor')
}

function goAbout(): void {
  router.push('/about')
}

function goJuejin(): void {
  router.push('/juejin')
}

function filterByTag(tag: string): void {
  router.push({ path: '/papers', query: { tag } })
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <nav class="sidebar-nav">
      <NTooltip v-if="collapsed" trigger="hover" placement="right">
        <template #trigger>
          <NButton
            class="nav-btn"
            :type="route.path === '/' ? 'primary' : 'default'"
            text
            @click="goHome"
          >
            <NIcon :size="20"><HomeOutline /></NIcon>
          </NButton>
        </template>
        {{ t('nav.home') }}
      </NTooltip>
      <NButton
        v-else
        class="nav-btn"
        :type="route.path === '/' ? 'primary' : 'default'"
        :ghost="route.path !== '/'"
        quaternary
        block
        @click="goHome"
      >
        <template #icon>
          <NIcon><HomeOutline /></NIcon>
        </template>
        {{ t('nav.home') }}
      </NButton>

      <NTooltip v-if="collapsed" trigger="hover" placement="right">
        <template #trigger>
          <NButton
            class="nav-btn"
            :type="route.path === '/papers' ? 'primary' : 'default'"
            text
            @click="goPapers"
          >
            <NIcon :size="20"><DocumentTextOutline /></NIcon>
          </NButton>
        </template>
        {{ t('nav.papers') }}
      </NTooltip>
      <NButton
        v-else
        class="nav-btn"
        :type="route.path === '/papers' ? 'primary' : 'default'"
        :ghost="route.path !== '/papers'"
        quaternary
        block
        @click="goPapers"
      >
        <template #icon>
          <NIcon><DocumentTextOutline /></NIcon>
        </template>
        {{ t('nav.papers') }}
      </NButton>

      <NTooltip v-if="collapsed" trigger="hover" placement="right">
        <template #trigger>
          <NButton
            class="nav-btn"
            :type="route.path.startsWith('/editor') ? 'primary' : 'default'"
            text
            @click="goWrite"
          >
            <NIcon :size="20"><PencilOutline /></NIcon>
          </NButton>
        </template>
        {{ t('nav.write') }}
      </NTooltip>
      <NButton
        v-else
        class="nav-btn"
        :type="route.path.startsWith('/editor') ? 'primary' : 'default'"
        :ghost="!route.path.startsWith('/editor')"
        quaternary
        block
        @click="goWrite"
      >
        <template #icon>
          <NIcon><PencilOutline /></NIcon>
        </template>
        {{ t('nav.write') }}
      </NButton>

      <NTooltip v-if="collapsed" trigger="hover" placement="right">
        <template #trigger>
          <NButton
            class="nav-btn"
            :type="route.path === '/about' ? 'primary' : 'default'"
            text
            @click="goAbout"
          >
            <NIcon :size="20"><InformationCircleOutline /></NIcon>
          </NButton>
        </template>
        {{ t('nav.about') }}
      </NTooltip>
      <NButton
        v-else
        class="nav-btn"
        :type="route.path === '/about' ? 'primary' : 'default'"
        :ghost="!(route.path === '/about')"
        quaternary
        block
        @click="goAbout"
      >
        <template #icon>
          <NIcon><InformationCircleOutline /></NIcon>
        </template>
        {{ t('nav.about') }}
      </NButton>

      <NTooltip v-if="collapsed" trigger="hover" placement="right">
        <template #trigger>
          <NButton
            class="nav-btn"
            :type="route.path === '/juejin' ? 'primary' : 'default'"
            text
            @click="goJuejin"
          >
            <NIcon :size="20"><NewspaperOutline /></NIcon>
          </NButton>
        </template>
        {{ t('nav.juejin') }}
      </NTooltip>
      <NButton
        v-else
        class="nav-btn"
        :type="route.path === '/juejin' ? 'primary' : 'default'"
        :ghost="!(route.path === '/juejin')"
        quaternary
        block
        @click="goJuejin"
      >
        <template #icon>
          <NIcon><NewspaperOutline /></NIcon>
        </template>
        {{ t('nav.juejin') }}
      </NButton>
    </nav>

    <NDivider v-if="blogStore.allTags.length && !collapsed" :style="{ margin: '16px 0 8px' }" />

    <div class="sidebar-tags" v-if="blogStore.allTags.length && !collapsed">
      <NText depth="3" class="tags-title">Tags</NText>
      <div class="tags-list">
        <NTag
          v-for="tag in blogStore.allTags"
          :key="tag.name"
          :type="activeTag === tag.name ? 'primary' : 'default'"
          size="small"
          :bordered="false"
          :color="activeTag === tag.name
            ? { color: 'var(--color-primary-light)', textColor: 'var(--color-primary)' }
            : undefined"
          checkable
          :checked="activeTag === tag.name"
          @update:checked="() => filterByTag(tag.name)"
        >
          {{ tag.name }}
          <NText depth="3" class="tag-count">{{ tag.count }}</NText>
        </NTag>
      </div>
    </div>

    <footer class="sidebar-footer" v-if="!collapsed">
      <NText depth="3">{{ t('sidebar.academic') }}</NText>
    </footer>
  </aside>

  <!-- 收起/展开按钮：悬浮在侧边栏右边缘 -->
  <div class="sidebar-collapse-trigger" @click="emit('toggleCollapse')">
    <NButton quaternary circle size="small" class="collapse-btn">
      <NIcon :size="14">
        <ChevronBackOutline v-if="!collapsed" />
        <ChevronForwardOutline v-else />
      </NIcon>
    </NButton>
  </div>
</template>

<style lang="less" scoped>
.sidebar {
  width: 220px;
  min-width: 220px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  /* 顶部留出顶栏高度(48px) + 呼吸感 */
  padding: 60px 0.8em 1.5em;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  transition: width 0.2s, min-width 0.2s;
  z-index: 50;
}

/* Electron 自定义标题栏时需要顶部留白给红绿灯 */
.app-layout.custom-titlebar .sidebar {
  padding-top: 76px;
}

.sidebar.collapsed {
  width: 56px;
  min-width: 56px;
  padding-left: 0;
  padding-right: 0;
}

.app-layout.custom-titlebar .sidebar.collapsed {
  padding-top: 76px;
}

.sidebar.collapsed .sidebar-nav {
  align-items: center;
}

.sidebar.collapsed .nav-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  justify-content: center !important;
  border-radius: var(--radius-sm);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  width: 100%;
}

.nav-btn {
  justify-content: flex-start !important;
  align-items: center !important;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast), color var(--transition-fast);

  /* 图标与文字垂直居中对齐 */
  :deep(.n-icon),
  :deep(svg) {
    vertical-align: middle;
  }

  /* 非激活导航项：hover 显示浅底 */
  &:not(.n-button--primary-type):hover {
    background: var(--color-bg-tertiary) !important;
  }

  /* 激活态：浅 primary 底 + primary 文字 */
  &.n-button--primary-type {
    background: var(--color-primary-light) !important;
    color: var(--color-primary) !important;
  }
}

.sidebar-tags {
  flex: 1;
  overflow-y: auto;
  margin-top: 0.5em;
}

.tags-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-tertiary);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-count {
  margin-left: 4px;
  font-size: 11px;
}

.sidebar-footer {
  padding-top: 1em;
  font-size: 12px;
  color: var(--color-text-tertiary);
  letter-spacing: 0.02em;
  border-top: 1px solid var(--color-border);
  text-align: center;
  flex-shrink: 0;
  margin-top: auto;
}

/* 收起按钮 */
.sidebar-collapse-trigger {
  position: fixed;
  top: 50%;
  left: 220px;
  transform: translateX(-50%) translateY(-50%);
  z-index: 60;
  transition: left 0.2s;
}

.sidebar.collapsed ~ .sidebar-collapse-trigger {
  left: 56px;
}

.collapse-btn {
  background: var(--color-bg-secondary) !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  opacity: 0;
  transition: opacity 0.2s;
}

.sidebar:hover ~ .sidebar-collapse-trigger .collapse-btn,
.sidebar-collapse-trigger:hover .collapse-btn,
.collapse-btn:hover {
  opacity: 1;
}
</style>
