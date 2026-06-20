import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

// Key-aware stub: phrases resolve ONLY for the full `home.marquee` path.
// A regression to a root-level `tm('marquee')` would yield [] and fail.
vi.stubGlobal('useI18n', () => ({
  tm: (key: string) =>
    key === 'home.marquee' ? ['Sushi ilimitado', 'Smash burgers'] : [],
  rt: (s: string) => s,
}))

import SiteMarquee from './SiteMarquee.vue'

const stubs = {
  UiMarquee: {
    props: ['tone'],
    template: '<div class="marquee-stub" :data-tone="tone"><slot /></div>',
  },
}

function mountMarquee() {
  return mount(SiteMarquee, { global: { stubs } })
}

describe('SiteMarquee', () => {
  it('uses the dark ink tone', () => {
    expect(mountMarquee().find('.marquee-stub').attributes('data-tone')).toBe(
      'ink'
    )
  })

  it('renders every i18n phrase', () => {
    const text = mountMarquee().text()
    expect(text).toContain('Sushi ilimitado')
    expect(text).toContain('Smash burgers')
  })

  it('separates phrases with an orange star', () => {
    const stars = mountMarquee()
      .findAll('span')
      .filter(s => s.text() === '✺')
    expect(stars.length).toBeGreaterThan(0)
    expect(stars[0]?.classes()).toContain('text-orange')
    expect(stars[0]?.attributes('aria-hidden')).toBe('true')
  })
})
