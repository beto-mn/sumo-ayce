import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/vue3-vite'
import vue from '@vitejs/plugin-vue'

const config: StorybookConfig = {
  stories: [
    '../app/**/*.stories.@(ts|tsx)',
    '../app/components/ui/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  viteFinal: async config => {
    const plugins = config.plugins ?? []
    plugins.push(vue())
    config.plugins = plugins
    config.resolve ??= {}
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string> | undefined),
      '@/components': fileURLToPath(
        new URL('../app/components', import.meta.url)
      ),
      '@/composables': fileURLToPath(
        new URL('../app/composables', import.meta.url)
      ),
      '@/layouts': fileURLToPath(new URL('../app/layouts', import.meta.url)),
      '@/utils': fileURLToPath(new URL('../app/utils', import.meta.url)),
      '@/types': fileURLToPath(new URL('../types', import.meta.url)),
    }
    return config
  },
}

export default config
