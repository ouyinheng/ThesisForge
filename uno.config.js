import { defineConfig } from 'unocss'
import presetUno from '@unocss/preset-uno'
import presetIcons from '@unocss/preset-icons'
import presetAttributify from '@unocss/preset-attributify'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
    presetAttributify(),
  ],
  shortcuts: {
    'wh-full': 'w-full h-full',
    'f-c-c': 'flex justify-center items-center',
    'flex-col': 'flex flex-col',
    'card-border': 'border border-solid',
    'auto-bg': 'bg-white dark:bg-dark',
    'auto-bg-hover': 'hover:bg-gray-100 dark:hover:bg-gray-800',
    'auto-bg-highlight': 'bg-gray-100 dark:bg-gray-800',
  },
  theme: {
    colors: {
      primary: 'var(--color-primary)',
      dark: 'var(--color-bg-dark, #0f1117)',
      light_border: 'var(--color-border)',
      dark_border: 'var(--color-border)',
    },
  },
})
