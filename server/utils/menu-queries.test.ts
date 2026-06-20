import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockDbSelect } = vi.hoisted(() => ({ mockDbSelect: vi.fn() }))

vi.mock('./db', () => ({ db: { select: mockDbSelect } }))
vi.mock('../db/schema', () => ({
  menuItems: {},
  menuCategories: {},
  sauces: {},
}))

import { getFeaturedDishes, getFullMenu } from './menu-queries'

// A joined menu_items×menu_categories row as the SQL select returns it.
type FeaturedQueryRow = {
  id: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string | null
  badgeEs: string | null
  badgeEn: string | null
  category: string
}

// Make `db.select(...).from(...).innerJoin(...).where(...).orderBy(...)` resolve to `rows`.
function mockFeaturedChain(rows: FeaturedQueryRow[]): void {
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(rows),
        }),
      }),
    }),
  })
}

const featuredRow = (
  over: Partial<FeaturedQueryRow> = {}
): FeaturedQueryRow => ({
  id: 'dish-1',
  nameEs: 'Edamame',
  nameEn: 'Edamame',
  descriptionEs: 'Vainas de soya',
  descriptionEn: 'Soybean pods',
  fileName: 'edamame.jpg',
  badgeEs: 'Nuevo',
  badgeEn: 'New',
  category: 'entradas',
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getFeaturedDishes', () => {
  it('maps each row to the FeaturedDishRow shape with bilingual name and description', async () => {
    mockFeaturedChain([featuredRow()])
    const [dish] = await getFeaturedDishes()
    expect(dish).toEqual({
      id: 'dish-1',
      name: { es: 'Edamame', en: 'Edamame' },
      description: { es: 'Vainas de soya', en: 'Soybean pods' },
      imageUrl: 'edamame.jpg',
      badge: { es: 'Nuevo', en: 'New' },
      category: 'entradas',
    })
  })

  it('passes a null image and null badge through unchanged', async () => {
    mockFeaturedChain([
      featuredRow({ fileName: null, badgeEs: null, badgeEn: null }),
    ])
    const [dish] = await getFeaturedDishes()
    expect(dish?.imageUrl).toBeNull()
    expect(dish?.badge).toBeNull()
  })

  it('preserves the SQL-filtered order returned by the query (display order)', async () => {
    mockFeaturedChain([
      featuredRow({ id: 'first' }),
      featuredRow({ id: 'second' }),
    ])
    const dishes = await getFeaturedDishes()
    expect(dishes.map(d => d.id)).toEqual(['first', 'second'])
  })

  it('includes a featured drink (bebidas category) identically to food', async () => {
    mockFeaturedChain([
      featuredRow({ id: 'mojito', category: 'bebidas', nameEs: 'Mojito' }),
    ])
    const [dish] = await getFeaturedDishes()
    expect(dish?.category).toBe('bebidas')
    expect(dish?.name.es).toBe('Mojito')
  })

  it('returns an empty array when no row is featured + active', async () => {
    mockFeaturedChain([])
    expect(await getFeaturedDishes()).toEqual([])
  })

  it('propagates DB errors instead of swallowing them', async () => {
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('db down')),
          }),
        }),
      }),
    })
    await expect(getFeaturedDishes()).rejects.toThrow('db down')
  })
})

// ─── getFullMenu ───────────────────────────────────────────────────────────────

type MenuQueryRow = {
  categoryKey: string
  categoryNameEs: string
  categoryNameEn: string
  categoryOrder: number
  dishId: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string | null
  badgeEs: string | null
  badgeEn: string | null
  price: string | null
  includedInAyce: boolean
  drinkGroup: string | null
  requiresSauce: boolean
}

type SauceRow = {
  id: string
  nameEs: string
  nameEn: string
  displayOrder: number
}

// First select(...) → dishes-with-category; second select(...) → sauces.
function mockMenuChains(menuRows: MenuQueryRow[], sauceRows: SauceRow[]): void {
  mockDbSelect
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(menuRows),
          }),
        }),
      }),
    })
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(sauceRows),
        }),
      }),
    })
}

const menuRow = (over: Partial<MenuQueryRow> = {}): MenuQueryRow => ({
  categoryKey: 'alitas',
  categoryNameEs: 'Alitas',
  categoryNameEn: 'Wings',
  categoryOrder: 0,
  dishId: 'wings-1',
  nameEs: 'Boneless',
  nameEn: 'Boneless',
  descriptionEs: '',
  descriptionEn: '',
  fileName: null,
  badgeEs: null,
  badgeEn: null,
  price: '120.00',
  includedInAyce: true,
  drinkGroup: null,
  requiresSauce: true,
  ...over,
})

const sauceRow = (over: Partial<SauceRow> = {}): SauceRow => ({
  id: 'sauce-1',
  nameEs: 'BBQ',
  nameEn: 'BBQ',
  displayOrder: 0,
  ...over,
})

describe('getFullMenu', () => {
  it('groups dishes under their category preserving query order', async () => {
    mockMenuChains(
      [
        menuRow({
          categoryKey: 'entradas',
          categoryNameEs: 'Entradas',
          categoryOrder: 0,
          dishId: 'a',
        }),
        menuRow({
          categoryKey: 'alitas',
          categoryNameEs: 'Alitas',
          categoryOrder: 1,
          dishId: 'b',
        }),
      ],
      []
    )
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    expect(result.categories.map(c => c.key)).toEqual(['entradas', 'alitas'])
    expect(result.categories[1]?.dishes[0]?.id).toBe('b')
  })

  it('shows price and incluido=false in the AYCE carta (a-la-carte) view', async () => {
    mockMenuChains([menuRow({ price: '120.00', includedInAyce: true })], [])
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'carta',
    })
    const dish = result.categories[0]?.dishes[0]
    expect(dish?.price).toBe('120.00')
    expect(dish?.incluido).toBe(false)
    expect(result.modality).toBe('carta')
  })

  it('shows incluido (no price) in the AYCE buffet view', async () => {
    mockMenuChains([menuRow({ price: '120.00', includedInAyce: true })], [])
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    const dish = result.categories[0]?.dishes[0]
    expect(dish?.price).toBeNull()
    expect(dish?.incluido).toBe(true)
  })

  it('reflects included_in_ayce=false as incluido=false in the buffet view', async () => {
    mockMenuChains([menuRow({ includedInAyce: false })], [])
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    expect(result.categories[0]?.dishes[0]?.incluido).toBe(false)
  })

  it('coerces Express + carta to the buffet view and reports the coercion', async () => {
    mockMenuChains([menuRow({ includedInAyce: true })], [])
    const result = await getFullMenu({
      locationType: 'express',
      modality: 'carta',
    })
    expect(result.modality).toBe('buffet')
    expect(result.locationType).toBe('express')
    expect(result.categories[0]?.dishes[0]?.price).toBeNull()
    expect(result.categories[0]?.dishes[0]?.incluido).toBe(true)
  })

  it('omits the price in carta when the dish has no price yet (null passes through)', async () => {
    mockMenuChains([menuRow({ price: null })], [])
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'carta',
    })
    expect(result.categories[0]?.dishes[0]?.price).toBeNull()
  })

  it('exposes drinkGroup and requiresSauce on each dish', async () => {
    mockMenuChains(
      [
        menuRow({
          categoryKey: 'bebidas',
          drinkGroup: 'sodas',
          requiresSauce: false,
        }),
      ],
      []
    )
    const dish = (
      await getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).categories[0]?.dishes[0]
    expect(dish?.drinkGroup).toBe('sodas')
    expect(dish?.requiresSauce).toBe(false)
  })

  it('returns the active sauce catalog ordered by the query', async () => {
    mockMenuChains(
      [],
      [
        sauceRow({ id: 's1', nameEs: 'BBQ', displayOrder: 0 }),
        sauceRow({
          id: 's2',
          nameEs: 'Buffalo',
          nameEn: 'Buffalo',
          displayOrder: 1,
        }),
      ]
    )
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    expect(result.sauces).toEqual([
      { id: 's1', name: { es: 'BBQ', en: 'BBQ' }, displayOrder: 0 },
      { id: 's2', name: { es: 'Buffalo', en: 'Buffalo' }, displayOrder: 1 },
    ])
  })

  it('propagates DB errors from the dishes query', async () => {
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('db down')),
          }),
        }),
      }),
    })
    await expect(
      getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).rejects.toThrow('db down')
  })
})
