<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NUpload, NUploadDragger, NSpace, NButton, NSelect, NDivider, NText, NProgress, useMessage } from 'naive-ui'
import { useI18n } from '@/composables/i18n/useI18n'
import { TrashOutline, DownloadOutline } from '@vicons/ionicons5'

const { t } = useI18n()
const message = useMessage()

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()

interface ImageFile {
  id: string
  file: File
  preview: string
  name: string
}

const images = ref<ImageFile[]>([])
const paperSize = ref('a4')
const progress = ref(0)
const processing = ref(false)

const paperOptions = [
  { label: 'A4 (210x297mm)', value: 'a4' },
  { label: 'A3 (297x420mm)', value: 'a3' },
  { label: 'Letter (216x279mm)', value: 'letter' },
]

const presets: Record<string, [number, number]> = {
  a4: [210, 297],
  a3: [297, 420],
  letter: [215.9, 279.4],
}

let idCounter = 0

function handleFileList(files: { file: File }[]): boolean {
  for (const item of files) {
    if (!item.file.type.startsWith('image/')) continue
    const id = String(++idCounter)
    const reader = new FileReader()
    reader.onload = () => {
      images.value.push({
        id,
        file: item.file,
        preview: reader.result as string,
        name: item.file.name,
      })
    }
    reader.readAsDataURL(item.file)
  }
  return false
}

function removeImage(id: string) {
  const idx = images.value.findIndex((img) => img.id === id)
  if (idx >= 0) images.value.splice(idx, 1)
}

function clearAll() {
  images.value = []
  progress.value = 0
}

async function generatePdf() {
  if (!images.value.length) return
  processing.value = true
  progress.value = 0

  try {
    const { jsPDF } = await import('jspdf')
    const [w, h] = presets[paperSize.value]
    const orientation = w > h ? 'l' : 'p'
    const pdf = new jsPDF({ orientation, unit: 'mm', format: [w, h], compress: true })

    for (let i = 0; i < images.value.length; i++) {
      const img = images.value[i]
      if (i > 0) pdf.addPage()

      const imgEl = await loadImage(img.preview)
      const imgRatio = imgEl.width / imgEl.height
      const pageRatio = w / h

      let drawW: number, drawH: number
      if (imgRatio > pageRatio) {
        drawW = w
        drawH = w / imgRatio
      } else {
        drawH = h
        drawW = h * imgRatio
      }

      const x = (w - drawW) / 2
      const y = (h - drawH) / 2

      pdf.addImage(img.preview, 'JPEG', x, y, drawW, drawH, undefined, 'FAST')
      progress.value = Math.round(((i + 1) / images.value.length) * 100)
    }

    const fileName = 'images-' + Date.now() + '.pdf'
    pdf.save(fileName)
    message.success(t('tools.pdf.success'))
  } catch (e: any) {
    message.error(e.message || t('tools.pdf.error'))
  } finally {
    processing.value = false
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    :style="{ width: '720px', maxWidth: '95vw' }"
    :title="t('tools.pdf.title')"
    :bordered="false"
    @update:show="emit('update:show', $event)"
  >
    <n-space vertical :size="12">
      <n-upload
        :default-upload="false"
        :show-file-list="false"
        accept="image/*"
        multiple
        @update:file-list="(list: any) => handleFileList(list)"
      >
        <n-upload-dragger>
          <div style="padding: 8px 0">
            <n-text style="font-size: 14px">{{ t('tools.pdf.dragTip') }}</n-text>
            <br />
            <n-text depth="3" style="font-size: 12px">{{ t('tools.pdf.supportTip') }}</n-text>
          </div>
        </n-upload-dragger>
      </n-upload>

      <div v-if="images.length" style="max-height: 200px; overflow-y: auto">
        <n-space :size="8">
          <div v-for="img in images" :key="img.id" style="position: relative; width: 80px; height: 80px">
            <img
              :src="img.preview"
              :alt="img.name"
              style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid #eee"
            />
            <button class="remove-btn" @click="removeImage(img.id)">×</button>
          </div>
        </n-space>
      </div>

      <n-divider v-if="images.length" style="margin: 4px 0" />

      <n-space align="center">
        <span style="font-size: 13px; color: #666">{{ t('tools.pdf.paperSize') }}</span>
        <n-select v-model:value="paperSize" :options="paperOptions" style="width: 160px" size="small" />
      </n-space>

      <n-progress v-if="processing" :percentage="progress" indicator-placement="inside" processing />

      <n-space justify="space-between">
        <n-button size="small" secondary :disabled="processing" @click="clearAll">
          <template #icon><n-icon :component="TrashOutline" /></template>
          {{ t('tools.clear') }}
        </n-button>
        <n-button size="small" type="primary" :disabled="!images.length || processing" :loading="processing" @click="generatePdf">
          <template #icon><n-icon :component="DownloadOutline" /></template>
          {{ t('tools.pdf.generate') }}
        </n-button>
      </n-space>
    </n-space>
  </n-modal>
</template>

<style scoped>
.remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: #d12f2f;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.remove-btn:hover { background: #a82626; }
</style>
