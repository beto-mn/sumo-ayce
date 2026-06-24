import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { SortedBranch } from '../types'
import BranchCard from './BranchCard.vue'

const AYCE_BRANCH: SortedBranch = {
  id: 'p1',
  name: 'SUMO Polanco',
  address: 'Av. Presidente Masaryk 123, Polanco, Miguel Hidalgo, CDMX',
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
}

const EXPRESS_BRANCH: SortedBranch = {
  id: 'b1',
  name: 'SUMO Buenavista',
  address: 'Eje 1 Norte s/n, Buenavista, Cuauhtémoc, CDMX',
  lat: '19.44980000',
  lng: '-99.15030000',
  isActive: true,
  type: 'express',
  schedule: {
    mon: { open: '13:00', close: '22:00' },
    tue: { open: '13:00', close: '22:00' },
    wed: { open: '13:00', close: '22:00' },
    thu: { open: '13:00', close: '22:00' },
    fri: { open: '13:00', close: '22:00' },
    sat: null,
    sun: null,
  },
  phone: '+52551234568',
}

const meta = {
  title: 'Branches/BranchCard',
  component: BranchCard,
  tags: ['autodocs'],
  argTypes: {
    highlighted: { control: 'boolean' },
  },
} satisfies Meta<typeof BranchCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    branch: AYCE_BRANCH,
  },
}

export const AYCECard: Story = {
  name: 'AYCE Card',
  args: { branch: AYCE_BRANCH },
}

export const ExpressCard: Story = {
  name: 'Express Card',
  args: { branch: EXPRESS_BRANCH },
}

export const WithDistance: Story = {
  name: 'With Distance',
  args: { branch: { ...AYCE_BRANCH, distanceKm: 1.23 } },
}

export const WithoutDistance: Story = {
  name: 'Without Distance',
  args: { branch: AYCE_BRANCH },
}

export const WithSchedule: Story = {
  name: 'With Full Schedule',
  args: {
    branch: {
      ...AYCE_BRANCH,
      schedule: {
        mon: { open: '12:00', close: '22:00' },
        tue: { open: '12:00', close: '22:00' },
        wed: { open: '12:00', close: '22:00' },
        thu: { open: '12:00', close: '22:00' },
        fri: { open: '12:00', close: '22:00' },
        sat: { open: '11:00', close: '23:00' },
        sun: { open: '11:00', close: '23:00' },
      },
    },
  },
}

export const WithoutSchedule: Story = {
  name: 'Without Schedule',
  args: { branch: { ...AYCE_BRANCH, schedule: null } },
}

export const PhoneNull: Story = {
  name: 'No Phone (Call hidden)',
  args: { branch: { ...AYCE_BRANCH, phone: null } },
}

export const Highlighted: Story = {
  name: 'Highlighted',
  args: { branch: { ...AYCE_BRANCH, distanceKm: 0.5 }, highlighted: true },
}

export const Mobile: Story = {
  args: { branch: { ...AYCE_BRANCH, distanceKm: 1.2 } },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { branch: { ...AYCE_BRANCH, distanceKm: 1.2 } },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
