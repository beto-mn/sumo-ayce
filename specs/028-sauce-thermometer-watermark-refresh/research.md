# Research: Sauce Heat Thermometer Graphic + Sitewide Watermark Asset Refresh

## R1 — Watermark artwork swap: preserving on-screen tile density

- **Finding**: The current watermark tile (`public/patterns/sumo-watermark.webp`) is
  300×405 px. The client's new tile (`specs/028-.../assets/source/Fondo web bien.webp`)
  is 781×1056 px — aspect ratio 0.7397 vs. 0.7401, i.e. essentially identical framing,
  but ~2.6x the linear resolution. No `background-size` is set today anywhere in the
  codebase for `.bg-watermark` — the browser paints the image at its native pixel
  size (CSS default `background-size: auto`). A naive URL swap would therefore make
  the repeating tile render ~2.6x larger on screen, roughly halving the pattern's
  repeat frequency and changing the visual density established in feature 024.
- **Decision**: Add an explicit `background-size` to the `bg-watermark` utility
  (e.g. via a small Tailwind arbitrary-value class or a dedicated CSS custom property
  sized to `300px 405px`, matching the previous on-screen footprint) so the new,
  higher-resolution source file renders at the same physical tile size as before.
  This keeps the higher source resolution (crisper on high-DPI screens) while
  preserving the feature-024 visual density baseline.
- **Alternatives considered**:
  - *Ship the new tile at native size, accept the larger pattern.* Rejected — changes
    an already-approved visual baseline (feature 024) without being asked to, and the
    feature description explicitly says not to change the "contrast baseline...
    unless the new artwork demonstrably requires it," which it doesn't (same aspect
    ratio, same concept).
  - *Downscale the source file itself to 300×405 before deploying.* Rejected — throws
    away the resolution improvement the client evidently intended (a higher-res
    source is strictly better for crispness at the same on-screen size); an explicit
    `background-size` gets the same visual result without losing source fidelity.

## R2 — Sauce selection mechanism: option-groups vs. dormant `requiresSauce`/`sauces`

- **Finding**: Two mechanisms exist in the codebase today:
  (a) the generic `menu_item_option_groups`/`menu_item_option_choices` tables (feature
  027), with a complete, tested, end-to-end path: DB → `queryOptionGroupsByMenuItem` →
  `FullMenuDish.optionGroups` → `MenuDishCard.vue`'s rendering loop →
  `MenuSaucePicker.vue`. Currently seeded only for Ramen XL and Vaso Sumo.
  (b) `menu_items.requiresSauce` (boolean, already `true` on the relevant seed rows)
  and `FullMenuResult.sauces` (the flat 12-sauce catalog, already exposed at the
  top level of the menu API response) — neither is read by any Vue component today.
- **Decision** (Clarifications Q1): Build on mechanism (a). It is a proven, already-
  tested rendering path; extending it is strictly additive (new seed rows + one new
  column) with zero new UI code paths. Mechanism (b) would require building an
  entirely new, parallel rendering path duplicating what (a) already does — a clear
  Article X (KISS) and Article I (DRY) violation ("if the same markup pattern
  appears in 2+ places, extract" — here we'd be creating a second implementation of
  a pattern that already has one working implementation).
- **Disposition of (b)**: Left untouched and unused, exactly as before this feature.
  Removing it is explicitly out of scope (no unrelated cleanup); a future feature may
  revisit whether `requiresSauce`/`sauces` should be deprecated, but that decision is
  not this feature's to make.
- **Alternatives considered**: Wiring through (b) directly — rejected per above.
  A hybrid (keep `requiresSauce` as a "this dish needs the thermometer" flag while
  option-groups drive the actual picker) was considered but rejected as unnecessary
  complexity: category membership (`key === 'wings'`) is already a sufficient signal
  for where the thermometer mounts (R4), so a second boolean flag adds no value.

## R3 — Multi-select sauce picker for À la Carta packages

- **Finding**: `MenuSaucePicker.vue` today holds a single `selectedId: ref<string | null>`
  and always keeps exactly one option active — sufficient for AYCE/Express (1 sauce)
  and for Ramen XL/Vaso Sumo's existing single-select groups, but insufficient for À
  la Carta Wings/Boneless packages that require exactly 2 or 3 simultaneous sauce
  selections. There is no existing bounded multi-select UI pattern anywhere in the
  menu feature to reuse instead.
- **Decision** (Clarifications Q2): Extend `MenuSaucePicker.vue` with an additive
  `maxSelections?: number` prop (default `1`, preserving 100% of today's behavior
  and all existing tests unmodified). When `maxSelections > 1`, internal state
  becomes a bounded `Set<string>` of selected ids instead of a single id; clicking
  an already-selected option deselects it (freeing a slot); clicking a new option
  when the set is already at `maxSelections` is a no-op (FR-010, no error state).
  `maxSelections` is sourced from a new `menu_item_option_groups.max_selections`
  integer column (default `1`), set per dish in the seed data (1 for AYCE/Express
  wings, 2 or 3 for the relevant À la Carta packages).
- **Alternatives considered**:
  - *A separate `MenuMultiSaucePicker.vue` component.* Rejected — Article I forbids
    duplicating >60% shared markup across two components; single-select and
    bounded-multi-select share the same option-button grid, the same spice
    indicator, the same sort-by-spice behavior. One parameterized component is the
    correct shape.
  - *Free-form multi-select with no upper bound.* Rejected — every À la Carta
    package's description specifies an exact count (2 or 3); an unbounded picker
    would let a visitor "select" more sauces than the kitchen can prepare per order.

## R4 — Thermometer graphic placement

- **Finding**: The reference asset (`Termometro salsas new.webp`) is a single
  legend-style graphic depicting all 12 sauces' relative heat in one image, not a
  per-dish or per-selection element. `menuCategories` already has a `note`
  field rendered once per category section by `MenuDishGrid.vue` (used today for
  the Kids "Combo Infantil" inclusions note) — an existing, proven single-mount-
  per-section pattern.
- **Decision** (Clarifications Q3): Mount the thermometer graphic once per "wings"
  ("Alitas & Boneless") category section in `MenuDishGrid.vue`, alongside the
  existing `category-note` block, rather than once per dish/per `MenuSaucePicker`
  instance. This avoids loading/rendering the same static image N times per section
  (better for Lighthouse/Article V) and matches the asset's own nature as a single
  reference legend rather than a per-selection widget.
- **Alternatives considered**: Per-dish mount (next to each `MenuSaucePicker`) —
  rejected as redundant (same static image repeated per dish) and heavier on mobile
  scroll/perf for sections with multiple Wings/Boneless dishes.

## R5 — Thermometer asset reference mechanism

- **Finding**: The codebase already has a precedent for a category/feature-specific
  static decorative image referenced directly by a fixed public path rather than a
  DB column — the "Garantía Sumo" badge in `MenuDishCard.vue`
  (`src="/brand/garantia-sumo.webp"`, hardcoded, driven by a boolean flag, not by a
  DB-stored URL).
- **Decision**: The thermometer graphic follows the same pattern — a single fixed
  public asset path (e.g. `/menu/thermometer/sauce-heat-thermometer.webp`)
  referenced directly in `MenuDishGrid.vue`, gated on `category.key === 'wings'`.
  No new DB column, no new API field. Satisfies FR-012 (single swappable asset
  reference, trivial future replacement) with the least possible complexity
  (Article X KISS) — a brand/design asset like this has no business reason to be
  staff-editable via the DB, unlike genuinely dynamic content (promotions, dish
  photos sourced from `fileName` columns).
- **Alternatives considered**: A DB-stored asset URL (mirroring how dish `fileName`
  works) — rejected as unnecessary indirection for a single, sitewide-fixed
  decorative asset with no per-row variation.

## R6 — Migration numbering

- **Finding**: The latest migration in `server/db/migrations/` is
  `0031_add_menu_item_option_groups.sql` (feature 027).
- **Decision**: The new additive column lands in
  `0032_add_menu_item_option_group_max_selections.sql`, following the existing
  additive-only migration convention (Article XIII precedent, no destructive
  changes).
