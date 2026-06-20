import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { Promotion } from '@/types/content'
import PromoCard from './PromoCard.vue'

const localeRef = { value: 'es' }
vi.stubGlobal('useI18n', () => ({ t: (k: string) => k, locale: localeRef }))

const stubs = {
  UiCard: {
    props: ['accent'],
    template: '<div class="card-stub" :data-accent="accent"><slot /></div>',
  },
  UiSticker: {
    props: ['tone', 'rotate'],
    template: '<span class="sticker-stub" :data-tone="tone"><slot /></span>',
  },
}

function makePromo(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: 'p1',
    badge: { es: '2x1', en: '2for1' },
    title: { es: 'Martes 2x1', en: 'Tuesday 2for1' },
    description: { es: 'Trae a un amigo.', en: 'Bring a friend.' },
    validity: { es: 'Solo martes', en: 'Tuesdays only' },
    color: 'orange',
    type: 'ayce',
    active: true,
    publishedAt: '2026-06-10T00:00:00Z',
    imageUrl: null,
    ...overrides,
  }
}

function mountCard(promo: Promotion) {
  return mount(PromoCard, { props: { promo }, global: { stubs } })
}

describe('PromoCard', () => {
  it('renders the Spanish title and badge by default', () => {
    const text = mountCard(makePromo()).text()
    expect(text).toContain('Martes 2x1')
    expect(text).toContain('2x1')
  })

  it('renders the English fields when locale is en', () => {
    localeRef.value = 'en'
    const text = mountCard(makePromo()).text()
    expect(text).toContain('Tuesday 2for1')
    localeRef.value = 'es'
  })

  it('falls back to the Spanish string when the English value is empty', () => {
    localeRef.value = 'en'
    const promo = makePromo({ title: { es: 'Solo ES', en: '' } })
    expect(mountCard(promo).text()).toContain('Solo ES')
    localeRef.value = 'es'
  })

  it('keeps the card accent express for express promotions', () => {
    const card = mountCard(makePromo({ type: 'express', color: 'blue' }))
    expect(card.find('.card-stub').attributes('data-accent')).toBe('express')
  })

  it('keeps the card accent ayce for non-express promotions', () => {
    const card = mountCard(makePromo({ type: 'ayce', color: 'pink' }))
    expect(card.find('.card-stub').attributes('data-accent')).not.toBe(
      'express'
    )
  })

  it('colors the badge from acf.color (orange/pink/blue/green)', () => {
    const tone = (promo: Promotion) =>
      mountCard(promo).find('.sticker-stub').attributes('data-tone')
    expect(tone(makePromo({ color: 'orange' }))).toBe('orange')
    expect(tone(makePromo({ color: 'pink' }))).toBe('pink')
    expect(tone(makePromo({ color: 'blue' }))).toBe('blue')
    expect(tone(makePromo({ color: 'green' }))).toBe('green')
  })

  it('uses acf.color for the badge even on express promotions', () => {
    const tone = mountCard(makePromo({ type: 'express', color: 'green' }))
      .find('.sticker-stub')
      .attributes('data-tone')
    expect(tone).toBe('green')
  })

  it('renders a blue type bar for express promotions', () => {
    const bar = mountCard(makePromo({ type: 'express' })).find('.rounded-full')
    expect(bar.exists()).toBe(true)
    expect(bar.classes()).toContain('bg-blue')
  })

  it('renders an orange type bar for ayce promotions', () => {
    const bar = mountCard(makePromo({ type: 'ayce' })).find('.rounded-full')
    expect(bar.exists()).toBe(true)
    expect(bar.classes()).toContain('bg-orange')
  })

  it('renders an ink type bar for `all` promotions', () => {
    const bar = mountCard(makePromo({ type: 'all' })).find('.rounded-full')
    expect(bar.exists()).toBe(true)
    expect(bar.classes()).toContain('bg-ink')
  })

  it('never renders an inline image', () => {
    const withImage = mountCard(makePromo({ imageUrl: '/promo.jpg' }))
    expect(withImage.find('img').exists()).toBe(false)
    const withoutImage = mountCard(makePromo({ imageUrl: null }))
    expect(withoutImage.find('img').exists()).toBe(false)
  })

  it('is interactive and emits open with the flyer payload when imageUrl is set', async () => {
    const card = mountCard(
      makePromo({ imageUrl: '/promo.jpg', title: { es: 'Flyer ES', en: 'x' } })
    )
    const root = card.find('.card-stub')
    expect(root.attributes('role')).toBe('button')
    expect(root.attributes('tabindex')).toBe('0')
    await root.trigger('click')
    expect(card.emitted('open')).toEqual([
      [{ src: '/promo.jpg', alt: 'Flyer ES' }],
    ])
  })

  it('opens on Enter and Space when interactive', async () => {
    const card = mountCard(makePromo({ imageUrl: '/promo.jpg' }))
    const root = card.find('.card-stub')
    await root.trigger('keydown', { key: 'Enter' })
    await root.trigger('keydown', { key: ' ' })
    expect(card.emitted('open')).toHaveLength(2)
  })

  it('is a plain non-interactive card when imageUrl is null', async () => {
    const card = mountCard(makePromo({ imageUrl: null }))
    const root = card.find('.card-stub')
    expect(root.attributes('role')).toBeUndefined()
    expect(root.attributes('tabindex')).toBeUndefined()
    await root.trigger('click')
    expect(card.emitted('open')).toBeUndefined()
  })
})
