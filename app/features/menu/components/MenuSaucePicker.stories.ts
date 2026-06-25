import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuSauce } from '@/types/menu'
import MenuSaucePicker from './MenuSaucePicker.vue'

const sauces: FullMenuSauce[] = [
  {
    id: 's1',
    name: { es: 'Honey Mustard', en: 'Honey Mustard' },
    spiceLevel: 0,
  },
  { id: 's2', name: { es: 'BBQ Suave', en: 'Mild BBQ' }, spiceLevel: 1 },
  { id: 's3', name: { es: 'Buffalo', en: 'Buffalo' }, spiceLevel: 2 },
  { id: 's4', name: { es: 'Thai Chili', en: 'Thai Chili' }, spiceLevel: 3 },
  { id: 's5', name: { es: 'Habanero', en: 'Habanero' }, spiceLevel: 4 },
  { id: 's6', name: { es: 'Ghost Pepper', en: 'Ghost Pepper' }, spiceLevel: 5 },
]

const meta = {
  title: 'Menu/MenuSaucePicker',
  component: MenuSaucePicker,
  tags: ['autodocs'],
} satisfies Meta<typeof MenuSaucePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { sauces },
}

export const SelectedState: Story = {
  args: { sauces },
  play: async ({ canvasElement }) => {
    const btns = canvasElement.querySelectorAll('button')
    if (btns[2]) (btns[2] as HTMLButtonElement).click()
  },
}

export const Mobile: Story = {
  args: { sauces },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
