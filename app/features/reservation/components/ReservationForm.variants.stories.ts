import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Branch } from '../types'
import ReservationFormComponent from './ReservationForm.vue'

const AYCE_BRANCH: Branch = {
  id: 'branch-uuid-1',
  name: 'SUMO Polanco',
  type: 'ayce',
  schedule: {
    mon: { open: '13:00', close: '22:00' },
    tue: { open: '13:00', close: '22:00' },
    wed: { open: '13:00', close: '22:00' },
    thu: { open: '13:00', close: '22:00' },
    fri: { open: '13:00', close: '22:00' },
    sat: { open: '11:00', close: '23:00' },
    sun: { open: '11:00', close: '23:00' },
  },
}

const BRANCHES: Branch[] = [AYCE_BRANCH]

const meta = {
  title: 'Reservation/ReservationForm',
  component: ReservationFormComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof ReservationFormComponent>

export default meta
type Story = StoryObj<typeof meta>

/** Fills the form with a valid future reservation and clicks submit. */
async function fillAndSubmit(canvasElement: HTMLElement): Promise<void> {
  const future = new Date()
  future.setDate(future.getDate() + 5)
  const yyyy = future.getFullYear()
  const mm = String(future.getMonth() + 1).padStart(2, '0')
  const dd = String(future.getDate()).padStart(2, '0')

  const dateInput = canvasElement.querySelector<HTMLInputElement>(
    '[data-testid="date-input"]'
  )
  if (dateInput) {
    dateInput.value = `${yyyy}-${mm}-${dd}`
    dateInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  await new Promise(resolve => setTimeout(resolve, 50))

  const timeInput = canvasElement.querySelector<HTMLInputElement>(
    '[data-testid="time-input"]'
  )
  if (timeInput) {
    timeInput.value = '14:00'
    timeInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const nameInput = canvasElement.querySelector<HTMLInputElement>(
    '[data-testid="name-input"]'
  )
  if (nameInput) {
    nameInput.value = 'Ana García'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const partySelect = canvasElement.querySelector<HTMLSelectElement>(
    '[data-testid="party-size-select"]'
  )
  if (partySelect) {
    partySelect.value = '4'
    partySelect.dispatchEvent(new Event('change', { bubbles: true }))
  }

  const phoneInput = canvasElement.querySelector<HTMLInputElement>(
    '[data-testid="phone-input"]'
  )
  if (phoneInput) {
    phoneInput.value = '5512345678'
    phoneInput.dispatchEvent(new Event('input', { bubbles: true }))
  }

  const submitBtn = canvasElement.querySelector<HTMLButtonElement>(
    '[data-testid="submit-button"]'
  )
  submitBtn?.click()
}

// Stub $fetch to never resolve so the form stays in "submitting" state.
export const Loading: Story = {
  name: 'Loading — submitting state',
  args: {
    branches: BRANCHES,
    initialBranchId: 'branch-uuid-1',
    initialTipo: 'ayce',
  },
  loaders: [
    async () => {
      const globalScope = globalThis as Record<string, unknown>
      globalScope.$fetch = () => new Promise(() => {})
      return {}
    },
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await fillAndSubmit(canvasElement)
  },
}

// Stub $fetch to reject immediately so the form shows the API error banner.
export const WithApiError: Story = {
  name: 'With API Error — error banner visible',
  args: {
    branches: BRANCHES,
    initialBranchId: 'branch-uuid-1',
    initialTipo: 'ayce',
  },
  loaders: [
    async () => {
      const globalScope = globalThis as Record<string, unknown>
      globalScope.$fetch = () =>
        Promise.reject(new Error('Internal Server Error'))
      return {}
    },
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await fillAndSubmit(canvasElement)
    await new Promise(resolve => setTimeout(resolve, 100))
  },
}
