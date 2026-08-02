<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NInput, NSpace, NButton, NSwitch, NSelect, NDivider, useMessage } from 'naive-ui'
import { useI18n } from '@/composables/useI18n'
import { CopyOutline, CodeOutline, TrashOutline } from '@vicons/ionicons5'

const { t } = useI18n()
const message = useMessage()

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()

const jsonInput = ref('')
const indent = ref<number>(2)
const sortKeys = ref(false)
const error = ref('')

const indentOptions = [
  { label: '2 空格', value: 2 },
  { label: '4 空格', value: 4 },
  { label: 'Tab', value: 1 },
]

const formatted = computed(() => {
  if (!jsonInput.value.trim()) return ''
  try {
    let parsed = JSON.parse(jsonInput.value)
    if (sortKeys.value && typeof parsed === 'object' && parsed !== null) {
      parsed = sortObjectKeys(parsed)
    }
    error.value = ''
    const useTab = indent.value === 1
    const space = useTab ? '\t' : ' '.repeat(indent.value)
    return JSON.stringify(parsed, null, space)
  } catch (e: any) {
    error.value = e.message || 'JSON parse error'
    return ''
  }
})

function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }
  if (typeof obj === 'object' && obj !== null) {
    const sorted: Record<string, any> = {}
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortObjectKeys(obj[key])
    }
    return sorted
  }
  return obj
}

function copyResult() {
  if (!formatted.value) return
  navigator.clipboard.writeText(formatted.value).then(() => message.success(t('tools.copied')))
}

function clearAll() {
  jsonInput.value = ''
  error.value = ''
}

function minify() {
  if (!jsonInput.value.trim()) return
  try {
    const parsed = JSON.parse(jsonInput.value)
    jsonInput.value = JSON.stringify(parsed)
    message.success(t('tools.json.minified'))
  } catch (e: any) {
    message.error(e.message)
  }
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    :style="{ width: '720px', maxWidth: '95vw' }"
    :title="t('tools.json.title')"
    :bordered="false"
    @update:show="emit('update:show', $event)"
  >
    <n-space vertical :size="12">
      <n-input
        v-model:value="jsonInput"
        type="textarea"
        :placeholder="t('tools.json.placeholder')"
        :autosize="{ minRows: 8, maxRows: 16 }"
        style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px"
      />

      <n-space align="center" :size="16">
        <span style="font-size: 13px; color: #666">{{ t('tools.json.indent') }}</span>
        <n-select v-model:value="indent" :options="indentOptions" style="width: 120px" size="small" />
        <n-switch v-model:value="sortKeys" size="small">
          <template #checked>{{ t('tools.json.sortKeysOn') }}</template>
          <template #unchecked>{{ t('tools.json.sortKeysOff') }}</template>
        </n-switch>
      </n-space>

      <div v-if="error" style="color: #d12f2f; font-size: 13px; padding: 4px 0">
        {{ t('tools.json.error') }}: {{ error }}
      </div>

      <n-divider v-if="formatted" style="margin: 4px 0" />
      <div v-if="formatted">
        <div style="font-size: 12px; color: #888; margin-bottom: 4px">{{ t('tools.json.result') }}</div>
        <pre class="json-result">{{ formatted }}</pre>
      </div>

      <n-space justify="space-between">
        <n-space>
          <n-button size="small" secondary @click="minify">
            <template #icon><n-icon :component="CodeOutline" /></template>
            {{ t('tools.json.minify') }}
          </n-button>
        </n-space>
        <n-space>
          <n-button size="small" secondary @click="clearAll">
          <template #icon><n-icon :component="TrashOutline" /></template>
          {{ t('tools.clear') }}
          </n-button>
          <n-button size="small" type="primary" :disabled="!formatted" @click="copyResult">
          <template #icon><n-icon :component="CopyOutline" /></template>
          {{ t('tools.copy') }}
          </n-button>
        </n-space>
      </n-space>
    </n-space>
  </n-modal>
</template>

<style scoped>
.json-result {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  max-height: 300px;
  overflow: auto;
  margin: 0;
}
</style>
