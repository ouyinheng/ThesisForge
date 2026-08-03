<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NModal,
  NInput,
  NSelect,
  NButton,
  NIcon,
  useMessage,
} from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { useCollectionStore } from '@/stores/collection'
import { useI18n } from '@/composables/useI18n'
import { fetchBookmarkInfo } from '@/composables/useBookmarkFetch'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: false]
}>()

const { t } = useI18n()
const store = useCollectionStore()
const message = useMessage()

const form = ref({
  url: '',
  title: '',
  icon: '',
  groupId: '',
})

const fetching = ref(false)
const editMode = ref(false)  // true = 编辑已有书签

// 编辑模式（从外部设置）
function editBookmark(id: string) {
  const bm = store.getBookmark(id)
  if (!bm) return
  editMode.value = true
  form.value = {
    url: bm.url,
    title: bm.title,
    icon: bm.icon,
    groupId: bm.groupId,
  }
}

function resetForm() {
  form.value = { url: '', title: '', icon: '', groupId: '' }
  editMode.value = false
}

watch(() => props.show, (val) => {
  if (!val) resetForm()
})

/** 自动抓取 */
async function autoFetch() {
  if (!form.value.url.trim()) {
    message.warning(t('collection.inputUrl'))
    return
  }
  fetching.value = true
  try {
    const result = await fetchBookmarkInfo(form.value.url)
    if (result.ok) {
      if (result.title) form.value.title = result.title
      if (result.icon) form.value.icon = result.icon
      message.success(t('collection.fetchSuccess'))
    } else {
      message.warning(t('collection.fetchFailed'))
    }
  } catch {
    message.error(t('collection.fetchFailed'))
  } finally {
    fetching.value = false
  }
}

function handleSave() {
  if (!form.value.url.trim()) {
    message.warning(t('collection.inputUrl'))
    return
  }
  if (!form.value.title.trim()) {
    message.warning(t('collection.inputTitle'))
    return
  }
  if (editMode.value && bookmarkIdToEdit) {
    store.updateBookmark(bookmarkIdToEdit, {
      url: form.value.url,
      title: form.value.title,
      icon: form.value.icon,
      groupId: form.value.groupId,
    })
  } else {
    store.addBookmark({
      url: form.value.url,
      title: form.value.title,
      icon: form.value.icon,
      groupId: form.value.groupId,
    })
  }
  message.success(t('collection.saved'))
  close()
}

let bookmarkIdToEdit: string | null = null

function openEdit(id: string) {
  bookmarkIdToEdit = id
  editBookmark(id)
}

function openAdd() {
  bookmarkIdToEdit = null
  resetForm()
}

function close() {
  emit('update:show', false)
}

// 分组选项
const groupOptions = computed(() => [
  { label: t('collection.ungrouped'), value: '' },
  ...store.sortedCollections.map((c) => ({
    label: `${c.icon} ${c.name}`,
    value: c.id,
  })),
])

defineExpose({ openAdd, openEdit })
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :style="{ width: '520px' }"
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
    <template #header>
      <div class="form-title">
        <span>{{ editMode ? t('collection.editBookmark') : t('collection.addBookmark') }}</span>
      </div>
    </template>

    <div class="form-content">
      <!-- URL -->
      <div class="form-row">
        <NInput
          v-model:value="form.url"
          :placeholder="t('collection.urlPlaceholder')"
          clearable
        />
        <NButton
          quaternary
          :loading="fetching"
          :disabled="!form.url.trim()"
          @click="autoFetch"
          :title="t('collection.autoFetch')"
        >
          <template #icon>
            <NIcon :size="18"><RefreshOutline /></NIcon>
          </template>
        </NButton>
      </div>

      <!-- 图标预览 -->
      <div class="form-icon-preview" v-if="form.icon">
        <img :src="form.icon" class="preview-img" alt="favicon" />
      </div>

      <!-- 标题 -->
      <NInput
        v-model:value="form.title"
        :placeholder="t('collection.titlePlaceholder')"
      />

      <!-- 分组 -->
      <NSelect
        v-model:value="form.groupId"
        :options="groupOptions"
        :placeholder="t('collection.selectGroup')"
      />

      <!-- 操作按钮 -->
      <div class="form-actions">
        <NButton @click="close">{{ t('todo.cancel') }}</NButton>
        <NButton type="primary" @click="handleSave">{{ editMode ? t('collection.update') : t('todo.add') }}</NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.form-title {
  display: flex;
  padding: 16px 20px;
  font-size: var(--fs-lg);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
}
.form-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.form-icon-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-img {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--color-bg-tertiary);
  padding: 2px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
</style>
