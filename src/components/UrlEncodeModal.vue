<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NInput, NSpace, NButton, NTabs, NTabPane, NSelect, useMessage } from 'naive-ui'
import { useI18n } from '@/composables/useI18n'
import { CopyOutline, ArrowDownOutline } from '@vicons/ionicons5'

const { t } = useI18n()
const message = useMessage()

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()

const input = ref('')
const encodeMode = ref<'encodeURI' | 'encodeURIComponent'>('encodeURIComponent')
const activeTab = ref<'encode' | 'decode'>('encode')

const encodeModes = [
  { label: 'encodeURIComponent', value: 'encodeURIComponent', desc: t('tools.url.modeComp') },
  { label: 'encodeURI', value: 'encodeURI', desc: t('tools.url.modeFull') },
]

const result = computed(() => {
  if (!input.value.trim()) return ''
  try {
    if (activeTab.value === 'encode') {
      if (encodeMode.value === 'encodeURI') return encodeURI(input.value)
      return encodeURIComponent(input.value)
    } else {
      return decodeURIComponent(input.value)
    }
  } catch (e: any) {
    return t('tools.url.error') + ': ' + e.message
  }
})

function copyResult() {
  if (!result.value) return
  navigator.clipboard.writeText(result.value).then(() => message.success(t('tools.copied')))
}

function swap() {
  const temp = input.value
  input.value = result.value
  activeTab.value = activeTab.value === 'encode' ? 'decode' : 'encode'
  message.info(t('tools.url.swapped'))
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    :style="{ width: '680px', maxWidth: '95vw' }"
    :title="t('tools.url.title')"
    :bordered="false"
    @update:show="emit('update:show', $event)"
  >
    <n-space vertical :size="12">
      <n-tabs v-model:value="activeTab" type="line" animated size="small">
        <n-tab-pane name="encode" :tab="t('tools.url.encode')" />
        <n-tab-pane name="decode" :tab="t('tools.url.decode')" />
      </n-tabs>

      <n-select
        v-if="activeTab === 'encode'"
        v-model:value="encodeMode"
        :options="encodeModes"
        size="small"
      />

      <n-input
        v-model:value="input"
        type="textarea"
        :placeholder="activeTab === 'encode' ? t('tools.url.encodePlaceholder') : t('tools.url.decodePlaceholder')"
        :autosize="{ minRows: 6, maxRows: 12 }"
        style="font-family: 'JetBrains Mono', monospace; font-size: 13px"
      />

      <div style="text-align: center">
        <n-button text size="small" @click="swap">
          <template #icon><n-icon :component="ArrowDownOutline" /></template>
          {{ t('tools.url.swap') }}
        </n-button>
      </div>

      <n-input
        :value="result"
        type="textarea"
        readonly
        :autosize="{ minRows: 4, maxRows: 10 }"
        style="font-family: 'JetBrains Mono', monospace; font-size: 13px"
        :placeholder="t('tools.url.resultPlaceholder')"
      />

      <n-space justify="end">
        <n-button size="small" type="primary" :disabled="!result" @click="copyResult">
          <template #icon><n-icon :component="CopyOutline" /></template>
          {{ t('tools.copy') }}
        </n-button>
      </n-space>
    </n-space>
  </n-modal>
</template>
