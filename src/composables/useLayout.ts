import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export function useLayout() {
  const settings = useSettingsStore()

  const currentLayout = computed(() => settings.layout)

  function toggleLayout(): void {
    settings.layout = settings.layout === 'sidebar' ? 'topbar' : 'sidebar'
  }

  return {
    currentLayout,
    toggleLayout,
  }
}
