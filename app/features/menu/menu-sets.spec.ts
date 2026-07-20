import { describe, expect, it } from 'vitest'
import {
  AYCE_BUFFET_SET,
  AYCE_CARTA_SET,
  DRINKS_SET,
  EXPRESS_SET,
  filterAvailableKeys,
  getCuratedSet,
  getDefaultKey,
  KIDS_SET,
  resolveActiveKey,
} from '@/features/menu/menu-sets'

describe('menu curated sets', () => {
  it('AYCE buffet lists exactly 8 categories in the confirmed order', () => {
    expect(AYCE_BUFFET_SET).toEqual([
      'appetizers',
      'burgers',
      'sandwiches',
      'hot_dogs',
      'cold_rolls',
      'hot_rolls',
      'sweet_rolls',
      'wings',
    ])
  })

  it('AYCE carta lists exactly 11 categories in the confirmed order (no kids)', () => {
    // burgers/hot_dogs/cold_rolls/hot_rolls reference the à la carte-only
    // `_carta` category-key variants (feature 029, Part C — category split).
    expect(AYCE_CARTA_SET).toEqual([
      'appetizers',
      'salads',
      'rice',
      'ramen',
      'burgers_carta',
      'hot_dogs_carta',
      'cold_rolls_carta',
      'hot_rolls_carta',
      'sweet_rolls',
      'desserts',
      'wings',
    ])
  })

  it('Express lists exactly 8 categories in the confirmed order (no kids)', () => {
    expect(EXPRESS_SET).toEqual([
      'appetizers',
      'burgers',
      'burritos',
      'hot_dogs',
      'cold_rolls',
      'hot_rolls',
      'sweet_rolls',
      'wings',
    ])
  })

  it('excludes kids from every food set (kids is a standalone primary type)', () => {
    expect(AYCE_BUFFET_SET).not.toContain('kids')
    expect(AYCE_CARTA_SET).not.toContain('kids')
    expect(EXPRESS_SET).not.toContain('kids')
  })

  it('Kids is a single-entry set (a flat list, not a chip row)', () => {
    expect(KIDS_SET).toEqual(['kids'])
  })

  it('Bebidas lists exactly 6 drink groups in the confirmed order', () => {
    expect(DRINKS_SET).toEqual([
      'jumbo_cocktails',
      'cantaritos_sumo_cups',
      'sodas',
      'beers',
      'destilados',
      'coffee_digestifs',
    ])
  })

  it('encodes the three intentional asymmetries', () => {
    expect(AYCE_BUFFET_SET).toContain('sandwiches')
    expect(AYCE_BUFFET_SET).not.toContain('burritos')
    expect(EXPRESS_SET).toContain('burritos')
    expect(EXPRESS_SET).not.toContain('sandwiches')
    expect(AYCE_CARTA_SET).not.toContain('sandwiches')
    expect(AYCE_CARTA_SET).not.toContain('burritos')
  })

  it('defaults to Entradas for food, Coctelería Jumbo for drinks, kids for Kids', () => {
    expect(getDefaultKey('ayce')).toBe('appetizers')
    expect(getDefaultKey('express')).toBe('appetizers')
    expect(getDefaultKey('drinks')).toBe('jumbo_cocktails')
    expect(getDefaultKey('kids')).toBe('kids')
  })

  it('getCuratedSet returns the matching set for each selection/modality', () => {
    expect(getCuratedSet('ayce', 'buffet')).toBe(AYCE_BUFFET_SET)
    expect(getCuratedSet('ayce', 'carta')).toBe(AYCE_CARTA_SET)
    expect(getCuratedSet('express', 'buffet')).toBe(EXPRESS_SET)
    expect(getCuratedSet('drinks', 'buffet')).toBe(DRINKS_SET)
    expect(getCuratedSet('kids', 'buffet')).toBe(KIDS_SET)
  })

  it('resolveActiveKey resolves the kids view to the kids key', () => {
    expect(resolveActiveKey('kids', 'buffet', 'kids')).toBe('kids')
    expect(resolveActiveKey('kids', 'buffet', 'burgers')).toBe('kids')
    expect(resolveActiveKey('kids', 'buffet', null)).toBe('kids')
  })

  it('resolveActiveKey keeps a valid in-set key', () => {
    expect(resolveActiveKey('ayce', 'buffet', 'sandwiches')).toBe('sandwiches')
    expect(resolveActiveKey('drinks', 'buffet', 'destilados')).toBe(
      'destilados'
    )
  })

  it('resolveActiveKey falls back to the default for an out-of-set key', () => {
    expect(resolveActiveKey('express', 'buffet', 'sandwiches')).toBe(
      'appetizers'
    )
    expect(resolveActiveKey('ayce', 'carta', 'burritos')).toBe('appetizers')
    expect(resolveActiveKey('drinks', 'buffet', 'burgers')).toBe(
      'jumbo_cocktails'
    )
  })

  it('resolveActiveKey falls back to the default when no key is provided', () => {
    expect(resolveActiveKey('ayce', 'buffet', null)).toBe('appetizers')
    expect(resolveActiveKey('drinks', 'buffet', undefined)).toBe(
      'jumbo_cocktails'
    )
  })
})

// ─── filterAvailableKeys (feature 023 — menu chip / DB drift guard) ──────────

describe('filterAvailableKeys', () => {
  it('preserves curated order for keys present in availableKeys', () => {
    const availableKeys = new Set(['wings', 'appetizers', 'burgers'])
    expect(filterAvailableKeys(AYCE_BUFFET_SET, availableKeys)).toEqual([
      'appetizers',
      'burgers',
      'wings',
    ])
  })

  it('drops keys absent from availableKeys', () => {
    const availableKeys = new Set(['appetizers', 'burgers'])
    expect(filterAvailableKeys(AYCE_BUFFET_SET, availableKeys)).toEqual([
      'appetizers',
      'burgers',
    ])
  })

  it('never adds a key not already in the input keys', () => {
    const availableKeys = new Set([
      'appetizers',
      'burgers',
      'salads', // not a member of AYCE_BUFFET_SET — must not appear in output
    ])
    const result = filterAvailableKeys(AYCE_BUFFET_SET, availableKeys)
    expect(result).not.toContain('salads')
    for (const key of result) expect(AYCE_BUFFET_SET).toContain(key)
  })

  it('returns an empty array when availableKeys is empty', () => {
    expect(filterAvailableKeys(AYCE_BUFFET_SET, new Set())).toEqual([])
  })

  it('returns the full input when all keys are available (no-op, no regression)', () => {
    expect(
      filterAvailableKeys(AYCE_BUFFET_SET, new Set(AYCE_BUFFET_SET))
    ).toEqual(AYCE_BUFFET_SET)
  })
})

describe('resolveActiveKey — availableKeys drift guard (feature 023)', () => {
  it('keeps a requested key that is curated AND available', () => {
    const availableKeys = new Set(AYCE_BUFFET_SET)
    expect(
      resolveActiveKey('ayce', 'buffet', 'sandwiches', availableKeys)
    ).toBe('sandwiches')
  })

  it('falls back to the default when the requested key is curated but no longer available', () => {
    const availableKeys = new Set(
      AYCE_BUFFET_SET.filter(key => key !== 'sandwiches')
    )
    expect(
      resolveActiveKey('ayce', 'buffet', 'sandwiches', availableKeys)
    ).toBe('appetizers')
  })

  it('falls back to the default drink group when it is missing from availableKeys', () => {
    const availableKeys = new Set(
      DRINKS_SET.filter(key => key !== 'destilados')
    )
    expect(
      resolveActiveKey('drinks', 'buffet', 'destilados', availableKeys)
    ).toBe('jumbo_cocktails')
  })

  it('behaves exactly as before when availableKeys is omitted (no regression — FR-012)', () => {
    expect(resolveActiveKey('ayce', 'buffet', 'sandwiches')).toBe('sandwiches')
    expect(resolveActiveKey('express', 'buffet', 'sandwiches')).toBe(
      'appetizers'
    )
  })
})
