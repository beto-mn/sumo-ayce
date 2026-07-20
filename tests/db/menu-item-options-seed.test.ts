import { describe, expect, it, vi } from 'vitest'

// Seed modules import the db client at load time; stub it so importing the
// pure data arrays needs no live DB/env (Article IV — no DB mocks for logic,
// but the seed *data* is a pure constant we assert against directly).
vi.mock('../../server/utils/db', () => ({ db: {} }))

import { ALL_ITEMS as ALA_CARTA_ITEMS } from '../../server/db/seeds/alaCarta'
import { KIDS_ITEMS } from '../../server/db/seeds/kidsMenu'
import { DISH_OPTIONS_SEED } from '../../server/db/seeds/menuItemOptions'

describe('menu_items.highlight_background seed data (feature 027, Part D)', () => {
  it('flags "All You Can Eat Kids" highlightBackground=true', () => {
    const ayceKids = KIDS_ITEMS.find(i => i.nameEs === 'All You Can Eat Kids')
    expect(ayceKids?.highlightBackground).toBe(true)
  })

  it('is the ONLY Kids item flagged highlightBackground=true', () => {
    const highlighted = KIDS_ITEMS.filter(i => i.highlightBackground === true)
    expect(highlighted.map(i => i.nameEs)).toEqual(['All You Can Eat Kids'])
  })

  it('leaves every $149 combo unaffected (no highlightBackground)', () => {
    const combos = KIDS_ITEMS.filter(i => i.nameEs !== 'All You Can Eat Kids')
    expect(combos.length).toBeGreaterThan(0)
    for (const combo of combos) {
      expect(combo.highlightBackground).toBeUndefined()
    }
  })
})

describe('Ramen XL renders as a normal dish card (feature 027, Part C revised)', () => {
  it('has no showcase/hero fileName override — reuses its normal dish photo', () => {
    const ramenXl = ALA_CARTA_ITEMS.find(i => i.nameEs === 'Ramen XL')
    expect(ramenXl?.fileName).toBe('menu/ala-carta/ramen_xl.webp')
  })
})

describe('menu_item_option_groups seed data (feature 027, Parts C & E)', () => {
  it('attaches exactly 3 option groups to Ramen XL: noodle_base, protein, extra_protein', () => {
    const ramenXl = DISH_OPTIONS_SEED.find(d => d.dishNameEs === 'Ramen XL')
    expect(ramenXl?.groups.map(g => g.key)).toEqual([
      'noodle_base',
      'protein',
      'extra_protein',
    ])
  })

  it('"Base de fideo" offers Pollo, Camarón cremoso, Camarón picante, Vegetales picantes', () => {
    const ramenXl = DISH_OPTIONS_SEED.find(d => d.dishNameEs === 'Ramen XL')
    const noodleBase = ramenXl?.groups.find(g => g.key === 'noodle_base')
    expect(noodleBase?.nameEs).toBe('Base de fideo')
    expect(noodleBase?.choices.map(c => c.nameEs)).toEqual([
      'Pollo',
      'Camarón cremoso',
      'Camarón picante',
      'Vegetales picantes',
    ])
  })

  it('"Proteína" offers Res, Camarón, Pollo', () => {
    const ramenXl = DISH_OPTIONS_SEED.find(d => d.dishNameEs === 'Ramen XL')
    const protein = ramenXl?.groups.find(g => g.key === 'protein')
    expect(protein?.nameEs).toBe('Proteína')
    expect(protein?.choices.map(c => c.nameEs)).toEqual([
      'Res',
      'Camarón',
      'Pollo',
    ])
  })

  it('"Añade extra proteína" offers exactly one +$29 choice (DB-editable by design)', () => {
    const ramenXl = DISH_OPTIONS_SEED.find(d => d.dishNameEs === 'Ramen XL')
    const extraProtein = ramenXl?.groups.find(g => g.key === 'extra_protein')
    expect(extraProtein?.choices).toEqual([
      {
        nameEs: 'Extra proteína (+$29).',
        nameEn: 'Extra protein (+$29).',
        priceDelta: '29.00',
      },
    ])
  })

  it('every choice priceDelta is a non-negative decimal string', () => {
    for (const dish of DISH_OPTIONS_SEED) {
      for (const group of dish.groups) {
        for (const choice of group.choices) {
          expect(Number(choice.priceDelta)).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('attaches a single "flavor" (Sabor) group to Vaso Sumo with the same 6 flavors as before', () => {
    const vasoSumo = DISH_OPTIONS_SEED.find(d => d.dishNameEs === 'Vaso Sumo')
    expect(vasoSumo?.groups).toHaveLength(1)
    const flavor = vasoSumo?.groups[0]
    expect(flavor?.key).toBe('flavor')
    expect(flavor?.nameEs).toBe('Sabor')
    expect(flavor?.choices.map(c => c.nameEs)).toEqual([
      'Ron',
      'Tequila',
      'Vodka',
      'Whisky',
      'New Mix',
      "Jack Daniel's",
    ])
  })
})
