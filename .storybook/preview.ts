import type { Preview } from '@storybook/vue3'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0F0F0F' },
        { name: 'light', value: '#FFFFFF' },
        { name: 'express', value: '#2B3990' },
      ],
    },
    viewport: {
      defaultViewport: 'responsive',
    },
  },
}

export default preview
