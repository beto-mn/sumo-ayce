# Final Pre-Commit Review: promo-flip-menu-card-tweaks (027)

**Status:** APPROVED

## Scope of this review

This is a second, holistic pass over the ENTIRE uncommitted working tree
(feature 027 Parts A–E, already APPROVED + `done` per the original
`REVIEW.md`, PLUS the follow-up tweaks layered on top since that approval),
prior to a single commit landing everything at once. Nothing in this diff
has been committed yet (`git status --short` confirms ~43 modified files
+ 5 untracked paths, matching the description given).

## Verification of the original REVIEW.md's findings (Parts A–E still hold)

- **No `displayVariant`/`MenuDishHero` leftovers**: `grep -rn "displayVariant|MenuDishHero|display_variant" app/ server/ types/ tests/`
  returns only expected historical references inside `tasks.md` (completed
  cleanup tasks) and one explanatory code comment in the new migration
  (`0030_add_menu_item_highlight_background.sql`) describing what it
  replaces. No live component/column/type reference remains. `find . -name
  "MenuDishHero*"` returns nothing.
- **Bilingual `tyc_es`/`tyc_en` completeness rule intact**: `PromotionCard.vue`'s
  `hasTerms`/`onCardClick` logic and `validators.ts`'s `toTerms()` are
  unchanged from the approved version — both-present-only rule, no
  same-language fallback, confirmed by the (unmodified) test cases in
  `validators.test.ts` and the new flip-specific cases in
  `PromotionCard.spec.ts`.
- **Option-groups genericity intact**: `menu_item_option_groups`/
  `menu_item_option_choices` remain keyed generically by `menuItemId`;
  `MenuDishCard.vue` (Ramen XL) and `MenuDrinkSection.vue` (Vaso Sumo) both
  render `MenuSaucePicker` per `optionGroups` entry through the same
  generic loop — no Ramen-specific or Vaso-Sumo-specific branching
  introduced by the follow-up tweaks.
- **Garantía badge**: still `size-24` (not reverted to `size-16`), positioned
  top-left, documented as never overlapping the top-right `badgeEs` sticker.

No regression found versus the original approval.

## Verification of the 3 follow-up tweaks

1. **`PromotionCard.vue` responsive T&C back-face padding** (`p-6` mobile →
   `min-[520px]:p-9` tablet → `min-[880px]:p-12` desktop): touches only the
   back-face `<div>`'s class list inside `PromotionCard.vue`; no other markup,
   props, or behavior changed by this tweak. `min-[520px]:`/`min-[880px]:`
   arbitrary-variant breakpoints are an established, pre-existing pattern in
   this codebase (`HomeTypeSelector.vue`, `ReservationFieldsContact.vue`,
   `DishCard.vue`, `SiteFooter.vue`, `contact.vue`), matching the documented
   breakpoints in `docs/business/overview.md` §9 (880px/520px) — not a new or
   inconsistent convention. All three values (`p-6`/`p-9`/`p-12`) are
   standard Tailwind spacing-scale classes, not arbitrary values — the
   arbitrary-value grep (`(bg|text|border|...)-\[`) and default-Tailwind-
   palette grep both return zero matches anywhere touched by this diff.
   `PromotionCard.spec.ts` has a dedicated test asserting exactly these three
   classes are present on the back face
   (`'scales padding progressively: p-6 mobile, p-9 tablet (min-[520px]),
   p-12 desktop (min-[880px])'`), and the existing flip/reduced-motion tests
   are unaffected. No story regression: `PromotionCard.stories.ts`'s
   `Flipped`/`Flippable`/`NoTerms` stories mount the real component and are
   unaffected by a class-list-only change.
2. **`server/db/seeds/alaCarta.ts` Ramen XL vegetables note**: touches only
   the `descriptionEs`/`descriptionEn` strings on the existing "Ramen XL"
   seed entry, plus an explanatory code comment — no schema, query, or
   option-groups logic touched. No test asserts the exact prior description
   string (`menu-queries.test.ts`/`tests/db/menu-item-options-seed.test.ts`
   assert option-group structure, not this dish's description text), so nothing
   broke. This keeps the seed source in sync with the manually-applied live
   Neon row, preventing a future `pnpm db:seed` from reverting the client's
   copy — correctly scoped, no side effects on Parts A–E.
3. Reviewed the remainder of the diff for anything beyond the two tweaks
   named above; found nothing else that reads as a third independent,
   out-of-spec tweak — the `.storybook/preview.ts` menu-component
   auto-registration change is required plumbing for Part C/E's
   `MenuSaucePicker` reuse inside `MenuDishCard`/`MenuDrinkSection` stories
   (not a "tweak," a dependency of the already-approved Part C/E Storybook
   coverage) and every other file in the diff maps directly onto Parts A–E
   as described in `plan.md`. Flagging this discrepancy (3 tweaks promised,
   2 distinct ones found) as a non-blocking note — worth a one-line
   confirmation from whoever briefed this task, but not a rejection reason
   since every actual file in the diff is accounted for and nothing
   unexplained or out of scope was found.

## Repo state — `./init.sh` (run independently)

```
Biome check OK
Typecheck OK
Test Files  115 passed (115) / Tests  1003 passed (1003)
Storybook build OK
Environment ready.
```
Exit code 0.

## Sensitive data scan

- `git diff -- ':!pnpm-lock.yaml' ':!package-lock.json'` against the secret
  pattern set: zero real hits (only the literal word "token" inside design-
  token prose/comments, and one occurrence inside the `feature_list.json`
  diff's own description text, which is a plain-English copy of the spec
  input, not a secret).
- All 5 untracked paths (`server/db/migrations/0030_*.sql`,
  `0031_*.sql`, `server/db/seeds/menuItemOptions.ts`,
  `specs/027-promo-flip-menu-card-tweaks/`, `tests/db/menu-item-options-seed.test.ts`)
  individually re-scanned: zero matches.
- No `.env*` file tracked (`git ls-files | grep -E '^\.env($|\.)'` →
  empty except none at all).

## Design-token / frontend enforcement (Article VII, since `app/` is touched)

- Default-Tailwind-palette scan (`bg|text|border|...-{gray,red,orange,...}-{50..950}`)
  across `app/` and `.storybook/`: zero matches.
- Arbitrary-value scan (`(bg|text|border|...)-\[`) across changed files in
  `app/`/`.storybook/`: zero matches (the `[transform:rotateY(180deg)]`/
  `[backface-visibility:hidden]`/`[perspective:1200px]` usages in
  `PromotionCard.vue` are pre-existing, unmodified-by-the-follow-up-tweaks
  CSS-property arbitrary variants, not color/spacing/token bypasses, and
  were already present in the originally-approved Part A implementation).
- Inline-hex scan across `app/components/`, `app/layouts/`, `app/pages/`:
  zero matches.
- `find app/components -maxdepth 1 -name '*.vue'` → empty (folder-structure
  gate holds).

## `feature_list.json` state

- Feature 27 (`promo-flip-menu-card-tweaks`) present with `"status": "done"`,
  added as a clean new entry at the end of the `features` array — no other
  feature entry was touched by this diff.
- Full status sweep: `done` → [1–14, 16–24, 27]; `pending` → [15, 25, 26].
  Zero features left `in_progress` or `reviewing` — consistent with
  `./init.sh`'s own "Features in_progress/reviewing: 0" check.

## Notes (non-blocking)

- The task brief said "THREE additional follow-up tweaks" but only
  described two; only two distinct, independently-scoped tweaks were found
  in the diff beyond the already-approved Parts A–E (the padding change and
  the Ramen XL description change). Recommend the leader confirm there
  isn't a third intended tweak that never made it into the working tree
  before this commit lands — but this is a documentation/communication
  gap, not a code defect, and does not block approval.
- T048 (Lighthouse spot-check, flagged non-blocking in the original review)
  remains open for a human with real browser tooling — unchanged status,
  still not a blocker.
