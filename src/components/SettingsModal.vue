<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NModal,
  NCard,
  NH3,
  NText,
  NButton,
  NButtonGroup,
  NIcon,
  NInput,
} from 'naive-ui'
import {
  SunnyOutline,
  MoonOutline,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@vicons/ionicons5'
import { OpenOutline, CheckmarkOutline } from '@vicons/ionicons5'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from '@/composables/useI18n'
import { useMessage } from 'naive-ui'
import { h, type Component } from 'vue'
import { isDesktop } from '@/services/storage'

const settings = useSettingsStore()
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

function startEditPath() {
  pathDraft.value = settings.storagePath || ''
  editingPath.value = true
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
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :style="{ width: '480px' }"
    size="medium"
    :bordered="false"
    :closable="false"
    @update:show="(val) => { if (!val) emit('update:show', false) }"
    @esc="emit('update:show', false)"
    @mask-click="emit('update:show', false)"
  >
    <NCard
      :style="{ borderRadius: '16px', overflow: 'hidden' }"
      content-style="padding: 0"
    >
      <!-- 标题区 -->
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
              :type="settings.layout === 'sidebar' ? 'primary' : 'default'"
              :ghost="settings.layout !== 'sidebar'"
              @click="settings.layout = 'sidebar'"
            >
              <template #icon>
                <NIcon><MenuIcon /></NIcon>
              </template>
              Sidebar
            </NButton>
            <NButton
              :type="settings.layout === 'topbar' ? 'primary' : 'default'"
              :ghost="settings.layout !== 'topbar'"
              @click="settings.layout = 'topbar'"
            >
              <template #icon>
                <NIcon><MenuIcon /></NIcon>
              </template>
              Topbar
            </NButton>
          </NButtonGroup>
        </div>

        <!-- 语言 -->
        <div class="setting-row">
          <NText depth="3" class="setting-label">{{ t('language') }}</NText>
          <NButtonGroup size="small">
            <NButton
              :type="locale === 'zh' ? 'primary' : 'default'"
              :ghost="locale !== 'zh'"
              @click="setLocale('zh')"
            >
              中文
            </NButton>
            <NButton
              :type="locale === 'en' ? 'primary' : 'default'"
              :ghost="locale !== 'en'"
              @click="setLocale('en')"
            >
              EN
            </NButton>
          </NButtonGroup>
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
    </NCard>
  </NModal>
</template>

<style lang="less" scoped>
.settings-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 14px;
  border-bottom: 1px solid var(--color-border);
}

.settings-content {
  padding: 20px 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-label {
  font-size: 13px;
  font-weight: 500;
}

.setting-path-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
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
