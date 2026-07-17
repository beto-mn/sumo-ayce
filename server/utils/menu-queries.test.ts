import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockDbSelect, mockInArray } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockInArray: vi.fn(),
}))

vi.mock('./db', () => ({ db: { select: mockDbSelect } }))
vi.mock('drizzle-orm', async importOriginal => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  mockInArray.mockImplementation(actual.inArray)
  return { ...actual, inArray: mockInArray }
})
vi.mock('../db/schema', async importOriginal => {
  const actual = await importOriginal<typeof import('../db/schema')>()
  return {
    ...actual,
    menuItems: {},
    menuCategories: {},
    drinkGroups: {},
    drinkSubGroups: actual.drinkSubGroups,
    menuItemOptionGroups: {},
    menuItemOptionChoices: {},
  }
})
vi.mock('../api/v1/menu/resolveImageUrl', () => ({
  resolveImageUrl: (filePath: string | null) =>
    filePath ? `https://blob.example.com/${filePath}` : null,
}))

import { DatabaseUnavailableError } from './error-handler'
import { getFeaturedDishes, getFullMenu, locationScope } from './menu-queries'

/** Builds a featured-query chain whose terminal `orderBy` runs `onOrderBy` each call. */
function mockFeaturedChainWith(onOrderBy: () => Promise<unknown>): void {
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockImplementation(onOrderBy),
          }),
        }),
      }),
    }),
  })
}

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

// Make `db.select(...).from(...).innerJoin(...).leftJoin(...).where(...).orderBy(...)` resolve to `rows`.
function mockFeaturedChain(rows: FeaturedQueryRow[]): void {
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(rows),
          }),
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
  fileName: 'menu/ala-carta/edamame.jpg',
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
      imageUrl: 'https://blob.example.com/menu/ala-carta/edamame.jpg',
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
      featuredRow({ id: 'first', nameEs: 'Bora Bora' }),
      featuredRow({ id: 'second', nameEs: 'Coco Roll' }),
    ])
    const dishes = await getFeaturedDishes()
    expect(dishes.map(d => d.id)).toEqual(['first', 'second'])
  })

  it('dedupes multiple rows of the same dish to one (keeps the first by order)', async () => {
    // The same garantía dish is featured on several location/modality rows; the
    // rail must list it once, keeping the first (lowest-displayOrder) row.
    mockFeaturedChain([
      featuredRow({ id: 'bora-ayce', nameEs: 'Bora Bora' }),
      featuredRow({ id: 'coco', nameEs: 'Coco Roll' }),
      featuredRow({ id: 'bora-carta', nameEs: 'Bora Bora' }),
      featuredRow({ id: 'bora-express', nameEs: 'Bora Bora' }),
    ])
    const dishes = await getFeaturedDishes()
    expect(dishes.map(d => d.id)).toEqual(['bora-ayce', 'coco'])
    expect(dishes.map(d => d.name.es)).toEqual(['Bora Bora', 'Coco Roll'])
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

  it('propagates non-transient DB errors instead of swallowing them', async () => {
    mockFeaturedChainWith(() => Promise.reject(new Error('db down')))
    await expect(getFeaturedDishes()).rejects.toThrow('db down')
  })

  it('retries a transient connection error and succeeds on the second attempt', async () => {
    let attempts = 0
    mockFeaturedChainWith(() => {
      attempts += 1
      if (attempts === 1) return Promise.reject(new Error('fetch failed'))
      return Promise.resolve([featuredRow({ id: 'recovered' })])
    })
    const dishes = await getFeaturedDishes()
    expect(attempts).toBe(2)
    expect(dishes[0]?.id).toBe('recovered')
  })

  it('throws a handled DatabaseUnavailableError when every attempt is transiently down', async () => {
    let attempts = 0
    mockFeaturedChainWith(() => {
      attempts += 1
      return Promise.reject(
        new Error('Error connecting to database: fetch failed')
      )
    })
    await expect(getFeaturedDishes()).rejects.toBeInstanceOf(
      DatabaseUnavailableError
    )
    expect(attempts).toBe(3)
  })
})

// ─── getFullMenu ───────────────────────────────────────────────────────────────

type MenuQueryRow = {
  categoryKey: string
  categoryNameEs: string
  categoryNameEn: string
  categoryNoteEs: string | null
  categoryNoteEn: string | null
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
  featured: boolean
  highlightBackground: boolean
}

type OptionGroupRow = {
  id: string
  menuItemId: string
  key: string
  nameEs: string
  nameEn: string
}

type OptionChoiceRow = {
  id: string
  optionGroupId: string
  nameEs: string
  nameEn: string
  priceDelta: string
}

type DrinkGroupRow = {
  groupKey: string
  nameEs: string | null
  nameEn: string | null
  displayOrder: number
  promoEs: string | null
  promoEn: string | null
}

// First select(...) → dishes-with-category; second select(...) → drink groups
// (.from → .orderBy); third (+ fourth, only when the third returned rows)
// select(...) → option groups + their choices.
// The dishes query chains: .from → .innerJoin → .leftJoin (drinkGroups) → .leftJoin (drinkSubGroups) → .where → .orderBy
function mockMenuChains(
  menuRows: MenuQueryRow[],
  drinkGroupRows: DrinkGroupRow[] = [],
  optionGroupRows: OptionGroupRow[] = [],
  optionChoiceRows: OptionChoiceRow[] = []
): void {
  const innerChain = {
    where: vi.fn().mockReturnValue({
      orderBy: vi.fn().mockResolvedValue(menuRows),
    }),
  }
  const leftJoin2 = vi.fn().mockReturnValue(innerChain)
  const leftJoin1 = vi.fn().mockReturnValue({ leftJoin: leftJoin2 })
  mockDbSelect
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: leftJoin1,
        }),
      }),
    })
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(drinkGroupRows),
      }),
    })
  if (menuRows.length > 0) {
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(optionGroupRows),
        }),
      }),
    })
    if (optionGroupRows.length > 0) {
      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(optionChoiceRows),
          }),
        }),
      })
    }
  }
}

const menuRow = (over: Partial<MenuQueryRow> = {}): MenuQueryRow => ({
  categoryKey: 'alitas',
  categoryNameEs: 'Alitas',
  categoryNameEn: 'Wings',
  categoryNoteEs: null,
  categoryNoteEn: null,
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
  featured: false,
  highlightBackground: false,
  ...over,
})

// US3 SC2 — direct unit test for the locationScope predicate builder.
describe('locationScope', () => {
  it('calls inArray with ["express","both"] for express', () => {
    locationScope('express')
    // The first arg is menuItems.locationType (undefined in schema mock — that's fine).
    // What matters is the values array passed to inArray.
    const [, values] = mockInArray.mock.calls[0] as [unknown, string[]]
    expect(values).toEqual(['express', 'both'])
  })

  it('calls inArray with ["ayce","both"] for ayce', () => {
    locationScope('ayce')
    const [, values] = mockInArray.mock.calls[0] as [unknown, string[]]
    expect(values).toEqual(['ayce', 'both'])
  })
})

describe('getFullMenu', () => {
  it('groups dishes under their category preserving query order', async () => {
    mockMenuChains([
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
    ])
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    expect(result.categories.map(c => c.key)).toEqual(['entradas', 'alitas'])
    expect(result.categories[1]?.dishes[0]?.id).toBe('b')
  })

  it('returns the kids category items (with per-item includedInAyce + note) for the kids view', async () => {
    mockMenuChains([
      // Query orders by displayOrder; the $179 AYCE Niños item is displayOrder 0.
      menuRow({
        categoryKey: 'kids',
        categoryNameEs: 'Menú Kids',
        categoryNameEn: 'Kids Menu',
        categoryNoteEs: 'Incluye papas a la francesa…',
        categoryNoteEn: 'Includes french fries…',
        dishId: 'kids-ayce',
        price: '179.00',
        includedInAyce: true,
      }),
      menuRow({
        categoryKey: 'kids',
        categoryNameEs: 'Menú Kids',
        categoryNameEn: 'Kids Menu',
        categoryNoteEs: 'Incluye papas a la francesa…',
        categoryNoteEn: 'Includes french fries…',
        dishId: 'kid-burger',
        price: '149.00',
        includedInAyce: false,
      }),
    ])
    const result = await getFullMenu({
      locationType: 'kids',
      modality: 'buffet',
    })
    // Kids resolves to a single 'kids' category, always priced (carta) regardless
    // of the requested modality.
    expect(result.locationType).toBe('kids')
    expect(result.modality).toBe('carta')
    expect(result.categories).toHaveLength(1)
    expect(result.categories[0]?.key).toBe('kids')
    // The category carries the bilingual inclusion note again.
    expect(result.categories[0]?.note).toEqual({
      es: 'Incluye papas a la francesa…',
      en: 'Includes french fries…',
    })
    const dishes = result.categories[0]?.dishes ?? []
    // All You Can Eat Kids ($179) comes FIRST, then the combos.
    expect(dishes.map(d => d.id)).toEqual(['kids-ayce', 'kid-burger'])
    expect(dishes.map(d => d.price)).toEqual(['179.00', '149.00'])
    // Raw includedInAyce splits the two sub-sections: buffet (true) vs combos (false).
    expect(dishes.map(d => d.includedInAyce)).toEqual([true, false])
  })

  it('exposes the bilingual category note when present (e.g. Kids inclusions)', async () => {
    mockMenuChains([
      menuRow({
        categoryKey: 'kids',
        categoryNoteEs: 'Incluye papas…',
        categoryNoteEn: 'Includes fries…',
      }),
    ])
    const category = (
      await getFullMenu({ locationType: 'ayce', modality: 'carta' })
    ).categories[0]
    expect(category?.note).toEqual({
      es: 'Incluye papas…',
      en: 'Includes fries…',
    })
  })

  it('returns note=null for a category without a note', async () => {
    mockMenuChains([menuRow({ categoryKey: 'alitas' })])
    const category = (
      await getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).categories[0]
    expect(category?.note).toBeNull()
  })

  it('exposes the featured (Garantía Sumo) flag per dish', async () => {
    mockMenuChains([
      menuRow({ dishId: 'star', featured: true }),
      menuRow({ dishId: 'plain', featured: false }),
    ])
    const dishes = (
      await getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).categories.flatMap(c => c.dishes)
    expect(dishes.find(d => d.id === 'star')?.featured).toBe(true)
    expect(dishes.find(d => d.id === 'plain')?.featured).toBe(false)
  })

  // ── highlightBackground projection (Part D) ────────────────────────────────
  it('projects highlightBackground=true for the flagged dish (e.g. Kids AYCE)', async () => {
    mockMenuChains([
      menuRow({ dishId: 'kids-ayce', highlightBackground: true }),
    ])
    const dishes = (
      await getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).categories.flatMap(c => c.dishes)
    expect(dishes.find(d => d.id === 'kids-ayce')?.highlightBackground).toBe(
      true
    )
  })

  it('projects highlightBackground=false for every other (unflagged) dish', async () => {
    mockMenuChains([menuRow({ dishId: 'plain', highlightBackground: false })])
    const dishes = (
      await getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).categories.flatMap(c => c.dishes)
    expect(dishes.find(d => d.id === 'plain')?.highlightBackground).toBe(false)
  })

  // ── optionGroups projection (Parts C & E) ───────────────────────────────────
  it('projects optionGroups=[] for a dish with no configured option groups', async () => {
    mockMenuChains([menuRow({ dishId: 'plain' })])
    const dishes = (
      await getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).categories.flatMap(c => c.dishes)
    expect(dishes.find(d => d.id === 'plain')?.optionGroups).toEqual([])
  })

  it('projects optionGroups with their choices, correctly ordered and shaped (e.g. Ramen XL)', async () => {
    mockMenuChains(
      [menuRow({ dishId: 'ramen-xl' })],
      [],
      [
        {
          id: 'g1',
          menuItemId: 'ramen-xl',
          key: 'noodle_base',
          nameEs: 'Base de fideo',
          nameEn: 'Noodle base',
        },
        {
          id: 'g2',
          menuItemId: 'ramen-xl',
          key: 'protein',
          nameEs: 'Proteína',
          nameEn: 'Protein',
        },
      ],
      [
        {
          id: 'c1',
          optionGroupId: 'g1',
          nameEs: 'Pollo',
          nameEn: 'Chicken',
          priceDelta: '0.00',
        },
        {
          id: 'c2',
          optionGroupId: 'g2',
          nameEs: 'Res',
          nameEn: 'Beef',
          priceDelta: '0.00',
        },
      ]
    )
    const dishes = (
      await getFullMenu({ locationType: 'ayce', modality: 'carta' })
    ).categories.flatMap(c => c.dishes)
    const ramenXl = dishes.find(d => d.id === 'ramen-xl')
    expect(ramenXl?.optionGroups).toEqual([
      {
        key: 'noodle_base',
        name: { es: 'Base de fideo', en: 'Noodle base' },
        choices: [
          {
            id: 'c1',
            name: { es: 'Pollo', en: 'Chicken' },
            priceDelta: '0.00',
          },
        ],
      },
      {
        key: 'protein',
        name: { es: 'Proteína', en: 'Protein' },
        choices: [
          { id: 'c2', name: { es: 'Res', en: 'Beef' }, priceDelta: '0.00' },
        ],
      },
    ])
  })

  it('drops a group entirely when it has zero active choices (no empty picker shown)', async () => {
    mockMenuChains(
      [menuRow({ dishId: 'ramen-xl' })],
      [],
      [
        {
          id: 'g1',
          menuItemId: 'ramen-xl',
          key: 'noodle_base',
          nameEs: 'Base de fideo',
          nameEn: 'Noodle base',
        },
      ],
      []
    )
    const dishes = (
      await getFullMenu({ locationType: 'ayce', modality: 'carta' })
    ).categories.flatMap(c => c.dishes)
    expect(dishes.find(d => d.id === 'ramen-xl')?.optionGroups).toEqual([])
  })

  it('shows price and incluido=false in the AYCE carta (a-la-carte) view', async () => {
    mockMenuChains([menuRow({ price: '120.00', includedInAyce: true })])
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
    mockMenuChains([menuRow({ price: '120.00', includedInAyce: true })])
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    const dish = result.categories[0]?.dishes[0]
    expect(dish?.price).toBeNull()
    expect(dish?.incluido).toBe(true)
  })

  it('reflects included_in_ayce=false as incluido=false in the buffet view', async () => {
    mockMenuChains([menuRow({ includedInAyce: false })])
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    expect(result.categories[0]?.dishes[0]?.incluido).toBe(false)
  })

  it('coerces Express + carta to the buffet view and reports the coercion', async () => {
    mockMenuChains([menuRow({ includedInAyce: true })])
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
    mockMenuChains([menuRow({ price: null })])
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'carta',
    })
    expect(result.categories[0]?.dishes[0]?.price).toBeNull()
  })

  it('exposes drinkGroup on each dish', async () => {
    mockMenuChains([
      menuRow({
        categoryKey: 'bebidas',
        drinkGroup: 'sodas',
      }),
    ])
    const dish = (
      await getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).categories[0]?.dishes[0]
    expect(dish?.drinkGroup).toBe('sodas')
  })

  it('resolves dish imageUrl to a fully-qualified URL when fileName is non-null', async () => {
    mockMenuChains([menuRow({ fileName: 'menu/ayce/boneless.webp' })])
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    const dish = result.categories[0]?.dishes[0]
    expect(dish?.imageUrl).toBe(
      'https://blob.example.com/menu/ayce/boneless.webp'
    )
    expect(dish?.imageUrl).toMatch(/^https:\/\//)
  })

  // US3 SC2 — only Express and 'both' items appear for locationType=express.
  // The WHERE clause is built by locationScope() via inArray(locationType, ['express','both']).
  // This test verifies the correct value list is passed to inArray when locationType='express'.
  it('applies Express location filter via inArray(locationType, ["express","both"])', async () => {
    mockMenuChains([menuRow()])
    await getFullMenu({ locationType: 'express', modality: 'buffet' })
    // The first arg is menuItems.locationType (undefined in schema mock — that's fine).
    const [, valuesExpress] = mockInArray.mock.calls[0] as [unknown, string[]]
    expect(valuesExpress).toEqual(['express', 'both'])
  })

  it('applies AYCE location filter via inArray(locationType, ["ayce","both"])', async () => {
    mockMenuChains([menuRow()])
    await getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    const [, valuesAyce] = mockInArray.mock.calls[0] as [unknown, string[]]
    expect(valuesAyce).toEqual(['ayce', 'both'])
  })

  it('exposes drink groups in ascending display order with their DB name', async () => {
    mockMenuChains(
      [],
      [
        {
          groupKey: 'jumbo_cocktails',
          nameEs: 'Coctelería Jumbo',
          nameEn: 'Jumbo Cocktails',
          displayOrder: 0,
          promoEs: null,
          promoEn: null,
        },
        {
          groupKey: 'beers',
          nameEs: 'Cervezas',
          nameEn: 'Beers',
          displayOrder: 3,
          promoEs: null,
          promoEn: null,
        },
        {
          groupKey: 'destilados',
          nameEs: 'Destilados',
          nameEn: 'Spirits',
          displayOrder: 4,
          promoEs: null,
          promoEn: null,
        },
      ]
    )
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    expect(result.drinkGroups.map(g => g.key)).toEqual([
      'jumbo_cocktails',
      'beers',
      'destilados',
    ])
    // Each group carries its DB-sourced bilingual display name.
    expect(result.drinkGroups.map(g => g.name)).toEqual([
      { es: 'Coctelería Jumbo', en: 'Jumbo Cocktails' },
      { es: 'Cervezas', en: 'Beers' },
      { es: 'Destilados', en: 'Spirits' },
    ])
  })

  it('carries the Destilados group-level promo once (beers has none)', async () => {
    mockMenuChains(
      [],
      [
        {
          groupKey: 'beers',
          nameEs: 'Cervezas',
          nameEn: 'Beers',
          displayOrder: 3,
          promoEs: null,
          promoEn: null,
        },
        {
          groupKey: 'destilados',
          nameEs: 'Destilados',
          nameEn: 'Spirits',
          displayOrder: 4,
          promoEs: 'Combo Mezcladores $189',
          promoEn: 'Mixer Combo $189',
        },
      ]
    )
    const result = await getFullMenu({
      locationType: 'ayce',
      modality: 'buffet',
    })
    expect(result.drinkGroups.find(g => g.key === 'destilados')?.promo).toEqual(
      {
        es: 'Combo Mezcladores $189',
        en: 'Mixer Combo $189',
      }
    )
    expect(result.drinkGroups.find(g => g.key === 'beers')?.promo).toBeNull()
  })

  it('propagates DB errors from the dishes query', async () => {
    const errorChain = {
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockRejectedValue(new Error('db down')),
      }),
    }
    const leftJoin2Err = vi.fn().mockReturnValue(errorChain)
    const leftJoin1Err = vi.fn().mockReturnValue({ leftJoin: leftJoin2Err })
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: leftJoin1Err,
        }),
      }),
    })
    await expect(
      getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).rejects.toThrow('db down')
  })

  it('degrades to a handled DatabaseUnavailableError when Neon stays down (transient, all attempts)', async () => {
    // Every attempt's dishes query rejects with a transient connection error.
    const rejectingChain = {
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockRejectedValue(new Error('fetch failed')),
      }),
    }
    const leftJoin2Err = vi.fn().mockReturnValue(rejectingChain)
    const leftJoin1Err = vi.fn().mockReturnValue({ leftJoin: leftJoin2Err })
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({ leftJoin: leftJoin1Err }),
      }),
    })
    await expect(
      getFullMenu({ locationType: 'ayce', modality: 'buffet' })
    ).rejects.toBeInstanceOf(DatabaseUnavailableError)
  })
})
