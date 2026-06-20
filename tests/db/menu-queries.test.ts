import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockDbSelect } = vi.hoisted(() => ({ mockDbSelect: vi.fn() }))

vi.mock('../../server/utils/db', () => ({ db: { select: mockDbSelect } }))
vi.mock('../../server/db/schema', () => ({
  menuItems: {},
  menuCategories: {},
  sauces: {},
  drinkGroups: {},
}))

import { getFeaturedDishes, getFullMenu } from '../../server/db/queries/menu'

// ─── Shared helpers ───────────────────────────────────────────────────────────

type FeaturedRow = {
  id: string
  categoryId: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  locationType: string
  price: string | null
  includedInAyce: boolean
  fileName: string | null
  badgeEs: string | null
  badgeEn: string | null
  featured: boolean
  drinkGroup: string | null
  requiresSauce: boolean
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
  category: {
    key: string
    nameEs: string
    nameEn: string
  }
}

function makeFeaturedRow(over: Partial<FeaturedRow> = {}): FeaturedRow {
  return {
    id: 'item-1',
    categoryId: 'cat-1',
    nameEs: 'Edamames',
    nameEn: 'Edamame',
    descriptionEs: 'Vainas de soya',
    descriptionEn: 'Soybean pods',
    locationType: 'both',
    price: null,
    includedInAyce: true,
    fileName: null,
    badgeEs: null,
    badgeEn: null,
    featured: true,
    drinkGroup: null,
    requiresSauce: false,
    isActive: true,
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { key: 'entradas', nameEs: 'Entradas', nameEn: 'Starters' },
    ...over,
  }
}

// Mocks the `.select(...).from(...).innerJoin(...).leftJoin(...).where(...)` chain
function mockSelectChain(rows: FeaturedRow[]): void {
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(rows),
        }),
      }),
    }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getFeaturedDishes ────────────────────────────────────────────────────────

describe('getFeaturedDishes', () => {
  it('returns items returned by the DB query', async () => {
    const row = makeFeaturedRow({ featured: true, isActive: true })
    mockSelectChain([row])

    const results = await getFeaturedDishes()

    expect(results).toHaveLength(1)
    expect(results[0]?.nameEs).toBe('Edamames')
    expect(results[0]?.featured).toBe(true)
    expect(results[0]?.isActive).toBe(true)
  })

  it('returns category fields on each item', async () => {
    const row = makeFeaturedRow({
      category: { key: 'burgers', nameEs: 'Burgers', nameEn: 'Burgers' },
    })
    mockSelectChain([row])

    const results = await getFeaturedDishes()

    expect(results[0]?.category.key).toBe('burgers')
    expect(results[0]?.category.nameEs).toBe('Burgers')
    expect(results[0]?.category.nameEn).toBe('Burgers')
  })

  it('returns an empty array when the query returns no rows', async () => {
    mockSelectChain([])
    const results = await getFeaturedDishes()
    expect(results).toEqual([])
  })

  it('propagates DB errors', async () => {
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(new Error('connection failed')),
          }),
        }),
      }),
    })

    await expect(getFeaturedDishes()).rejects.toThrow('connection failed')
  })
})

// ─── getFullMenu ──────────────────────────────────────────────────────────────

describe('getFullMenu', () => {
  it('returns all active items when no filter is provided', async () => {
    const rows = [
      makeFeaturedRow({ nameEs: 'Edamames', locationType: 'both' }),
      makeFeaturedRow({ nameEs: 'Boneless', locationType: 'ayce' }),
    ]
    mockSelectChain(rows)

    const results = await getFullMenu()

    expect(results).toHaveLength(2)
  })

  it('passes the query through for ayce filter', async () => {
    const ayceRow = makeFeaturedRow({
      nameEs: 'Alitas',
      locationType: 'ayce',
    })
    mockSelectChain([ayceRow])

    const results = await getFullMenu({ locationType: 'ayce' })

    // The mock returns whatever we set up — we verify the function calls through
    expect(results).toHaveLength(1)
    expect(results[0]?.nameEs).toBe('Alitas')
  })

  it('passes the query through for express filter', async () => {
    const expressRow = makeFeaturedRow({
      nameEs: 'Burrito Sumo',
      locationType: 'express',
    })
    mockSelectChain([expressRow])

    const results = await getFullMenu({ locationType: 'express' })

    expect(results).toHaveLength(1)
    expect(results[0]?.nameEs).toBe('Burrito Sumo')
  })

  it('returns category join data on each item', async () => {
    const row = makeFeaturedRow({
      category: { key: 'bebidas', nameEs: 'Bebidas', nameEn: 'Drinks' },
    })
    mockSelectChain([row])

    const results = await getFullMenu()

    expect(results[0]?.category.key).toBe('bebidas')
    expect(results[0]?.category.nameEs).toBe('Bebidas')
    expect(results[0]?.category.nameEn).toBe('Drinks')
  })

  it('returns empty array when no active items exist', async () => {
    mockSelectChain([])

    const results = await getFullMenu()

    expect(results).toEqual([])
  })

  it('propagates DB errors', async () => {
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockRejectedValue(new Error('db timeout')),
          }),
        }),
      }),
    })

    await expect(getFullMenu({ locationType: 'ayce' })).rejects.toThrow(
      'db timeout'
    )
  })
})
