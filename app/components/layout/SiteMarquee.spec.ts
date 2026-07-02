import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ES_MARQUEE = [
  'Sushi',
  'Boneless',
  'Smash Burgers',
  'Yakimeshi',
  'Sumo Sandwich',
  'Hot Dogs',
  '$269 todos los días',
]

const EN_MARQUEE = [
  'Sushi',
  'Boneless',
  'Smash Burgers',
  'Yakimeshi',
  'Sumo Sandwich',
  'Hot Dogs',
  '$269 every day',
]

// Key-aware stub: phrases resolve ONLY for the full `home.marquee` path.
// A regression to a root-level `tm('marquee')` would yield [] and fail.
function stubMarquee(items: string[]) {
  vi.stubGlobal('useI18n', () => ({
    tm: (key: string) => (key === 'home.marquee' ? items : []),
    rt: (s: string) => s,
  }))
}

const stubs = {
  UiMarquee: {
    props: ['tone'],
    template: '<div class="marquee-stub" :data-tone="tone"><slot /></div>',
  },
}

async function mountMarquee(items = ES_MARQUEE) {
  stubMarquee(items)
  const SiteMarquee = (await import('./SiteMarquee.vue')).default
  return mount(SiteMarquee, { global: { stubs } })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('SiteMarquee', () => {
  it('uses the dark ink tone', async () => {
    expect(
      (await mountMarquee()).find('.marquee-stub').attributes('data-tone')
    ).toBe('ink')
  })

  it('renders the seven Spanish phrases in contract order', async () => {
    const wrapper = await mountMarquee(ES_MARQUEE)
    const phrases = wrapper
      .findAll('span')
      .map(s => s.text())
      .filter(text => text !== '✺')
    expect(phrases).toEqual(ES_MARQUEE)
  })

  it('localizes only the last phrase in English (product names identical)', async () => {
    const wrapper = await mountMarquee(EN_MARQUEE)
    const phrases = wrapper
      .findAll('span')
      .map(s => s.text())
      .filter(text => text !== '✺')
    expect(phrases).toEqual(EN_MARQUEE)
    expect(phrases[6]).toBe('$269 every day')
  })

  it('separates phrases with an orange star', async () => {
    const stars = (await mountMarquee())
      .findAll('span')
      .filter(s => s.text() === '✺')
    expect(stars.length).toBeGreaterThan(0)
    expect(stars[0]?.classes()).toContain('text-orange')
    expect(stars[0]?.attributes('aria-hidden')).toBe('true')
  })
})
