import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BranchSearch from './BranchSearch.vue'

const meta = {
  title: 'Branches/BranchSearch',
  component: BranchSearch,
  tags: ['autodocs'],
  argTypes: {
    geoState: { control: 'object' },
    cpState: { control: 'object' },
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
