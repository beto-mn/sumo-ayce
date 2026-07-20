# Phase 0 Research: À La Carte Combo Notes & Menu Copy Refresh

## R1 — Part A: is the "rice" category à la carte-exclusive?

**Question**: Does renaming `menu_categories.name_es` for `key = 'rice'` risk leaking into AYCE-buffet or Express views?

**Decision**: No risk. Proceed with a single-row rename.

**Evidence**: `grep -n "categoryKey: 'rice'"` across `server/db/seeds/ayceMenu.ts` and
`server/db/seeds/expressMenu.ts` returns zero matches. The only seed file that references the
`rice` category key is `server/db/seeds/alaCarta.ts` (`RICE_DISHES`, 4 items: Yakimeshi Mixto,
Yakimeshi Especial, Gohan Teriyaki, Gohan Especial). The category row itself is shared
infrastructure (`menu_categories` has one row per `key`, unique), but since no other seed file
populates dishes under this key, renaming its `nameEs` cannot visually affect any other modality.

**Alternatives considered**: None needed — this is a pure confirmation task.

---

## R2 — Part B: does "5 pzas" piece-count copy already exist, and where?

**Question**: The original ticket claimed "5 pzas" text already exists somewhere in the live
menu and asked us to verify before deciding how "10 Pzas" should be worded/placed in à la carte.

**Decision**: The client's claim is correct, but the original research (which searched for the
literal string "pzas") missed it due to an abbreviation mismatch. A broader search confirms:

- `server/db/seeds/ayceMenu.ts` — every item under `cold_rolls`, `hot_rolls`, and `sweet_rolls`
  ends its `descriptionEs` with **"5 pzs."** (19 matches). No English equivalent is present in
  the AYCE-buffet English descriptions.
- `server/db/seeds/expressMenu.ts` — the same items end `descriptionEs` with **"5 pzs."** AND
  end `descriptionEn` with **"5 pcs."** (both languages).
- `server/db/seeds/kidsMenu.ts` and the `kids` category note in `menuCategories.ts` use the
  spelling **"5 pzas"** (with an "a"), in a different, unrelated context (the Kids combo item).
- `server/db/seeds/alaCarta.ts` — `COLD_ROLLS`, `HOT_ROLLS`, and `SWEET_ROLLS` items have **zero**
  piece-count text in either language today (confirmed, no matches).

**Rationale for resolution**: Since à la carte rolls are 10 pieces (vs. 5 for buffet/Express),
and the client's own combo flyers literally print "10 PZAS", the correct fix is to append
bilingual piece-count copy to every à la carte roll description: **"10 Pzas."** (Spanish) and
**"10 pcs."** (English), mirroring the existing convention of a trailing sentence at the end of
the description — matching the placement already used in `ayceMenu.ts`/`expressMenu.ts`, and
providing both languages (unlike the AYCE-buffet ES-only precedent) since the site is fully
bilingual and à la carte descriptions are already fully translated in both languages.

**Alternatives considered**:
- Mirror the exact "5 pzs." abbreviation style → rejected in favor of the client's own flyer
  wording ("10 PZAS" → "10 Pzas.") since Part B and Part C both source their copy from the same
  client flyers, keeping voice consistent within this feature.
- Add piece count as a separate structured field instead of inline description text → rejected
  per KISS (Article X): no other part of the schema models "piece count" as data, and doing so
  here would be a schema change for a single cosmetic string with no other consumer.

---

## R3 — Part C: are burgers/hot_dogs/cold_rolls/hot_rolls à la carte-exclusive (like `rice`), or shared?

**Question**: Whether the existing `noteEs`/`noteEn` mechanism (already modality-agnostic, used
by `kids` and `wings`) can be safely reused as-is for the four Part C categories, or whether a
modality-scoped extension is required.

**Decision**: These four categories are **shared across all three modalities** — the existing
mechanism is NOT safe to reuse as-is. A modality-scoped extension is required.

**Evidence**: `grep -n "categoryKey: '(burgers|hot_dogs|cold_rolls|hot_rolls)'"` across all three
seed files returns real item rows in every file:

| Category key | `ayceMenu.ts` (buffet) | `expressMenu.ts` | `alaCarta.ts` (à la carte) |
|---|---|---|---|
| `burgers` | yes (7 items) | yes (7 items) | yes (5 items) |
| `hot_dogs` | yes (3 items) | yes (3 items) | yes (3 items) |
| `cold_rolls` | yes (8 items) | yes (7 items) | yes (8 items) |
| `hot_rolls` | yes (9 items) | yes (7 items) | yes (8 items) |

Since `menu_categories` has exactly one row per `key` (shared across all dishes that reference
it via `categoryId`), and `server/utils/menu-queries.ts`'s `groupByCategory()` attaches
`categoryNoteEs`/`categoryNoteEn` from that single row with no modality branching, populating the
existing `noteEs`/`noteEn` columns for these four keys would make the combo note appear in
**every** modality's view of Hamburguesas/Hot Dogs/Sushi Frío/Sushi Caliente — including AYCE
buffet and Express, where no combo applies. This is confirmed unacceptable per FR-008/FR-009.

**Decision — schema shape**: Add two new nullable columns to `menu_categories`:
`carta_note_es` / `carta_note_en` (Drizzle: `cartaNoteEs`, `cartaNoteEn`), populated only for
`burgers`, `hot_dogs`, `cold_rolls`, `hot_rolls`. `server/utils/menu-queries.ts` selects these
columns alongside the existing note columns and, in `groupByCategory()`, attaches
`{ es, en }` sourced from `cartaNoteEs`/`cartaNoteEn` when the already-resolved `modality`
argument is `'carta'` and those columns are non-null; otherwise it falls back to the existing
`categoryNoteEs`/`categoryNoteEn` behavior exactly as today. Because `resolveModality()` already
coerces Express to `'buffet'` unconditionally before `groupByCategory()` is ever called, Express
can never observe a `'carta'` modality — no additional Express-specific guard is required.

**Alternatives considered**:
1. **Separate `menu_category_notes` table keyed by `(category_id, modality)`** — rejected per
   KISS (Article X). This use case is bounded to exactly 4 categories, 1 extra modality, and no
   evidence of a third or fourth "modality" ever needing a note in this domain (Express has no
   à la carte, buffet already covered by the generic note). A join table adds query complexity,
   a migration, and a new seed helper for a problem two nullable columns solve directly. The
   100-line threshold for introducing new abstraction (Article X) is not met.
2. **Split the shared `menu_categories` row into per-modality rows** (e.g. `cold_rolls_carta`,
   `cold_rolls_buffet`) — rejected: this would require re-keying every dish's `categoryId`
   reference across three seed files for four categories, a much larger and riskier migration
   than the ticket's "DB-seed-only copy change" framing implies, and would break the category
   chip/grouping logic that currently assumes one category = one chip across modalities
   (`docs/business/overview.md` §5 lists categories once, not per-modality).
3. **A boolean `is_carta_only` flag reusing the existing `noteEs`/`noteEn` columns**, gating
   whether the shared note renders in buffet/Express — rejected: it would force ALL of a
   category's notes (including any future kids/wings-style additions on these same categories)
   into a single all-or-nothing modality visibility, whereas the two-column-pair approach lets a
   category carry a modality-agnostic note AND a carta-only note simultaneously if ever needed
   (see spec Edge Cases), which is more flexible without being more complex to reason about.

---

## R3 — REVISION (post spec_ready human review): category split supersedes the two-column design

**Context**: After the spec/plan/tasks package above reached `spec_ready`, the human reviewer
rejected the two-nullable-columns + query-layer-branch design (alternative 2 above, "split the
shared row into per-modality rows") on the grounds that it should go through the database properly
— i.e. new category records should exist so that à la carte-only combo items are backed by their
own manageable categories, rather than a hidden per-modality flag layered onto a shared row. This
supersedes R3's original recommendation; alternative 2 is **un-rejected** for this revision, with
one refinement that resolves the original objection to it.

**Revised decision**: Give each of the four affected categories a second, à la carte-only category
record — same displayed bilingual name, distinct key (`_carta` suffix: `burgers_carta`,
`hot_dogs_carta`, `cold_rolls_carta`, `hot_rolls_carta`) — that carries the combo note. Reassign
the affected à la carte menu items (already isolated in `alaCarta.ts`, since à la carte items were
always modeled as separate rows from `ayceMenu.ts`/`expressMenu.ts` items) to point at the new
category record instead of the shared one.

**Why this addresses the original R3 rejection of a row-split** (re-examined): The original R3
rejected a row-split for two stated reasons — (a) it would require "re-keying every dish's
`categoryId` reference across three seed files for four categories" and (b) it would "break the
category chip/grouping logic that currently assumes one category = one chip across modalities."
Both concerns turn out to be smaller than R3 originally estimated, once actually traced through the
code:

- (a) Re-keying is required in exactly **one** seed file (`alaCarta.ts`), not three — the à la
  carte items for `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls` are already fully separate arrays
  (`BURGERS`, `HOT_DOGS`, `COLD_ROLLS`, `HOT_ROLLS`) from the AYCE-buffet/Express equivalents in
  `ayceMenu.ts`/`expressMenu.ts`, which are **not** touched — only the à la carte side needs its
  `categoryKey` field changed, item-by-item, within a single file.
- (b) The "one category = one chip across modalities" assumption is not actually broken, because
  the per-view chip rows are already modality-exclusive and curated independently per view
  (`app/features/menu/menu-sets.ts`, feature 023's `AYCE_BUFFET_SET`/`AYCE_CARTA_SET`/
  `EXPRESS_SET`) — updating `AYCE_CARTA_SET` alone to point at the 4 new keys, while
  `AYCE_BUFFET_SET`/`EXPRESS_SET` keep the original shared keys, reproduces the exact same "one
  chip labeled Hamburguesas per view" behavior visitors see today. Confirmed via
  `MenuShell.vue`, which renders exactly one category section at a time
  (`props.menuData.categories.find(c => c.key === activeCategory.value)`) — there is no
  "all-categories" or "all-modalities" view that would ever render the shared and split variants
  side by side. This is exactly the precedent this project already established for feature 023
  (curated, per-view category membership living in `menu-sets.ts`, not in the DB schema) and for
  prior category-key additions (`rice`+`ensalada`+`arroces` in migration 0021, `ramen` in
  migration 0022) — this revision is a direct continuation of that pattern, not a new one.

**New finding — the query layer needs zero changes, not a smaller branch**: Tracing
`ayceModalityFilter()` (`server/utils/menu-queries.ts`) shows the split design doesn't just avoid
adding a *new* branch — it makes the *previously proposed* branch in `groupByCategory()`
unnecessary entirely. `ayceModalityFilter()` already restricts a `buffet`-modality query to
`includedInAyce = true` rows and a `carta`-modality query to `includedInAyce = false` rows. À la
carte items are always seeded `includedInAyce: false`; AYCE-buffet items are always seeded
`includedInAyce: true`. Once à la carte items point at `burgers_carta` and buffet items point at
`burgers`, a `buffet` query can never surface a `burgers_carta` row and a `carta` query can never
surface a `burgers` row — each category row is modality-exclusive as a side effect of filtering
logic that already existed for pricing/inclusion reasons, unrelated to this feature. `note_es`/
`note_en` therefore flow through `groupByCategory()`'s existing, completely unmodified code path.

**Schema footprint re-examined**: `menu_categories.key` is a Postgres enum
(`menu_category_key`), so the 4 new key strings do require *a* migration — but the minimal kind
already established twice in this exact codebase (`0021_add_ensalada_arroces_category_keys.sql`,
`0022_add_ramen_category_key.sql`): a same-shaped `ALTER TYPE ... ADD VALUE IF NOT EXISTS` per new
key, zero column changes, zero table changes. This is a strictly smaller migration than the
originally-planned two-nullable-columns migration, and removes the query-layer branch entirely —
a stronger Article X (KISS) outcome than the original R3 recommendation, not a weaker one.

**Alternatives re-considered under the revision**:
- Widen `menu_categories.key` from an enum to free `text` to avoid touching the enum at all —
  rejected: this would be a larger, more invasive migration (dropping a constraint that every
  existing row and query currently benefits from) purely to avoid a two-line additive enum
  migration that this project already has two precedents for; it would also weaken Article II
  type-safety guarantees on `MenuCategoryKey`. Not KISS — trades a small, precedented change for a
  bigger, novel one.
- Keep the two-column/query-branch design and simply relabel it — rejected outright per the
  client's explicit instruction that new categories, not a hidden per-modality flag, are the
  correct DB shape here.

**Consumer-safety check (repo-wide)**: `grep`-ed `app/`, `server/`, `tests/` for hardcoded
dependence on the literal `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls` key strings outside the
seed files and `menu-sets.ts` themselves. The only conditional keyed off `category.key` anywhere
in the app layer is `MenuDishGrid.vue`'s `showThermometer()` (`category.key === 'wings'`),
unrelated to the four affected keys. No i18n key is namespaced by category key. Storybook
`.stories.ts` fixtures reference these keys as static illustrative fixtures, independent of the
live DB seed, and are unaffected. No other consumer breaks from the key split.

---

## R4 — Reseed procedure risk

**Question**: What operational risk exists in the "delete records, re-run seed" cycle this
feature requires?

**Decision**: Document the known, pre-existing `resetDrinkChildren()` foreign-key-order bug
(`server/db/seeds/drinkGroups.ts`, surfaced during feature 028, tracked in
`progress/current.md`) in `quickstart.md` as a sanity-check step before/after the full reseed.
This bug is unrelated to the `menu_categories`/`menuItems` rows this feature touches (it affects
drink-item cleanup ordering, not rice/burgers/hot_dogs/rolls/the 4 new `_carta` categories), but
any full `pnpm db:seed` re-run touches the same seed pipeline entry point, so it is a real risk to
the reseed step of this feature's rollout and must not be silently ignored.

**Alternatives considered**: Fixing the bug as part of this feature — rejected, explicitly out
of scope per the ticket ("unrelated to this feature's categories but worth a sanity check").

---

## R5 — Testing approach

**Decision**: Follow the existing test conventions already established for this exact surface:

- `tests/db/menu-seeds.test.ts` — has a `describe('menu categories seed', …)` block with
  `it('leaves every category other than kids/wings without a note', …)`. **[Revised]** Under the
  category-split design, this existing test needs a small update (not just an addition): it must
  keep passing for the shared `burgers`/`hot_dogs`/`cold_rolls`/`hot_rolls`/`sweet_rolls` rows
  (still note-less, unchanged) while excluding the 4 new `_carta` rows, which are asserted
  separately (bilingual name matches their shared counterpart; bilingual note matches the combo
  copy in `data-model.md`). New assertions are also added for: every `alaCarta.ts` BURGERS/
  HOT_DOGS/COLD_ROLLS/HOT_ROLLS item's `categoryKey` pointing at its `_carta` variant, and the
  existing `describe('menu-sets.ts curated keys match the active seed', …)` drift-guard block
  (already generic per curated set) gains explicit assertions that `AYCE_CARTA_SET` contains the
  4 `_carta` keys and not the shared ones, and vice versa for `AYCE_BUFFET_SET`/`EXPRESS_SET`.
- **[Revised]** `server/utils/menu-queries.ts` is unmodified by this revision, so
  `server/utils/menu-queries.test.ts` needs **no new cases** — the previously-planned
  carta/buffet/Express note-visibility assertions are unnecessary because that behavior is now a
  consequence of seed data (which category row an item points at) plus the query layer's
  pre-existing, untouched `ayceModalityFilter()`/`groupByCategory()` logic, not new query-layer
  code that would need its own dedicated test coverage.
- Per constitution Article IV, these server-side/seed-data unit tests are written before the
  corresponding seed/schema implementation changes (TDD), co-located with the files they test,
  named by behavior not implementation.
