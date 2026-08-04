<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NMenu, NDivider, NText, NTag, NButton, NIcon } from "naive-ui";
import { SettingsOutline, SunnyOutline, MoonOutline } from "@vicons/ionicons5";
import { useI18n } from "@/composables/i18n/useI18n";
import { useBlogStore } from "@/stores/blog";
import { useSettingsStore } from "@/stores/settings";
import { useRouter, useRoute } from "vue-router";
import { useNavMenu } from "@/composables/nav/useNavMenu";

const props = defineProps<{
  collapsed: boolean;
}>();

const { t } = useI18n();
const blogStore = useBlogStore();
const settings = useSettingsStore();
const router = useRouter();
const route = useRoute();
const { navMenuOptions, activeKey, handleSelect } = useNavMenu();

const isSimpleLayout = computed(() => settings.layout === 'simple');

function openSettings(): void {
  window.dispatchEvent(new CustomEvent('open-settings-global'));
}

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
  <div class="app-sidebar flex-col flex-1">
    <!-- 菜单区：占满剩余高度，可滚动 -->
    <NMenu
      class="side-menu cus-scroll-y"
      :options="navMenuOptions"
      :value="activeKey"
      :collapsed="props.collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="20"
      v-model:expanded-keys="expandedKeys"
      :indent="18"
      :root-indent="18"
      @update:value="handleSelect"
    />

    <!-- 标签云区：仅展开时显示 -->
    <NDivider
      v-if="blogStore.allTags.length && !props.collapsed"
      :style="{ margin: '8px 12px' }"
    />
    <div class="sidebar-tags" v-if="blogStore.allTags.length && !props.collapsed">
      <NText depth="3" class="tags-title">Tags</NText>
      <div class="tags-list">
        <NTag
          v-for="tag in blogStore.allTags"
          :key="tag.name"
          :type="activeTag === tag.name ? 'primary' : 'default'"
          size="small"
          :bordered="false"
          checkable
          :checked="activeTag === tag.name"
          @update:checked="() => filterByTag(tag.name)"
        >
          {{ tag.name }}
          <NText depth="3" class="tag-count">{{ tag.count }}</NText>
        </NTag>
      </div>
    </div>

    <!-- simple 布局底部：设置 + 主题切换（无顶栏时在此提供入口） -->
    <div v-if="isSimpleLayout" class="sidebar-footer">
      <NDivider :style="{ margin: '8px 12px' }" />
      <div class="footer-actions">
        <NButton quaternary circle size="small" @click="settings.toggleTheme">
          <template #icon>
            <NIcon :component="settings.theme === 'dark' ? SunnyOutline : MoonOutline" />
          </template>
        </NButton>
        <NButton quaternary circle size="small" @click="openSettings">
          <template #icon>
            <NIcon :component="SettingsOutline" />
          </template>
        </NButton>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.app-sidebar {
  display: flex;
  min-height: 0;
}
.side-menu {
  flex: 1;
  min-height: 0;
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
    &::before {
      left: 3px;
      right: 3px;
    }
  }

  :deep(.n-menu-item-content--child-active .n-menu-item-content__icon) {
    color: var(--color-primary);
  }
}

/* Tags */
.sidebar-tags {
  flex-shrink: 0;
  padding: 0 12px 12px;
  overflow-y: auto;
  max-height: 240px;
}

.tags-title {
  font-size: var(--fs-xs);
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

/* simple 布局底部操作按钮 */
.sidebar-footer {
  flex-shrink: 0;
  margin-top: auto;
}
.footer-actions {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px 12px;
}
</style>
