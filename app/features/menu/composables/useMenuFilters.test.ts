import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMenuFilters } from './useMenuFilters'

const mockReplace = vi.fn()
let routeQuery: Record<string, string> = { type: 'ayce', modality: 'buffet' }

vi.stubGlobal('useRouter', () => ({ replace: mockReplace }))
vi.stubGlobal('useRoute', () => ({ query: routeQuery }))

beforeEach(() => {
  mockReplace.mockClear()
  routeQuery = { type: 'ayce', modality: 'buffet' }
})

describe('useMenuFilters — default landing', () => {
  it('defaults to AYCE · buffet · Entradas (never null, no show-all)', () => {
    const { activeSelection, activeModality, activeCategory } = useMenuFilters(
      'ayce',
      'buffet'
    )
    expect(activeSelection.value).toBe('ayce')
    expect(activeModality.value).toBe('buffet')
    expect(activeCategory.value).toBe('appetizers')
  })

  it('parses type=bebidas from the URL and defaults to Coctelería Jumbo', () => {
    routeQuery = { type: 'bebidas' }
    const { activeSelection, activeCategory } = useMenuFilters('ayce', 'buffet')
    expect(activeSelection.value).toBe('drinks')
    expect(activeCategory.value).toBe('jumbo_cocktails')
  })

  it('parses type=kids from the URL and resolves the kids view', () => {
    routeQuery = { type: 'kids' }
    const { activeSelection, activeCategory, activeModality } = useMenuFilters(
      'ayce',
      'buffet'
    )
    expect(activeSelection.value).toBe('kids')
    expect(activeCategory.value).toBe('kids')
    expect(activeModality.value).toBe('buffet')
  })

  it('restores a valid deep-linked category', () => {
    routeQuery = { type: 'ayce', modality: 'buffet', category: 'sandwiches' }
    const { activeCategory } = useMenuFilters('ayce', 'buffet')
    expect(activeCategory.value).toBe('sandwiches')
  })

  it('restores a valid deep-linked carta category', () => {
    routeQuery = { type: 'ayce', modality: 'carta', category: 'ramen' }
    const { activeModality, activeCategory } = useMenuFilters('ayce', 'buffet')
    expect(activeModality.value).toBe('carta')
    expect(activeCategory.value).toBe('ramen')
  })

  it('restores a valid deep-linked express category', () => {
    routeQuery = { type: 'express', category: 'burritos' }
    const { activeSelection, activeCategory } = useMenuFilters('ayce', 'buffet')
    expect(activeSelection.value).toBe('express')
    expect(activeCategory.value).toBe('burritos')
  })

  it('restores a valid deep-linked drink group', () => {
    routeQuery = { type: 'bebidas', category: 'destilados' }
    const { activeCategory } = useMenuFilters('ayce', 'buffet')
    expect(activeCategory.value).toBe('destilados')
  })

  it('falls back to the default when category is omitted', () => {
    routeQuery = { type: 'ayce', modality: 'buffet' }
    const { activeCategory } = useMenuFilters('ayce', 'buffet')
    expect(activeCategory.value).toBe('appetizers')
  })

  it('falls back to the default for an out-of-set deep-link key (no empty view)', () => {
    // Sándwiches is buffet-only; opening it under Express must resolve to default.
    routeQuery = { type: 'express', category: 'sandwiches' }
    const { activeCategory } = useMenuFilters('ayce', 'buffet')
    expect(activeCategory.value).toBe('appetizers')
  })

  it('ignores modality for express/bebidas', () => {
    routeQuery = { type: 'express', modality: 'carta' }
    const { activeModality } = useMenuFilters('ayce', 'buffet')
    expect(activeModality.value).toBe('buffet')
  })
})

describe('useMenuFilters — showModalityToggle, chips & accent', () => {
  it('shows the modality toggle only for AYCE', () => {
    expect(useMenuFilters('ayce', 'buffet').showModalityToggle.value).toBe(true)
    routeQuery = { type: 'express' }
    expect(useMenuFilters('express', 'buffet').showModalityToggle.value).toBe(
      false
    )
    routeQuery = { type: 'bebidas' }
    expect(useMenuFilters('drinks', 'buffet').showModalityToggle.value).toBe(
      false
    )
    routeQuery = { type: 'kids' }
    expect(useMenuFilters('kids', 'buffet').showModalityToggle.value).toBe(
      false
    )
  })

  it('exposes isKids and hides the category chips for the Kids view', () => {
    routeQuery = { type: 'kids' }
    const kids = useMenuFilters('kids', 'buffet')
    expect(kids.isKids.value).toBe(true)
    expect(kids.showCategoryChips.value).toBe(false)
    routeQuery = { type: 'ayce', modality: 'buffet' }
    const ayce = useMenuFilters('ayce', 'buffet')
    expect(ayce.isKids.value).toBe(false)
    expect(ayce.showCategoryChips.value).toBe(true)
  })

  it('maps accent to orange / blue / soft (Bebidas AND Kids share soft)', () => {
    expect(useMenuFilters('ayce', 'buffet').accentStyle.value).toEqual({
      '--accent': 'var(--orange)',
    })
    routeQuery = { type: 'express' }
    expect(useMenuFilters('express', 'buffet').accentStyle.value).toEqual({
      '--accent': 'var(--blue)',
    })
    routeQuery = { type: 'bebidas' }
    expect(useMenuFilters('drinks', 'buffet').accentStyle.value).toEqual({
      '--accent': 'var(--soft)',
    })
    routeQuery = { type: 'kids' }
    expect(useMenuFilters('kids', 'buffet').accentStyle.value).toEqual({
      '--accent': 'var(--soft)',
    })
  })
})

describe('useMenuFilters — setSelection', () => {
  it('switches to express and resets category to Entradas', () => {
    const { activeSelection, activeCategory, setSelection } = useMenuFilters(
      'ayce',
      'buffet'
    )
    setSelection('express')
    expect(activeSelection.value).toBe('express')
    expect(activeCategory.value).toBe('appetizers')
  })

  it('switches to drinks and resets category to Coctelería Jumbo', () => {
    const { activeCategory, setSelection } = useMenuFilters('ayce', 'buffet')
    setSelection('drinks')
    expect(activeCategory.value).toBe('jumbo_cocktails')
  })

  it('switches to kids and writes type=kids with the kids category to the URL', () => {
    const { activeSelection, activeCategory, setSelection } = useMenuFilters(
      'ayce',
      'buffet'
    )
    setSelection('kids')
    expect(activeSelection.value).toBe('kids')
    expect(activeCategory.value).toBe('kids')
    expect(mockReplace).toHaveBeenCalledWith({
      query: expect.objectContaining({ type: 'kids', category: 'kids' }),
    })
    // Kids has no modality param.
    expect(mockReplace).toHaveBeenCalledWith({
      query: expect.not.objectContaining({ modality: expect.anything() }),
    })
  })

  it('resets modality to buffet on selection change', () => {
    const { activeModality, setModality, setSelection } = useMenuFilters(
      'ayce',
      'buffet'
    )
    setModality('carta')
    setSelection('express')
    expect(activeModality.value).toBe('buffet')
  })

  it('writes type=bebidas (not drinks) to the URL via replace', () => {
    const { setSelection } = useMenuFilters('ayce', 'buffet')
    setSelection('drinks')
    expect(mockReplace).toHaveBeenCalledWith({
      query: expect.objectContaining({
        type: 'bebidas',
        category: 'jumbo_cocktails',
      }),
    })
  })

  it('omits the modality param for non-AYCE selections', () => {
    const { setSelection } = useMenuFilters('ayce', 'buffet')
    setSelection('express')
    expect(mockReplace).toHaveBeenCalledWith({
      query: expect.not.objectContaining({ modality: expect.anything() }),
    })
  })
})

describe('useMenuFilters — setModality', () => {
  it('updates modality and resets category to the set default', () => {
    const { activeModality, activeCategory, setCategory, setModality } =
      useMenuFilters('ayce', 'buffet')
    setCategory('burgers')
    setModality('carta')
    expect(activeModality.value).toBe('carta')
    expect(activeCategory.value).toBe('appetizers')
  })

  it('replaces the URL with modality + default category', () => {
    const { setModality } = useMenuFilters('ayce', 'buffet')
    setModality('carta')
    expect(mockReplace).toHaveBeenCalledWith({
      query: expect.objectContaining({
        type: 'ayce',
        modality: 'carta',
        category: 'appetizers',
      }),
    })
  })
})

describe('useMenuFilters — setCategory', () => {
  it('sets a valid in-set category', () => {
    const { activeCategory, setCategory } = useMenuFilters('ayce', 'buffet')
    setCategory('wings')
    expect(activeCategory.value).toBe('wings')
  })

  it('resolves an out-of-set key to the default', () => {
    const { activeCategory, setCategory } = useMenuFilters('ayce', 'buffet')
    setCategory('burritos') // Burritos is Express-only
    expect(activeCategory.value).toBe('appetizers')
  })

  it('writes the category to the URL via replace (no history spam)', () => {
    const { setCategory } = useMenuFilters('ayce', 'buffet')
    setCategory('wings')
    expect(mockReplace).toHaveBeenCalledWith({
      query: expect.objectContaining({ category: 'wings' }),
    })
  })
})

describe('useMenuFilters — drift guard (feature 023)', () => {
  it('excludes a curated key that has no matching entry in availableKeys', () => {
    // Sándwiches is a real AYCE·buffet member, but this render's menu data
    // (content-store read) no longer contains it.
    const availableKeys = new Set([
      'appetizers',
      'burgers',
      'hot_dogs',
      'cold_rolls',
      'hot_rolls',
      'sweet_rolls',
      'wings',
    ])
    const { curatedSet } = useMenuFilters('ayce', 'buffet', availableKeys)
    expect(curatedSet.value).not.toContain('sandwiches')
    // The remaining members keep their existing curated order.
    expect(curatedSet.value).toEqual([
      'appetizers',
      'burgers',
      'hot_dogs',
      'cold_rolls',
      'hot_rolls',
      'sweet_rolls',
      'wings',
    ])
  })

  it('falls back the active category to the view default when the deep-linked key becomes unavailable', () => {
    routeQuery = { type: 'ayce', modality: 'buffet', category: 'sandwiches' }
    const availableKeys = new Set(['appetizers', 'burgers'])
    const { activeCategory } = useMenuFilters('ayce', 'buffet', availableKeys)
    expect(activeCategory.value).toBe('appetizers')
  })

  it('setCategory falls back to the default when the target key is no longer available', () => {
    routeQuery = { type: 'ayce', modality: 'buffet' }
    const availableKeys = new Set(['appetizers', 'burgers'])
    const { activeCategory, setCategory } = useMenuFilters(
      'ayce',
      'buffet',
      availableKeys
    )
    setCategory('sandwiches')
    expect(activeCategory.value).toBe('appetizers')
  })

  it('excludes a missing drink group from the Bebidas chip row', () => {
    routeQuery = { type: 'bebidas' }
    const availableKeys = new Set([
      'jumbo_cocktails',
      'sodas',
      'beers',
      'coffee_digestifs',
    ])
    const { curatedSet } = useMenuFilters('drinks', 'buffet', availableKeys)
    expect(curatedSet.value).not.toContain('cantaritos_sumo_cups')
    expect(curatedSet.value).not.toContain('destilados')
    expect(curatedSet.value).toEqual([
      'jumbo_cocktails',
      'sodas',
      'beers',
      'coffee_digestifs',
    ])
  })

  it('keeps unaffected views identical to current behavior when nothing is missing (no regression — FR-012)', () => {
    routeQuery = { type: 'ayce', modality: 'buffet' }
    const availableKeys = new Set([
      'appetizers',
      'burgers',
      'sandwiches',
      'hot_dogs',
      'cold_rolls',
      'hot_rolls',
      'sweet_rolls',
      'wings',
    ])
    const withGuard = useMenuFilters('ayce', 'buffet', availableKeys)
    const withoutGuard = useMenuFilters('ayce', 'buffet')
    expect(withGuard.curatedSet.value).toEqual(withoutGuard.curatedSet.value)
    expect(withGuard.activeCategory.value).toBe(
      withoutGuard.activeCategory.value
    )
  })
})
