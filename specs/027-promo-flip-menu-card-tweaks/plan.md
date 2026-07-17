# Implementation Plan: Promo Flip-to-Terms + Garantía Badge + Ramen XL DB-Driven Options + Kids AYCE Background + Vaso Sumo Migration

**Branch**: `feat/027-promo-flip-menu-card-tweaks` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/027-promo-flip-menu-card-tweaks/spec.md`

## Summary

Five independent client-requested visual/UX/data tweaks. **Part A** (unchanged
this round): promo cards in the shared `PromotionsCarousel.vue` flip on click
to reveal WordPress-sourced bilingual Terms & Conditions (`tyc_es`/`tyc_en`,
both required non-empty), reusing Embla's built-in click-vs-drag suppression
and resetting on slide navigation. **Part B** (unchanged): enlarge the
existing Garantía Sumo badge in `MenuDishCard.vue`. **Part C** (REVISED,
hero-image approach scrapped): "Ramen XL" renders as a completely normal dish
card, gaining a "build your own" options section (noodle base, protein,
extra-protein add-on) driven entirely by two new generic, reusable database
tables (`menu_item_option_groups` + `menu_item_option_choices`), consumed via
the already-generic `MenuSaucePicker.vue` component — no new Vue component,
no Vercel Blob asset, no per-dish display-variant column. **Part D**:
"All You Can Eat Kids" gets an orange→blue gradient behind its image panel via
a new, dedicated `highlightBackground` boolean (simpler replacement for the
scrapped shared `display_variant` column). **Part E** (NEW): Vaso Sumo's 6
hardcoded (i18n-only) flavors migrate onto the same option-groups tables built
for Part C, becoming DB-editable with zero visible change to diners.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Vue 3 Composition API, Node 20 (Vercel runtime)
**Primary Dependencies**: Nuxt 4, `embla-carousel-vue` (existing, no upgrade), Zod (validators), Drizzle ORM. No `@vercel/blob` usage in this revision (Part C's Blob asset is no longer needed — see research.md R6c).
**Storage**: Neon PostgreSQL — one additive boolean column (`menu_items.highlight_background`) and two new additive tables (`menu_item_option_groups`, `menu_item_option_choices`). WordPress `promociones` CPT gains two new ACF fields (assumed keys `tyc_es`/`tyc_en`, confirmed in-progress via a live WP admin screenshot — see research.md R4) upstream — out of this repo's control (coordination status, downgraded from blocking to in-progress). Unchanged this round.
**Testing**: Vitest (co-located `*.spec.ts`) + Storybook stories (`*.stories.ts`) per Article VII
**Target Platform**: Vercel edge/serverless (Nitro), rendered client in evergreen browsers
**Project Type**: Web application (Nuxt 4 frontend + server routes, single repo)
**Performance Goals**: No Lighthouse regression on `/`, `/menu`, `/promotions` (SC-007); flip animation runs at 60fps via GPU-accelerated `transform` only (no layout thrashing); option-groups query adds at most one additional batched DB read per menu request (no N+1).
**Constraints**: No new npm packages (Article X KISS). No destructive migration (Article XIII precedent). No new routes/routeRules (research.md R7). `prefers-reduced-motion` MUST be respected (Part A). The abandoned hero-image artifacts (uncommitted, never merged) MUST be deleted, not adapted (research.md R6c).
**Scale/Scope**: Touches 2 Vue components for Part A (`PromotionsCarousel.vue`, `PromotionCard.vue`), 2 existing menu components for Parts C/D/E (`MenuDishCard.vue`, `MenuDrinkSection.vue` — no new component), 1 grid consumer (`MenuDishGrid.vue`, simplified back to uniform rendering), 2 DB migrations + 3 seed files (`kidsMenu.ts`, `alaCarta.ts`, `drinks.ts`), 1 Zod schema + 3 shared types (`types/wordpress.ts`, `types/content.ts`, `types/menu.ts`), 1 server query file (`menu-queries.ts`), plus deletion of 4 orphaned files from the scrapped approach.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — no changes required.*

| Article | Rule | Status |
|---------|------|--------|
| I — Code Organization & Reusability | The new option-groups mechanism is generic and reusable by construction (FR-013) — attachable to any menu item, not Ramen-specific — directly satisfying "extract into a reusable mechanism when the same pattern appears in 2+ places" (Ramen XL + Vaso Sumo, Parts C & E, from day one). `MenuSaucePicker.vue` (already a generic, non-sauce-specific component) is reused unmodified for both Ramen's option groups and Vaso Sumo's flavors — zero new UI component, zero duplicated picker markup. Part D reuses `MenuDishCard.vue` via a boolean prop, not a duplicated file. `PromotionsCarousel.vue`/`PromotionCard.vue` stay in `app/components/ui/` (unchanged this round). | ✅ Pass |
| II — TypeScript & Framework Standards | All new fields/types typed (`highlightBackground: boolean`, `optionGroups: DishOptionGroup[]`, `terms: Bilingual \| null`), no `any`. Composition API only. | ✅ Pass |
| III — Architecture | WordPress remains headless-CMS-only for `terms` (no Neon involvement for promo content, unchanged). The new option-groups tables and `highlightBackground` column are Neon-only, unrelated to WP. No feature bypasses this separation. | ✅ Pass |
| IV — Testing | New/changed components require co-located Vitest specs (`MenuDishCard.spec.ts`, `MenuDrinkSection.spec.ts` extended; `PromotionCard.spec.ts`/`PromotionsCarousel.spec.ts` extended, unchanged from last round) + `menu-queries.test.ts` cases for `highlightBackground` and `optionGroups` projection + a `validators.ts` case for `terms` parsing (unchanged). | ✅ Pass (tests required, tracked in tasks.md) |
| V — Performance / Rendering strategy | No new routes; `/`, `/menu`, `/promotions` keep their existing `routeRules` (research.md R7, unchanged). Flip animation uses `transform`/`opacity` only (unchanged). Option-groups data is fetched via one additional batched query per menu request (mirrors the existing `sauces`/`drinkGroups` batched-query pattern) — no N+1, no per-dish round trip. | ✅ Pass |
| VI — Security | No new public endpoint surface; existing Zod validation on `promociones` extended (unchanged). Option-groups tables are read-only from the public API's perspective (no write endpoint introduced). | ✅ Pass |
| VII — UX Consistency & Component Docs | All parts stay within existing design tokens (unchanged Part D gradient decision). Every changed component gets/updates a `.stories.ts` (`MenuDishCard.stories.ts` gains `HighlightBackground` + `WithOptionGroups` variants; `MenuDrinkSection.stories.ts` updated to reflect the DB-driven Vaso Sumo flavors; `PromotionCard.stories.ts`/`PromotionsCarousel.stories.ts` unchanged from last round). No new component means no new story file is *required*, though the reused `MenuSaucePicker.vue` may gain an additional story variant demonstrating a non-sauce, non-flavor generic group for documentation completeness. Mobile-first + reduced-motion respected (Part A, unchanged). | ✅ Pass |
| VIII — Clean Code Discipline | No component exceeds 200 lines from these changes (no new component is added; existing components gain small, focused additions). Query functions for option groups follow the existing small-function style already used for `querySauces`/`queryDrinkGroups` in `menu-queries.ts`. | ✅ Pass |
| IX — Quality Gates | No change to Biome/Husky/commitlint config. Standard gates apply. | ✅ Pass |
| X — KISS | No new npm package. No new Vue component for Parts C/D/E (reuses `MenuSaucePicker.vue` and `MenuDishCard.vue`). The extra-protein "add-on" is modeled as a same-shaped option group (a $0/+$29 choice pair) instead of inventing a second group "type" (research.md R6a) — one entity shape, no branching. A dedicated boolean replaces the scrapped shared enum column for Part D once there is nothing left to disambiguate (research.md R5). | ✅ Pass |
| XI — Absolute Imports | All new imports use `@/` aliases. | ✅ Pass |
| XII — Error Handling | WP terms parsing unchanged (Part A). Option-groups queries follow the same `DatabaseUnavailableError`/graceful-degradation pattern already used by `querySauces`/`queryDrinkGroups` — a transient failure yields an empty `optionGroups: []` for the affected dish rather than breaking the whole menu response. | ✅ Pass |
| XIII — Environment Validation | No new env vars. `BLOB_BASE_URL` is no longer needed for this feature at all (Part C's Blob asset requirement is gone) — its existing validation (feature 018) is unaffected either way. | ✅ Pass |

**Post-design re-check**: Confirmed after Phase 1 — the boolean column and the
two new option-groups tables introduce no new constitution violation. No
entries needed in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/027-promo-flip-menu-card-tweaks/
├── plan.md              ← this file
├── spec.md              ← feature spec
├── research.md           ← Phase 0 output
├── data-model.md         ← Phase 1 output
├── quickstart.md         ← Phase 1 output
├── assets/source/
│   ├── ramen-xl-reference.jpg          ← client reference (illustrative — now for the OPTIONS mechanic, not a hero image)
│   └── wp-admin-tyc-fields.png         ← client WP admin screenshot (Part A, unchanged)
├── checklists/requirements.md
└── tasks.md              ← Phase 2 output (/speckit.tasks)
```

No `contracts/` directory: the two server routes touched (`/api/v1/content/promotions`,
`/api/v1/menu`) gain purely **additive** response fields (`terms`,
`highlightBackground`, `optionGroups`) with no shape removal or breaking
change — documented directly in `data-model.md`, mirroring the precedent set
in feature 018-vercel-blob-images.

### Source Code (repository root)

```text
server/
  db/
    schema.ts                                    ← REMOVE the displayVariant column/CHECK already added; ADD highlightBackground boolean to menuItems; ADD menuItemOptionGroups + menuItemOptionChoices tables
    migrations/
      0030_add_menu_item_display_variant.sql      ← DELETE (never merged; see research.md R6c) — journal entry also removed
      0030_add_menu_item_highlight_background.sql ← NEW additive migration, reclaims the freed slot (Part D)
      0031_add_menu_item_option_groups.sql        ← NEW additive migration (Parts C & E)
    seeds/
      kidsMenu.ts                                 ← "All You Can Eat Kids" gains highlightBackground: true (replaces displayVariant: 'highlight')
      alaCarta.ts                                 ← REMOVE any displayVariant: 'hero' already added to "Ramen XL"; add its 3 option groups (new seed data, likely a new seed helper/file)
      drinks.ts                                    ← "Vaso Sumo" gains its "flavor" option group (Part E)
  utils/
    menu-queries.ts                               ← REMOVE displayVariant projection; ADD highlightBackground projection + a batched option-groups query attached to FullMenuDish
    menu-queries.test.ts                          ← REMOVE displayVariant assertions; ADD highlightBackground + optionGroups assertions
  api/v1/
    content/
      validators.ts                               ← unchanged this round (tyc_es/tyc_en, Part A)

types/
  wordpress.ts                                     ← unchanged this round (Part A)
  content.ts                                        ← unchanged this round (Part A)
  menu.ts                                           ← REMOVE displayVariant; ADD highlightBackground, optionGroups, DishOptionGroup, DishOptionChoice

app/
  components/ui/
    PromotionsCarousel.vue / .spec.ts / .stories.ts  ← unchanged this round (Part A)
    PromotionCard.vue / .spec.ts / .stories.ts       ← unchanged this round (Part A)
  features/menu/components/
    MenuDishCard.vue                                 ← larger badge (Part B, unchanged) + highlightBackground-driven gradient (Part D, re-sourced) + renders MenuSaucePicker per dish.optionGroups entry (Part C, new)
    MenuDishCard.spec.ts / .stories.ts                ← extended for highlightBackground + optionGroups
    MenuDishHero.vue / .spec.ts / .stories.ts         ← DELETE (orphaned, never merged; see research.md R6c)
    MenuDishGrid.vue                                  ← simplified: removes the MenuDishHero swap entirely, renders MenuDishCard uniformly for every dish
    MenuDrinkSection.vue                              ← REMOVE isVasoSumo()/vasoSumoFlavors/flavorOptions hardcoding; renders MenuSaucePicker per drink.optionGroups entry (Part E, generic — same code path as Part C)
    MenuDrinkSection.spec.ts / .stories.ts            ← updated to reflect DB-driven Vaso Sumo flavors
    MenuSaucePicker.vue                                ← UNCHANGED (already generic; reused as-is for Parts C & E)

i18n/locales/es.json, en.json                        ← REMOVE menu.vaso_sumo.flavor.* and menu.vaso_sumo.picker_label keys once the DB-driven groups replace them (Part E)

tests/db/menu-display-variant.test.ts                 ← DELETE if present (orphaned, written against the scrapped mechanism)

specs/027-promo-flip-menu-card-tweaks/assets/source/
  ramen-xl-reference.jpg                             ← client reference composition (already present, now illustrating the OPTIONS mechanic)
  wp-admin-tyc-fields.png                            ← client WP admin screenshot (already present, Part A)
```

**Structure Decision**: Single Nuxt 4 repo (Article III). Frontend changes stay
within `app/components/ui/` (Part A, unchanged) and `app/features/menu/components/`
(Parts B/C/D/E) per Article I's folder boundaries — no cross-feature imports
introduced, and no new component added despite three parts (C/D/E) touching
the menu feature. Backend changes stay within `server/db/` and
`server/utils/menu-queries.ts` — no new server route is added. The two
orphaned artifact groups (old migration + `MenuDishHero.*`) are deleted as
part of this same structure change, per research.md R6c.

## Complexity Tracking

> No constitution violations — table not needed.
