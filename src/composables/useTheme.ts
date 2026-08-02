import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export function useTheme() {
  const settings = useSettingsStore()

  const currentTheme = computed(() => settings.theme)

  function toggleTheme(): void {
    settings.theme = settings.theme === 'light' ? 'dark' : 'light'
  }

  return {
    currentTheme,
    toggleTheme,
  }
}
