<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NInput, NSpace, NButton, NTag, NSelect, NDivider, NCheckbox, useMessage } from 'naive-ui'
import { useI18n } from '@/composables/i18n/useI18n'
import { CopyOutline, TrashOutline } from '@vicons/ionicons5'

const { t } = useI18n()
const message = useMessage()

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()

const pattern = ref('')
const flags = ref(['g', 'i'])
const testText = ref('')
const error = ref('')

const availableFlags = [
  { label: 'g (global)', value: 'g' },
  { label: 'i (ignoreCase)', value: 'i' },
  { label: 'm (multiline)', value: 'm' },
  { label: 's (dotAll)', value: 's' },
]

const presetPatterns = [
  { label: t('tools.regex.presets.email'), value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
  { label: t('tools.regex.presets.phone'), value: '^1[3-9]\\d{9}$' },
  { label: t('tools.regex.presets.url'), value: '^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$' },
  { label: t('tools.regex.presets.ipv4'), value: '^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$' },
  { label: t('tools.regex.presets.date'), value: '^\\d{4}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\\d|3[01])$' },
]

const regex = computed(() => {
  if (!pattern.value.trim()) return null
  try {
    error.value = ''
    const flagStr = flags.value.join('')
    return new RegExp(pattern.value, flagStr)
  } catch (e: any) {
    error.value = e.message || 'Invalid regex'
    return null
  }
})

interface MatchResult {
  match: string
  index: number
  groups?: Record<string, string>
}

const matches = computed<MatchResult[]>(() => {
  if (!regex.value || !testText.value) return []
  const results: MatchResult[] = []
  if (regex.value.global) {
    let m: RegExpExecArray | null
    let count = 0
    while ((m = regex.value.exec(testText.value)) !== null) {
      results.push({ match: m[0], index: m.index, groups: m.groups })
      count++
      if (count > 500) break
      if (m[0] === '') regex.value.lastIndex++
    }
  } else {
    const m = regex.value.exec(testText.value)
    if (m) results.push({ match: m[0], index: m.index, groups: m.groups })
  }
  return results
})

// 高亮匹配文本
const highlightedText = computed(() => {
  if (!regex.value || !testText.value) return null
  const text = testText.value
  const matchedRanges = matches.value.map((m) => ({ start: m.index, end: m.index + m.match.length }))

  let result = ''
  let cursor = 0
  for (const range of matchedRanges) {
    if (range.start < cursor) continue
    result += escapeHtml(text.slice(cursor, range.start))
    result += `<mark class="regex-highlight">${escapeHtml(text.slice(range.start, range.end))}</mark>`
    cursor = range.end
  }
  result += escapeHtml(text.slice(cursor))
  return result
})

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')
}

function copyMatches() {
  if (!matches.value.length) return
  const text = matches.value.map((m) => m.match).join('\n')
  navigator.clipboard.writeText(text).then(() => message.success(t('tools.copied')))
}

function clearAll() {
  pattern.value = ''
  testText.value = ''
  error.value = ''
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    :style="{ width: '720px', maxWidth: '95vw' }"
    :title="t('tools.regex.title')"
    :bordered="false"
    @update:show="emit('update:show', $event)"
  >
    <n-space vertical :size="12">
      <!-- 预设 -->
      <n-select
        :default-value="null"
        :options="[{ label: t('tools.regex.selectPreset'), value: 'preset-placeholder', type: 'ignored' }, ...presetPatterns]"
        size="small"
        @update:value="(v: any) => { if (v && v !== 'preset-placeholder') pattern = String(v) }"
      />

      <!-- 正则输入 -->
      <div style="position: relative">
        <n-input
          v-model:value="pattern"
          :placeholder="t('tools.regex.patternPlaceholder')"
          :status="error ? 'error' : undefined"
          clearable
        >
          <template #prefix>
            <span style="color: #888; font-family: monospace">/</span>
          </template>
          <template #suffix>
            <span style="color: #888; font-family: monospace">/{{ flags.join('') }}</span>
          </template>
        </n-input>
      </div>

      <!-- Flags -->
      <n-checkbox-group v-model:value="flags">
        <n-space>
          <n-checkbox v-for="f in availableFlags" :key="f.value" :value="f.value" :label="f.label" />
        </n-space>
      </n-checkbox-group>

      <!-- 错误信息 -->
      <div v-if="error" style="color: #d12f2f; font-size: var(--fs-sm)">{{ t('tools.regex.error') }}: {{ error }}</div>

      <!-- 测试文本 -->
      <n-input
        v-model:value="testText"
        type="textarea"
        :placeholder="t('tools.regex.textPlaceholder')"
        :autosize="{ minRows: 6, maxRows: 12 }"
        style="font-size: var(--fs-base); line-height: 1.7"
      />

      <!-- 高亮预览 -->
      <div v-if="highlightedText && !error" class="highlight-box" v-html="highlightedText"></div>

      <!-- 匹配结果统计 -->
      <div v-if="matches.length && !error">
        <n-space align="center">
          <span style="font-size: var(--fs-sm); color: #666">
            {{ t('tools.regex.matches') }}: <strong>{{ matches.length }}</strong>
          </span>
          <n-tag v-for="(m, i) in matches.slice(0, 10)" :key="i" size="small" type="success">
            {{ m.match.length > 30 ? m.match.slice(0, 30) + '...' : m.match }}
          </n-tag>
          <n-tag v-if="matches.length > 10" size="small">...</n-tag>
        </n-space>
      </div>

      <div v-else-if="testText && pattern && !error" style="color: #999; font-size: var(--fs-sm)">
        {{ t('tools.regex.noMatch') }}
      </div>

      <n-space justify="end">
        <n-button size="small" secondary @click="clearAll">
          <template #icon><n-icon :component="TrashOutline" /></template>
          {{ t('tools.clear') }}
        </n-button>
        <n-button size="small" type="primary" :disabled="!matches.length" @click="copyMatches">
          <template #icon><n-icon :component="CopyOutline" /></template>
          {{ t('tools.copyMatches') }}
        </n-button>
      </n-space>
    </n-space>
  </n-modal>
</template>

<style scoped>
.highlight-box {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: var(--fs-base);
  line-height: 1.8;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
}
.highlight-box :deep(.regex-highlight) {
  background: #ffe066;
  border-radius: 2px;
  padding: 1px 2px;
  font-weight: 500;
}
</style>
