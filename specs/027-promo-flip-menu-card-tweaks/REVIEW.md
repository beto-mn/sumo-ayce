# Review: promo-flip-menu-card-tweaks (027)

**Status:** APPROVED

## Precondition
- `feature_list.json` id 27 status: `reviewing` — confirmed before starting.

## Verifications

### Acceptance criteria ↔ test traceability
All 5 user stories' acceptance scenarios have concrete, matching tests:
- **US1 (Part A)**: `server/api/v1/content/validators.test.ts` covers both-present → `Bilingual`,
  both-absent → `null`, ONLY-ES / ONLY-EN → `null` (bilingual-completeness, no fallback),
  whitespace-only → `null`, promo never dropped. `PromotionCard.spec.ts` / `PromotionsCarousel.spec.ts`
  cover flip toggle, `terms:null` → no flip affordance, reduced-motion cross-fade, and
  FR-004 reset-on-navigate (`'resets the flipped card to its front face when navigating to another
  slide (FR-004)'`).
- **US2 (Part B)**: `MenuDishCard.spec.ts` asserts badge is `size-24` (not `size-16`), badge renders
  with no image, and confirms positioning code comment documenting no-overlap vs. `badgeEs`.
- **US3 (Part C)**: `tests/db/menu-item-options-seed.test.ts` asserts Ramen XL's exact 3 groups
  (`noodle_base`/`protein`/`extra_protein`) and their choices/prices; `menu-queries.test.ts` asserts
  `optionGroups` projection (empty/populated/ordered, zero-active-choices group dropped);
  `MenuDishCard.spec.ts` asserts no picker for `optionGroups: []` and one `MenuSaucePicker` per group
  otherwise — this also directly covers AC7 (a future dish with no groups renders with no options
  section).
- **US4 (Part D)**: `tests/db/menu-item-options-seed.test.ts` asserts only "All You Can Eat Kids" is
  flagged and every $149 combo is unaffected; `MenuDishGrid.spec.ts` asserts uniform `MenuDishCard`
  rendering (Ramen XL identical to sibling) and correct `highlightBackground` passthrough per dish.
- **US5 (Part E)**: `MenuDrinkSection.spec.ts` asserts the 6 flavors incl. Jack Daniel's render from
  `drink.optionGroups`, and a drink with no groups shows no picker; `grep` confirms zero remaining
  `menu.vaso_sumo.*` i18n keys in `i18n/locales/{es,en}.json`.

### Phase -1 / Constitution Check gates
`plan.md`'s "Constitution Check" table (this repo's Phase -1 gate equivalent — same convention as
features 023/025) has all 13 articles marked `✅ Pass`, re-confirmed post-design. No violations,
Complexity Tracking table correctly empty.

### Tasks
49/50 marked `[x]`. The one exception, **T048** (Lighthouse spot-check), is explicitly left `[ ]`
with an inline note explaining no Lighthouse/Chrome tooling was available in the implementer's
sandbox — flagged for reviewer/human spot-check, not silently dropped. Confirmed: this sandbox also
has no Chrome/Chromium binary usable by the `lighthouse` CLI (only `npx lighthouse` itself resolves,
no browser). The code-level reasoning holds (no new npm deps; one additional batched query mirroring
the existing `querySauces`/`queryDrinkGroups` precedent) — treated as a non-blocking follow-up for a
human with real browser tooling, consistent with the reviewer protocol's allowance for explicitly
flagged limitations.

### `[NEEDS CLARIFICATION]`
None found in `spec.md`.

### Repo state — `./init.sh` (run independently, not trusting the implementer's paste)
```
Biome check OK
Typecheck OK
Test Files  115 passed (115) / Tests  1002 passed (1002)
Storybook build OK
Environment ready.
```
Exit code 0.

### Sensitive data scan
`git diff master -- ':!pnpm-lock.yaml' ':!package-lock.json'` + untracked-file scan: zero real
matches (only the literal word "token" in prose/comments, e.g. "reused here for token consistency").
No `.env*` files tracked. No PEM/JWT/AWS/Twilio/Mapbox-secret patterns found.

### CHECKPOINTS.md C1–C7
- C1: harness files present, `./init.sh` exit 0. OK.
- C2: exactly one feature (`27`) in `reviewing`, none `in_progress`. OK.
- C3/C3.1: `find app/components -maxdepth 1 -name '*.vue'` → empty. No cross-feature imports
  introduced. No new components added (all changes are edits to existing menu/promotions files).
- C4: at least one test per acceptance criterion (see traceability above); `pnpm test` runs both
  `server/` and `app/` suites; `pnpm check`/`typecheck`/`storybook:build` all exit 0.
- C5: N/A blocking for this review (session-closure bookkeeping is the leader's responsibility after
  approval).
- C6: `spec.md`/`plan.md`/`tasks.md`/`data-model.md`/`research.md`/`quickstart.md` all present; no
  `NEEDS CLARIFICATION`; tasks all `[x]` except the flagged T048.
- C7: clean, see sensitive-data scan above.

## Feature-specific double-checks (per task brief)

- **Part C genericity**: `menu_item_option_groups`/`menu_item_option_choices` (migration `0031`) are
  keyed generically by `menuItemId`; the seed (`server/db/seeds/menuItemOptions.ts`) is a
  `DISH_OPTIONS_SEED: DishOptionsSeed[]` array driven by `dishNameEs` lookup, not hardcoded to Ramen —
  Vaso Sumo (Part E) attaches through the exact same array/mechanism. "Añade extra proteína" is
  modeled as a 2-choice group (`No, gracias` $0.00 / `Sí, extra proteína (+$29)` $29.00) exactly per
  research.md R6a, not a separate add-on entity type.
- **Part D no `display_variant` leftovers**: `grep -rn "displayVariant|MenuDishHero|display_variant"
  app/ server/ types/ tests/` returns only one hit — a code comment in the NEW migration
  (`0030_add_menu_item_highlight_background.sql`) explaining what it *replaces*, not a live reference.
  Mechanism is a standalone `highlightBackground: boolean('highlight_background')` column on
  `menuItems`, independent of the option-groups tables (confirmed FR-020 compliance).
- **Part E DB-driven, not renamed hardcoding**: `MenuDrinkSection.vue` renders `MenuSaucePicker` per
  `drink.optionGroups` entry via the same generic loop as `MenuDishCard.vue` (no `isVasoSumo()`
  special-casing left). `grep -rn "vaso_sumo|vasoSumoFlavors|isVasoSumo"` across `app/ server/ types/
  tests/ i18n/` returns only one hit — a code comment documenting the migrated-from state. i18n files
  have zero `menu.vaso_sumo.*` keys remaining.
- **Part A bilingual-completeness**: `toTerms()` in `validators.ts` returns `{es, en}` only when
  BOTH trim to non-empty, with an explicit code comment noting the deliberate absence of a
  same-language fallback (unlike `badge_en`). `validators.test.ts` proves both one-language-only
  directions plus whitespace-only all resolve to `null`.
- **Migration numbering**: `_journal.json` tail shows `0030_add_menu_item_highlight_background` then
  `0031_add_menu_item_option_groups`, consistent with the two migration files present and with
  `schema.ts`'s `menuItems.highlightBackground` column + `menuItemOptionGroups`/
  `menuItemOptionChoices` table definitions (column list matches `data-model.md` exactly, including
  the `(menuItemId, key)` unique constraint and the `price_delta >= 0` check). No reference to the
  old scrapped `0030_add_menu_item_display_variant.sql` remains anywhere in the tree.

## Notes (non-blocking)
- `progress/current.md`'s top entry still describes the feature at `spec_ready` (pre-dating the two
  amendment rounds and the `in_progress`/`reviewing` transitions) — stale prose, not a state-coherence
  violation since `feature_list.json` (the actual gate) is correct. Worth a housekeeping update when
  this feature closes.
- No `progress/impl_027*.md` file exists; the implementer instead wrote
  `specs/027-promo-flip-menu-card-tweaks/IMPLEMENTER_REPORT.md`, per this review's task instructions.
  Acceptable for this feature; future features should confirm which convention the leader expects.
- T048 (Lighthouse) remains a genuine open item for a human with real browser tooling before
  SC-007 can be considered fully closed — not a rejection reason given the explicit flag and sound
  code-level reasoning, but should not be forgotten.
