# Tasks: Storybook Full UI/UX Documentation Coverage

**Input**: Design documents from `/specs/020-storybook-full-coverage/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅  
**Tests**: Not applicable — stories are documentation artifacts, not test files. Verification gate is `storybook build` + `vue-tsc --noEmit` + Biome check.

**Scope constraint**: ALL tasks are confined to `.storybook/` and `app/**/*.stories.ts`. Zero app source file changes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6 mapped from spec.md)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup — Addon Installation & Config

**Purpose**: Install missing packages and update Storybook configuration. MUST complete before any story file work.

**⚠️ CRITICAL**: All Phase 3+ story file tasks depend on Phase 1 completion (addon registration must exist before viewport/a11y stories can be verified).

- [x] T001 Install `@storybook/addon-viewport@^10.4.1` and `@storybook/addon-a11y@^10.4.1` as dev dependencies (`npm install --save-dev @storybook/addon-viewport@^10.4.1 @storybook/addon-a11y@^10.4.1`)
- [x] T002 Update `.storybook/main.ts`: add `'@storybook/addon-viewport'` and `'@storybook/addon-a11y'` to the `addons` array
- [x] T003 Update `.storybook/main.ts`: change `docs: { autodocs: 'tag' }` to `docs: { autodocs: true }`
- [x] T004 Create `.storybook/preview.ts` with `parameters.viewport` block defining three presets: `mobile` (375px × 812px), `tablet` (768px × 1024px), `desktop` (1280px × 900px) with `defaultViewport: 'mobile'`
- [x] T005 Smoke-test: run `npm run storybook` and confirm Storybook starts without errors, Viewport toolbar appears, Accessibility panel appears, and Docs tabs are present on existing components

**Checkpoint**: Storybook starts with both new addons active and autodocs pages visible for all existing components.

---

## Phase 2: Foundational — Fix Broken Image References

**Purpose**: Repair the three broken `/menu/ayce/bora_bora.webp` references so all stories render without 404 errors. This is a prerequisite for reliable visual review in all subsequent phases.

**⚠️ CRITICAL**: Must complete before Phase 3+ story reviews to avoid false-positive visual failures.

- [x] T006 [US1] Fix `app/features/menu/components/MenuDishCard.stories.ts` line 33: replace `imageUrl: '/menu/ayce/bora_bora.webp'` with `imageUrl: 'https://placehold.co/400x300'`
- [x] T007 [P] [US1] Fix `app/features/menu/components/MenuDishGrid.stories.ts` line 33: replace `imageUrl: '/menu/ayce/bora_bora.webp'` with `imageUrl: 'https://placehold.co/400x300'`
- [x] T008 [P] [US1] Fix `app/features/menu/components/MenuDishGrid.stories.ts` line 110: replace `imageUrl: '/menu/ayce/bora_bora.webp'` with `imageUrl: 'https://placehold.co/400x300'`
- [x] T009 [US1] Verify zero browser console 404 errors for any `/menu/**` path by opening the patched stories in Storybook

**Checkpoint**: All story images resolve without 404. Open `MenuDishCard` and `MenuDishGrid` stories and confirm placeholder images display.

---

## Phase 3: User Story 2 — Viewport & Accessibility Addons (Priority: P1)

**Goal**: Developers can switch between Mobile / Tablet / Desktop viewport presets and run WCAG AA accessibility audits on every Default story.

**Independent Test**: Open Storybook → click Viewport selector → confirm three named presets resize the canvas. Open Accessibility panel on `Button/Default` → confirm zero violations.

- [x] T010 [US2] Verify `app/components/ui/Button.stories.ts` Default story passes WCAG AA in the Accessibility panel; document any violations found and add `parameters.a11y.config.rules` suppression with reason if needed
- [x] T011 [P] [US2] Verify `app/components/ui/Input.stories.ts` Default story passes WCAG AA; fix story render (aria-label, label association) if violations found — no `.vue` file changes
- [x] T012 [P] [US2] Verify `app/components/ui/Select.stories.ts` Default story passes WCAG AA; fix story render if violations found
- [x] T013 [P] [US2] Verify `app/components/ui/Textarea.stories.ts` Default story passes WCAG AA; fix story render if violations found
- [x] T014 [P] [US2] Verify `app/components/ui/Nav.stories.ts` Default story passes WCAG AA (keyboard nav, focus management)
- [x] T015 [P] [US2] Verify `app/components/ui/Lightbox.stories.ts` Default story passes WCAG AA (focus trap, aria-modal)
- [x] T016 [P] [US2] Verify `app/components/layout/SiteHeader.stories.ts` Default story passes WCAG AA
- [x] T017 [P] [US2] Verify `app/components/ui/PromotionCard.stories.ts` Default story passes WCAG AA (color contrast)
- [x] T018 [P] [US2] Verify `app/features/reservation/components/ReservationForm.stories.ts` Default story passes WCAG AA
- [x] T019 [P] [US2] Verify remaining 42 Default stories pass WCAG AA — batch-check by opening each story group (branches, contact, homepage, menu, promotions, staff) and confirming zero violations in the Accessibility panel

**Checkpoint**: All Default stories show zero WCAG AA violations in the addon-a11y panel.

---

## Phase 4: User Story 3 — Autodocs for Every Component (Priority: P2)

**Goal**: Every component entry in the Storybook sidebar has a Docs tab with an auto-generated documentation page including a props/controls table.

**Independent Test**: After Phase 1 config changes (T003 sets `autodocs: true`), open any component in Storybook and click the Docs tab — confirms the auto-generated page renders with a controls table.

> Note: Autodocs infrastructure is delivered by T003 (Phase 1). Phase 4 tasks focus on adding `argTypes` to all Meta objects so the Docs pages are populated with descriptions and controls — not just type inference.

### UI Primitives (`app/components/ui/`)

- [x] T020 [P] [US3] Add `argTypes` with `description` and `control` to `app/components/ui/Button.stories.ts` (props: `label`, `variant`, `size`, `disabled`)
- [x] T021 [P] [US3] Add `argTypes` to `app/components/ui/Card.stories.ts` (props: `title`, `accent`, `shadow`)
- [x] T022 [P] [US3] Add `argTypes` to `app/components/ui/Chip.stories.ts` (props: `label`, `active`, `accent`)
- [x] T023 [P] [US3] Add `argTypes` to `app/components/ui/Input.stories.ts` (props: `label`, `placeholder`, `modelValue`, `error`, `disabled`)
- [x] T024 [P] [US3] Add `argTypes` to `app/components/ui/Select.stories.ts` (props: `label`, `options`, `modelValue`, `error`, `disabled`)
- [x] T025 [P] [US3] Add `argTypes` to `app/components/ui/Textarea.stories.ts` (props: `label`, `placeholder`, `modelValue`, `error`, `disabled`)
- [x] T026 [P] [US3] Add `argTypes` to `app/components/ui/Kicker.stories.ts` (props: `text`, `rotated`)
- [x] T027 [P] [US3] Add `argTypes` to `app/components/ui/Lightbox.stories.ts` (props: `open`, `imageUrl`, `alt`)
- [x] T028 [P] [US3] Add `argTypes` to `app/components/ui/MapView.stories.ts` (props: `center`, `zoom`, `markers`, `style`, `interactive`)
- [x] T029 [P] [US3] Add `argTypes` to `app/components/ui/Marquee.stories.ts` (props: `items`, `speed`, `paused`)
- [x] T030 [P] [US3] Add `argTypes` to `app/components/ui/Nav.stories.ts` (props: `locale`, `currentRoute`)
- [x] T031 [P] [US3] Add `argTypes` to `app/components/ui/PageHeader.stories.ts` (props: `title`, `subtitle`, `kicker`)
- [x] T032 [P] [US3] Add `argTypes` to `app/components/ui/PromotionCard.stories.ts` (props: `badge`, `title`, `description`, `validity`, `color`, `type`)
- [x] T033 [P] [US3] Add `argTypes` to `app/components/ui/Sticker.stories.ts` (props: `text`, `color`, `rotated`)
- [x] T034 [P] [US3] Add `argTypes` to `app/components/ui/Tokens.stories.ts` (no interactive props — confirm existing structure is sufficient)

### Layout (`app/components/layout/`)

- [x] T035 [P] [US3] Add `argTypes` to `app/components/layout/SiteFooter.stories.ts` (props: `locale`)
- [x] T036 [P] [US3] Add `argTypes` to `app/components/layout/SiteHeader.stories.ts` (props: `locale`, `currentRoute`)
- [x] T037 [P] [US3] Add `argTypes` to `app/components/layout/SiteLogo.stories.ts` (props: `size`)
- [x] T038 [P] [US3] Add `argTypes` to `app/components/layout/SiteMarquee.stories.ts` (props: `items`, `locale`)

### Staff (`app/components/staff/`)

- [x] T039 [P] [US3] Add `argTypes` to `app/components/staff/CustomerCard.stories.ts` (props: `name`, `phone`, `points`)
- [x] T040 [P] [US3] Add `argTypes` to `app/components/staff/LoginForm.stories.ts` (props: `error`, `loading`)
- [x] T041 [P] [US3] Add `argTypes` to `app/components/staff/RewardsList.stories.ts` (props: `rewards`, `loading`)
- [x] T042 [P] [US3] Add `argTypes` to `app/components/staff/TransactionTable.stories.ts` (props: `transactions`, `loading`)
- [x] T043 [P] [US3] Add `argTypes` to `app/components/staff/VisitButton.stories.ts` (props: `disabled`, `loading`, `customerId`)

### Branches feature (`app/features/branches/`)

- [x] T044 [P] [US3] Add `argTypes` to `app/features/branches/components/BranchCard.stories.ts` (props: `name`, `type`, `address`, `distance`, `phone`)
- [x] T045 [P] [US3] Add `argTypes` to `app/features/branches/components/BranchList.stories.ts` (props: `branches`, `loading`)
- [x] T046 [P] [US3] Add `argTypes` to `app/features/branches/components/BranchSearch.stories.ts` (props: `modelValue`, `error`)

### Contact feature (`app/features/contact/`)

- [x] T047 [P] [US3] Add `argTypes` to `app/features/contact/components/ContactForm.stories.ts` (props: `branches`, `error`, `locale`)
- [x] T048 [P] [US3] Add `argTypes` to `app/features/contact/components/ContactInfo.stories.ts` (props: `locale`)

### Homepage feature (`app/features/homepage/`)

- [x] T049 [P] [US3] Add `argTypes` to `app/features/homepage/components/DishCard.stories.ts` (props: `name`, `description`, `imageUrl`, `price`, `badge`, `locale`)
- [x] T050 [P] [US3] Add `argTypes` to `app/features/homepage/components/HomeBranchesCta.stories.ts` (props: `locale`)
- [x] T051 [P] [US3] Add `argTypes` to `app/features/homepage/components/HomeFeaturedRail.stories.ts` (props: `dishes`, `loading`)
- [x] T052 [P] [US3] Add `argTypes` to `app/features/homepage/components/HomeHero.stories.ts` (props: `locale`, `price`)
- [x] T053 [P] [US3] Add `argTypes` to `app/features/homepage/components/HomePromotions.stories.ts` (props: `promotions`)
- [x] T054 [P] [US3] Add `argTypes` to `app/features/homepage/components/HomeReviews.stories.ts` (props: `reviews`)
- [x] T055 [P] [US3] Add `argTypes` to `app/features/homepage/components/HomeTypeSelector.stories.ts` (props: `locale`)
- [x] T056 [P] [US3] Add `argTypes` to `app/features/homepage/components/ReviewCard.stories.ts` (props: `author`, `rating`, `text`, `locale`)

### Menu feature (`app/features/menu/`)

- [x] T057 [P] [US3] Add `argTypes` to `app/features/menu/components/MenuCategoryChips.stories.ts` (props: `categories`, `active`, `locale`)
- [x] T058 [P] [US3] Add `argTypes` to `app/features/menu/components/MenuDishCard.stories.ts` (props: `name`, `description`, `imageUrl`, `price`, `badge`, `locale`)
- [x] T059 [P] [US3] Add `argTypes` to `app/features/menu/components/MenuDishGrid.stories.ts` (props: `dishes`, `loading`, `locale`)
- [x] T060 [P] [US3] Add `argTypes` to `app/features/menu/components/MenuDrinkSection.stories.ts` (props: `drinks`, `locale`)
- [x] T061 [P] [US3] Add `argTypes` to `app/features/menu/components/MenuModalityToggle.stories.ts` (props: `modelValue`, `locale`)
- [x] T062 [P] [US3] Add `argTypes` to `app/features/menu/components/MenuSaucePicker.stories.ts` (props: `sauces`, `modelValue`, `locale`)
- [x] T063 [P] [US3] Add `argTypes` to `app/features/menu/components/MenuShell.stories.ts` (props: `loading`)
- [x] T064 [P] [US3] Add `argTypes` to `app/features/menu/components/MenuTypeToggle.stories.ts` (props: `modelValue`, `locale`)

### Promotions feature (`app/features/promotions/`)

- [x] T065 [P] [US3] Add `argTypes` to `app/features/promotions/components/PromotionsGrid.stories.ts` (props: `promotions`, `locale`)

### Reservation feature (`app/features/reservation/`)

- [x] T066 [P] [US3] Add `argTypes` to `app/features/reservation/components/ReservationConfirmation.stories.ts` (props: `branch`, `date`, `time`, `partySize`, `name`, `locale`)
- [x] T067 [P] [US3] Add `argTypes` to `app/features/reservation/components/ReservationFieldsContact.stories.ts` (props: `modelValue`, `error`, `locale`)
- [x] T068 [P] [US3] Add `argTypes` to `app/features/reservation/components/ReservationFieldsDateTime.stories.ts` (props: `modelValue`, `slots`, `error`)
- [x] T069 [P] [US3] Add `argTypes` to `app/features/reservation/components/ReservationFieldsPrimary.stories.ts` (props: `branches`, `modelValue`, `error`, `locale`)
- [x] T070 [P] [US3] Add `argTypes` to `app/features/reservation/components/ReservationForm.stories.ts` (props: `branches`, `loading`, `error`)

**Checkpoint**: Every component in Storybook has a Docs tab with a populated controls table showing prop descriptions and interactive inputs.

---

## Phase 5: User Story 4 — Complete State Variant Stories (Priority: P2)

**Goal**: Every applicable component has Loading, Empty, Error, Disabled, LocaleES, and LocaleEN stories in addition to Default.

**Independent Test**: Navigate to any component listed below in Storybook and confirm the named variant stories appear in the sidebar.

> Note: Tasks in this phase are grouped by feature slice for parallel execution. Within each slice, individual story files are independent.

### UI Primitives — state variants

- [x] T071 [P] [US4] Add `Disabled` and `AccentExpress` stories to `app/components/ui/Button.stories.ts`
- [x] T072 [P] [US4] Add `Disabled`, `AccentAYCE`, `AccentExpress`, `LocaleES`, `LocaleEN` stories to `app/components/ui/Chip.stories.ts`
- [x] T073 [P] [US4] Add `Error`, `Disabled`, `LocaleES`, `LocaleEN` stories to `app/components/ui/Input.stories.ts`
- [x] T074 [P] [US4] Add `Error`, `Disabled`, `LocaleES`, `LocaleEN` stories to `app/components/ui/Select.stories.ts`
- [x] T075 [P] [US4] Add `Error`, `Disabled`, `LocaleES`, `LocaleEN` stories to `app/components/ui/Textarea.stories.ts`
- [x] T076 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/components/ui/Kicker.stories.ts`
- [x] T077 [P] [US4] Add `Loading` (map initializing state) story to `app/components/ui/MapView.stories.ts`
- [x] T078 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/components/ui/Marquee.stories.ts`
- [x] T079 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/components/ui/Nav.stories.ts`
- [x] T080 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/components/ui/PageHeader.stories.ts`
- [x] T081 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/components/ui/PromotionCard.stories.ts`

### Layout — state variants

- [x] T082 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/components/layout/SiteFooter.stories.ts`
- [x] T083 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/components/layout/SiteHeader.stories.ts`
- [x] T084 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/components/layout/SiteMarquee.stories.ts`

### Staff — state variants

- [x] T085 [P] [US4] Add `Error` story to `app/components/staff/LoginForm.stories.ts`
- [x] T086 [P] [US4] Add `Empty` story to `app/components/staff/RewardsList.stories.ts`
- [x] T087 [P] [US4] Add `Loading`, `Empty` stories to `app/components/staff/TransactionTable.stories.ts`
- [x] T088 [P] [US4] Add `Disabled` story to `app/components/staff/VisitButton.stories.ts`

### Branches — state variants

- [x] T089 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/branches/components/BranchCard.stories.ts`
- [x] T090 [P] [US4] Add `Loading`, `Empty` stories to `app/features/branches/components/BranchList.stories.ts`
- [x] T091 [P] [US4] Add `Error`, `LocaleES`, `LocaleEN` stories to `app/features/branches/components/BranchSearch.stories.ts`

### Contact — state variants

- [x] T092 [P] [US4] Add `Error`, `LocaleES`, `LocaleEN` stories to `app/features/contact/components/ContactForm.stories.ts`
- [x] T093 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/contact/components/ContactInfo.stories.ts`

### Homepage — state variants

- [x] T094 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/homepage/components/DishCard.stories.ts`
- [x] T095 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/homepage/components/HomeBranchesCta.stories.ts`
- [x] T096 [P] [US4] Add `Loading`, `Empty` stories to `app/features/homepage/components/HomeFeaturedRail.stories.ts`
- [x] T097 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/homepage/components/HomeHero.stories.ts`
- [x] T098 [P] [US4] Add `Empty` story to `app/features/homepage/components/HomePromotions.stories.ts`
- [x] T099 [P] [US4] Add `Empty` story to `app/features/homepage/components/HomeReviews.stories.ts`
- [x] T100 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/homepage/components/HomeTypeSelector.stories.ts`
- [x] T101 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/homepage/components/ReviewCard.stories.ts`

### Menu — state variants

- [x] T102 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/menu/components/MenuCategoryChips.stories.ts`
- [x] T103 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/menu/components/MenuDishCard.stories.ts`
- [x] T104 [P] [US4] Add `Loading`, `Empty` stories to `app/features/menu/components/MenuDishGrid.stories.ts`
- [x] T105 [P] [US4] Add `Empty`, `LocaleES`, `LocaleEN` stories to `app/features/menu/components/MenuDrinkSection.stories.ts`
- [x] T106 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/menu/components/MenuModalityToggle.stories.ts`
- [x] T107 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/menu/components/MenuSaucePicker.stories.ts`
- [x] T108 [P] [US4] Add `Loading`, `Empty` stories to `app/features/menu/components/MenuShell.stories.ts`
- [x] T109 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/menu/components/MenuTypeToggle.stories.ts`

### Promotions — state variants

- [x] T110 [P] [US4] Add `Empty` story to `app/features/promotions/components/PromotionsGrid.stories.ts`

### Reservation — state variants

- [x] T111 [P] [US4] Add `LocaleES`, `LocaleEN` stories to `app/features/reservation/components/ReservationConfirmation.stories.ts`
- [x] T112 [P] [US4] Add `Error`, `LocaleES`, `LocaleEN` stories to `app/features/reservation/components/ReservationFieldsContact.stories.ts`
- [x] T113 [P] [US4] Add `Error` story to `app/features/reservation/components/ReservationFieldsDateTime.stories.ts`
- [x] T114 [P] [US4] Add `Error`, `LocaleES`, `LocaleEN` stories to `app/features/reservation/components/ReservationFieldsPrimary.stories.ts`
- [x] T115 [P] [US4] Add `Loading`, `Error` stories to `app/features/reservation/components/ReservationForm.stories.ts`

### 200-line overflow check

- [x] T116 [US4] Review all updated story files for 200-line limit (Article VIII); for any file exceeding 200 lines, extract overflow stories to a sibling `*.variants.stories.ts` file in the same directory

**Checkpoint**: Every applicable component shows state variants in the Storybook sidebar. No story file exceeds 200 lines.

---

## Phase 6: User Story 5 — ArgTypes Interactive Controls (Priority: P2)

**Goal**: Every prop in every component shows an appropriate interactive input in the Controls panel with a description.

> Note: ArgTypes are added in Phase 4 (T020–T070). Phase 6 is a validation + refinement phase ensuring controls actually work interactively and descriptions are meaningful.

- [x] T117 [US5] Open each UI primitive component in Storybook Controls panel and verify all props have: (a) a non-empty description string, (b) the correct control type (toggle for boolean, text for string, select for enum, number for number), (c) live update when changed — fix any `argTypes` entries in `app/components/ui/*.stories.ts` that fail
- [x] T118 [P] [US5] Verify Controls panel for all `app/components/layout/` story files (SiteFooter, SiteHeader, SiteLogo, SiteMarquee)
- [x] T119 [P] [US5] Verify Controls panel for all `app/components/staff/` story files
- [x] T120 [P] [US5] Verify Controls panel for all `app/features/branches/` story files
- [x] T121 [P] [US5] Verify Controls panel for all `app/features/contact/` story files
- [x] T122 [P] [US5] Verify Controls panel for all `app/features/homepage/` story files
- [x] T123 [P] [US5] Verify Controls panel for all `app/features/menu/` story files
- [x] T124 [P] [US5] Verify Controls panel for all `app/features/promotions/` story files
- [x] T125 [P] [US5] Verify Controls panel for all `app/features/reservation/` story files

**Checkpoint**: Every prop in the Controls panel has a description and a working interactive input. Modifying any control updates the rendered story live.

---

## Phase 7: User Story 6 — ComponentDocs Feature-Slice Overview Stories (Priority: P3)

**Goal**: Six feature-slice overview entries appear in the Storybook sidebar, each showing a Docs page listing that slice's components.

**Independent Test**: Confirm all six slice entries appear in the sidebar and each Docs page lists the components.

- [x] T126 [P] [US6] Create `app/features/branches/Branches.stories.ts` — ComponentDocs overview with `title: 'Features/Branches'`, `tags: ['autodocs']`, listing BranchCard, BranchList, BranchSearch
- [x] T127 [P] [US6] Create `app/features/contact/Contact.stories.ts` — ComponentDocs overview with `title: 'Features/Contact'`, `tags: ['autodocs']`, listing ContactForm, ContactInfo
- [x] T128 [P] [US6] Create `app/features/homepage/Homepage.stories.ts` — ComponentDocs overview with `title: 'Features/Homepage'`, `tags: ['autodocs']`, listing DishCard, HomeBranchesCta, HomeFeaturedRail, HomeHero, HomePromotions, HomeReviews, HomeTypeSelector, ReviewCard
- [x] T129 [P] [US6] Create `app/features/menu/Menu.stories.ts` — ComponentDocs overview with `title: 'Features/Menu'`, `tags: ['autodocs']`, listing MenuCategoryChips, MenuDishCard, MenuDishGrid, MenuDrinkSection, MenuModalityToggle, MenuSaucePicker, MenuShell, MenuTypeToggle
- [x] T130 [P] [US6] Create `app/features/promotions/Promotions.stories.ts` — ComponentDocs overview with `title: 'Features/Promotions'`, `tags: ['autodocs']`, listing PromotionsGrid
- [x] T131 [P] [US6] Create `app/features/reservation/Reservation.stories.ts` — ComponentDocs overview with `title: 'Features/Reservation'`, `tags: ['autodocs']`, listing ReservationConfirmation, ReservationFieldsContact, ReservationFieldsDateTime, ReservationFieldsPrimary, ReservationForm
- [x] T132 [P] [US6] Create `app/components/ui/UIPrimitives.stories.ts` — ComponentDocs overview with `title: 'UI Primitives'`, `tags: ['autodocs']`, listing all ui/, layout/, and staff/ components

**Checkpoint**: Seven slice overview entries appear in the Storybook sidebar. Each Docs page lists the components in that slice.

---

## Phase 8: Polish & Verification

**Purpose**: Final quality gates across all changes.

- [x] T133 Run `npx vue-tsc --noEmit` and fix any TypeScript errors in `app/**/*.stories.ts` and `.storybook/*.ts` files
- [x] T134 [P] Run `npx biome check app/**/*.stories.ts .storybook/` and fix all lint/formatting issues
- [x] T135 [P] Re-run Storybook accessibility panel on all Default stories and confirm zero WCAG AA violations remain (follow-up from Phase 3)
- [x] T136 Run `npm run storybook:build` (`storybook build`) and confirm build completes without errors
- [x] T137 [P] Confirm Storybook build output contains zero 404 references in the network tab for image assets
- [x] T138 [P] Confirm all six ComponentDocs slice overview entries appear in the built Storybook sidebar
- [x] T139 Confirm Storybook dev server starts in under 60 seconds (`npm run storybook`)

**Checkpoint**: All gates pass. Feature ready for human review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Broken images)**: Depends on Phase 1 completion (Storybook must start to verify fix)
- **Phase 3 (Accessibility)**: Depends on Phase 1 (addons must be registered)
- **Phase 4 (ArgTypes/Autodocs)**: Depends on Phase 1 (autodocs must be enabled to verify Docs pages)
- **Phase 5 (State variants)**: Independent of Phases 3–4, but follows Phase 2 (images fixed first for clean review)
- **Phase 6 (Controls verification)**: Depends on Phase 4 (argTypes must exist to verify)
- **Phase 7 (ComponentDocs)**: Depends on Phase 1; independent of Phases 3–6
- **Phase 8 (Verification)**: Depends on all phases complete

### User Story Dependencies

- **US1 (Broken images)**: Can start after Phase 1 — no dependency on US2–US6
- **US2 (Addons)**: Infrastructure delivered by Phase 1; US2 tasks verify it — no story dependency
- **US3 (Autodocs/ArgTypes)**: Depends on Phase 1 (T003) — otherwise independent
- **US4 (State variants)**: Depends on Phase 2 (images fixed) — otherwise fully parallel across slices
- **US5 (Controls verification)**: Depends on US3 (argTypes must exist)
- **US6 (ComponentDocs)**: Depends on Phase 1 only — fully parallel with US2–US5

### Parallel Opportunities

- All Phase 5 tasks (T071–T115) can run in parallel — different files
- All Phase 4 argTypes tasks (T020–T070) can run in parallel — different files
- All Phase 7 ComponentDocs tasks (T126–T132) can run in parallel — new files
- Phases 4, 5, and 7 can run concurrently after Phase 1 + 2 complete
- Phase 3 (a11y verification) can run concurrently with Phases 4 and 5

---

## Parallel Execution Examples

### Parallel: Phase 4 + 5 + 7 (after Phase 1 + 2)

```
Agent A: T020–T034 (UI Primitives argTypes)
Agent B: T035–T043 (Layout + Staff argTypes)
Agent C: T044–T065 (Features argTypes — branches, contact, homepage, menu, promotions)
Agent D: T066–T070 (Reservation argTypes)
Agent E: T071–T088 (UI + Layout + Staff state variants)
Agent F: T089–T115 (Feature state variants — branches, contact, homepage, menu, promotions, reservation)
Agent G: T126–T132 (all ComponentDocs index stories)
```

All 7 agents work concurrently — zero file conflicts.

---

## Implementation Strategy

### MVP First (User Story 1 — Broken Images)

1. Complete Phase 1: Install addons + config
2. Complete Phase 2: Fix 3 broken image refs
3. **STOP and VALIDATE**: Zero 404 errors in Storybook console
4. Storybook is now a reliable visual review tool

### Incremental Delivery

1. Phase 1 + 2 → Images fixed, addons active, autodocs working (MVP)
2. Phase 3 → Accessibility baseline established
3. Phase 4 → All components have interactive Docs pages
4. Phase 5 → Full state variant coverage per Article VII
5. Phase 6 → Controls panel verified interactive
6. Phase 7 → Slice overview navigation added
7. Phase 8 → Final verification gates pass → spec_ready → human review

---

## Notes

- All `[P]` tasks operate on different files — no write conflicts
- No task in this list modifies any `.vue`, `.ts` (non-story), `server/`, `types/`, or `tests/` file
- Story files that exceed 200 lines after T116 review must be split before T133 (vue-tsc gate)
- ComponentDocs files (T126–T132) use `tags: ['autodocs']` on their Meta even though global `autodocs: true` is set — this ensures the Docs entry is the primary sidebar entry with no blank Canvas tab
- The `app/**/*.stories.@(ts|tsx)` glob in `main.ts` already captures `*.variants.stories.ts` and new ComponentDocs files — no `main.ts` glob update needed
