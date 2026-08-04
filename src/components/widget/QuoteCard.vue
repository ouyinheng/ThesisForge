<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NText, NButton, NIcon, NSpin } from 'naive-ui'
import { useI18n } from '@/composables/i18n/useI18n'
import { RefreshOutline, BookOutline } from '@vicons/ionicons5'
import { fetchQuote, getRandomQuote } from '@/services/quote'

const { t } = useI18n()

const loading = ref(true)
const quote = ref({ text: '', author: '' })

function todayKey(): string {
  const d = new Date()
  return ' daily-quote-' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}

async function loadQuote() {
  loading.value = true
  const cached = localStorage.getItem(todayKey())
  if (cached) {
    try {
      quote.value = JSON.parse(cached)
      loading.value = false
      return
    } catch {
      /* cache miss, fetch below */
    }
  }
  try {
    const result = await fetchQuote()
    quote.value = result
    localStorage.setItem(todayKey(), JSON.stringify(result))
  } catch (e) {
    quote.value = getRandomQuote()
  } finally {
    loading.value = false
  }
}

async function refresh() {
  loading.value = true
  try {
    const result = await fetchQuote()
    quote.value = result
    localStorage.setItem(todayKey(), JSON.stringify(result))
  } catch (e) {
    quote.value = getRandomQuote()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadQuote()
})
</script>

<template>
  <section class="dashboard-panel dashboard-quote">
    <NIcon :size="16" class="quote-icon"><BookOutline /></NIcon>
    <template v-if="loading">
      <div style="display: flex; justify-content: center; padding: 12px 0">
        <n-spin size="small" />
      </div>
    </template>
    <div v-else class="quote-content">
      <NText class="quote-text">{{ quote.text }}</NText>
      <NText depth="3" class="quote-author">— {{ quote.author }}</NText>
    </div>
    <NButton text size="small" class="quote-refresh" @click="refresh">
      <template #icon><n-icon :size="14"><RefreshOutline /></n-icon></template>
      {{ t('tools.quote.refresh') }}
    </NButton>
  </section>
</template>

<style scoped>
.dashboard-panel {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 1.25em 1.5em;
}
.dashboard-quote {
  display: flex;
  flex-direction: column;
  border-left: 3px solid var(--color-primary);
  position: relative;
}
.quote-icon {
  color: var(--color-primary);
  margin-bottom: 8px;
}
.quote-content {
  flex: 1;
}
.quote-text {
  display: block;
  font-family: var(--font-serif);
  font-size: var(--fs-base);
  line-height: 1.7;
  color: var(--color-text);
}
.quote-author {
  display: block;
  margin-top: 10px;
  text-align: right;
  font-size: var(--fs-xs);
}
.quote-refresh {
  align-self: flex-end;
  margin-top: 10px;
}
</style>
