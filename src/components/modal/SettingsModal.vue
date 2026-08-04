<script setup lang="ts">
import { ref, computed } from "vue";
import {
  NModal,
  NH3,
  NText,
  NButton,
  NButtonGroup,
  NIcon,
  NInput,
  NSwitch,
  NAvatar,
  NSlider,
  NUpload
} from "naive-ui";
import { SunnyOutline, MoonOutline, Menu as MenuIcon, Close as CloseIcon } from "@vicons/ionicons5";
import { OpenOutline, CheckmarkOutline, PencilOutline } from "@vicons/ionicons5";
import { useSettingsStore } from "@/stores/settings";
import { useTabsStore } from "@/stores/tabs";
import { useI18n } from "@/composables/i18n/useI18n";
import { useMessage } from "naive-ui";
import { h, type Component } from "vue";
import { isDesktop, selectDirectory } from "@/services/storage";

const settings = useSettingsStore();
const tabs = useTabsStore();
const { t, setLocale, currentLocale: locale } = useI18n();
const message = useMessage();

defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  "update:show": [value: false];
}>();

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

// 是否已设置存储路径
const hasStoragePath = computed(
  () => settings.storagePath && settings.storagePath.trim().length > 0
);

// 是否处于桌面模式
const isDesktopApp = computed(() => isDesktop());

// 编辑路径
const editingPath = ref<boolean>(false);
const pathDraft = ref<string>("");
const saving = ref<boolean>(false);

async function startEditPath() {
  if (isDesktopApp.value) {
    const picked = await selectDirectory();
    if (picked) {
      await applyPath(picked);
    }
    return;
  }
  pathDraft.value = settings.storagePath || "";
  editingPath.value = true;
}

async function applyPath(newPath: string) {
  if (newPath === settings.storagePath) return;
  saving.value = true;
  try {
    await settings.changeStoragePath(newPath);
    message.success(t("pathSaved"));
    editingPath.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
}

function cancelEditPath() {
  editingPath.value = false;
  pathDraft.value = "";
}

async function savePath() {
  const newPath = pathDraft.value.trim();
  if (!newPath) {
    message.warning(t("storagePath") + "不能为空");
    return;
  }
  if (newPath === settings.storagePath) {
    editingPath.value = false;
    return;
  }
  saving.value = true;
  try {
    await settings.changeStoragePath(newPath);
    message.success(t("pathSaved"));
    editingPath.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
}

async function resetPath() {
  saving.value = true;
  try {
    await settings.resetStoragePath();
    message.success(t("pathSaved"));
    editingPath.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
}

// 头像上传处理
async function handleAvatarUpload({ file }: { file: { file: File } }) {
  const imgFile = file.file;
  if (!imgFile) return false;

  // 验证文件类型
  if (!imgFile.type.startsWith("image/")) {
    message.error("请上传图片文件");
    return false;
  }

  // 验证大小（限制 10MB）
  if (imgFile.size > 10 * 1024 * 1024) {
    message.error("图片大小不能超过 10MB");
    return false;
  }

  // 压缩并转换为 base64
  try {
    const base64 = await compressImage(imgFile, 200, 0.7);
    settings.avatar = base64;
    message.success("头像已更新");
  } catch (e) {
    console.error(e);
    message.error("上传失败");
  }
  return false; // 阻止默认上传行为
}

// 压缩图片到指定尺寸
function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建 canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// 清除头像
function clearAvatar() {
  settings.avatar = "";
}

// 字体大小滑块
const fontSizeOptions = [
  { label: "小", value: 12 },
  { label: "中", value: 14 },
  { label: "大", value: 16 },
  { label: "特大", value: 18 }
];
const currentFontSizeLabel = computed(() => {
  const opt = fontSizeOptions.find((o) => o.value === settings.fontSize);
  return opt ? opt.label : String(settings.fontSize);
});

// 主题色选项：默认 + 3 种
const ACCENT_PRESETS = [
  { label: "", value: "#D12F2F" }, // 默认红
  { label: "", value: "#2563EB" }, // 蓝
  { label: "", value: "#059669" }, // 绿
  { label: "", value: "#9333EA" } // 紫
];
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
    @update:show="
      (val) => {
        if (!val) emit('update:show', false);
      }
    "
    @esc="emit('update:show', false)"
    @mask-click="emit('update:show', false)"
  >
    <!-- 标题区 -->
    <template #header>
      <div class="settings-title">
        <NH3 :style="{ margin: 0 }">{{ t("settings") }}</NH3>
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
      <!-- 头像与昵称 -->
      <div class="setting-profile-block">
        <div class="profile-row">
          <NUpload
            :show-file-list="false"
            :custom-request="handleAvatarUpload"
            accept="image/*"
            style="flex: 1"
          >
            <div class="avatar-wrapper">
              <NAvatar :size="48" :src="settings.avatar" round class="profile-avatar">
                <span v-if="!settings.avatar" class="avatar-fallback">
                  {{ (settings.nickname || "?").charAt(0).toUpperCase() }}
                </span>
              </NAvatar>
              <div class="avatar-mask">
                <NIcon :size="16"><PencilOutline /></NIcon>
              </div>
            </div>
          </NUpload>
          <div class="profile-info">
            <NInput
              :value="settings.nickname"
              @update:value="settings.nickname = $event || ''"
              :placeholder="t('nicknamePlaceholder')"
              size="small"
              maxlength="20"
              style="flex: 1"
            />
            <NButton v-if="settings.avatar" text size="tiny" type="error" @click="clearAvatar">
              清除头像
            </NButton>
          </div>
        </div>
      </div>

      <!-- 字体大小 -->
      <div class="setting-row">
        <NText depth="3" class="setting-label">{{ t("fontSize") }}</NText>
        <div class="font-size-control">
          <NButtonGroup size="small">
            <NButton
              v-for="opt in fontSizeOptions"
              :key="opt.value"
              :type="settings.fontSize === opt.value ? 'primary' : 'default'"
              :ghost="settings.fontSize !== opt.value"
              @click="settings.fontSize = opt.value"
            >
              {{ opt.label }}
            </NButton>
          </NButtonGroup>
        </div>
      </div>

      <!-- 主题 -->
      <div class="setting-row">
        <NText depth="3" class="setting-label">{{ t("theme") }}</NText>
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
        <NText depth="3" class="setting-label">{{ t("layout") }}</NText>
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
        <NText depth="3" class="setting-label">{{ t("language") }}</NText>
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
        <NText depth="3" class="setting-label">{{ t("accentColor") }}</NText>
        <n-space :size="6">
          <button
            v-for="c in ACCENT_PRESETS"
            :key="c.value"
            class="accent-swatch"
            :class="{ active: settings.accentColor === c.value }"
            :style="{ background: c.value }"
            @click="settings.accentColor = c.value"
          >
            <NIcon v-if="settings.accentColor === c.value" :size="12" class="swatch-check"
              ><CheckmarkOutline
            /></NIcon>
          </button>
        </n-space>
      </div>

      <!-- 天气城市 -->
      <div class="setting-row">
        <NText depth="3" class="setting-label">{{ t("city") }}</NText>
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
        <NText depth="3" class="setting-label">{{ t("showTabs") }}</NText>
        <NSwitch :value="tabs.showTabs" @update:value="tabs.toggleShow">
          <template #checked>{{ t("showTabsOn") }}</template>
          <template #unchecked>{{ t("showTabsOff") }}</template>
        </NSwitch>
      </div>

      <!-- 存储路径 -->
      <div class="setting-path-block">
        <div class="path-header">
          <NText depth="3" class="setting-label">{{ t("storagePath") }}</NText>
          <NText depth="3" class="path-desc">{{ t("storagePathDesc") }}</NText>
        </div>

        <div class="path-display" v-if="!isDesktopApp">
          <NInput :value="settings.storagePath" size="small" readonly :placeholder="'localStorage'">
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
              <NButton size="tiny" :loading="saving" type="primary" @click="savePath">
                {{ t("save") }}
              </NButton>
              <NButton size="tiny" quaternary :disabled="saving" @click="cancelEditPath">
                {{ t("cancel") }}
              </NButton>
              <NButton size="tiny" text :disabled="saving" @click="resetPath">
                {{ t("resetPath") }}
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

.setting-profile-block {
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.profile-avatar {
  border: 2px solid var(--color-border);
  transition: border-color var(--transition-fast);
}

.avatar-wrapper:hover .profile-avatar {
  border-color: var(--color-primary);
}

.avatar-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
  color: #fff;
}

.avatar-wrapper:hover .avatar-mask {
  opacity: 1;
}

.avatar-fallback {
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--color-primary);
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.font-size-control {
  display: flex;
  align-items: center;
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
  transition:
    border-color var(--transition-fast),
    transform var(--transition-fast);
}
.accent-swatch:hover {
  transform: scale(1.12);
}
.accent-swatch.active {
  border-color: var(--color-text);
}
.swatch-check {
  color: #ffffff;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.5));
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
  font-size: var(--fs-xs);
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
