import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuSauce } from '@/types/menu'
import MenuSaucePicker from './MenuSaucePicker.vue'

const sauces: FullMenuSauce[] = [
  {
    id: 's1',
    name: { es: 'Honey Mustard', en: 'Honey Mustard' },
    imageUrl: null,
    spiceLevel: 0,
  },
  {
    id: 's2',
    name: { es: 'BBQ Suave', en: 'Mild BBQ' },
    imageUrl: null,
    spiceLevel: 1,
  },
  {
    id: 's3',
    name: { es: 'Buffalo', en: 'Buffalo' },
    imageUrl: null,
    spiceLevel: 2,
  },
  {
    id: 's4',
    name: { es: 'Thai Chili', en: 'Thai Chili' },
    imageUrl: null,
    spiceLevel: 3,
  },
  {
    id: 's5',
    name: { es: 'Habanero', en: 'Habanero' },
    imageUrl: null,
    spiceLevel: 4,
  },
  {
    id: 's6',
    name: { es: 'Ghost Pepper', en: 'Ghost Pepper' },
    imageUrl: null,
    spiceLevel: 5,
  },
]

const meta = {
  title: 'Menu/MenuSaucePicker',
  component: MenuSaucePicker,
  tags: ['autodocs'],
  argTypes: {
    sauces: {
      description:
        'Array of sauce objects with id, localized name, imageUrl, and spiceLevel (0-5)',
      control: { type: 'object' },
    },
  },
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

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  args: { sauces },
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  args: { sauces },
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  args: { sauces },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
