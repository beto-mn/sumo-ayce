# Research: Promo Flip-to-Terms + Garantía Badge + Ramen XL DB-Driven Options + Kids AYCE Background + Vaso Sumo Migration

**Feature**: `027-promo-flip-menu-card-tweaks`
**Date**: 2026-07-16 (Part C rescoped + Part E added same day, see R5/R6/R6a/R6b/R6c)

No `NEEDS CLARIFICATION` markers remain in `spec.md`. This document resolves the
technical unknowns needed to design Phase 1, verified against the actual
installed dependency (`embla-carousel@8.6.0`) rather than assumed.

## R1 — Distinguishing click vs. drag/swipe on the promo carousel (Part A)

**Decision**: Attach a plain `@click` handler to `PromotionCard`'s root
element. Do NOT hand-roll pointer-distance tracking.

**Rationale**: Embla Carousel already solves this internally. Reading the
installed package
(`node_modules/.pnpm/embla-carousel@8.6.0/node_modules/embla-carousel/esm/embla-carousel.esm.js`,
`draggable` component, lines ~302–392): Embla registers its OWN `click`
listener on the root node in the **capture phase**
(`.add(node, 'click', click, true)`). Its internal `click()` handler checks a
`preventClick` flag — set to `true` whenever pointer movement during a drag
exceeds `dragThreshold` (or, for `dragFree`, on specific mouse-release
conditions) — and if set, calls `evt.stopPropagation()` + `evt.preventDefault()`
**before** the event reaches any bubble-phase listener added by application
code (Vue's `@click` is a standard bubble-phase listener). A genuine drag past
the threshold therefore never reaches our `@click` handler at all; a discrete
tap/click (no meaningful movement) does. This satisfies FR-005 with zero
additional code — confirmed against the real dependency, not assumed API
behavior.

**Alternatives considered**:
- Manual `pointerdown`/`pointerup` delta tracking in `PromotionCard` — rejected
  as unnecessary duplication of logic Embla already provides (violates
  Article X KISS: no abstraction for a problem that doesn't exist).
- A `click:allowed` callback option — does not exist in this Embla version;
  the capture-phase suppression is the actual (undocumented in the README, but
  implemented) mechanism.

## R2 — Where flip state lives (Part A)

**Decision**: `PromotionsCarousel.vue` (which already owns `selectedIndex`)
owns a single `flippedId: string | null` ref. It passes `flipped: boolean` as
a prop to each `PromotionCard` and listens for a `@flip` emit to toggle it.
`onSelect()` (already wired to Embla's `select`/`reInit` events) resets
`flippedId` to `null` whenever the active slide changes.

**Rationale**: `PromotionCard` stays a pure/presentational component (already
its role today — no local carousel-awareness), which keeps it trivially
storyable (Article VII) with a `Flipped: Story` variant driven purely by
props. Centralizing the "only one card flipped, reset on navigate" rule in the
carousel (single source of truth) avoids each card needing to know about its
siblings or the active slide — directly satisfies FR-004 (reset on navigate)
with one `watch`/event-handler, not N.

**Alternatives considered**:
- Local flip state inside `PromotionCard` + a `resetFlip` prop watcher — more
  moving parts for the same outcome, and couples the card to carousel
  lifecycle events it would otherwise not need.

## R3 — Flip animation implementation (Part A)

**Decision**: Pure CSS 3D transform (`perspective` on the slide wrapper,
`transform-style: preserve-3d` + `rotateY(180deg)` toggle on an inner flip
container, `backface-visibility: hidden` on both faces, back face pre-rotated
`rotateY(180deg)`). Reduced-motion detection reuses the exact JS pattern
already in `PromotionsCarousel.vue`'s `onMounted`
(`window.matchMedia('(prefers-reduced-motion: reduce)').matches`) to add a
`reducedMotion` boolean that swaps the transform-based transition for an
opacity cross-fade between the two faces (front/back absolutely stacked,
`transition-opacity` instead of `transition-transform`).

**Rationale**: No new dependency (Article X KISS — a flip is a transform, not
a feature requiring an animation library). Reusing the existing
`matchMedia`-based detection (rather than only a Tailwind `motion-reduce:`
class variant) matches the established pattern in the same file and gives
JS-level control needed to swap the transition *type*, not just disable it.

**Alternatives considered**:
- Pure Tailwind `motion-reduce:` variant only — insufficient on its own because
  the *transition property itself* (transform vs. opacity) needs to change,
  not just be disabled; a disabled transform transition would make the card
  snap instantly to the rotated (illegible, mirrored) state instead of
  cross-fading to the readable back face.

## R4 — Terms & Conditions field on the WordPress `promociones` CPT (Part A)

**Decision**: Model the field the same way every other bilingual ACF pair in
this CPT is modeled: `tyc_es` / `tyc_en` (both optional/nullish — NOT a
required-with-fallback pair like `badge_es`/`badge_en`), added to
`WpPromotionAcf`, `acfSchema` in `validators.ts` (both `.nullish()`, matching
how `imagen_*` fields already tolerate WP's loose typing), and projected into
a new `Promotion.terms: Bilingual | null` field. **`terms` is set ONLY when
BOTH `tyc_es` AND `tyc_en` are non-empty strings** — if either is missing,
empty, or whitespace-only, `terms` resolves to `null` (no same-language
fallback for the missing side; see R4a below).

**Field name update (2026-07-16, post-review)**: Originally modeled with a
placeholder name (`terminos_es`/`terminos_en`). The client provided a
screenshot of the live WordPress admin edit screen for the `promociones` CPT
(`specs/027-promo-flip-menu-card-tweaks/assets/source/wp-admin-tyc-fields.png`),
showing two new textarea fields labeled **"TyC (ES)"** and **"TyC (EN)"**
positioned directly below the existing "Badge (ES)"/"Badge (EN)" fields.
Following the established naming convention in this exact CPT (`badge_es`/
`badge_en`, `imagen_desktop`/`imagen_tablet`/`imagen_movil` — snake_case,
`_es`/`_en` suffix), the assumed field keys are **`tyc_es`** and **`tyc_en`**.
This is an assumption pending confirmation from a live API payload (the
screenshot shows the admin FORM, not the underlying field key, which WP does
not surface in the standard edit UI) — the Zod schema tolerates the field
being named differently or absent entirely by treating it as any other
optional/nullish field (parses successfully either way, never drops the promo).

**Coordination status (downgraded from blocking to in-progress, per
constitution Article III / WP headless boundary and
`docs/business/features.md` §9)**: This is no longer an open-ended "field
doesn't exist, timeline unknown" risk — the client is actively wiring the
field into WP admin right now (per the screenshot, both textareas exist and
are unlocked for editing, currently empty, and — unlike the required Badge
fields — carry no red-asterisk required marker). WP admin/ACF configuration
remains an out-of-repo action per `docs/business/features.md` §9 (this repo
does not configure WordPress), but the risk has moved from "blocking, no ETA"
to "in progress, exact key name and rollout timing not 100% confirmed."
**The defensive-parsing requirement is unchanged and remains load-bearing**:
`parsePromotions` MUST continue to project `terms: null` whenever `tyc_es`/
`tyc_en` are absent, empty, or the assumed key names simply turn out to be
wrong once a live payload is inspected — FR-008 (no flip affordance without
BOTH languages present) makes this the correct, non-broken steady state
rather than an error path, regardless of why the content is missing.

**Rationale**: Mirrors the `badge_es`/`badge_en` pattern already validated and
shipped in this codebase for the *shape* of the fields, while treating them as
optional (unlike Badge, which is required in WP admin) since the WP screenshot
confirms TyC carries no required-field marker.

## R4a — Bilingual-completeness rule for the flip affordance (Part A, post-review)

**Decision**: The flip affordance requires **both** `tyc_es` AND `tyc_en` to
be present and non-empty. A promo with only one language filled in (e.g.
`tyc_es` has text, `tyc_en` is empty) is treated identically to a promo with
neither — `terms` resolves to `null`, no flip affordance is offered, no
same-language content is ever shown standing in for the missing language.

**Rationale**: This was tightened from the original (pre-review) draft, which
only guarded the both-absent case and would have let a promo with just one
language configured flip and show, e.g., Spanish-only terms to an
English-locale visitor with no translation — an incomplete/inconsistent
bilingual experience the client explicitly does not want. Requiring
completeness up front is also simpler to implement and test than a
same-language-fallback rule (no fallback branch to write or verify), directly
in line with Article X (KISS).

**Alternatives considered**:
- Flip if EITHER language is present, falling back to the available language
  for the other locale (mirroring how `badge_en` falls back to `badge_es`) —
  rejected per the client's explicit correction: bilingual completeness is
  mandatory for Terms & Conditions specifically (a legal/informational
  content type), unlike a decorative badge label where a same-language
  fallback is acceptable.

## R5 — Kids AYCE background flag, standalone (Part D — REVISED 2026-07-16)

**Decision**: A dedicated boolean column on `menu_items`:
`highlightBackground: boolean('highlight_background').notNull().default(false)`
— set to `true` on exactly one row ("All You Can Eat Kids"), `false`
everywhere else (the default).

**Rationale (supersedes the old R5)**: The original design shared one
nullable `display_variant` enum column between Part C's hero-swap and Part
D's highlight-background, because both needed "target exactly one dish,
independent of category." Part C's hero-swap concept has been scrapped
entirely (see R6 below) — there is no longer a second value for that column
to distinguish from, so keeping an enum-shaped column alive for a single
boolean condition is unnecessary complexity. A plain boolean, matching the
exact existing precedent of `menu_items.featured` (`boolean('featured')
.notNull().default(false)`, already used to flag Garantía Sumo dishes), is
simpler, self-documenting, and requires no `CHECK` constraint at all — a
boolean's domain is inherently `{true, false}`. This directly follows Article
X (KISS): match the simplest existing pattern in this exact table rather than
inventing a new one.

**Alternatives considered**:
- Keep the enum column with only `'highlight' | null` — rejected: a
  single-value enum is more complex than a boolean for no benefit, once
  `'hero'` is gone there is nothing left to disambiguate.

## R6 — Generic option-groups schema (Parts C & E) — REPLACES the old "Ramen XL hero" scope entirely

**Decision**: Two new tables, generic and reusable, attachable to ANY menu
item (not Ramen/Vaso-Sumo-specific in shape):

```
menu_item_option_groups
  id            uuid pk
  menu_item_id  uuid not null → menu_items.id
  key           varchar(60) not null   -- e.g. 'noodle_base', 'protein', 'extra_protein', 'flavor'
  name_es       varchar(80) not null   -- picker label, e.g. "Base de fideo"
  name_en       varchar(80) not null
  display_order integer not null default 0
  is_active     boolean not null default true
  created_at, updated_at timestamps
  UNIQUE (menu_item_id, key)

menu_item_option_choices
  id              uuid pk
  option_group_id uuid not null → menu_item_option_groups.id
  name_es         varchar(80) not null   -- e.g. "Camarón cremoso"
  name_en         varchar(80) not null
  price_delta     decimal(8,2) not null default '0.00'
  display_order   integer not null default 0
  is_active       boolean not null default true
  created_at, updated_at timestamps
  CHECK (price_delta >= 0)
```

Every option group is modeled uniformly as a **required single-select group
with N choices** — there is no separate "optional add-on" entity type. See R6a
for how "Añade extra proteína" fits this shape without a special case.

**Rationale**: This is the schema-level fix for the client's core complaint
("must be editable from the DB, not hardcoded") — every noodle-base flavor,
protein choice, Vaso Sumo flavor, and their prices become real, editable rows.
The two-level group→choice hierarchy is structurally the same pattern already
proven in this exact schema for `drinkGroups`→`drinkSubGroups` (a parent
grouping table + a child table referencing it, both with `displayOrder` +
`isActive`), while the "DB-driven catalog with a picker component reading it"
behavior is validated by the existing `sauces` table +
`MenuSaucePicker.vue` (feature 016) — the client's own cited precedent. This
design combines both proven patterns rather than inventing a new one:
structure from `drinkGroups`/`drinkSubGroups`, editability/UI-consumption
model from `sauces`.

**Alternatives considered**:
- A single flat table (no groups, just "menu_item_id + label + price") —
  rejected: cannot express "Base de fideo" and "Proteína" as two independently
  labeled, independently orderable pickers on the same dish; the client's
  reference image explicitly shows two separate labeled steps.
- Extending the existing `sauces` table with a `menu_item_id` FK — rejected:
  `sauces` is a genuinely GLOBAL catalog (12 sauces shared across every Wings/
  Boneless dish); repurposing it for per-dish, per-group option sets would
  conflate two different sharing models (one global list vs. many
  dish-specific lists) in one table, violating single-responsibility.
- Storing choices as a JSON column on `menu_items` — rejected per Article X:
  loses relational integrity (no per-choice `isActive`/ordering/uniqueness),
  and is explicitly the kind of "not really DB-editable in a structured way"
  approach the client is trying to move away from (mirrors why Vaso Sumo's
  i18n-hardcoded list was rejected as a pattern to keep, per Part E).

## R6a — Frontend reuse: `MenuSaucePicker.vue` unmodified, "extra protein" as a $0/+$29 choice pair

**Decision**: `app/features/menu/components/MenuSaucePicker.vue` is **already
a generic single-select picker** (`PickerOption[]` + a label — it is not
sauce-specific in implementation despite its name; it is already reused for
Vaso Sumo's hardcoded flavors today). No changes to this component are
needed. `MenuDishCard.vue` (for Ramen XL) and `MenuDrinkSection.vue` (for
Vaso Sumo) both render one `MenuSaucePicker` per entry in the dish's
`optionGroups` array, mapping each group's `choices` to `PickerOption[]`
(`{ id, label }`). This replaces `MenuDrinkSection.vue`'s existing
`isVasoSumo()` special-case + hardcoded `vasoSumoFlavors` array with a
**fully generic loop that works for any dish with option groups** — no
dish-name string-matching required post-migration.

"Añade extra proteína" (+$29) is modeled as its own option group with two
choices: a default "No, gracias" choice at `price_delta: 0.00` (first by
`display_order`, so it is preselected by default — matching
`MenuSaucePicker`'s existing `selectedId = props.options[0]?.id` behavior)
and a "Sí, extra proteína (+$29)" choice at `price_delta: 29.00`.

**Decision on displaying `price_delta`**: The price is baked directly into
the choice's `name_es`/`name_en` text at the data layer (e.g. "Sí, extra
proteína (+$29)"), exactly as the client's own reference image does it
textually. `price_delta` is still stored as its own numeric column (so it
remains independently DB-editable per FR-015), but the frontend does not need
any new prop or rendering logic on `MenuSaucePicker` to show it separately —
it is just part of the label string returned by the query layer, the same way
`sauces`' `spiceLevel` is instead rendered as a SEPARATE chili-icon indicator
today (a precedent for "a picker CAN show structured metadata," used only
where the existing component already supports it; extending
`MenuSaucePicker` with a new `priceDelta` prop was considered and rejected as
unnecessary for a first version — see Alternatives).

**Rationale**: Directly satisfies Article X (KISS) and Article I (DRY) — zero
new Vue components, zero changes to an already-generic, already-proven picker
component, for both Ramen (Part C) and Vaso Sumo (Part E). Modeling the
add-on as a same-shaped option group (rather than inventing a `required:
boolean` flag or a separate "add-on" entity) keeps exactly one entity shape
in the schema, with no group-type branching anywhere in code.

**Alternatives considered**:
- A `required: boolean` column on `menu_item_option_groups` plus different
  frontend treatment (radio vs. checkbox) for optional groups — rejected:
  adds a second code path and a second component behavior for a distinction
  that a "No, gracias" $0 choice already expresses without any schema or UI
  branching.
- Add a `priceDelta` prop to `MenuSaucePicker.vue` for a dedicated "+$29"
  badge rendered next to the label — deferred, not rejected outright: this
  is a reasonable future UI polish, but not required to satisfy any FR in
  spec.md (which only requires the price be DB-editable and communicated,
  not that it render in a specific visual treatment); baking it into the
  label text satisfies FR-015 today with zero new frontend code.

## R6b — Vaso Sumo flavor migration mechanics (Part E)

**Decision**: Seed one `menu_item_option_groups` row (`key: 'flavor'`,
attached to the "Vaso Sumo" `menu_items` row) with 6
`menu_item_option_choices` rows (Ron, Tequila, Vodka, Whisky, New Mix, Jack
Daniel's — same names, same order as today's hardcoded
`menu.vaso_sumo.flavor.*` i18n keys, `price_delta: 0.00` for all). Remove the
hardcoded `vasoSumoFlavors` array, `flavorOptions` computed, `isVasoSumo()`
function, and the `menu.vaso_sumo.flavor.*`/`menu.vaso_sumo.picker_label`
i18n keys from `MenuDrinkSection.vue`/`i18n/locales/*.json` once the generic
`optionGroups` loop (R6a) replaces them.

**Rationale**: A pure like-for-like data migration — FR-023 requires zero
visible change, so the seeded choice labels/order must exactly match today's
rendered output before the hardcoded source is deleted.

## R6c — Disposition of the abandoned "hero image" artifacts and migration slot

**Decision**: The following uncommitted, never-merged artifacts from the
original (now-scrapped) Part C approach MUST be deleted, not adapted:

- `app/features/menu/components/MenuDishHero.vue`
- `app/features/menu/components/MenuDishHero.spec.ts`
- `app/features/menu/components/MenuDishHero.stories.ts`
- `server/db/migrations/0030_add_menu_item_display_variant.sql` (and its
  corresponding entry in `server/db/migrations/meta/_journal.json`)
- The `displayVariant` column/CHECK-constraint addition already made to
  `server/db/schema.ts`, and every reference to `displayVariant` already
  introduced in `types/menu.ts`, `server/utils/menu-queries.ts`,
  `server/db/seeds/alaCarta.ts` (`displayVariant: 'hero'` on Ramen XL), and
  `server/db/seeds/kidsMenu.ts` (`displayVariant: 'highlight'` on the Kids
  item) — these all get replaced by R5 (Kids boolean) and R6 (option groups)
  respectively.
- Any test file written specifically against the old `display_variant`
  mechanism (e.g. a `tests/db/menu-display-variant.test.ts`-style file, if one
  exists in the working tree) — superseded by new tests for the boolean flag
  and the option-groups tables.

**Migration slot reuse**: Since migration `0030` was never committed or
applied to any shared/production Neon database (per the coordinator: "never
merged"), it is safe to delete the file and its journal entry entirely and
let this feature's real migrations claim fresh slots starting at `0030`
again — no renumbering gap, no orphaned "skipped" migration number.

**Rationale**: Keeping any part of the hero-image artifacts around "just in
case" would violate Article X (KISS — no dead code) and Article VIII (no
commented-out/dead code in the codebase); since none of it was ever merged,
there is no historical/rollback reason to preserve it, and deleting it
outright avoids leaving a half-finished, unreferenced component and an
inert database column behind.

## R7 — Rendering-strategy / routing impact

**Decision**: None. `/`, `/menu`, and `/promotions` already have `routeRules`
entries (`isr: 3600`, `isr: 3600`, `isr: 60` respectively per
`docs/business/rendering-strategy.md`). This feature adds no new route, no new
page, and no new `/api/**` endpoint — only additive fields on the two existing
menu and promotions server routes. No `nuxt.config.ts` change is required.

**Rationale**: Confirms the Constitution Check gate (Article V) passes without
modification.
