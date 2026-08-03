import { computed } from 'vue'
import type { GlobalThemeOverrides } from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'

function getCssVar(name: string): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return v || '#000'
}

export function useNaiveTheme() {
  const settings = useSettingsStore()

  const themeOverrides = computed<GlobalThemeOverrides>(() => {
    // 显式依赖：访问 settings.theme、settings.locale 与 settings.accentColor，确保变化时重算
    const theme = settings.theme
    const locale = settings.locale
    const accent = settings.accentColor

    const primary = accent || getCssVar('--color-primary')
    const primaryHover = getCssVar('--color-primary-hover')
    const text = getCssVar('--color-text')
    const textSecondary = getCssVar('--color-text-secondary')
    const textTertiary = getCssVar('--color-text-tertiary')
    const bg = getCssVar('--color-bg')
    const bgSecondary = getCssVar('--color-bg-secondary')
    const bgTertiary = getCssVar('--color-bg-tertiary')
    const border = getCssVar('--color-border')

    const isDark = theme === 'dark'

    return {
      common: {
        primaryColor: primary,
        primaryColorHover: primaryHover,
        primaryColorPressed: primary,
        primaryColorSuppl: primary,
        infoColor: '#3b82f6',
        infoColorHover: '#60a5fa',
        infoColorPressed: '#2563eb',
        infoColorSuppl: '#60a5fa',
        successColor: '#18a058',
        successColorHover: '#36ad6a',
        successColorPressed: '#0c7a43',
        successColorSuppl: '#36ad6a',
        warningColor: '#f0a020',
        warningColorHover: '#fcb040',
        warningColorPressed: '#d89018',
        warningColorSuppl: '#fcb040',
        errorColor: '#d03050',
        errorColorHover: '#de576d',
        errorColorPressed: '#ab1f3f',
        errorColorSuppl: '#de576d',
        textColorBase: text,
        textColor1: text,
        textColor2: textSecondary,
        textColor3: textTertiary,
        textColorDisabled: textTertiary,
        bodyColor: bg,
        cardColor: bg,
        modalColor: bgSecondary,
        popoverColor: bg,
        tableColor: bg,
        bgColor: bg,
        borderRadius: '6px',
        borderColor: border,
        dividerColor: border,
        hoverColor: bgTertiary,
        closeColor: textSecondary,
        closeColorHover: text,
        opacityDisabled: '0.5',
        fontSize: '14px',
        fontFamily:
          "'IBM Plex Sans', -apple-system, 'Segoe UI', Roboto, sans-serif",
      },
      Button: {
        textColorPrimary: '#ffffff',
        textColorHoverPrimary: '#ffffff',
        textColorFocusPrimary: '#ffffff',
        textColorPressedPrimary: '#ffffff',
        textColorTertiary: textSecondary,
        textColorHoverTertiary: text,
        textColorFocusTertiary: text,
        textColorPressedTertiary: text,
        textColorGhost: textSecondary,
        textColorGhostHover: text,
        textColorQuaternary: textSecondary,
        textColorHoverQuaternary: text,
        textColorFocusQuaternary: text,
        textColorPressedQuaternary: text,
        borderTertiary: `1px solid ${border}`,
        borderQuaternary: `1px solid ${border}`,
        colorTertiary: bg,
        colorHoverTertiary: bgTertiary,
        colorFocusTertiary: bgTertiary,
        colorPressedTertiary: bgTertiary,
        colorQuaternary: bg,
        colorHoverQuaternary: bgTertiary,
        colorFocusQuaternary: bgTertiary,
        colorPressedQuaternary: bgTertiary,
      },
      Card: {
        color: bg,
        colorModal: bg,
        colorEmbedded: bgSecondary,
        borderColor: border,
        textColor: text,
        titleTextColor: text,
        titleFontWeight: '600',
      },
      Modal: {
        color: bg,
        textColor: text,
      },
      Tag: {
        textColorPrimary: '#ffffff',
        colorPrimary: primary,
        colorHoverPrimary: primaryHover,
        borderColorPrimary: primary,
        closeColor: '#ffffff99',
        closeColorHover: '#ffffff',
        closeColorPressed: '#ffffff70',
        textColorInfo: text,
        colorInfo: bgTertiary,
        colorHoverInfo: border,
        borderColorInfo: border,
        closeColorInfo: textTertiary,
        closeColorHoverInfo: text,
      },
      Input: {
        color: bg,
        colorFocus: bg,
        colorDisabled: bgSecondary,
        borderColor: border,
        borderColorHover: primary,
        borderColorFocus: primary,
        textColor: text,
        textColorDisabled: textTertiary,
        placeholderColor: textTertiary,
        caretColor: primary,
        borderHover: `1px solid ${primary}`,
        borderFocus: `1px solid ${primary}`,
      },
      DynamicTags: {
        peers: {
          Tag: {
            textColorPrimary: '#ffffff',
          },
          Input: {
            color: bg,
            colorFocus: bg,
            borderColor: border,
            borderColorHover: primary,
            borderColorFocus: primary,
          },
        },
      },
      Divider: {
        color: border,
      },
      Empty: {
        textColor: textTertiary,
        iconColor: textTertiary,
      },
      Typography: {
        headerTextColor: text,
        textColor: textSecondary,
        textColor1: text,
        textColor2: textSecondary,
        textColor3: textTertiary,
        textColorDisabled: textTertiary,
        prefixColor: primary,
        linkColor: primary,
        linkColorHover: primaryHover,
        linkColorPressed: primary,
        headerFontWeight: '600',
        headerMargin: '0 0 0.5em',
        headerFontSize1: '32px',
        headerFontSize2: '24px',
        headerFontSize3: '19px',
        headerFontFamily1:
          "'Source Serif 4', 'Georgia', 'Times New Roman', serif",
        headerFontFamily2:
          "'Source Serif 4', 'Georgia', 'Times New Roman', serif",
        headerFontFamily3:
          "'Source Serif 4', 'Georgia', 'Times New Roman', serif",
      },
    }
  })

  return {
    themeOverrides,
  }
}
