# Spec Author Summary — Feature 027 (promo-flip-menu-card-tweaks)

## Decisions per part

- **Part A (P1, flip-to-terms)**: Flip state owned by `PromotionsCarousel.vue`
  (single `flippedId` ref, reset on `onSelect`), `PromotionCard.vue` stays
  presentational. Click-vs-drag distinction requires no new code — verified
  against the installed `embla-carousel@8.6.0` source that Embla already
  suppresses `click` after a real drag via a capture-phase listener. Reduced
  motion reuses the existing `matchMedia` pattern already in
  `PromotionsCarousel.vue` and swaps rotate-transform for opacity cross-fade.
  A promo with no terms configured shows no flip affordance at all (never an
  empty back face).
- **Part B (P2, Garantía badge)**: Simple size-class bump on the existing
  badge in `MenuDishCard.vue`; exact Tailwind size value deferred to
  implementation, constrained only by "clearly larger" + "never overlaps the
  pink sticker at any breakpoint."
- **Part C (P3, Ramen XL hero)**: New `MenuDishHero.vue` component, swapped in
  by `MenuDishGrid.vue` based on a new per-dish `display_variant` column
  (`'hero'`). Hero asset follows the existing Blob/`resolveImageUrl`/
  `replace-blob-images.ts` convention at a new stable path
  (`menu/ala-carta/ramen_xl_hero.webp`), separate from the dish's existing
  small photo. The client's reference image (already at
  `assets/source/ramen-xl-reference.jpg`) is documented as illustrative only —
  final art still pending.
- **Part D (P4, Kids AYCE background)**: Resolved to the orange→blue gradient
  (client's own stated fallback) rather than introducing a new, non-token
  purple color, reusing the existing gradient utility already used in
  `PromotionsCarousel.vue`. Reuses the same `display_variant` column
  (`'highlight'`) as Part C, applied as a prop on the existing
  `MenuDishCard.vue` — no new component needed for this part.

## Clarifications

No `/speckit.clarify` round was needed. `spec.md` was authored with **zero**
`[NEEDS CLARIFICATION]` markers — every ambiguous point (WP dependency
posture for Part A, gradient-vs-purple for Part D, exact badge size, exact
hero sizing) had a reasonable default resolvable from the feature's own
instructions and is documented explicitly in `spec.md`'s Assumptions section
instead of left open.

## Coordination dependencies flagged

- **Part A, blocking**: A new bilingual WordPress ACF field pair
  (`terminos_es`/`terminos_en`) on the `promociones` CPT does **not exist
  upstream yet**. WP admin/ACF configuration is out of this repo's scope
  (`docs/business/features.md` §9). This repo's parse/type/UI plumbing ships
  regardless — every promotion safely projects `terms: null` until the field
  is added (no error state, no dropped promo) — but live end-to-end terms
  content requires that out-of-repo step. Flagged in `spec.md` Assumptions,
  `research.md` R4, `data-model.md`, and `plan.md`'s Constitution Check —
  never silently assumed ready.
- **Part C, non-blocking**: The final production Ramen XL hero image asset is
  still pending from the client; a placeholder/reference-derived asset may
  ship first at the same stable Blob path, swappable later with no code
  change.

## Artifacts

- `specs/027-promo-flip-menu-card-tweaks/spec.md`
- `specs/027-promo-flip-menu-card-tweaks/plan.md`
- `specs/027-promo-flip-menu-card-tweaks/research.md`
- `specs/027-promo-flip-menu-card-tweaks/data-model.md`
- `specs/027-promo-flip-menu-card-tweaks/quickstart.md`
- `specs/027-promo-flip-menu-card-tweaks/tasks.md`
- `specs/027-promo-flip-menu-card-tweaks/checklists/requirements.md`
- `feature_list.json` — feature 27 status → `spec_ready` (only that field changed)
- `progress/current.md` — session entry added at the top

Branch: `feat/027-promo-flip-menu-card-tweaks` (renamed from the
auto-generated `feat/028-...` to match the pre-existing `specs/027-...`
folder and `feature_list.json`'s `spec_path`).

## Amendment (post-review)

Human reviewed `spec.md` and requested changes to Part A only (Parts B/C/D
unchanged, still approved as drafted). Patched `spec.md`, `plan.md`,
`research.md`, `data-model.md`, `tasks.md`, and `quickstart.md` in place —
did not re-run the speckit flow from scratch.

- **Stricter no-flip rule**: the flip affordance now explicitly requires
  BOTH `tyc_es` AND `tyc_en` to be present and non-empty — a promo with only
  ONE language filled in is treated identically to a promo with neither (no
  same-language fallback, unlike `badge_en`'s fallback to `badge_es`). Added
  as a new acceptance scenario + edge case in `spec.md`, `FR-008` reworded,
  and a new `research.md` R4a documenting the decision/rationale/alternative
  considered (rejected the fallback approach per the client's explicit
  correction that bilingual completeness is mandatory for legal/informational
  content).
- **Field name updated from placeholder to assumed real name**: replaced the
  placeholder `terminos_es`/`terminos_en` with the assumed real ACF keys
  **`tyc_es`**/**`tyc_en`**, inferred from a client-provided screenshot of the
  live WP admin edit screen (`assets/source/wp-admin-tyc-fields.png`, showing
  "TyC (ES)"/"TyC (EN)" textareas, both optional/unmarked-required) plus this
  CPT's established `_es`/`_en` snake_case naming convention. Flagged as an
  assumption pending confirmation from a live payload, not a certainty.
- **Coordination status downgraded from blocking to in-progress**: the WP
  field is being actively wired in by the client right now, not a
  hypothetical unscheduled dependency — reframed throughout `spec.md`
  Assumptions, `research.md` R4, `data-model.md`, and `plan.md` accordingly.
  The defensive parsing/no-flip-without-both-languages requirement is
  explicitly called out as unchanged and still load-bearing (protects
  against the assumed key names being wrong just as much as against the
  field not existing).
- `feature_list.json` status untouched (already `spec_ready`, as instructed).

## Amendment 2 (2026-07-16, Ramen options + Vaso Sumo migration)

Major re-scope from the client: Part C's original "Ramen XL hero image"
approach is scrapped entirely and replaced with a DB-driven "build your own"
options mechanism; a new Part E migrates Vaso Sumo's hardcoded flavor list
onto the same mechanism; Part D gets a simpler standalone mechanism now that
it no longer shares a discriminator with Part C. Parts A and B are untouched.
Patched `spec.md`, `plan.md`, `research.md`, `data-model.md`, `tasks.md`,
`quickstart.md` in place.

- **New option-groups schema design**: two generic, reusable tables —
  `menu_item_option_groups` (id, `menuItemId` FK, `key`, bilingual `name`,
  `displayOrder`, `isActive`) and `menu_item_option_choices` (id,
  `optionGroupId` FK, bilingual `name`, `priceDelta` decimal ≥0,
  `displayOrder`, `isActive`) — attachable to ANY menu item, not
  Ramen-specific. Structurally modeled on the existing
  `drinkGroups`→`drinkSubGroups` two-level pattern already in this schema;
  editability/consumption model validated by the existing `sauces` table +
  `MenuSaucePicker.vue` (the client's own cited precedent, NOT Vaso Sumo's
  i18n-hardcoded list). Every group is uniformly a required single-select
  group — "Añade extra proteína" is modeled as a 2-choice group ($0 "No,
  gracias" / +$29 "Sí") rather than inventing a separate "add-on" entity
  type, keeping one schema shape with zero branching.
- **How Ramen XL and Vaso Sumo both attach**: `FullMenuDish` gains
  `optionGroups: DishOptionGroup[]` (empty for every dish without groups).
  `MenuDishCard.vue` (Ramen XL) and `MenuDrinkSection.vue` (Vaso Sumo) both
  render one `MenuSaucePicker` per group — `MenuSaucePicker.vue` itself is
  **unmodified**, since it was already a generic `PickerOption[]`-driven
  component (already reused for Vaso Sumo's hardcoded flavors today, just not
  DB-backed). `MenuDrinkSection.vue`'s `isVasoSumo()`/hardcoded-array
  special-casing is deleted and replaced by the same generic loop used for
  Ramen — zero new Vue components for either part.
- **Orphaned hero-image artifacts**: `MenuDishHero.vue`/`.spec.ts`/`.stories.ts`
  and migration `0030_add_menu_item_display_variant.sql` (plus the
  `displayVariant` column already added to `schema.ts` and every reference to
  it already introduced in `types/menu.ts`, `menu-queries.ts`, and the two
  seed files) are all uncommitted and never merged — decided to **delete
  outright, not adapt or salvage**. The freed migration slot `0030` is
  reclaimed for this revision's actual Kids-boolean migration; a fresh `0031`
  holds the new option-groups tables. `research.md` R6c and `data-model.md`
  both carry the explicit removal list so the implementer knows exactly what
  to delete vs. build fresh.
- **Part D's new mechanism**: replaced the scrapped shared `display_variant`
  enum column with a standalone `menu_items.highlight_background` boolean
  (default `false`), directly analogous to the existing `featured` boolean
  already on the same table — simpler than keeping a single-value enum alive
  once Part C's `'hero'` value no longer exists to disambiguate against.
  Part D is now fully decoupled from Part C's mechanism (FR-020).
