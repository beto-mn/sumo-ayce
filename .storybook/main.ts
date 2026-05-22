import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: ['../app/components/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
}

export default config
