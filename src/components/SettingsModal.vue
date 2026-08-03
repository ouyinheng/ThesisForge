<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NModal,
  NH3,
  NText,
  NButton,
  NButtonGroup,
  NIcon,
  NInput,
  NSwitch,
} from 'naive-ui'
import {
  SunnyOutline,
  MoonOutline,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@vicons/ionicons5'
import { OpenOutline, CheckmarkOutline } from '@vicons/ionicons5'
import { useSettingsStore } from '@/stores/settings'
import { useTabsStore } from '@/stores/tabs'
import { useI18n } from '@/composables/useI18n'
import { useMessage } from 'naive-ui'
import { h, type Component } from 'vue'
import { isDesktop, selectDirectory } from '@/services/storage'

const settings = useSettingsStore()
const tabs = useTabsStore()
const { t, setLocale, currentLocale: locale } = useI18n()
const message = useMessage()

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: false]
}>()

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 是否已设置存储路径
const hasStoragePath = computed(() => settings.storagePath && settings.storagePath.trim().length > 0)

// 是否处于桌面模式
const isDesktopApp = computed(() => isDesktop())

// 编辑路径
const editingPath = ref<boolean>(false)
const pathDraft = ref<string>('')
const saving = ref<boolean>(false)

async function startEditPath() {
  if (isDesktopApp.value) {
    const picked = await selectDirectory()
    if (picked) {
      await applyPath(picked)
    }
    return
  }
  pathDraft.value = settings.storagePath || ''
  editingPath.value = true
}

async function applyPath(newPath: string) {
  if (newPath === settings.storagePath) return
  saving.value = true
  try {
    await settings.changeStoragePath(newPath)
    message.success(t('pathSaved'))
    editingPath.value = false
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

function cancelEditPath() {
  editingPath.value = false
  pathDraft.value = ''
}

async function savePath() {
  const newPath = pathDraft.value.trim()
  if (!newPath) {
    message.warning(t('storagePath') + '不能为空')
    return
  }
  if (newPath === settings.storagePath) {
    editingPath.value = false
    return
  }
  saving.value = true
  try {
    await settings.changeStoragePath(newPath)
    message.success(t('pathSaved'))
    editingPath.value = false
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function resetPath() {
  saving.value = true
  try {
    await settings.resetStoragePath()
    message.success(t('pathSaved'))
    editingPath.value = false
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

// 主题色选项：默认 + 3 种
const ACCENT_PRESETS = [
  { label: '', value: '#D12F2F' },  // 默认红
  { label: '', value: '#2563EB' },  // 蓝
  { label: '', value: '#059669' },  // 绿
  { label: '', value: '#9333EA' },  // 紫
]
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :style="{ width: '480px' }"
    size="medium"
    :bordered="false"
    :closable="false"
    :title-style="{ display: 'none' }"
    :header-style="{ padding: '0' }"
    :content-style="{ padding: '0' }"
    :card-style="{ borderRadius: '16px', overflow: 'hidden' }"
    @update:show="(val) => { if (!val) emit('update:show', false) }"
    @esc="emit('update:show', false)"
    @mask-click="emit('update:show', false)"
  >
    <!-- 标题区 -->
    <template #header>
      <div class="settings-title">
        <NH3 :style="{ margin: 0 }">{{ t('settings') }}</NH3>
        <NButton
          quaternary
          circle
          size="small"
          :render-icon="renderIcon(CloseIcon)"
          @click="emit('update:show', false)"
        />
      </div>
    </template>

    <div class="settings-content">
      <!-- 主题 -->
        <div class="setting-row">
          <NText depth="3" class="setting-label">{{ t('theme') }}</NText>
          <NButtonGroup size="small">
            <NButton
              :type="settings.theme === 'light' ? 'primary' : 'default'"
              :ghost="settings.theme !== 'light'"
              @click="settings.theme = 'light'"
            >
              <template #icon>
                <NIcon><SunnyOutline /></NIcon>
              </template>
              Light
            </NButton>
            <NButton
              :type="settings.theme === 'dark' ? 'primary' : 'default'"
              :ghost="settings.theme !== 'dark'"
              @click="settings.theme = 'dark'"
            >
              <template #icon>
                <NIcon><MoonOutline /></NIcon>
              </template>
              Dark
            </NButton>
          </NButtonGroup>
        </div>

        <!-- 布局 -->
        <div class="setting-row">
          <NText depth="3" class="setting-label">{{ t('layout') }}</NText>
          <NButtonGroup size="small">
            <NButton
              :type="settings.layout === 'simple' ? 'primary' : 'default'"
              :ghost="settings.layout !== 'simple'"
              @click="settings.setLayoutMode('simple')"
            >
              <template #icon>
                <NIcon><MenuIcon /></NIcon>
              </template>
              简约
            </NButton>
            <NButton
              :type="settings.layout === 'normal' ? 'primary' : 'default'"
              :ghost="settings.layout !== 'normal'"
              @click="settings.setLayoutMode('normal')"
            >
              <template #icon>
                <NIcon><MenuIcon /></NIcon>
              </template>
              通用
            </NButton>
            <NButton
              :type="settings.layout === 'full' ? 'primary' : 'default'"
              :ghost="settings.layout !== 'full'"
              @click="settings.setLayoutMode('full')"
            >
              <template #icon>
                <NIcon><MenuIcon /></NIcon>
              </template>
              全面
            </NButton>
          </NButtonGroup>
        </div>

        <!-- 语言 -->
        <div class="setting-row">
          <NText depth="3" class="setting-label">{{ t('language') }}</NText>
          <NButtonGroup size="small">
            <NButton
              :type="settings.locale === 'zh' ? 'primary' : 'default'"
              :ghost="settings.locale !== 'zh'"
              @click="setLocale('zh')"
            >
              中文
            </NButton>
            <NButton
              :type="settings.locale === 'en' ? 'primary' : 'default'"
              :ghost="settings.locale !== 'en'"
              @click="setLocale('en')"
            >
              EN
            </NButton>
          </NButtonGroup>
        </div>

        <!-- 主题色 -->
        <div class="setting-row">
          <NText depth="3" class="setting-label">{{ t('accentColor') }}</NText>
          <n-space :size="6">
            <button
              v-for="c in ACCENT_PRESETS"
              :key="c.value"
              class="accent-swatch"
              :class="{ active: settings.accentColor === c.value }"
              :style="{ background: c.value }"
              @click="settings.accentColor = c.value"
            >
              <NIcon v-if="settings.accentColor === c.value" :size="12" class="swatch-check"><CheckmarkOutline /></NIcon>
            </button>
          </n-space>
        </div>

        <!-- 天气城市 -->
        <div class="setting-row">
          <NText depth="3" class="setting-label">{{ t('city') }}</NText>
          <NInput
            :value="settings.weatherCity"
            @update:value="settings.weatherCity = $event || ''"
            :placeholder="t('cityPlaceholder')"
            size="small"
            style="width: 200px"
            clearable
          />
        </div>

        <!-- 显示标签页 -->
        <div class="setting-row">
          <NText depth="3" class="setting-label">{{ t('showTabs') }}</NText>
          <NSwitch :value="tabs.showTabs" @update:value="tabs.toggleShow">
            <template #checked>{{ t('showTabsOn') }}</template>
            <template #unchecked>{{ t('showTabsOff') }}</template>
          </NSwitch>
        </div>

        <!-- 存储路径 -->
        <div class="setting-path-block">
          <div class="path-header">
            <NText depth="3" class="setting-label">{{ t('storagePath') }}</NText>
            <NText depth="3" class="path-desc">{{ t('storagePathDesc') }}</NText>
          </div>

          <div class="path-display" v-if="!isDesktopApp">
            <NInput
              :value="settings.storagePath"
              size="small"
              readonly
              :placeholder="'localStorage'"
            >
              <template #suffix>
                <NIcon>
                  <CheckmarkOutline />
                </NIcon>
              </template>
            </NInput>
          </div>

          <template v-else>
            <div class="path-display" v-if="!editingPath">
              <NInput
                :value="settings.storagePath || t('pathNotSet')"
                size="small"
                readonly
                :class="['path-readonly', { 'path-empty': !hasStoragePath }]"
              >
                <template #suffix>
                  <NIcon v-if="hasStoragePath" :style="{ color: '#18a058' }">
                    <CheckmarkOutline />
                  </NIcon>
                  <NButton
                    text
                    size="tiny"
                    :render-icon="renderIcon(OpenOutline)"
                    @click="startEditPath"
                    :style="{ marginLeft: '4px' }"
                    :title="t('editPath')"
                  />
                </template>
              </NInput>
            </div>

            <div class="path-edit" v-else>
              <NInput
                v-model:value="pathDraft"
                size="small"
                :placeholder="t('storagePath')"
                class="path-input"
              />
              <div class="path-actions">
                <NButton
                  size="tiny"
                  :loading="saving"
                  type="primary"
                  @click="savePath"
                >
                  {{ t('save') }}
                </NButton>
                <NButton
                  size="tiny"
                  quaternary
                  :disabled="saving"
                  @click="cancelEditPath"
                >
                  {{ t('cancel') }}
                </NButton>
                <NButton
                  size="tiny"
                  text
                  :disabled="saving"
                  @click="resetPath"
                >
                  {{ t('resetPath') }}
                </NButton>
              </div>
            </div>
          </template>
        </div>
      </div>
  </NModal>
</template>

<style lang="less" scoped>
.settings-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid var(--color-border);
}

.settings-content {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-label {
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.accent-swatch {
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--transition-fast), transform var(--transition-fast);
}
.accent-swatch:hover {
  transform: scale(1.12);
}
.accent-swatch.active {
  border-color: var(--color-text);
}
.swatch-check {
  color: #ffffff;
  filter: drop-shadow(0 0 1px rgba(0,0,0,0.5));
}

.setting-path-block {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.path-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.path-desc {
  font-size: 12px;
}

.path-display {
  width: 100%;
}

:deep(.path-empty .n-input__input-el) {
  color: var(--color-danger, #e03e3e) !important;
  font-style: italic;
}

.path-readonly {
  cursor: default;
}

.path-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.path-input {
  width: 100%;
}

.path-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
