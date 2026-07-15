# Implementation Plan: Menu Experience Overhaul (data + UI)

**Branch**: `feat/021-menu-experience-overhaul` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/021-menu-experience-overhaul/spec.md`

---

## ⚑ DB MIGRATION REQUIRED: **YES (three small, additive migrations)**

> **Reconciled 2026-07-14.** The plan originally scoped ONE migration. As delivered, THREE additive
> migrations shipped (0027/0028/0029), all applied to production Neon and re-seeded. The extra two
> land the DB-driven labels (0028) and the Kids category note (0029) that arrived with the
> client-approved scope growth (Kids view + labels moved out of i18n).

Three additive Drizzle/Neon migrations, plus seed + i18n + component changes. Each migration is
**minimal and low-risk** (one integer-with-default or nullable-text column). Every other change is
seed / i18n / component only.

| Change | Migration? | Justification |
|---|---|---|
| **Destilados split into its own drink group** | **NO (seed + type union)** | `drink_group.groupKey` is free-text `varchar(60)`. New `destilados` group is a seed INSERT; re-mapping spirit items is a seed UPDATE. `DrinkGroup` union: `beers_spirits` → `beers`, `+ destilados`, `- non_alcoholic` (folds into `sodas`). |
| **Deterministic ordering of the 6 drink groups** | **YES — 0027 `drink_group.display_order integer NOT NULL DEFAULT 0`** | No ordering column existed; group order is load-bearing once Destilados is its own button. Backfilled by seed (0..5). |
| **DB-driven drink-group labels** | **YES — 0028 `drink_group.name_es` / `name_en` (nullable text)** | Labels moved out of i18n into the DB (single source of truth), mirroring `menu_categories.name_es/en`. `menu.drink_group.*` i18n keys removed. |
| **Kids combo inclusion note** | **YES — 0029 `menu_categories.note_es` / `note_en` (nullable text)** | The Kids "Combo incluye…" box is a per-category section note; backfilled only for `kids`. Mirrors the drink-group promo note. |
| **DB-driven food category labels** | **NO (columns pre-existed)** | `menu_categories.name_es/en` already existed; `menu.category.*` i18n keys removed and the DB name is read directly. |
| **Vaso Sumo consolidation (5 → 1, six-base selector)** | **NO (seed)** | Keep one canonical "Vaso Sumo" row; six bases (Ron/Tequila/Vodka/Whisky/New Mix/Jack Daniel's) are a code-known list via the reused picker. Tropical Sumo stays a separate row. |
| **Garantías Sumo — 11 featured (dedup rail)** | **NO (seed UPDATE)** | Set `featured=true` + `featuredOrder` on the 11 dishes across ALL their location rows; homepage query dedupes by name → 11 unique. |
| **2x1 / Combo Mezcladores note once for Destilados** | **NO (seed)** | Promo text on group-level `drink_group.promoEs/En`; spirit sub-group promo nulled. |
| **Caguamón first; Café/Digestivos image-first** | **NO (seed `displayOrder`)** | Sub-group + item `displayOrder`. |
| **Kids as a standalone VIEW (two sections)** | **NO (presentation + kidsMenu seed)** | Kids items seeded under `kids` (`locationType='both'`), split by `includedInAyce` in `MenuShell`; not part of any food set. |
| **Curated ordered category SETS per (selection, modality)** | **NO (menu-sets config + existing data)** | `menu-sets.ts` config drives order + default + asymmetries; membership derives from `locationType` + `includedInAyce`. |
| **Whole-card hover-zoom, cursor-pointer, half-width drink cards, star badge, "Carta"/"Menu" label** | **NO (component + i18n)** | Tailwind classes + asset + i18n value change only. |

**Migration files** (hand-written additive, journal updated, applied to prod Neon then reseeded):
`0027_add_drink_group_display_order.sql`, `0028_add_drink_group_name.sql`,
`0029_add_menu_category_note.sql`.

---

## Summary

Restructure `/menu` from a two-axis, show-everything layout into a **four-way primary navigation**
(a segmented AYCE | Express pill + standalone Bebidas y coctelería and Kids buttons) with an
AYCE-only secondary modality (All You Can Eat / Carta), where each selection renders a **curated,
ordered category set** (or, for Kids, two fixed sub-sections) and the page lands on a **single
default category** (AYCE · All You Can Eat · Entradas; Bebidas → Coctelería Jumbo). Move category
and drink-group **labels into the database** (0028/0029 + pre-existing category names) so the DB is
the single source of truth (i18n `menu.category.*`/`menu.drink_group.*` removed). Alongside: split
**Destilados** into its own group (0027 group order; `beers_spirits`→`beers`; `non_alcoholic`→`sodas`),
de-duplicate the 2x1 promo note to render once, order Caguamón first and Café/Digestivos image-first,
consolidate the Vaso Sumo items into one six-base selector card (reusing `MenuSaucePicker`) with
Tropical Sumo separate, remove the sauce picker from Alitas & Boneless, flag the 11 Garantías Sumo
dishes featured on every location row and dedupe the homepage rail by name to 11 unique, and polish
dish cards (whole-card hover-zoom on hover-capable devices, Garantía star badge, half-width no-image
drink cards, "Carta"/"Menu" label). Robustness: image cache-busting, Neon retry, graceful empty-menu
degradation. No new routes; `/menu` renders `ssr: true` (it was never ISR).

## Technical Context

**Language/Version**: TypeScript (strict) on Nuxt 4 (Vue 3, Composition API only), Node 20.
**Primary Dependencies**: Nuxt 4, Drizzle ORM, `@neondatabase/serverless`, `@nuxtjs/i18n`,
Tailwind CSS, Vitest (+ happy-dom, `@vue/test-utils`), Storybook 10, Biome, vue-tsc.
**Storage**: Neon PostgreSQL via Drizzle. Menu tables: `menu_categories`, `menu_items`, `sauces`,
`drink_group`, `drink_sub_group`. Images via Vercel Blob (`BLOB_BASE_URL`).
**Testing**: Vitest — `app/**` under happy-dom, `server/**` under node; co-located `*.spec.ts`.
Storybook stories co-located `*.stories.ts`.
**Target Platform**: Vercel (Nuxt SSR/ISR). `/menu` is `isr: 3600`.
**Project Type**: Web application (single Nuxt repo; frontend `app/`, backend `server/`).
**Performance Goals**: Lighthouse 90+ on `/menu`; no regression to the ISR cache behaviour.
**Constraints**: Mobile-first (breakpoints 880 / 520); tokens-only styling; no `any`; functions
≤30 lines; component/story files ≤200 lines; page template ≤100 lines; no Drizzle/Neon import in
`app/**`; absolute alias imports.
**Scale/Scope**: One route (`/menu`) + homepage featured rail; ~8 menu components, 1 composable,
1 types file, 6 seed files, 1 query util, 1 schema table, i18n ES/EN.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase -1: Pre-Implementation Gates (NON-NEGOTIABLE)

#### Code Organization & Reusability (Article I)

- [x] All UI changes stay in `app/features/menu/` (components + composable + types); homepage rail
      changes stay in the homepage feature slice + `server/api/v1/menu/featured.get.ts`.
- [x] All data/query changes stay in `server/db/` (schema, migration, seeds) and
      `server/utils/menu-queries.ts`; no feature-to-feature imports.
- [x] **DRY — no duplicate component for the flavour selector**: the Vaso Sumo flavour picker
      reuses `MenuSaucePicker` (parameterized via props), NOT a new near-identical file. If >60%
      markup overlap, it MUST be one component.
- [x] `app/pages/menu.vue` template stays ≤100 lines (decompose into feature components if it grows).
- [x] Every changed UI component has a co-located `.stories.ts` (Article VII coverage).

#### TypeScript & Framework Standards (Article II)

- [x] No `any`; TS strict throughout. `DrinkGroup` union extended with `'destilados'` (no string
      literals leaking untyped).
- [x] Vue components use `<script setup lang="ts">` (Composition API only).
- [x] Shared menu types stay in `types/menu.ts` — no duplication across the app/server boundary.

#### Testing (Article IV)

- [x] Tests written BEFORE implementation for server-side logic (migration/seed query behaviour,
      `menu-queries` group ordering, featured selection, Vaso Sumo consolidation).
- [x] Co-located: `useMenuFilters.test.ts`, `Menu*.spec.ts`, `menu-queries.test.ts` updated.
- [x] Coverage: server routes/queries ≥80%, composables ≥70%.
- [x] Behavior-named tests (e.g. "renders exactly 8 categories for AYCE buffet in order").

#### Performance & Rendering (Article V + rendering-strategy.md)

- [x] `/menu` route rule left UNCHANGED — it renders `ssr: true` (it was never `isr:3600`; the
      original plan text was stale). No new route added.
- [x] No `drizzle-orm` / `@neondatabase/serverless` import under `app/**`.
- [x] Menu data continues to flow through `GET /api/v1/menu` (no direct DB access in components).
- [x] Images lazy-loaded; Lighthouse 90+ preserved (hover-zoom is transform-only, GPU-cheap).

#### UX Consistency & Component Documentation (Article VII)

- [x] Design tokens are the source of truth (no inline hex; `--accent` swap unchanged).
- [x] Mobile-first; verify the 3-way selector, chips, half-width drink cards, and hover-zoom at
      880 and 520 breakpoints.
- [x] Hover-zoom respects `hoverOnlyWhenSupported` (Tailwind `@media (hover: hover)`), so
      touch-only devices are unaffected.
- [x] Storybook: Default + significant variants (each selection/modality, no-image drink card,
      flavour selector, removed-sauce card) + responsive annotation for every changed component.
- [x] SUMO logo unmodified (no logo change in this feature).

#### Clean Code (Article VIII)

- [x] Functions ≤30 lines; component/story files ≤200 lines; no dead/commented code; no bare
      `console.log`; self-documenting names; `use*` composable prefix; PascalCase components.

#### Quality Gates (Article IX)

- [x] Biome lint + format pass; `vue-tsc --noEmit` passes; Vitest suite green; `storybook build`
      succeeds with zero image 404s. Conventional Commits.

#### KISS (Article X)

- [x] No new table for curated sets (encoded in `menu-sets.ts`); no new component for the base
      selector (reused `MenuSaucePicker`); the three migrations add single columns only, no
      abstraction layer. Labels moved into existing/added DB columns rather than a new lookup table.

#### Absolute Imports (Article XI)

- [x] All imports via `@/` aliases; no `../` across directories.

#### Error Handling (Article XII)

- [x] Any changed server route (`menu/index.get.ts`, `featured.get.ts`) keeps delegating to the
      centralized error handler; DB failures degrade gracefully. Delivered: `server/utils/db-retry.ts`
      (transient-error retry) + `DatabaseUnavailableError` (503, WARN) → `/menu` renders an empty
      menu (`menu.unavailable`) instead of a 500.

#### Environment Validation (Article XIII)

- [x] No env changes (`BLOB_BASE_URL` etc. unchanged).

**Result**: No constitutional violations. The three additive migrations are justified above
(Article X favours data-driven ordering + labels over hard-coded arrays the client cannot edit;
each adds one column). Complexity Tracking table below is empty.

## Project Structure

### Documentation (this feature)

```text
specs/021-menu-experience-overhaul/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── menu-api.md       # GET /api/v1/menu response shape (+ destilados group)
│   └── i18n-keys.md      # menu.* i18n key contract (ES/EN)
├── checklists/
│   └── requirements.md   # Spec quality checklist (from /speckit.specify)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
server/
├── db/
│   ├── schema.ts                         # + drink_group.displayOrder, drink_group.name_es/en, menu_categories.note_es/en
│   ├── migrations/
│   │   ├── 0027_add_drink_group_display_order.sql   # DDL
│   │   ├── 0028_add_drink_group_name.sql            # DDL
│   │   └── 0029_add_menu_category_note.sql          # DDL
│   └── seeds/
│       ├── menuCategories.ts             # sweet_rolls="Sushi Dulce"; kids note_es/en; drinks="Bebidas y coctelería"
│       ├── drinkGroups.ts                # beers_spirits→beers; +destilados; displayOrder 0..5; name_es/en; group-level promo; delete non_alcoholic
│       ├── drinkSubGroups.ts             # Caguamón first; re-parent spirits→destilados, beers→beers; per-sub-group promo nulled
│       ├── drinks.ts                     # Vaso Sumo → 1 six-base card; Tropical Sumo separate; Café image-first; re-map groups
│       ├── kidsMenu.ts                   # 7 items (1 AYCE $179 includedInAyce=true + 6 combos $149)
│       ├── ayceMenu.ts / alaCarta.ts / expressMenu.ts  # featured flags on ALL rows (Garantías Sumo 11); wings requiresSauce=false
│       └── desserts.ts                   # Sumo Fries featured; cleared Sumo Bites
├── utils/
│   ├── menu-queries.ts                   # queryDrinkGroups (DB name + order + promo); queryKidsRows; dedupeByName; withDbRetry; DatabaseUnavailableError
│   └── db-retry.ts                       # NEW — transient Neon retry
└── api/v1/menu/
    ├── index.get.ts                      # catches DatabaseUnavailableError → emptyMenuResult
    ├── featured.get.ts                   # reads featured=true (deduped by name)
    └── resolveImageUrl.ts                # + ?v=MENU_IMAGE_VERSION cache-busting

types/
└── menu.ts                               # DrinkGroup: -non_alcoholic, beers_spirits→beers, +destilados; FullMenuResult.drinkGroups; category.note; kids locationType

app/
├── pages/menu.vue                        # unchanged route (ssr); ≤100 template lines
└── features/menu/
    ├── types.ts                          # PickerOption; MenuPrimarySelection
    ├── menu-sets.ts                      # NEW — 4-way curated sets (incl. KIDS_SET); getCuratedSet/getDefaultKey/resolveActiveKey
    ├── composables/useMenuFilters.ts     # 4-way activeSelection; kids/drinks flags; accent; default = first of set; no "show all"
    └── components/
        ├── MenuShell.vue                 # 4-way orchestration; DB labels; Kids two-section split
        ├── MenuTypeToggle.vue            # AYCE|Express pill + standalone Bebidas/Kids buttons; responsive
        ├── MenuModalityToggle.vue        # AYCE-only; "Carta"/"Menu" label via i18n
        ├── MenuCategoryChips.vue         # curated ordered set; single active; DB labels
        ├── MenuDishCard.vue              # whole-card hover:scale-105; Garantía star badge; no sauce picker on wings
        ├── MenuDishGrid.vue              # renders only active category / Kids sections
        ├── MenuSaucePicker.vue           # PARAMETERIZED (PickerOption[]) → reused for Vaso Sumo bases
        ├── MenuDrinkCard.vue             # NEW — extracted per-card (image/no-image span)
        └── MenuDrinkSection.vue          # DB group name; single group-level promo; sub-groups; six-base Vaso Sumo picker; half-width cards
i18n/locales/{es,en}.json                 # menu.category.*/drink_group.* REMOVED (kept category.empty); +type.kids, kids.*, vaso_sumo.*, guarantee_alt, unavailable; modality.carta="Carta"/"Menu"
```

**Structure Decision**: Web application (single Nuxt repo). All changes live in the existing
`menu` vertical slice (`app/features/menu/`) plus the shared menu data layer (`server/db/`,
`server/utils/menu-queries.ts`, `types/menu.ts`) and locale files. No new feature folder, no new
route, one additive migration.

## Complexity Tracking

> No constitutional violations. Table intentionally empty — the three additive columns
> (`drink_group.display_order`, `drink_group.name_es/en`, `menu_categories.note_es/en`) are
> justified under Article X (data-driven content ordering + labels beat hard-coded arrays the
> client cannot edit) and do not constitute unjustified complexity.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
