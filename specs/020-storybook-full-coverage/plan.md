# Implementation Plan: Storybook Full UI/UX Documentation Coverage

**Branch**: `chore/021-storybook-coverage` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/020-storybook-full-coverage/spec.md`

## Summary

Upgrade the SUMO AYCE Storybook setup from minimal single-story coverage to full documentation-grade by addressing three structural gaps: (1) replace broken `/menu/**/*.webp` image references left after feature 018 deleted `public/menu/`, (2) install and configure `@storybook/addon-viewport` (mobile/tablet/desktop breakpoints) and `@storybook/addon-a11y` (WCAG AA audit), and (3) add state-variant stories (loading, empty, error, disabled, ES, EN) and `argTypes` with descriptions/controls to all 51 existing story files. Additionally: enable autodocs globally in `.storybook/main.ts`, and add six ComponentDocs index story files — one per feature slice. No application code changes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Storybook 10.4.1 (`@storybook/vue3-vite`), Vue 3  
**Primary Dependencies**:
- Already installed: `@storybook/addon-docs ^10.4.1`, `@storybook/vue3-vite ^10.4.1`, `storybook ^10.4.1`
- To install: `@storybook/addon-viewport ^10.4.1`, `@storybook/addon-a11y ^10.4.1`
**Storage**: N/A — no backend, no database changes  
**Testing**: Storybook build (`storybook build`) as the verification gate; Biome lint + `vue-tsc --noEmit` for TypeScript correctness  
**Target Platform**: Developer tooling (browser-based, local/CI)  
**Project Type**: Developer tooling — component documentation upgrade  
**Performance Goals**: Storybook starts in under 60 seconds; build completes without errors  
**Constraints**: All changes confined to `.storybook/` and `app/**/*.stories.ts`; zero app code changes  
**Scale/Scope**: 51 existing story files across 6 feature slices (branches, contact, homepage, menu, promotions, reservation) + layout + staff + ui-primitives

## Phase -1: Pre-Implementation Gates (Constitution Check)

*GATE: Must pass before any implementation begins. Re-check after Phase 1 design.*

### Article I — Code Organization & Reusability (NON-NEGOTIABLE)

- [x] All story files remain co-located with their component in `app/features/<slice>/components/` or `app/components/ui/`, `app/components/layout/`, `app/components/staff/`
- [x] No story file imports from another feature's folder directly (cross-feature imports forbidden)
- [x] ComponentDocs index story files are placed at the slice root (e.g., `app/features/reservation/Reservation.stories.ts`) — not in a separate directory
- [x] No shared story utility module is created unless it is used by 3 or more story files (KISS — Article X)

### Article II — TypeScript & Framework Standards (NON-NEGOTIABLE)

- [x] All story files use TypeScript with strict types (no `any`); `Meta<typeof ComponentName>` pattern used throughout
- [x] `argTypes` values use typed control descriptors; no untyped objects

### Article VII — UX Consistency & Component Documentation (NON-NEGOTIABLE)

- [x] Every story file covers: Default + all applicable state variants (loading, empty, error, disabled) + both locale variants (ES, EN) where the component renders i18n strings
- [x] Every story file covers: at least one responsive story or viewport annotation demonstrating mobile and desktop behavior
- [x] The `--accent` swap (AYCE orange vs. Express blue) is represented in stories for components that support both contexts (e.g., `Button`, `Card`, `Chip`)

### Article VIII — Clean Code Discipline

- [x] No story file exceeds 200 lines; if variants bloat a file, a second file (e.g., `ComponentName.variants.stories.ts`) is created rather than exceeding the limit
- [x] No dead code, commented-out code, or TODO comments in story files at merge

### Article IX — Quality Gates (NON-NEGOTIABLE)

- [x] All story files pass Biome lint + formatting
- [x] `vue-tsc --noEmit` passes with zero errors (stories are TypeScript files compiled by the same tsconfig)
- [x] `storybook build` completes with zero errors and zero 404s for image assets
- [x] `@storybook/addon-a11y` reports zero WCAG AA violations on all Default stories before merge

### Article X — KISS

- [x] `@storybook/addon-viewport` and `@storybook/addon-a11y` are added because they save significant hand-written auditing effort (well above the 100-line threshold — justification: each replaces a multi-step manual browser audit cycle)
- [x] No abstraction layer (e.g., shared story factories) created unless 3+ story files concretely benefit

## Project Structure

### Documentation (this feature)

```text
specs/020-storybook-full-coverage/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (affected paths only)

```text
.storybook/
└── main.ts                        # Add addons, change autodocs: 'tag' → true, add viewport presets

app/
├── components/
│   ├── layout/
│   │   ├── SiteFooter.stories.ts  # argTypes + variants + locale
│   │   ├── SiteHeader.stories.ts  # argTypes + variants + locale
│   │   ├── SiteLogo.stories.ts    # argTypes + variants
│   │   └── SiteMarquee.stories.ts # argTypes + variants + locale
│   ├── staff/
│   │   ├── CustomerCard.stories.ts
│   │   ├── LoginForm.stories.ts
│   │   ├── RewardsList.stories.ts
│   │   ├── TransactionTable.stories.ts
│   │   └── VisitButton.stories.ts
│   └── ui/
│       ├── Button.stories.ts       # argTypes + disabled + AYCE/Express accent variants
│       ├── Card.stories.ts
│       ├── Chip.stories.ts
│       ├── Input.stories.ts        # argTypes + error + disabled + locale
│       ├── Kicker.stories.ts
│       ├── Lightbox.stories.ts
│       ├── MapView.stories.ts
│       ├── Marquee.stories.ts
│       ├── Nav.stories.ts
│       ├── PageHeader.stories.ts
│       ├── PromotionCard.stories.ts
│       ├── Select.stories.ts
│       ├── Sticker.stories.ts
│       ├── Textarea.stories.ts
│       └── Tokens.stories.ts
├── features/
│   ├── branches/components/
│   │   ├── BranchCard.stories.ts
│   │   ├── BranchList.stories.ts   # argTypes + empty + loading
│   │   └── BranchSearch.stories.ts # argTypes + error
│   ├── contact/components/
│   │   ├── ContactForm.stories.ts  # argTypes + error + locale
│   │   └── ContactInfo.stories.ts
│   ├── homepage/components/
│   │   ├── DishCard.stories.ts     # FIX broken image + argTypes + locale
│   │   ├── HomeBranchesCta.stories.ts
│   │   ├── HomeFeaturedRail.stories.ts # empty state
│   │   ├── HomeHero.stories.ts     # argTypes + locale
│   │   ├── HomePromotions.stories.ts   # empty state + locale
│   │   ├── HomeReviews.stories.ts  # empty state
│   │   ├── HomeTypeSelector.stories.ts
│   │   └── ReviewCard.stories.ts
│   ├── menu/components/
│   │   ├── MenuCategoryChips.stories.ts
│   │   ├── MenuDishCard.stories.ts # FIX broken image (/menu/ayce/bora_bora.webp) + argTypes
│   │   ├── MenuDishGrid.stories.ts # FIX broken images + argTypes + empty + loading
│   │   ├── MenuDrinkSection.stories.ts
│   │   ├── MenuModalityToggle.stories.ts
│   │   ├── MenuSaucePicker.stories.ts
│   │   ├── MenuShell.stories.ts    # loading + empty
│   │   └── MenuTypeToggle.stories.ts
│   ├── promotions/components/
│   │   └── PromotionsGrid.stories.ts # argTypes + empty
│   └── reservation/components/
│       ├── ReservationConfirmation.stories.ts
│       ├── ReservationFieldsContact.stories.ts # argTypes + error + locale
│       ├── ReservationFieldsDateTime.stories.ts # argTypes + error
│       ├── ReservationFieldsPrimary.stories.ts  # argTypes + error
│       └── ReservationForm.stories.ts            # loading + error

# NEW: ComponentDocs index story files (one per slice)
app/features/branches/Branches.stories.ts
app/features/contact/Contact.stories.ts
app/features/homepage/Homepage.stories.ts
app/features/menu/Menu.stories.ts
app/features/promotions/Promotions.stories.ts
app/features/reservation/Reservation.stories.ts
app/components/ui/UIPrimitives.stories.ts    # ui + layout slice overview
```

## Complexity Tracking

No constitution violations — all changes stay within the permitted scope. No complexity justification required.

---

## Phase 0: Research

*See [research.md](./research.md) for full findings.*

### Key decisions resolved:

| Decision | Chosen | Rationale |
|---|---|---|
| Addon version | `^10.4.1` (same major as installed Storybook) | Peer-dependency alignment; avoids version skew errors |
| Autodocs strategy | Global flag `docs: { autodocs: true }` in `main.ts` | Simpler than adding `tags: ['autodocs']` to 51 files; one-line change |
| Broken image fix | Replace with `https://placehold.co/400x300` | External URL, no asset to commit, clearly a placeholder, degrades gracefully offline |
| Locale variant strategy | Locale stories pass locale-specific string props directly (e.g., `label: 'Reservar'` vs `label: 'Reserve'`) — no i18n plugin decorator required | Components accept string props; no need to mock the full i18n plugin in Storybook for variant display |
| ComponentDocs file format | CSF3 `.stories.ts` with `tags: ['autodocs']` on Meta, empty named export | Avoids MDX dependency; compatible with current Storybook 10 CSF3 setup |
| 200-line overflow handling | Split to `ComponentName.variants.stories.ts` if base file would exceed 200 lines | Article VIII compliance; keeps base file readable |

---

## Phase 1: Design & Contracts

*See [data-model.md](./data-model.md) and [quickstart.md](./quickstart.md).*

### `.storybook/main.ts` change summary

```diff
  addons: [
    '@storybook/addon-docs',
+   '@storybook/addon-viewport',
+   '@storybook/addon-a11y',
  ],
  docs: {
-   autodocs: 'tag',
+   autodocs: true,
  },
+ viewportAddon: {
+   viewports: {
+     mobile:  { name: 'Mobile',  styles: { width: '375px',  height: '812px' } },
+     tablet:  { name: 'Tablet',  styles: { width: '768px',  height: '1024px' } },
+     desktop: { name: 'Desktop', styles: { width: '1280px', height: '900px' } },
+   },
+   defaultViewport: 'mobile',
+ },
```

*Note: The exact `viewportAddon` config key is confirmed in research.md — Storybook 10 uses `parameters.viewport` in `.storybook/preview.ts` for custom viewports, not a top-level `viewportAddon` key in `main.ts`.*

### Story variant matrix (what gets added per component category)

| Component category | Loading | Empty | Error | Disabled | LocaleES | LocaleEN | Notes |
|---|---|---|---|---|---|---|---|
| List/grid components (BranchList, MenuDishGrid, HomeFeaturedRail, HomePromotions, HomeReviews, PromotionsGrid) | Yes | Yes | — | — | — | — | Loading skeleton + empty-list state |
| Form field components (Input, Select, Textarea, ContactForm, ReservationFields*) | — | — | Yes | Yes | Yes | Yes | Validation error + disabled + bilingual labels |
| Action components (Button, VisitButton) | — | — | — | Yes | — | — | Disabled state only |
| Content components (DishCard, MenuDishCard, PromotionCard, ReviewCard) | — | — | — | — | Yes | Yes | Bilingual content props |
| Shell/page-level (MenuShell, ReservationForm) | Yes | Yes | — | — | — | — | Loading + empty skeleton wrappers |
| Navigation (Nav, SiteHeader) | — | — | — | — | Yes | Yes | Bilingual nav links |
| Decorative (Sticker, Kicker, Marquee, SiteLogo) | — | — | — | — | — | — | No state or i18n variants |

### ArgTypes control mapping

| Prop type | Storybook control |
|---|---|
| `boolean` | `{ type: 'boolean' }` |
| `string` | `{ type: 'text' }` |
| `'ayce' \| 'express'` enum | `{ type: 'select', options: ['ayce', 'express'] }` |
| `number` | `{ type: 'number' }` |
| `object` / `array` | `{ type: 'object' }` |
| event handler / function | `{ type: 'function' }` (or omit — functions don't serialize) |
