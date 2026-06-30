import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TransactionTable from './TransactionTable.vue'

const txs = [
  {
    id: 't1',
    type: 'earn' as const,
    pointsDelta: 1,
    ticketId: 'TKT-001',
    voidedAt: null,
    createdAt: new Date().toISOString(),
    customer: { id: 'c1', name: 'María García', phone: '+52 55 1234 5678' },
    createdBy: { id: 's1', name: 'Juan Cajero' },
  },
  {
    id: 't2',
    type: 'redeem' as const,
    pointsDelta: 10,
    ticketId: 'TKT-002',
    voidedAt: null,
    createdAt: new Date().toISOString(),
    customer: { id: 'c2', name: 'Pedro López', phone: '+52 55 9876 5432' },
    createdBy: { id: 's1', name: 'Juan Cajero' },
  },
  {
    id: 't3',
    type: 'earn' as const,
    pointsDelta: 1,
    ticketId: 'TKT-003',
    voidedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    customer: { id: 'c3', name: 'Ana Torres', phone: '+52 55 5555 5555' },
    createdBy: null,
  },
]

const meta: Meta<typeof TransactionTable> = {
  title: 'Staff/TransactionTable',
  component: TransactionTable,
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'dark' } },
  args: { transactions: txs },
  argTypes: {
    transactions: {
      description: 'Array of transaction records to display in the table',
      control: { type: 'object' },
    },
    loading: {
      description:
        'Shows a loading skeleton while transactions are being fetched',
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof TransactionTable>

export const Default: Story = {}

export const WithVoided: Story = {
  args: { transactions: txs },
}

export const Empty: Story = {
  args: { transactions: [] },
}

export const Loading: Story = {
  args: { loading: true },
}

export const Responsive: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
}
