import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { PickerOption } from '@/features/menu/types'
import MenuSaucePicker from './MenuSaucePicker.vue'

const sauceOptions: PickerOption[] = [
  { id: 's1', label: 'Honey Mustard', spiceLevel: 0 },
  { id: 's2', label: 'BBQ Suave', spiceLevel: 1 },
  { id: 's3', label: 'Buffalo', spiceLevel: 2 },
  { id: 's4', label: 'Thai Chili', spiceLevel: 3 },
  { id: 's5', label: 'Habanero', spiceLevel: 4 },
]

const flavorOptions: PickerOption[] = [
  { id: 'ron', label: 'Ron' },
  { id: 'tequila', label: 'Tequila' },
  { id: 'vodka', label: 'Vodka' },
  { id: 'whisky', label: 'Whisky' },
  { id: 'new_mix', label: 'New Mix' },
]

const meta = {
  title: 'Menu/MenuSaucePicker',
  component: MenuSaucePicker,
  tags: ['autodocs'],
  args: {
    options: flavorOptions,
    pickerLabel: 'Elige tu base',
    sortBySpice: false,
  },
  argTypes: {
    options: {
      description: 'Single-active choices (Wings sauces OR Vaso Sumo flavours)',
      control: { type: 'object' },
    },
    pickerLabel: {
      description:
        'Heading above the choices ("Elige tu salsa" / "Elige tu base")',
      control: { type: 'text' },
    },
    sortBySpice: {
      description:
        'Sort by spice level ascending and show the chili indicator (sauces)',
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof MenuSaucePicker>

export default meta
type Story = StoryObj<typeof meta>

/** Vaso Sumo flavour selector — reuses the picker for a base choice. */
export const FlavorMode: Story = {}

/** Wings sauce selector — sorted by spice with a chili indicator. */
export const SauceMode: Story = {
  args: {
    options: sauceOptions,
    pickerLabel: 'Elige tu salsa',
    sortBySpice: true,
  },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
