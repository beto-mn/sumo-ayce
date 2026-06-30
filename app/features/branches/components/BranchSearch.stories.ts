import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BranchSearch from './BranchSearch.vue'

const meta = {
  title: 'Branches/BranchSearch',
  component: BranchSearch,
  tags: ['autodocs'],
  argTypes: {
    geoState: {
      description:
        'Geolocation state object with status (idle|loading|error|unsupported), errorMessage, and coordinates',
      control: { type: 'object' },
    },
    cpState: {
      description:
        'Postal code input state object with value, status, and optional errorMessage',
      control: { type: 'object' },
    },
  },
} satisfies Meta<typeof BranchSearch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    geoState: {
      status: 'idle',
      errorMessage: null,
      userLat: null,
      userLng: null,
    },
    cpState: { value: '', status: 'idle', errorMessage: null },
  },
}

export const Loading: Story = {
  args: {
    geoState: {
      status: 'loading',
      errorMessage: null,
      userLat: null,
      userLng: null,
    },
    cpState: { value: '', status: 'idle', errorMessage: null },
  },
}

export const GeoErrorWithCp: Story = {
  name: 'Geo Error + CP Input',
  args: {
    geoState: {
      status: 'error',
      errorMessage: 'branches.search.geoError',
      userLat: null,
      userLng: null,
    },
    cpState: { value: '', status: 'idle', errorMessage: null },
  },
}

export const CpError: Story = {
  name: 'CP Error',
  args: {
    geoState: {
      status: 'error',
      errorMessage: 'branches.search.geoError',
      userLat: null,
      userLng: null,
    },
    cpState: {
      value: '99999',
      status: 'error',
      errorMessage: 'branches.search.cpError',
    },
  },
}

export const Unsupported: Story = {
  name: 'Geo Unsupported (CP Only)',
  args: {
    geoState: {
      status: 'unsupported',
      errorMessage: null,
      userLat: null,
      userLng: null,
    },
    cpState: { value: '', status: 'idle', errorMessage: null },
  },
}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  args: {
    geoState: {
      status: 'idle',
      errorMessage: null,
      userLat: null,
      userLng: null,
    },
    cpState: { value: '', status: 'idle', errorMessage: null },
  },
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  args: {
    geoState: {
      status: 'idle',
      errorMessage: null,
      userLat: null,
      userLng: null,
    },
    cpState: { value: '', status: 'idle', errorMessage: null },
  },
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  args: {
    geoState: {
      status: 'idle',
      errorMessage: null,
      userLat: null,
      userLng: null,
    },
    cpState: { value: '', status: 'idle', errorMessage: null },
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: {
    geoState: {
      status: 'idle',
      errorMessage: null,
      userLat: null,
      userLng: null,
    },
    cpState: { value: '', status: 'idle', errorMessage: null },
  },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
