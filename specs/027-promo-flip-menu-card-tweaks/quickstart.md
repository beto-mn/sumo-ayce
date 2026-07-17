# Quickstart: Promo Flip-to-Terms + Garantía Badge + Ramen XL DB-Driven Options + Kids AYCE Background + Vaso Sumo Migration

**Feature**: `027-promo-flip-menu-card-tweaks`

Manual verification steps once the feature is implemented, mirroring the
Independent Tests already defined in `spec.md`. Each part is independently
verifiable.

## Part A — Promo card flip-to-terms

1. Ensure at least one WordPress `promociones` entry has BOTH `tyc_es` AND
   `tyc_en` (assumed field keys, per `research.md` R4) populated. **If the
   WP-side field isn't confirmed live yet, or the key names differ from the
   assumed `tyc_es`/`tyc_en`** (in-progress coordination status, no longer a
   hard blocker — `research.md` R4), this part cannot be end-to-end verified
   with live content — verify instead against a mocked/stubbed API response in
   Storybook/Vitest, and confirm that with a real WP payload lacking the field
   (or missing/empty on either side), no flip affordance appears (FR-008) and
   nothing errors.
2. `pnpm dev`, open `/` (homepage promotions rail) and `/promotions`.
3. Click a promo card with BOTH languages of terms configured → card flips,
   back face shows the terms text in the active locale. Click again → flips
   back.
4. Using a promo with only ONE language configured (e.g. `tyc_es` filled,
   `tyc_en` empty) → confirm the card does NOT flip at all (bilingual-
   completeness rule, `research.md` R4a) — same as a promo with neither
   language configured.
5. Drag/swipe the carousel → navigates normally, no flip triggered mid-drag.
6. Flip a card, then use the dot/arrow navigation to move to another slide →
   confirm the previously-flipped card is back to its front face if revisited.
7. Toggle OS-level "reduce motion" and repeat step 3 → transition is an
   instant/cross-fade swap, not a 3D rotation.

## Part B — Garantía Sumo badge size

1. Open `/menu`, à la carte modality, find a Garantía Sumo (`featured: true`)
   dish.
2. At 375px, 768px, and desktop widths, confirm the star badge is clearly
   larger than before and does not overlap the top-right pink badge sticker.

## Part C — Ramen XL build-your-own options (REVISED — no more hero image)

1. Open `/menu`, à la carte modality, "Ramen" category.
2. Confirm "Ramen XL" renders as a NORMAL dish card — same size/layout as
   every other à la carte dish, no showcase/hero visual treatment.
3. Confirm the card additionally shows three pickers beneath its description:
   "Base de fideo" (Pollo, Camarón cremoso, Camarón picante, Vegetales
   picantes), "Proteína" (Res, Camarón, Pollo), and "Añade extra proteína"
   ("No, gracias" / "Sí, extra proteína (+$29)").
4. Directly in the database, rename one choice (e.g. "Pollo" → "Pollo
   asado") or add a brand-new choice to one of the groups — reload `/menu`
   and confirm the change appears with NO code change or redeploy.
5. Deactivate (or delete) all choices in one group — reload and confirm that
   group's picker no longer renders (no empty picker shown).
6. Temporarily add a second seed item to `categoryKey: 'ramen'` with no
   option groups configured, and confirm it renders as a normal card with no
   options section at all.

## Part D — All You Can Eat Kids background

1. Open `/menu`, Kids view.
2. Confirm "All You Can Eat Kids" shows an orange→blue gradient behind its
   image panel; every other Kids combo card is visually unchanged.
3. Confirm dish name/description/price text remains fully legible.
4. Confirm this dish shows NO options section (it has no option groups
   configured — `highlightBackground` and `optionGroups` are independent
   mechanisms, per FR-020).

## Part E — Vaso Sumo flavors, now DB-driven (NEW)

1. Open `/menu`, switch to Bebidas, find "Vaso Sumo".
2. Confirm the flavor picker shows the same 6 flavors as before this feature
   (Ron, Tequila, Vodka, Whisky, New Mix, Jack Daniel's), in the same order
   and visual style — no perceptible change to the diner.
3. Directly in the database, add a 7th flavor (or rename/deactivate an
   existing one) — reload `/menu` and confirm the picker reflects the change
   with NO code change or redeploy.
4. Grep the codebase for `menu.vaso_sumo.flavor` and `vasoSumoFlavors` —
   confirm zero remaining references (FR-024).

## Automated coverage checklist (see `tasks.md` for the concrete work items)

- `PromotionCard.spec.ts` — flip prop toggling, terms rendering, no-terms →
  no flip affordance. (Unchanged, Part A.)
- `PromotionsCarousel.spec.ts` — flip resets on slide change; click vs. drag
  is exercised via Embla's real click-suppression (no need to mock it).
  (Unchanged, Part A.)
- `MenuDishCard.spec.ts` — badge size class (Part B); `highlightBackground`
  prop (Part D, revised from `highlightImagePanel`); `optionGroups` rendering
  via `MenuSaucePicker` (Part C, new).
- `MenuDrinkSection.spec.ts` — Vaso Sumo flavor picker sourced from
  `optionGroups` instead of hardcoded i18n keys (Part E, new).
- `menu-queries.test.ts` — `highlightBackground` projected correctly
  (`true`/`false`); `optionGroups` projected correctly (empty for most dishes,
  populated for Ramen XL/Vaso Sumo fixtures).
- `validators.ts` test — `terms` parses to `Bilingual` only when BOTH
  languages are present, `null` otherwise; promo is never dropped for
  missing/partial terms. (Unchanged, Part A.)
- **Removed** (superseded, delete rather than migrate): any test file written
  against `displayVariant` or `MenuDishHero.vue`.
