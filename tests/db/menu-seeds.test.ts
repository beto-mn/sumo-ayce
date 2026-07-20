import { describe, expect, it, vi } from 'vitest'

// Seed modules import the db client at load time; stub it so importing the
// pure data arrays needs no live DB/env (Article IV — no DB mocks for logic,
// but the seed *data* is a pure constant we assert against directly).
vi.mock('../../server/utils/db', () => ({ db: {} }))

import {
  AYCE_BUFFET_SET,
  AYCE_CARTA_SET,
  DRINKS_SET,
  EXPRESS_SET,
} from '../../app/features/menu/menu-sets'
import { ALL_ITEMS as ALA_CARTA_ITEMS } from '../../server/db/seeds/alaCarta'
import { DRINK_GROUPS } from '../../server/db/seeds/drinkGroups'
import { SUB_GROUPS } from '../../server/db/seeds/drinkSubGroups'
import { ALL_DRINKS } from '../../server/db/seeds/drinks'
import {
  KIDS_AYCE_PRICE,
  KIDS_ITEMS,
  KIDS_LOCATION_TYPE,
  KIDS_PRICE,
} from '../../server/db/seeds/kidsMenu'
import { CATEGORIES } from '../../server/db/seeds/menuCategories'

// ─── Drink groups ─────────────────────────────────────────────────────────────

describe('drink groups seed', () => {
  it('defines exactly the 6 visible groups in display order', () => {
    const ordered = [...DRINK_GROUPS].sort(
      (a, b) => a.displayOrder - b.displayOrder
    )
    expect(ordered.map(g => g.groupKey)).toEqual([
      'jumbo_cocktails',
      'cantaritos_sumo_cups',
      'sodas',
      'beers',
      'destilados',
      'coffee_digestifs',
    ])
  })

  it('has no legacy beers_spirits or non_alcoholic group', () => {
    const keys = DRINK_GROUPS.map(g => g.groupKey)
    expect(keys).not.toContain('beers_spirits')
    expect(keys).not.toContain('non_alcoholic')
  })

  it('gives every group a bilingual DB display label (name_es / name_en)', () => {
    const byKey = Object.fromEntries(DRINK_GROUPS.map(g => [g.groupKey, g]))
    expect(byKey.jumbo_cocktails?.nameEs).toBe('Coctelería Jumbo')
    expect(byKey.jumbo_cocktails?.nameEn).toBe('Jumbo Cocktails')
    expect(byKey.cantaritos_sumo_cups?.nameEs).toBe('Cantaritos y Vasos Sumo')
    expect(byKey.cantaritos_sumo_cups?.nameEn).toBe('Cantaritos & Sumo Cups')
    expect(byKey.sodas?.nameEs).toBe('Refrescos y Bebidas')
    expect(byKey.sodas?.nameEn).toBe('Sodas & Beverages')
    expect(byKey.beers?.nameEs).toBe('Cervezas')
    expect(byKey.beers?.nameEn).toBe('Beers')
    expect(byKey.destilados?.nameEs).toBe('Destilados')
    expect(byKey.destilados?.nameEn).toBe('Spirits')
    expect(byKey.coffee_digestifs?.nameEs).toBe('Café y Digestivos')
    expect(byKey.coffee_digestifs?.nameEn).toBe('Coffee & Digestifs')
    // No group is missing a label.
    for (const group of DRINK_GROUPS) {
      expect(group.nameEs.length).toBeGreaterThan(0)
      expect(group.nameEn.length).toBeGreaterThan(0)
    }
  })

  it('carries the 2x1 / Combo Mezcladores promo once at the destilados group level', () => {
    const destilados = DRINK_GROUPS.find(g => g.groupKey === 'destilados')
    const beers = DRINK_GROUPS.find(g => g.groupKey === 'beers')
    expect(destilados?.promoEs).toContain('Combo Mezcladores $189')
    expect(destilados?.promoEn).toContain('Mixer Combo $189')
    expect(beers?.promoEs).toBeNull()
  })
})

// ─── Drink sub-groups ─────────────────────────────────────────────────────────

describe('drink sub-groups seed', () => {
  it('re-parents every spirit sub-group to destilados', () => {
    const spiritKeys = [
      'ron',
      'vodka',
      'brandy',
      'mezcal',
      'ginebra',
      'tequila',
      'whisky',
      'cremas_licores',
    ]
    for (const key of spiritKeys) {
      const sg = SUB_GROUPS.find(s => s.key === key)
      expect(sg?.drinkGroupKey).toBe('destilados')
    }
  })

  it('keeps the beer sub-groups under the beers group', () => {
    for (const key of [
      'caguamon',
      'cerveza_nacional',
      'cerveza_premium',
      'cerveza',
    ]) {
      expect(SUB_GROUPS.find(s => s.key === key)?.drinkGroupKey).toBe('beers')
    }
  })

  it('orders caguamon first within the beers group', () => {
    const beerSubs = SUB_GROUPS.filter(s => s.drinkGroupKey === 'beers').sort(
      (a, b) => a.displayOrder - b.displayOrder
    )
    expect(beerSubs[0]?.key).toBe('caguamon')
  })

  it('nulls the per-spirit-sub-group subtitle/promo (moved to group level)', () => {
    const spiritSubs = SUB_GROUPS.filter(s => s.drinkGroupKey === 'destilados')
    for (const sg of spiritSubs) {
      expect(sg.subtitleEs).toBeUndefined()
      expect(sg.promoEs).toBeUndefined()
    }
  })
})

// ─── Drinks (items) ─────────────────────────────────────────────────────────

describe('drinks items seed', () => {
  it('has no dangling beers_spirits or non_alcoholic drinkGroup on any item', () => {
    const groups = new Set(ALL_DRINKS.map(d => d.drinkGroup))
    expect(groups.has('beers_spirits' as never)).toBe(false)
    expect(groups.has('non_alcoholic' as never)).toBe(false)
  })

  it('consolidates the six Vaso Sumo bases into exactly one card', () => {
    const vasoSumo = ALL_DRINKS.filter(d => d.nameEs === 'Vaso Sumo')
    expect(vasoSumo).toHaveLength(1)
    expect(vasoSumo[0]?.price).toBe('159.00')
    expect(vasoSumo[0]?.fileName).toBe('menu/drinks/sumo_cup.webp')
    // The former individual base rows are gone — Jack Daniel's is now the 6th
    // base chip on the Vaso Sumo card, not a standalone item.
    for (const old of [
      'Vaso Sumo Ron',
      'Vaso Sumo Tequila',
      'Vaso Sumo Vodka',
      'Vaso Sumo Whisky',
      'Vaso New Mix',
      "Vaso Jack Daniel's",
    ]) {
      expect(ALL_DRINKS.find(d => d.nameEs === old)).toBeUndefined()
    }
  })

  it('keeps Tropical Sumo as its own separate card at $169', () => {
    const tropical = ALL_DRINKS.filter(d => d.nameEs === 'Tropical Sumo')
    expect(tropical).toHaveLength(1)
    expect(tropical[0]?.price).toBe('169.00')
  })

  it('maps every spirit item to the destilados group', () => {
    const spiritSubKeys = new Set([
      'ron',
      'vodka',
      'brandy',
      'mezcal',
      'ginebra',
      'tequila',
      'whisky',
      'cremas_licores',
    ])
    const spirits = ALL_DRINKS.filter(
      d => d.drinkSubGroupKey && spiritSubKeys.has(d.drinkSubGroupKey)
    )
    expect(spirits.length).toBeGreaterThan(0)
    for (const d of spirits) expect(d.drinkGroup).toBe('destilados')
  })

  it('lists image-having coffee items before no-image ones', () => {
    const coffee = ALL_DRINKS.filter(d => d.drinkGroup === 'coffee_digestifs')
    const firstNoImage = coffee.findIndex(d => !d.fileName)
    const lastWithImage = coffee.reduce(
      (acc, d, i) => (d.fileName ? i : acc),
      -1
    )
    expect(lastWithImage).toBeLessThan(firstNoImage)
  })
})

// ─── Menu categories + Kids combos ────────────────────────────────────────────

describe('menu categories seed', () => {
  it('renames the rice category to "Arroces" in Spanish, leaving English unchanged', () => {
    const rice = CATEGORIES.find(c => c.key === 'rice')
    expect(rice?.nameEs).toBe('Arroces')
    expect(rice?.nameEn).toBe('Rice')
  })

  it('labels the kids category "Menú Kids" / "Kids Menu"', () => {
    const kids = CATEGORIES.find(c => c.key === 'kids')
    expect(kids?.nameEs).toBe('Menú Kids')
    expect(kids?.nameEn).toBe('Kids Menu')
  })

  it('carries the Kids inclusion note (bilingual) on the kids category', () => {
    const kids = CATEGORIES.find(c => c.key === 'kids')
    expect(kids?.noteEs).toContain('papas a la francesa')
    expect(kids?.noteEs).toContain('yakimeshi')
    expect(kids?.noteEn).toContain('french fries')
    expect(kids?.noteEn).toContain('yakimeshi')
  })

  it('carries the sauce-choice note (bilingual) on the wings category', () => {
    const wings = CATEGORIES.find(c => c.key === 'wings')
    expect(wings?.noteEs).toContain('salsa favorita')
    expect(wings?.noteEn).toContain('favorite sauce')
  })

  it('leaves every category other than kids/wings/the 4 à la carte-only _carta categories without a note', () => {
    const cartaOnlyKeys = new Set([
      'burgers_carta',
      'hot_dogs_carta',
      'cold_rolls_carta',
      'hot_rolls_carta',
    ])
    for (const cat of CATEGORIES) {
      if (cat.key === 'kids' || cat.key === 'wings') continue
      if (cartaOnlyKeys.has(cat.key)) continue
      expect(cat.noteEs ?? null).toBeNull()
      expect(cat.noteEn ?? null).toBeNull()
    }
  })

  it('keeps the shared burgers/hot_dogs/cold_rolls/hot_rolls rows note-less (unsplit, used by AYCE-buffet/Express)', () => {
    for (const key of ['burgers', 'hot_dogs', 'cold_rolls', 'hot_rolls']) {
      const cat = CATEGORIES.find(c => c.key === key)
      expect(cat?.noteEs ?? null).toBeNull()
      expect(cat?.noteEn ?? null).toBeNull()
    }
  })

  it.each([
    [
      'burgers_carta',
      'burgers',
      'Incluye papas a la francesa (100 g) y refresco (400 ml).',
      'Includes french fries (100 g) and a soft drink (400 ml).',
    ],
    [
      'hot_dogs_carta',
      'hot_dogs',
      'Incluye papas a la francesa (100 g) y refresco (400 ml).',
      'Includes french fries (100 g) and a soft drink (400 ml).',
    ],
    [
      'cold_rolls_carta',
      'cold_rolls',
      'Incluye tu elección de yakimeshi mixto (240 g) o ensalada sweet kani (180 g), más refresco (400 ml).',
      'Includes your choice of mixed yakimeshi (240 g) or sweet kani salad (180 g), plus a soft drink (400 ml).',
    ],
    [
      'hot_rolls_carta',
      'hot_rolls',
      'Incluye tu elección de yakimeshi mixto (240 g) o ensalada sweet kani (180 g), más refresco (400 ml).',
      'Includes your choice of mixed yakimeshi (240 g) or sweet kani salad (180 g), plus a soft drink (400 ml).',
    ],
  ])('%s: carries the same display name as %s, plus the combo note', (cartaKey, sharedKey, expectedNoteEs, expectedNoteEn) => {
    const cartaCat = CATEGORIES.find(c => c.key === cartaKey)
    const sharedCat = CATEGORIES.find(c => c.key === sharedKey)
    expect(cartaCat).toBeDefined()
    expect(sharedCat).toBeDefined()
    expect(cartaCat?.nameEs).toBe(sharedCat?.nameEs)
    expect(cartaCat?.nameEn).toBe(sharedCat?.nameEn)
    expect(cartaCat?.noteEs).toBe(expectedNoteEs)
    expect(cartaCat?.noteEn).toBe(expectedNoteEn)
    expect(cartaCat?.isActive).toBe(true)
  })

  it('defines exactly the 4 new _carta categories (no more, no fewer)', () => {
    const cartaKeys = CATEGORIES.filter(c => c.key.endsWith('_carta')).map(
      c => c.key
    )
    expect(cartaKeys.sort()).toEqual(
      [
        'burgers_carta',
        'hot_dogs_carta',
        'cold_rolls_carta',
        'hot_rolls_carta',
      ].sort()
    )
  })
})

// ─── À la carte seed (Part B piece-count copy + Part C category reassignment) ──

describe('à la carte seed (alaCarta.ts)', () => {
  it('appends bilingual piece-count copy ("10 Pzas." / "10 pcs.") to every cold_rolls/hot_rolls/sweet_rolls item', () => {
    const rollItems = ALA_CARTA_ITEMS.filter(item =>
      ['cold_rolls_carta', 'hot_rolls_carta', 'sweet_rolls'].includes(
        item.categoryKey
      )
    )
    // Sanity check the filter actually found items (guards against a silent
    // false-positive if the categoryKey reassignment breaks this lookup).
    expect(rollItems.length).toBeGreaterThan(0)
    for (const item of rollItems) {
      expect(item.descriptionEs.endsWith('10 Pzas.')).toBe(true)
      expect(item.descriptionEn.endsWith('10 pcs.')).toBe(true)
      // Regression guard: the append must not double up on the existing
      // trailing period of the base description (e.g. "...chiltepín.. 10
      // Pzas." is a typo — it must read "...chiltepín. 10 Pzas.").
      expect(item.descriptionEs).not.toContain('..')
      expect(item.descriptionEn).not.toContain('..')
    }
  })

  it('does NOT add piece-count copy to non-roll items (e.g. appetizers, burgers)', () => {
    const nonRollItems = ALA_CARTA_ITEMS.filter(
      item =>
        !['cold_rolls_carta', 'hot_rolls_carta', 'sweet_rolls'].includes(
          item.categoryKey
        )
    )
    for (const item of nonRollItems) {
      expect(item.descriptionEs.endsWith('10 Pzas.')).toBe(false)
      expect(item.descriptionEn.endsWith('10 pcs.')).toBe(false)
    }
  })

  it('reassigns every BURGERS/HOT_DOGS/COLD_ROLLS/HOT_ROLLS item to its _carta categoryKey variant', () => {
    const sharedKeys = ['burgers', 'hot_dogs', 'cold_rolls', 'hot_rolls']
    for (const key of sharedKeys) {
      expect(ALA_CARTA_ITEMS.some(item => item.categoryKey === key)).toBe(false)
    }
    const cartaKeys = [
      'burgers_carta',
      'hot_dogs_carta',
      'cold_rolls_carta',
      'hot_rolls_carta',
    ]
    for (const key of cartaKeys) {
      expect(ALA_CARTA_ITEMS.some(item => item.categoryKey === key)).toBe(true)
    }
  })

  it('leaves sweet_rolls (Sushi Dulce) on its original shared categoryKey (no combo, Part C out of scope)', () => {
    expect(
      ALA_CARTA_ITEMS.some(item => item.categoryKey === 'sweet_rolls')
    ).toBe(true)
  })
})

describe('kids menu seed', () => {
  it('stores kids items with location scope "both" (surfaced via the Kids view)', () => {
    expect(KIDS_LOCATION_TYPE).toBe('both')
  })

  it('keeps the $149 combo price and defines the $179 AYCE price', () => {
    expect(KIDS_PRICE).toBe('149.00')
    expect(KIDS_AYCE_PRICE).toBe('179.00')
  })

  it('defines the six kids combos plus the All You Can Eat Kids item', () => {
    const names = KIDS_ITEMS.map(i => i.nameEs)
    expect(names).toContain('Sushi Kids')
    expect(names).toContain('All You Can Eat Kids')
    expect(KIDS_ITEMS).toHaveLength(7)
  })

  it('lists All You Can Eat Kids FIRST (displayOrder derives from array index)', () => {
    // The seed maps `displayOrder: i`, so the array's first item renders first.
    expect(KIDS_ITEMS[0]?.nameEs).toBe('All You Can Eat Kids')
  })

  it('prices the All You Can Eat Kids item at $179 with the kids image asset', () => {
    const ayce = KIDS_ITEMS.find(i => i.nameEs === 'All You Can Eat Kids')
    expect(ayce?.price).toBe('179.00')
    expect(ayce?.fileName).toBe('menu/kids/all_you_can_eat_kids.webp')
    expect(ayce?.nameEn).toBe('All You Can Eat Kids')
    expect(ayce?.descriptionEs).toContain('2 a 10 años')
    expect(ayce?.descriptionEn).toContain('ages 2 to 10')
  })

  it('marks the All You Can Eat Kids item includedInAyce=true (buffet sub-section)', () => {
    const ayce = KIDS_ITEMS.find(i => i.nameEs === 'All You Can Eat Kids')
    expect(ayce?.includedInAyce).toBe(true)
  })

  it('keeps the six combos at $149 and includedInAyce=false (Combo Infantil sub-section)', () => {
    const combos = KIDS_ITEMS.filter(i => i.nameEs !== 'All You Can Eat Kids')
    expect(combos).toHaveLength(6)
    for (const combo of combos) {
      expect(combo.price).toBeUndefined()
      // Combos default to includedInAyce=false (undefined → false at seed time).
      expect(combo.includedInAyce ?? false).toBe(false)
    }
  })
})

// ─── menu-sets.ts curated keys match the active seed (feature 023 — FR-008/009) ──

/**
 * Guards against `app/features/menu/menu-sets.ts` drifting away from the
 * live content seed: if a curated-set key stops matching an active
 * `menu_categories`/`drink_group` entry, this test fails at build time with
 * the specific key + curated-set name, before the drift reaches production
 * (the runtime guard in `useMenuFilters.ts`/`menu-sets.ts` protects diners at
 * runtime if drift somehow still reaches production).
 *
 * Scope: ONLY `menu_categories` (food sets) and `drink_group` (Bebidas) are
 * asserted here — `sauces` and `drinkSubGroups`/`drink_sub_group` are
 * explicitly out of scope (FR-010) and are never imported by this test file
 * for that purpose (see the `drinkSubGroups` import above, used solely by the
 * pre-existing "drink sub-groups seed" describe block, not by this guard).
 */
describe('menu-sets.ts curated keys match the active seed', () => {
  const activeCategoryKeys = new Set(
    CATEGORIES.filter(c => c.isActive).map(c => c.key)
  )
  const activeDrinkGroupKeys = new Set(DRINK_GROUPS.map(g => g.groupKey))

  const curatedFoodSets: [string, string[]][] = [
    ['AYCE_BUFFET_SET', AYCE_BUFFET_SET],
    ['AYCE_CARTA_SET', AYCE_CARTA_SET],
    ['EXPRESS_SET', EXPRESS_SET],
  ]

  it.each(
    curatedFoodSets
  )('%s: every key has a matching active menu_categories entry', (setName, keys) => {
    for (const key of keys) {
      expect(
        activeCategoryKeys.has(key),
        `${setName} references "${key}", which has no matching active entry in the menu_categories seed`
      ).toBe(true)
    }
  })

  it('DRINKS_SET: every key has a matching active drink_group entry', () => {
    for (const key of DRINKS_SET) {
      expect(
        activeDrinkGroupKeys.has(key),
        `DRINKS_SET references "${key}", which has no matching active entry in the drink_group seed`
      ).toBe(true)
    }
  })

  it('AYCE_CARTA_SET references the 4 _carta keys, not the shared keys', () => {
    const cartaKeys = [
      'burgers_carta',
      'hot_dogs_carta',
      'cold_rolls_carta',
      'hot_rolls_carta',
    ]
    const sharedKeys = ['burgers', 'hot_dogs', 'cold_rolls', 'hot_rolls']
    for (const key of cartaKeys) {
      expect(AYCE_CARTA_SET).toContain(key)
    }
    for (const key of sharedKeys) {
      expect(AYCE_CARTA_SET).not.toContain(key)
    }
  })

  it.each([
    ['AYCE_BUFFET_SET', AYCE_BUFFET_SET],
    ['EXPRESS_SET', EXPRESS_SET],
  ])('%s references the shared burgers/hot_dogs/cold_rolls/hot_rolls keys, not any _carta key', (_setName, keys) => {
    for (const key of ['burgers', 'hot_dogs', 'cold_rolls', 'hot_rolls']) {
      expect(keys).toContain(key)
    }
    for (const key of [
      'burgers_carta',
      'hot_dogs_carta',
      'cold_rolls_carta',
      'hot_rolls_carta',
    ]) {
      expect(keys).not.toContain(key)
    }
  })
})
