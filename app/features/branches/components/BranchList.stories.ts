import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { SortedBranch } from '../types'
import BranchList from './BranchList.vue'

const BRANCHES: SortedBranch[] = [
  {
    id: 'p1',
    name: 'SUMO Polanco',
    address: 'Av. Presidente Masaryk 123, Polanco, CDMX',
    lat: '19.43260000',
    lng: '-99.19240000',
    isActive: true,
    type: 'ayce',
    schedule: {
      mon: { open: '12:00', close: '22:00' },
      tue: { open: '12:00', close: '22:00' },
      wed: { open: '12:00', close: '22:00' },
      thu: { open: '12:00', close: '22:00' },
      fri: { open: '12:00', close: '22:00' },
      sat: { open: '11:00', close: '23:00' },
      sun: { open: '11:00', close: '23:00' },
    },
    phone: '+52551234567',
    distanceKm: 0.5,
  },
  {
    id: 'b1',
    name: 'SUMO Buenavista',
    address: 'Eje 1 Norte s/n, Buenavista, Cuauhtémoc, CDMX',
    lat: '19.44980000',
    lng: '-99.15030000',
    isActive: true,
    type: 'express',
    schedule: null,
    phone: null,
    distanceKm: 3.2,
  },
  {
    id: 'c1',
    name: 'SUMO Coyoacán',
    address: 'Universidad 123, Coyoacán, CDMX',
    lat: '19.35060000',
    lng: '-99.16190000',
    isActive: true,
    type: 'ayce',
    schedule: {
      mon: { open: '13:00', close: '22:00' },
      tue: { open: '13:00', close: '22:00' },
      wed: { open: '13:00', close: '22:00' },
      thu: { open: '13:00', close: '22:00' },
      fri: { open: '13:00', close: '22:00' },
      sat: null,
      sun: null,
    },
    phone: '+52551234569',
    distanceKm: 8.7,
  },
]

const meta = {
  title: 'Branches/BranchList',
  component: BranchList,
  tags: ['autodocs'],
  argTypes: {
    highlightedId: { control: 'text' },
  },
} satisfies Meta<typeof BranchList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { branches: BRANCHES },
}

export const Empty: Story = {
  args: { branches: [] },
}

export const HighlightedCard: Story = {
  name: 'With Highlighted Card',
  args: { branches: BRANCHES, highlightedId: 'b1' },
}

export const Mobile: Story = {
  args: { branches: BRANCHES },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { branches: BRANCHES },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
