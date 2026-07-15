import { describe, expect, it, vi } from 'vitest'

vi.mock('../../server/utils/db', () => ({ db: {} }))

import { ALL_ITEMS as ALA_CARTA_ITEMS } from '../../server/db/seeds/alaCarta'
import { ALL_ITEMS as AYCE_ITEMS } from '../../server/db/seeds/ayceMenu'
import { DESSERTS } from '../../server/db/seeds/desserts'
import { ALL_ITEMS as EXPRESS_ITEMS } from '../../server/db/seeds/expressMenu'

// A Garantía Sumo dish exists as MULTIPLE menu_items rows (one per
// location/modality). To make the star show in EVERY view, every row of a
// garantía dish is flagged featured — so featured ROWS exceed 11, but the set of
// distinct featured dish NAMES is exactly the 11 client-curated dishes.

type FeaturedLike = {
  nameEs: string
  featured?: boolean
  featuredOrder?: number
}

function featured(items: FeaturedLike[]): FeaturedLike[] {
  return items.filter(i => i.featured)
}

const EXPECTED_ORDER = [
  'Burger del Barrio',
  'Papas Smash',
  'Mac & Cheese',
  'Smash Dog',
  'Bora Bora',
  'Coco Roll',
  'Canela Roll',
  'Kushiage de Queso',
  'Ramen XL',
  'Tostiburger',
  'Sumo Fries',
]

describe('Garantías Sumo featured rail', () => {
  const allFeatured = [
    ...featured(AYCE_ITEMS),
    ...featured(ALA_CARTA_ITEMS),
    ...featured(EXPRESS_ITEMS),
    ...featured(DESSERTS),
  ]

  it('flags MORE than 11 rows featured (each dish flagged in all its location rows)', () => {
    expect(allFeatured.length).toBeGreaterThan(11)
  })

  it('resolves to exactly the 11 client-curated distinct dish names and no others', () => {
    const distinctNames = [...new Set(allFeatured.map(i => i.nameEs))].sort()
    expect(distinctNames).toEqual([...EXPECTED_ORDER].sort())
  })

  it('flags EVERY row whose name is a garantía dish (star shows in every view)', () => {
    const garantia = new Set(EXPECTED_ORDER)
    for (const items of [
      AYCE_ITEMS,
      ALA_CARTA_ITEMS,
      EXPRESS_ITEMS,
      DESSERTS,
    ] as FeaturedLike[][]) {
      for (const item of items) {
        if (garantia.has(item.nameEs)) {
          expect(item.featured).toBe(true)
        } else {
          expect(item.featured).toBeFalsy()
        }
      }
    }
  })

  it('flags featured rows in the Express seed (so the star shows in Express too)', () => {
    const expressFeatured = featured(EXPRESS_ITEMS).map(i => i.nameEs)
    expect(expressFeatured.length).toBeGreaterThan(0)
    for (const name of expressFeatured) expect(EXPECTED_ORDER).toContain(name)
  })

  it('assigns the SAME featuredOrder to every row of a given dish, spanning 0..10', () => {
    // Rows carrying an explicit featuredOrder (ayce/alaCarta/desserts) must be
    // internally consistent: one order value per name, covering 0..10 once each.
    const orderByName = new Map<string, number>()
    for (const item of allFeatured) {
      if (item.featuredOrder === undefined) continue
      const existing = orderByName.get(item.nameEs)
      if (existing !== undefined) expect(item.featuredOrder).toBe(existing)
      orderByName.set(item.nameEs, item.featuredOrder)
    }
    const orders = [...orderByName.values()].sort((a, b) => a - b)
    expect(orders).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    const orderedNames = [...orderByName.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name)
    expect(orderedNames).toEqual(EXPECTED_ORDER)
  })

  it('Sumo Fries is the featured dessert (not Sumo Bites)', () => {
    expect(DESSERTS.find(d => d.nameEs === 'Sumo Fries')?.featured).toBe(true)
    expect(DESSERTS.find(d => d.nameEs === 'Sumo Bites')?.featured).toBeFalsy()
  })
})
