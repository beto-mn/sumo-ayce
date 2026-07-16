# Data Model — Menu Chip / DB Drift Guard (023)

No schema changes. This feature reads existing entities as-is; the only "model" additions are
presentation-layer (pure TS) shapes, listed below for completeness.

## 1. Existing entities read (UNCHANGED)

### `menu_categories` (Neon, via `server/db/schema.ts`)

Read via `server/utils/menu-queries.ts` → `FullMenuResult.categories[].key`. No column
changes. Used as the "is this curated category actually present" source of truth for food
views (AYCE buffet, AYCE Carta, Express).

### `drink_group` (Neon, via `server/db/schema.ts`)

Read via `server/utils/menu-queries.ts` → `FullMenuResult.drinkGroups[].key`
(`DrinkGroupMeta[]`, added in feature 021). No column changes. Used as the "is this curated
drink group actually present" source of truth for the Bebidas view.

### `sauces`, `drink_sub_group` — explicitly UNCHANGED, UNREAD by this feature

Neither table is queried, imported, or asserted against by any code added in this feature
(FR-010). They remain fully owned by their existing consumers (`MenuSaucePicker`,
`MenuDrinkSection.vue`).

## 2. Presentation-layer additions (no table — pure TypeScript)

### `filterAvailableKeys` (new pure function, `app/features/menu/menu-sets.ts`)

```ts
function filterAvailableKeys(keys: string[], availableKeys: Set<string>): string[]
```

| Param | Type | Meaning |
|---|---|---|
| `keys` | `string[]` | One of the four curated sets (`AYCE_BUFFET_SET`, `AYCE_CARTA_SET`, `EXPRESS_SET`, `DRINKS_SET`), in curated order |
| `availableKeys` | `Set<string>` | The `key`s present in the current `FullMenuResult.categories` (food views) or `FullMenuResult.drinkGroups` (Bebidas), built once per render from the fetched menu data |

**Returns**: the subset of `keys` that are members of `availableKeys`, preserving the input
order (curated order is authoritative for ordering; availability is authoritative for
membership only — see spec FR-003).

**Invariants**:
- Never adds a key that wasn't already in `keys` (curated sets remain the sole source of
  *candidate* chips — FR-007).
- Never reorders `keys` (FR-003).
- Pure — no side effects, no Vue reactivity dependency, safe to unit test directly.

### `curatedSet` (existing computed, `useMenuFilters.ts`) — behavior change only

| Aspect | Before (021) | After (023) |
|---|---|---|
| Source | `getCuratedSet(activeSelection, activeModality)` — static list only | `filterAvailableKeys(getCuratedSet(...), availableKeysFromMenuData)` — static list minus any key with no matching live entry |
| Type | `ComputedRef<string[]>` | `ComputedRef<string[]>` (unchanged shape) |
| Consumers | `MenuShell.vue` `chipItems` | Unchanged — same consumer, now receives an already-filtered list |

`useMenuFilters` needs the current `FullMenuResult` (or just its category/drink-group keys) as
an additional input to compute `availableKeys`. This is passed in the same way
`props.menuData` already flows into `MenuShell.vue` today — no new fetch, no new prop on
`MenuShell.vue` (menu data already arrives via its existing `menuData` prop); the composable
gains an additional parameter (or a reactive source) carrying the relevant keys, decided at
implementation time to minimize churn to the existing `useMenuFilters(initialSelection,
initialModality)` call site in `MenuShell.vue`.

### `resolveActiveKey` (existing pure function, `menu-sets.ts`) — no signature change

Already resolves an out-of-set key to the view's default (FR-013d, feature 021). This
feature's only requirement (FR-005) is that the set passed to it for membership-checking is
now the *filtered* set, not the raw curated set — so a key that is curated but no longer
available is treated exactly like a key that was never curated at all: fallback to default.
No change to `resolveActiveKey`'s own logic is required; only its caller now passes a filtered
set.

## 3. Test fixtures (new/extended, no table)

### `menu-sets.test.ts` (NEW)

Exercises `filterAvailableKeys` directly with small literal arrays — no DB, no seed import
needed (pure function, pure inputs).

### `tests/db/menu-seeds.test.ts` (EXTENDED)

New `describe` block imports `AYCE_BUFFET_SET`, `AYCE_CARTA_SET`, `EXPRESS_SET`, `DRINKS_SET`
from `app/features/menu/menu-sets.ts` and `CATEGORIES`, `DRINK_GROUPS` from
`server/db/seeds/menuCategories.ts` / `server/db/seeds/drinkGroups.ts` (same `vi.mock` DB stub
already in the file) and asserts set-membership, per FR-008/FR-009.

## 4. Relationships (unchanged)

No new relationships are introduced. The existing relationships already established in
feature 021's `data-model.md` (§2 Entities touched) are the ones this feature reads from —
no foreign keys, no new joins, no new columns.
