import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FeaturedDish } from '@/types/content'
import DishCard from './DishCard.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string, params?: Record<string, unknown>) =>
    params ? `${k}:${JSON.stringify(params)}` : k,
  locale: { value: 'es' },
}))
vi.stubGlobal('useLocalePath', () => (path: string) => path)

const stubs = {
  UiCard: { template: '<div class="card-stub"><slot /></div>' },
  UiSticker: { template: '<span class="sticker-stub"><slot /></span>' },
  NuxtLink: {
    props: ['to', 'ariaLabel'],
    template: '<a :href="to" :aria-label="ariaLabel"><slot /></a>',
  },
}

function makeDish(overrides: Partial<FeaturedDish> = {}): FeaturedDish {
  return {
    id: 'd1',
    name: 'Salmón Nigiri',
    description: { es: 'Salmón fresco.', en: 'Fresh salmon.' },
    imageUrl: 'https://cdn.test/nigiri.webp',
    badge: null,
    category: 'cold_rolls',
    locationType: 'ayce',
    includedInAyce: true,
    ...overrides,
  }
}

function mountCard(dish: FeaturedDish) {
  return mount(DishCard, { props: { dish }, global: { stubs } })
}

describe('DishCard', () => {
  it('renders the dish name', () => {
    expect(mountCard(makeDish()).text()).toContain('Salmón Nigiri')
  })

  it('renders the dish image when imageUrl is present', () => {
    const img = mountCard(makeDish()).find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://cdn.test/nigiri.webp')
  })

  it('renders a neutral SUMO placeholder (no img) when imageUrl is null', () => {
    const wrapper = mountCard(makeDish({ imageUrl: null }))
    expect(wrapper.find('img').exists()).toBe(false)
    // Placeholder is the aria-hidden SUMO wordmark block.
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('SUMO')
  })

  it('renders the badge sticker when a badge is present', () => {
    const wrapper = mountCard(makeDish({ badge: 'Top' }))
    expect(wrapper.find('.sticker-stub').text()).toContain('Top')
  })

  it('does not render a badge sticker when badge is null', () => {
    expect(
      mountCard(makeDish({ badge: null }))
        .find('.sticker-stub')
        .exists()
    ).toBe(false)
  })

  // ── Equal-height rail cards ──────────────────────────────────────────────────
  it('fills the row height (h-full) so rail cards equalize to the tallest', () => {
    // Attrs fall through onto the card root; h-full lets it match the flex row.
    expect(mountCard(makeDish()).find('.card-stub').classes()).toContain(
      'h-full'
    )
  })

  it('clamps the description to two lines (line-clamp-2) yet keeps flex-1', () => {
    const p = mountCard(makeDish()).find('p')
    expect(p.classes()).toContain('flex-1')
    expect(p.classes()).toContain('line-clamp-2')
  })

  // ── Clickable deep link to /menu (data-driven from DB fields) ────────────────
  it('links an AYCE buffet dish to type=ayce&modality=buffet&category', () => {
    const link = mountCard(
      makeDish({
        locationType: 'ayce',
        includedInAyce: true,
        category: 'cold_rolls',
      })
    ).find('a')
    expect(link.attributes('href')).toBe(
      '/menu?type=ayce&modality=buffet&category=cold_rolls'
    )
  })

  it('links an AYCE à-la-carte dish (includedInAyce=false) to modality=carta', () => {
    const link = mountCard(
      makeDish({
        locationType: 'ayce',
        includedInAyce: false,
        category: 'ramen',
      })
    ).find('a')
    expect(link.attributes('href')).toBe(
      '/menu?type=ayce&modality=carta&category=ramen'
    )
  })

  it('treats locationType="both" as ayce for the deep link', () => {
    const link = mountCard(
      makeDish({
        locationType: 'both',
        includedInAyce: true,
        category: 'appetizers',
      })
    ).find('a')
    expect(link.attributes('href')).toBe(
      '/menu?type=ayce&modality=buffet&category=appetizers'
    )
  })

  it('links an Express dish to type=express&category (no modality)', () => {
    const link = mountCard(
      makeDish({
        locationType: 'express',
        includedInAyce: false,
        category: 'burritos',
      })
    ).find('a')
    expect(link.attributes('href')).toBe('/menu?type=express&category=burritos')
  })

  it('gives the whole-card link an accessible name from the dish', () => {
    const link = mountCard(makeDish({ name: 'Salmón Nigiri' })).find('a')
    expect(link.attributes('aria-label')).toContain('home.featured.openLabel')
    expect(link.attributes('aria-label')).toContain('Salmón Nigiri')
  })
})
