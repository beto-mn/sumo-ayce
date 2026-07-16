import { describe, expect, it, vi } from 'vitest'

// Prevent the real mapbox-gl from loading — centralized per Gate IV.6
// (mirrors the mock used in MapView.spec.ts; no ad-hoc per-file mock shape).
vi.mock('mapbox-gl', () => ({
  default: {},
  Map: vi.fn(),
  Marker: vi.fn(),
  Popup: vi.fn(),
}))

import { makeMarkerElement, markerLogoSrc } from './mapboxAdapter'

describe('mapboxAdapter marker branding', () => {
  it('resolves the Express vertical logo for blue (Express) markers', () => {
    expect(markerLogoSrc('blue')).toBe('/brand/sumo-express-vertical.webp')
  })

  it('keeps the generic SUMO mark for orange (AYCE) markers', () => {
    expect(markerLogoSrc('orange')).toBe('/brand/sumo-vertical.svg')
  })

  it('renders an Express marker element whose img src points at the Express asset', () => {
    const el = makeMarkerElement('blue')
    const img = el.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('/brand/sumo-express-vertical.webp')
  })

  it('renders an AYCE marker element whose img src is unchanged from the generic mark', () => {
    const el = makeMarkerElement('orange')
    const img = el.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('/brand/sumo-vertical.svg')
  })

  it('produces different marker img srcs for Express vs AYCE', () => {
    const expressImg = makeMarkerElement('blue').querySelector('img')
    const ayceImg = makeMarkerElement('orange').querySelector('img')
    expect(expressImg?.getAttribute('src')).not.toBe(
      ayceImg?.getAttribute('src')
    )
  })
})
