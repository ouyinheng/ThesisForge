<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NLayoutSider, NScrollbar, NMenu, NDivider, NText, NTag } from "naive-ui";
import { useI18n } from "@/composables/useI18n";
import { useBlogStore } from "@/stores/blog";
import { useRouter, useRoute } from "vue-router";
import { useNavMenu } from "@/composables/useNavMenu";

const props = defineProps<{
  collapsed: boolean;
}>();

const emit = defineEmits<{
  toggleCollapse: [boolean];
}>();

const { t } = useI18n();
const blogStore = useBlogStore();
const router = useRouter();
const route = useRoute();
const { navMenuOptions, activeKey, handleSelect } = useNavMenu();

const activeTag = computed<string | undefined>(() => {
  const tag = route.query.tag;
  return Array.isArray(tag) ? tag[0] || undefined : tag || undefined;
});

const expandedKeys = ref<string[]>([]);

watch(
  () => route.path,
  (path) => {
    if (path === "/juejin" || path.startsWith("/juejin/")) {
      if (!expandedKeys.value.includes("external")) {
        expandedKeys.value = [...expandedKeys.value, "external"];
      }
    }
  },
  { immediate: true }
);

function filterByTag(tag: string): void {
  router.push({ path: "/papers", query: { tag } });
}
</script>

<template>
  <NLayoutSider
    class="sidebar"
    :class="{ 'sidebar-collapsed': props.collapsed }"
    :collapsed="props.collapsed"
    :collapsed-width="64"
    :width="220"
    bordered
    show-trigger
    collapse-mode="width"
    :native-scrollbar="false"
    @update:collapsed="emit('toggleCollapse', $event)"
  >
    <NScrollbar class="sidebar-content">
      <div class="sidebar-inner">
        <!-- Logo / Brand -->
        <div class="sidebar-brand">
          <span class="brand-mark">P</span>
          <span v-if="!props.collapsed" class="brand-text">PaperBlog</span>
        </div>

        <div class="sidebar-nav">
          <NMenu
            :options="navMenuOptions"
            :value="activeKey"
            :collapsed="props.collapsed"
            :collapsed-width="56"
            :collapsed-icon-size="20"
            v-model:expanded-keys="expandedKeys"
            :indent="18"
            :root-indent="18"
            @update:value="handleSelect"
          />
        </div>

        <NDivider
          v-if="blogStore.allTags.length && !props.collapsed"
          :style="{ margin: '16px 0 8px' }"
        />

        <div
          class="sidebar-tags"
          v-if="blogStore.allTags.length && !props.collapsed"
        >
          <NText depth="3" class="tags-title">Tags</NText>
          <div class="tags-list">
            <NTag
              v-for="tag in blogStore.allTags"
              :key="tag.name"
              :type="activeTag === tag.name ? 'primary' : 'default'"
              size="small"
              :bordered="false"
              :color="
                activeTag === tag.name
                  ? {
                      color: 'var(--color-primary-light)',
                      textColor: 'var(--color-primary)',
                    }
                  : undefined
              "
              checkable
              :checked="activeTag === tag.name"
              @update:checked="() => filterByTag(tag.name)"
            >
              {{ tag.name }}
              <NText depth="3" class="tag-count">{{ tag.count }}</NText>
            </NTag>
          </div>
        </div>

        <footer class="sidebar-footer" v-if="!props.collapsed">
          <NText depth="3">{{ t("sidebar.academic") }}</NText>
        </footer>
      </div>
    </NScrollbar>
  </NLayoutSider>
</template>

<style lang="less" scoped>
.sidebar {
  position: fixed;
  top: 48px;
  left: 0;
  bottom: 0;
  width: 220px;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  z-index: 60;
  transition: width var(--transition);
}
:deep(.n-layout-sider) {
  width: 220px !important;
  background: var(--color-bg) !important;
  border-right: 1px solid var(--color-border) !important;
}
:deep(.n-layout-sider-scrim) {
  background: rgba(0, 0, 0, 0.5);
}
:deep(.n-layout-sider-trigger-wrapper) {
  z-index: 9999;
}
:deep(.n-layout-sider--collapsed) {
  width: 64px !important;
}

.sidebar-collapsed .sidebar-inner {
  padding: 1em 0.4em 1.5em;
}
.sidebar-content {
  flex: 1;
  min-height: 0; /* important for scroll */

  :deep(.n-scrollbar-container) {
    height: 100%;
  }
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1em 0.8em 1.5em;
  width: 100%;
  min-width: 0;
}

/* 收起态：NLayoutSider 通过 .sidebar-collapsed 类标识 */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.5em;
  padding: 0 0.2em;
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
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

/* Nav menu */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 100%;

  :deep(.n-menu) {
    --n-item-height: 40px;
    background: transparent;
  }

  :deep(.n-menu-item) {
    margin: 1px 0;
  }

  :deep(.n-menu-item-content) {
    border-radius: var(--radius-sm);
  }

  :deep(.n-menu-item-content--child-active .n-menu-item-content__icon) {
    color: var(--color-primary);
  }
}

/* Tags */
.sidebar-tags {
  flex: 1;
  margin-top: 0.5em;
  overflow-y: auto;
}

.tags-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 8px;
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
  border-top: 1px solid var(--color-border);
  text-align: center;
  flex-shrink: 0;
  margin-top: auto;
}
</style>
