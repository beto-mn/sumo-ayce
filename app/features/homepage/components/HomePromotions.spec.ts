import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { Promotion } from '@/types/content'
import HomePromotions from './HomePromotions.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))
vi.stubGlobal('useLocalePath', () => (path: string) => path)

const stubs = {
  UiPromotionCard: {
    name: 'UiPromotionCard',
    props: ['promotion'],
    template: '<div class="promo-stub" />',
  },
  UiKicker: { template: '<span><slot /></span>' },
  UiButton: { template: '<button><slot /></button>' },
  UiLightbox: {
    props: ['open', 'src', 'alt'],
    template: '<div class="lightbox-stub" :data-open="open" />',
  },
  NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
}

function makePromo(id: string, overrides: Partial<Promotion> = {}): Promotion {
  return {
    id,
    badge: { es: 'b', en: 'b' },
    title: { es: 't', en: 't' },
    description: { es: 'd', en: 'd' },
    validity: { es: 'v', en: 'v' },
    color: 'orange',
    type: 'ayce',
    active: true,
    publishedAt: '2026-06-10T00:00:00Z',
    imageUrl: null,
    ...overrides,
  }
}

function mountSection(promotions: Promotion[]) {
  return mount(HomePromotions, { props: { promotions }, global: { stubs } })
}

describe('HomePromotions', () => {
  it('renders one PromotionCard per promotion', () => {
    const wrapper = mountSection([
      makePromo('1'),
      makePromo('2'),
      makePromo('3'),
    ])
    expect(wrapper.findAll('.promo-stub')).toHaveLength(3)
  })

  it('renders nothing when there are no promotions (section hides)', () => {
    const wrapper = mountSection([])
    expect(wrapper.find('section').exists()).toBe(false)
    expect(wrapper.findAll('.promo-stub')).toHaveLength(0)
  })

  it('renders fewer than 3 without padding', () => {
    expect(mountSection([makePromo('1')]).findAll('.promo-stub')).toHaveLength(
      1
    )
  })

  it('CTA link points to /promotions', () => {
    const wrapper = mountSection([makePromo('1')])
    const link = wrapper.findComponent(stubs.NuxtLink)
    expect(link.props('to')).toBe('/promotions')
  })

  it('keeps the lightbox closed until a card emits open-lightbox, then opens it', async () => {
    const wrapper = mountSection([makePromo('1', { imageUrl: '/flyer.jpg' })])
    const lightbox = wrapper.find('.lightbox-stub')
    expect(lightbox.attributes('data-open')).toBe('false')

    wrapper
      .findComponent({ name: 'UiPromotionCard' })
      .vm.$emit('open-lightbox', '/flyer.jpg')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.lightbox-stub').attributes('data-open')).toBe('true')
  })
})
