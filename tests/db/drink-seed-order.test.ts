import { beforeEach, describe, expect, it, vi } from 'vitest'

// Regression test for the FK-ordering bug: seedDrinkGroups must clear the
// child rows (bebidas menu_items, then drink_sub_groups) BEFORE deleting the
// legacy `beers_spirits` / `non_alcoholic` drink_group rows — otherwise the
// group DELETE violates menu_items_drink_group_id_fkey on a DB that still holds
// the pre-021 data. A recording db mock captures the operation sequence.

type Op =
  | { kind: 'select' }
  | { kind: 'insert'; table: string }
  | { kind: 'delete'; table: string }

const { ops, tableNames, tables } = vi.hoisted(() => {
  const names = new WeakMap<object, string>()
  const make = (name: string): object => {
    const obj = { __table: name }
    names.set(obj, name)
    return obj
  }
  return {
    ops: [] as Op[],
    // Identity map: schema tables are mocked as tagged objects so the recorder
    // can name the table each delete/insert targets.
    tableNames: names,
    tables: {
      menuCategories: make('menu_categories'),
      menuItems: make('menu_items'),
      drinkGroups: make('drink_group'),
      drinkSubGroups: make('drink_sub_group'),
    },
  }
})

vi.mock('../../server/db/schema', () => ({
  menuCategories: tables.menuCategories,
  menuItems: tables.menuItems,
  drinkGroups: tables.drinkGroups,
  drinkSubGroups: tables.drinkSubGroups,
}))

// db mock: records select/insert/delete calls and resolves the chains the seed
// awaits. The bebidas category lookup resolves to a stub id. Built inside the
// hoisted factory so it only closes over the hoisted `ops` / `tableNames`.
vi.mock('../../server/utils/db', () => ({
  db: {
    select: () => {
      ops.push({ kind: 'select' })
      const chain = {
        from: () => chain,
        where: () => chain,
        // `.limit(1)` is awaited for the bebidas category lookup.
        limit: () => Promise.resolve([{ id: 'bebidas-cat-id' }]),
      }
      return chain
    },
    insert: (table: object) => {
      ops.push({ kind: 'insert', table: tableNames.get(table) ?? '?' })
      const chain = {
        values: () => chain,
        onConflictDoUpdate: () => Promise.resolve(),
      }
      return chain
    },
    delete: (table: object) => {
      ops.push({ kind: 'delete', table: tableNames.get(table) ?? '?' })
      // Support both `db.delete(t)` (awaited directly — no .where) and
      // `db.delete(t).where(...)` (awaited after .where).
      const result: Record<string, unknown> = {
        where: () => Promise.resolve(),
      }
      Object.defineProperty(result, 'then', {
        value: (resolve: (v: unknown) => unknown) => resolve(undefined),
      })
      return result
    },
  },
}))

import { seedDrinkGroups } from '../../server/db/seeds/drinkGroups'

beforeEach(() => {
  ops.length = 0
})

describe('seedDrinkGroups — FK-safe reset order', () => {
  it('clears bebidas menu_items and drink_sub_groups before deleting any drink_group', async () => {
    await seedDrinkGroups()

    const deletes = ops.filter(o => o.kind === 'delete') as Extract<
      Op,
      { kind: 'delete' }
    >[]
    const deletedTables = deletes.map(d => d.table)

    // All three destructive deletes happened.
    expect(deletedTables).toContain('menu_items')
    expect(deletedTables).toContain('drink_sub_group')
    expect(deletedTables).toContain('drink_group')

    const firstGroupDelete = deletedTables.indexOf('drink_group')
    const menuItemsDelete = deletedTables.indexOf('menu_items')
    const subGroupDelete = deletedTables.indexOf('drink_sub_group')

    // Child rows are deleted BEFORE the parent drink_group rows (FK-safe).
    expect(menuItemsDelete).toBeLessThan(firstGroupDelete)
    expect(subGroupDelete).toBeLessThan(firstGroupDelete)
  })

  it('deletes children before it upserts the new drink_group rows', async () => {
    await seedDrinkGroups()

    const firstInsert = ops.findIndex(o => o.kind === 'insert')
    const menuItemsDelete = ops.findIndex(
      o => o.kind === 'delete' && o.table === 'menu_items'
    )
    const subGroupDelete = ops.findIndex(
      o => o.kind === 'delete' && o.table === 'drink_sub_group'
    )

    expect(menuItemsDelete).toBeGreaterThanOrEqual(0)
    expect(menuItemsDelete).toBeLessThan(firstInsert)
    expect(subGroupDelete).toBeLessThan(firstInsert)
  })

  it('removes both legacy groups (beers_spirits and non_alcoholic)', async () => {
    await seedDrinkGroups()
    const groupDeletes = ops.filter(
      o => o.kind === 'delete' && o.table === 'drink_group'
    )
    // Two explicit legacy-group deletes (beers_spirits + non_alcoholic).
    expect(groupDeletes.length).toBe(2)
  })
})
