<script setup lang="ts">
import { ref, computed } from 'vue'
import { NModal, NInput, NStatistic, NSpace, NGrid, NGi, NDivider, NButton, NEmpty, useMessage } from 'naive-ui'
import { useI18n } from '@/composables/i18n/useI18n'
import { TrashOutline, CopyOutline } from '@vicons/ionicons5'

const { t } = useI18n()
const message = useMessage()

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()

const text = ref('')

const stats = computed(() => {
  const raw = text.value
  if (!raw.trim()) return null

  const totalChars = raw.length
  const noSpaces = raw.replace(/\s/g, '').length
  const chineseChars = (raw.match(/[一-龥]/g) || []).length
  const englishWords = (raw.match(/[a-zA-Z]+/g) || []).length
  const numbers = (raw.match(/\d+/g) || []).length
  const punctuation = (raw.match(/[，。、；：？！""''（）《》【】.,;:!?'"()\-—…·]/g) || []).length
  const paragraphs = raw.split(/\n\s*\n/).filter((p) => p.trim()).length || (raw.trim() ? 1 : 0)
  const readMinutes = Math.max(1, Math.ceil((chineseChars + englishWords) / 300))

  return { totalChars, noSpaces, chineseChars, englishWords, numbers, punctuation, paragraphs, readMinutes }
})

function clearText() {
  text.value = ''
}

function copyStats() {
  if (!stats.value) return
  const s = stats.value
  const report = [
    t('tools.wordcount.letters') + ': ' + s.totalChars,
    t('tools.wordcount.noSpaces') + ': ' + s.noSpaces,
    t('tools.wordcount.chinese') + ': ' + s.chineseChars,
    t('tools.wordcount.english') + ': ' + s.englishWords,
    t('tools.wordcount.words') + ': ' + s.numbers,
    t('tools.wordcount.punctuation') + ': ' + s.punctuation,
    t('tools.wordcount.paragraphs') + ': ' + s.paragraphs,
    t('tools.wordcount.readTime') + ': ~' + s.readMinutes + ' ' + t('tools.wordcount.min'),
  ].join('\n')
  navigator.clipboard.writeText(report).then(() => message.success(t('tools.copied')))
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    :style="{ width: '640px', maxWidth: '95vw' }"
    :title="t('tools.wordcount.title')"
    :bordered="false"
    @update:show="emit('update:show', $event)"
  >
    <n-space vertical :size="16">
      <n-input
        v-model:value="text"
        type="textarea"
        :placeholder="t('tools.wordcount.placeholder')"
        :autosize="{ minRows: 8, maxRows: 16 }"
        style="font-size: 14px"
      />

      <template v-if="stats">
        <n-divider style="margin: 0" />
        <n-grid :cols="4" :x-gap="12" :y-gap="12">
          <n-gi>
            <n-statistic :label="t('tools.wordcount.letters')" :value="stats.totalChars" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('tools.wordcount.noSpaces')" :value="stats.noSpaces" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('tools.wordcount.chinese')" :value="stats.chineseChars" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('tools.wordcount.english')" :value="stats.englishWords" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('tools.wordcount.words')" :value="stats.numbers" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('tools.wordcount.punctuation')" :value="stats.punctuation" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('tools.wordcount.paragraphs')" :value="stats.paragraphs" />
          </n-gi>
          <n-gi>
            <n-statistic :label="t('tools.wordcount.readTime')">
              <span>~{{ stats.readMinutes }} {{ t('tools.wordcount.min') }}</span>
            </n-statistic>
          </n-gi>
        </n-grid>
      </template>

      <n-empty v-else :description="t('tools.wordcount.empty')" size="small" />

      <n-space justify="end">
        <n-button size="small" secondary @click="clearText">
          <template #icon><n-icon :component="TrashOutline" /></template>
          {{ t('tools.clear') }}
        </n-button>
        <n-button size="small" secondary :disabled="!stats" @click="copyStats">
          <template #icon><n-icon :component="CopyOutline" /></template>
          {{ t('tools.copyStat') }}
        </n-button>
      </n-space>
    </n-space>
  </n-modal>
</template>
