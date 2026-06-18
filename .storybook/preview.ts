import type { Preview } from '@storybook/vue3'
import '../app/assets/css/base.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'cream',
      values: [
        { name: 'cream', value: '#FFF7EC' },
        { name: 'cream2', value: '#FFE9D2' },
        { name: 'panel', value: '#FFFFFF' },
        { name: 'ink', value: '#1A1209' },
      ],
    },
    viewport: {
      viewports: {
        mobile1: {
          name: 'Mobile (360px)',
          styles: { width: '360px', height: '720px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet (880px)',
          styles: { width: '880px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop (1200px)',
          styles: { width: '1200px', height: '900px' },
          type: 'desktop',
        },
      },
      defaultViewport: 'desktop',
    },
  },
}

export default preview
