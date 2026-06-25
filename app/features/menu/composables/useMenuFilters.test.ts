import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMenuFilters } from './useMenuFilters'

const mockReplace = vi.fn()

vi.stubGlobal('useRouter', () => ({ replace: mockReplace }))
vi.stubGlobal('useRoute', () => ({
  query: { type: 'ayce', modality: 'buffet' },
}))

beforeEach(() => {
  mockReplace.mockClear()
})

describe('useMenuFilters — default state', () => {
  it('sets activeType from initialType', () => {
    const { activeType } = useMenuFilters('ayce', 'buffet')
    expect(activeType.value).toBe('ayce')
  })

  it('sets activeModality from initialModality', () => {
    const { activeModality } = useMenuFilters('ayce', 'carta')
    expect(activeModality.value).toBe('carta')
  })

  it('sets activeCategory to null initially', () => {
    const { activeCategory } = useMenuFilters('ayce', 'buffet')
    expect(activeCategory.value).toBeNull()
  })
})

describe('useMenuFilters — showModalityToggle', () => {
  it('is true when type is ayce', () => {
    const { showModalityToggle } = useMenuFilters('ayce', 'buffet')
    expect(showModalityToggle.value).toBe(true)
  })

  it('is false when type is express', () => {
    const { showModalityToggle } = useMenuFilters('express', 'buffet')
    expect(showModalityToggle.value).toBe(false)
  })
})

describe('useMenuFilters — accentStyle', () => {
  it('returns orange accent for ayce', () => {
    const { accentStyle } = useMenuFilters('ayce', 'buffet')
    expect(accentStyle.value).toEqual({ '--accent': 'var(--orange)' })
  })

  it('returns express-blue accent for express', () => {
    const { accentStyle } = useMenuFilters('express', 'buffet')
    expect(accentStyle.value).toEqual({ '--accent': 'var(--blue)' })
  })
})

describe('useMenuFilters — setType', () => {
  it('updates activeType', () => {
    const { activeType, setType } = useMenuFilters('ayce', 'buffet')
    setType('express')
    expect(activeType.value).toBe('express')
  })

  it('resets activeModality to buffet when switching to express', () => {
    const { activeModality, setType } = useMenuFilters('ayce', 'carta')
    setType('express')
    expect(activeModality.value).toBe('buffet')
  })

  it('resets activeCategory to null on type change', () => {
    const { activeCategory, setType, setCategory } = useMenuFilters(
      'ayce',
      'buffet'
    )
    setCategory('sushi')
    setType('express')
    expect(activeCategory.value).toBeNull()
  })

  it('showModalityToggle is false after setType("express")', () => {
    const { showModalityToggle, setType } = useMenuFilters('ayce', 'buffet')
    setType('express')
    expect(showModalityToggle.value).toBe(false)
  })

  it('showModalityToggle is true after setType("ayce")', () => {
    const { showModalityToggle, setType } = useMenuFilters('express', 'buffet')
    setType('ayce')
    expect(showModalityToggle.value).toBe(true)
  })

  it('calls router.replace with updated type and buffet modality', () => {
    const { setType } = useMenuFilters('ayce', 'buffet')
    setType('express')
    expect(mockReplace).toHaveBeenCalledWith({
      query: { type: 'express', modality: 'buffet' },
    })
  })
})

describe('useMenuFilters — setModality', () => {
  it('updates activeModality', () => {
    const { activeModality, setModality } = useMenuFilters('ayce', 'buffet')
    setModality('carta')
    expect(activeModality.value).toBe('carta')
  })

  it('calls router.replace with updated modality', () => {
    const { setModality } = useMenuFilters('ayce', 'buffet')
    setModality('carta')
    expect(mockReplace).toHaveBeenCalledWith({
      query: expect.objectContaining({ modality: 'carta' }),
    })
  })

  it('resets activeCategory to null', () => {
    const { activeCategory, setCategory, setModality } = useMenuFilters(
      'ayce',
      'buffet'
    )
    setCategory('burgers')
    setModality('carta')
    expect(activeCategory.value).toBeNull()
  })

  it('removes ?category from URL when switching modality', () => {
    const { setCategory, setModality } = useMenuFilters('ayce', 'buffet')
    setCategory('burgers')
    mockReplace.mockClear()
    setModality('carta')
    expect(mockReplace).toHaveBeenCalledWith({
      query: expect.not.objectContaining({ category: expect.anything() }),
    })
  })
})

describe('useMenuFilters — setCategory', () => {
  it('updates activeCategory', () => {
    const { activeCategory, setCategory } = useMenuFilters('ayce', 'buffet')
    setCategory('wings')
    expect(activeCategory.value).toBe('wings')
  })

  it('can reset activeCategory to null', () => {
    const { activeCategory, setCategory } = useMenuFilters('ayce', 'buffet')
    setCategory('wings')
    setCategory(null)
    expect(activeCategory.value).toBeNull()
  })
})
