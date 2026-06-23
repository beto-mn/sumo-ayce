---
description: "Task list for feature 017 — Contact Page (/contact)"
---

# Tasks: Contact Page (`/contact`)

**Feature ID**: 017
**Input**: Design documents from `specs/017-contact-page/`
**Prerequisites**: spec.md, plan.md, data-model.md, contracts/contact-form.md, research.md

**Tests**: REQUIRED. Constitution Article IV mandates unit tests for every composable
(Article IV). Article VII mandates Storybook coverage for every UI component. TDD order
applies to the composable; component tests written before implementation.

**Organization**: Grouped by user story (priority order). Each user story is independently
deliverable. US1 is the sole MVP increment.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in the same phase).
- **[Story]**: US1 | US2 | US3 | US4 — maps to user stories from spec.md.

---

## Phase 1: Setup

**Purpose**: Project initialization — folder structure, config changes, rendering strategy docs.

- [x] T001 Create feature slice folders: `app/features/contact/components/` and `app/features/contact/composables/` (Article I)
- [x] T002 Add `routeRules['/contact'] = { prerender: true }` to `nuxt.config.ts` (FR-002, Gate V.1)
- [x] T003 Update `docs/business/rendering-strategy.md` §2 and §4 tables: add `/contact` row with mode `prerender: true` and rationale "No CMS dependency. Shell is 100% static. Branch list fetched client-side." (Gate V.1, spec Assumption)

**Checkpoint**: Folder structure exists; `nuxt.config.ts` has the prerender rule; rendering strategy doc updated.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and i18n keys. MUST complete before any component or composable work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create `app/features/contact/types.ts` — export `ContactBranch`, `ContactFormState`, and `WaLinkConfig` as defined in `specs/017-contact-page/data-model.md`. `ContactFormState` has fields `name`, `branchId`, `message` (no `whatsapp`). `WaLinkConfig` has fields `email`, `socialInstagram`, `socialFacebook`, `socialTiktok` (no `globalWhatsapp`). Strict TS, no `any`. (Gate II.1, FR-011, FR-016)
- [x] T005 [P] Add `contact.*` keys to `i18n/locales/es.json`: `seo.title`, `seo.description`, `page.title`, `page.badge`, `form.title`, `form.name.label`, `form.name.placeholder`, `form.branch.label`, `form.branch.placeholder`, `form.message.label`, `form.message.placeholder`, `form.cta`, `form.loading`, `form.error`, `form.empty`, `waMessage` (template with `{name}` and `{message}` tokens only), `info.title`, `info.whatsappPrompt` ("Elige una sucursal para ver su número"), `info.whatsappLabel`, `info.emailLabel`, `info.socialTitle`, `email` ("contacto@sumo.com.mx"), `socialInstagram` ("https://www.instagram.com/sumo_allyoucaneat"), `socialFacebook` ("https://www.facebook.com/sumoallyoucaneat"), `socialTiktok` ("https://www.tiktok.com/@sumooficial"). No `globalWhatsapp` key. No `form.whatsapp.*` keys. (FR-011, FR-016, FR-017, FR-018, FR-023, FR-024)
- [x] T006 [P] Add the same `contact.*` keys to `i18n/locales/en.json` with English translations. `info.whatsappPrompt` = "Select a branch to see its number". Social URLs are identical to ES (they are not translated). `email` = "contacto@sumo.com.mx" (same in both locales). (FR-023, FR-024)

**Checkpoint**: `ContactBranch`, `ContactFormState`, `WaLinkConfig` types compile. All `contact.*` i18n keys exist in both locales.

---

## Phase 3: User Story 1 — Contact a specific branch via WhatsApp (Priority: P1) — MVP

**Goal**: Visitor fills the four-field form, selects a branch, clicks the CTA, and WhatsApp
opens with the branch's number and a pre-composed message.

**Independent Test**: On a device with WhatsApp installed, fill all three fields (name, branch, message), click the CTA. Confirm WhatsApp opens addressed to the branch's phone number with the visitor's name and typed message in the body (no user phone number).

### Composable (TDD)

- [x] T007 Write failing `app/features/contact/composables/useContact.spec.ts` (Vitest + happy-dom):
  - Initial `state` has three fields (`name`, `branchId`, `message`) as empty string. No `whatsapp` field.
  - `isFormValid` returns `false` when any of the three fields is empty.
  - `isFormValid` returns `true` only when `name`, `branchId`, and `message` are all non-empty strings.
  - `buildWaUrl('5215512345678', 'Hola, soy Ana.')` returns `'https://wa.me/5215512345678?text=Hola%2C%20soy%20Ana.'`.
  - `buildWaUrl` uses `encodeURIComponent` on the text parameter.
  - `buildMessageText` replaces `{name}` and `{message}` tokens only (no `{whatsapp}` token).
  - `filteredBranches` returns only branches where `phone !== null`.
  - `filteredBranches` is sorted alphabetically by `name` case-insensitively.
  Tests MUST fail first. (SC-007, Gate IV.3, FR-007, FR-011, FR-012, FR-013)

- [x] T008 Implement `app/features/contact/composables/useContact.ts`:
  - Exports reactive `state: ContactFormState` with fields `name`, `branchId`, `message` (all `''` initially). No `whatsapp` field.
  - Exports `computed isFormValid`: true iff `state.name`, `state.branchId`, and `state.message` are all non-empty strings.
  - Exports `buildWaUrl(phone: string, text: string): string` — returns `https://wa.me/${phone}?text=${encodeURIComponent(text)}`.
  - Exports `buildMessageText(state: ContactFormState, waMessageTemplate: string): string` — replaces `{name}` and `{message}` tokens only.
  - Exports `filterAndSortBranches(raw: BranchPublicRow[]): ContactBranch[]` — filters `phone !== null`, sorts by `name` locale-insensitively, maps to `ContactBranch`.
  - `use` prefix; file ≤ 200 lines; functions ≤ 30 lines; no `any`; no bare `console.log`. (Gate VIII.1, Gate X.1)

- [x] T009 Make T007 tests pass. Run `pnpm test app/features/contact/composables/useContact.spec.ts` — all green.

### `ContactForm` component (TDD)

- [x] T010 [P] Write failing `app/features/contact/components/ContactForm.spec.ts` (Vitest + happy-dom):
  - Renders three fields: name input, branch select, message textarea. No WhatsApp/tel input.
  - CTA button is disabled when any of the three fields is empty.
  - CTA button is enabled only when name, branch, and message are all filled.
  - On branch selection, emits `update:selectedBranch` with the selected `ContactBranch` (FR-016).
  - Dropdown shows only branches where `phone !== null` (SC-007, FR-006).
  - Loading state: loading indicator rendered; dropdown hidden (FR-008).
  - Error state: error message rendered; CTA disabled; no stack trace in DOM (FR-009, SC-006).
  - Empty branches state: "No hay sucursales disponibles en este momento" shown; CTA disabled (FR-010).
  - On valid submit: `window.open` called with `https://wa.me/<branch.phone>?text=<encodedText>` where text contains name and message only (FR-012, FR-013, FR-014).
  - Correct `wa.me` host when branch phone is `'5215512345678'` (FR-014).
  Tests MUST fail first. (SC-007, Gate IV.1)

- [x] T011 Implement `app/features/contact/components/ContactForm.vue`:
  - `<script setup lang="ts">` only; no Options API.
  - Uses `useFetch('/api/v1/branches', { server: false })` to fetch branches. Applies `filterAndSortBranches` from `useContact` on the response.
  - Uses `useContact()` for `state`, `isFormValid`, `buildWaUrl`, `buildMessageText`.
  - Uses `useI18n()` for all copy; no hardcoded strings.
  - Renders: name `<input type="text">`, branch `<select>`, message `<textarea>`, CTA `<button>`. No WhatsApp/tel input.
  - Emits `update:selectedBranch` with the full `ContactBranch | null` whenever the branch selection changes (FR-016 — needed by ContactInfo).
  - All inputs have `<label>` with `for` binding, `aria-required="true"`, minimum touch target 44px (FR-026, FR-022).
  - CTA button: `disabled` when `!isFormValid || pending || error || !filteredBranches.length`; `aria-disabled` reflects same state (FR-027).
  - On submit: constructs wa.me URL using `buildMessageText` with `{name}` and `{message}` tokens only, calls `window.open(url, '_blank')`. Single-fire guard while URL is opening.
  - Loading state: replaces select with loading indicator; other fields remain visible (FR-008).
  - Error state: replaces select with error message from `t('contact.form.error')`; no stack trace (FR-009).
  - Empty state: shows `t('contact.form.empty')` when no filtered branches (FR-010).
  - Uses design system primitives from `app/components/ui/` for input, select, textarea, button (no inline reimplementation).
  - No inline hex; Tailwind tokens only; file ≤ 200 lines; functions ≤ 30 lines. (Gate VIII, Gate VII.1)

- [x] T012 Make T010 tests pass. Run `pnpm test app/features/contact/components/ContactForm.spec.ts` — all green.

- [x] T013 [P] Add `app/features/contact/components/ContactForm.stories.ts`:
  - **Default**: branch list loaded, all three fields empty, CTA disabled.
  - **AllFieldsFilled**: all three fields filled (name, branch selected, message), CTA enabled.
  - **Loading**: `pending = true`, loading indicator visible.
  - **Error**: fetch failed, error message shown, CTA disabled.
  - **EmptyBranches**: fetch succeeded but no branches have a phone, empty-state message shown.
  - **Responsive**: viewport annotations at 360px and 1024px.
  (Gate VII.4, Article VII)

**Checkpoint**: User Story 1 is fully functional. Visitor can open WhatsApp with a pre-composed message to the correct branch.

---

## Phase 4: User Story 2 — Browse contact info for the selected branch (Priority: P2)

**Goal**: Right card shows branch-reactive WhatsApp section, a pre-filled mailto link for
`contacto@sumo.com.mx`, and three social pills. The WhatsApp section reacts to the branch
selected in the form dropdown.

**Independent Test**: Load `/contact`. Confirm the right card renders with the "Elige una
sucursal para ver su número" prompt, the email link, and three social pills. Select a branch.
Confirm the prompt is replaced by a pill linking to `https://wa.me/<branch.phone>`. Confirm
the email `mailto:` link updates with the current name and message from the form.

### Lift selected-branch state to page

- [x] T013b Add `selectedBranch: Ref<ContactBranch | null>` to `app/pages/contact.vue` (initialized to `null`). Pass it as `:selected-branch="selectedBranch"` prop to `<ContactInfo>` and listen to `@update:selected-branch="selectedBranch = $event"` on `<ContactForm>`. Also pass `formState` (or individual reactive refs for name and message) as props to `<ContactInfo>` for the reactive mailto. (FR-016, FR-017, Gate X.2)

### `ContactInfo` component (TDD)

- [x] T014 [P] Write failing `app/features/contact/components/ContactInfo.spec.ts` (Vitest + happy-dom):
  - When `selectedBranch` prop is `null`, renders the i18n prompt `contact.info.whatsappPrompt`; no WhatsApp pill button (FR-016, SC-008).
  - When `selectedBranch` prop has a phone value, renders a pill linking to `https://wa.me/<branch.phone>` in `_blank` (FR-016, SC-008).
  - Renders a `mailto:` link whose `href` starts with `mailto:contacto@sumo.com.mx` (FR-017, SC-008).
  - When `name` and `message` props are non-empty, the `mailto:` `href` includes encoded `subject` and `body` parameters (FR-017).
  - When form fields are empty, the `mailto:` `href` is `mailto:contacto@sumo.com.mx` with no query parameters (or empty ones) — link still works (FR-017).
  - Renders exactly three social pills: Instagram (`https://www.instagram.com/sumo_allyoucaneat`), Facebook (`https://www.facebook.com/sumoallyoucaneat`), TikTok (`https://www.tiktok.com/@sumooficial`) (FR-018, SC-008).
  - All external links have `target="_blank"` and `rel="noopener noreferrer"`.
  - WhatsApp pill (when rendered) and social pills all have accessible names (FR-028).
  Tests MUST fail first. (SC-008, Gate IV.2)

- [x] T015 Implement `app/features/contact/components/ContactInfo.vue`:
  - `<script setup lang="ts">` only.
  - Accepts props: `selectedBranch: ContactBranch | null`, `name: string`, `message: string`.
  - Uses `useI18n()` to read `t('contact.email')`, `t('contact.socialInstagram')`,
    `t('contact.socialFacebook')`, `t('contact.socialTiktok')`, `t('contact.info.whatsappPrompt')`.
  - WhatsApp section: shows prompt text when `selectedBranch === null`; shows pill with
    `href="https://wa.me/${selectedBranch.phone}"` when branch is selected.
  - Email: `href` is a computed `mailto:contacto@sumo.com.mx?subject=<encoded>&body=<encoded>`
    built reactively from `name`, `selectedBranch?.name`, and `message` props. Subject = "Contacto SUMO — [branch name if selected]". Body = "Nombre: [name]\n\nMensaje: [message]". Both are `encodeURIComponent`-encoded.
  - Social pills: `aria-label` when icon-only (FR-028). URLs from i18n keys (FR-018, FR-019).
  - All labels, section headings via i18n keys (FR-023).
  - No inline hex; Tailwind tokens only; file ≤ 200 lines. (Gate VIII, Gate VII.1)

- [x] T016 Make T014 tests pass. Run `pnpm test app/features/contact/components/ContactInfo.spec.ts` — all green.

- [x] T017 [P] Add `app/features/contact/components/ContactInfo.stories.ts`:
  - **NoBranchSelected**: `selectedBranch = null`, prompt visible, no WhatsApp pill.
  - **BranchSelected**: `selectedBranch` with phone `'5215512345678'`, pill rendered.
  - **WithFormData**: `name` and `message` filled, email mailto shows pre-filled subject/body.
  - **Responsive**: viewport annotations at 360px and 1024px.
  (Gate VII.4, Article VII)

**Checkpoint**: User Stories 1 and 2 both work independently. Right card renders without JS.

---

## Phase 5: User Story 3 — Graceful degradation on branch list failure (Priority: P2)

**Goal**: When `/api/v1/branches` fails, the page does not crash. The form shows a friendly
error message; the right card remains functional.

**Independent Test**: Block `GET /api/v1/branches` at the network level (DevTools). Load
`/contact`. Confirm dropdown area shows an error message (no stack trace), CTA is disabled,
and the right card with all static content is unaffected.

*Note*: Most of the error-state logic is already covered in `ContactForm.vue` (T011) and its
spec (T010). This phase adds the page-level assembly that proves both cards coexist correctly.

### Page assembly

- [x] T018 [P] [US3] Write failing `app/pages/contact.spec.ts` (Vitest + happy-dom):
  - Page renders both `<ContactForm>` and `<ContactInfo>` in the same DOM (FR-003).
  - `<ContactInfo>` is visible regardless of branch fetch state (US3 story goal).
  - SEO meta: page sets `<title>` and `<meta name="description">` from i18n keys `contact.seo.title` / `contact.seo.description` (FR-025).
  Tests MUST fail first.

- [x] T019 [US3] Implement `app/pages/contact.vue`:
  - `<script setup lang="ts">` only.
  - `useSeoMeta({ title: t('contact.seo.title'), description: t('contact.seo.description') })` (FR-025).
  - Declares `selectedBranch: Ref<ContactBranch | null> = ref(null)` and passes reactive name/message refs from the shared form state (or exposes them from `useContact`).
  - Template: `<UiPageHeader>` with `badge`, `badge-tone="pink"`, `title` from i18n (spec Assumption).
  - Two-column layout wrapper: side-by-side ≥ 880px, stacked < 880px (FR-020).
  - Left column: `<ContactForm @update:selected-branch="selectedBranch = $event" />`.
  - Right column: `<ContactInfo :selected-branch="selectedBranch" :name="state.name" :message="state.message" />`.
  - Template ≤ 100 lines; no inline hex. (FR-021, FR-016, FR-017, Gate I.5)

- [x] T020 [US3] Make T018 tests pass. Run `pnpm test app/pages/contact.spec.ts` — all green.

**Checkpoint**: Full page assembled. Error state in `ContactForm` does not affect `ContactInfo`.

---

## Phase 6: User Story 4 — Language toggle (Priority: P3)

**Goal**: All visible text on `/contact` switches to English via the language toggle without
a full page reload.

**Independent Test**: With the page loaded in Spanish, toggle language. Verify every text
element (labels, placeholders, headings, CTA, error/empty messages) updates to English.

*Note*: i18n keys were added in Phase 2 (T005/T006). This phase verifies the integration
works end-to-end at the component level.

- [x] T021 [P] [US4] Add i18n switching tests to `app/features/contact/components/ContactForm.spec.ts`:
  - With locale set to `en`, all labels, placeholders, and CTA text for the three fields (name, branch, message) render in English (FR-023).
  - Switching locale updates visible text without re-mounting (FR-023, spec US4 SC-2).
  Tests MUST fail first if the keys are wrong or missing.

- [x] T022 [P] [US4] Add i18n switching tests to `app/features/contact/components/ContactInfo.spec.ts`:
  - With locale set to `en`, the whatsapp prompt, section headings, and pill labels render in English (FR-023).
  - With locale set to `en` and a branch selected, the WhatsApp pill renders correctly in English context.
  Tests MUST fail first.

- [x] T023 [US4] Verify T021 and T022 pass. Run `pnpm test app/features/contact/` — all green.

**Checkpoint**: All four user stories are independently functional in both locales.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T024 [P] Reduced-motion pass: verify card entrance animations in `ContactForm.vue` and `ContactInfo.vue` respect `prefers-reduced-motion: reduce` — use `@media (prefers-reduced-motion: reduce)` in Tailwind via `motion-reduce:` prefix. Loading spinner is exempt. (spec edge cases)

- [x] T025 [P] Accessibility pass:
  - All form fields in `ContactForm.vue` have associated `<label>` or `aria-label` and `aria-required="true"` (FR-026).
  - CTA button conveys disabled state via `disabled` attribute and `aria-disabled` (FR-027).
  - Social pills in `ContactInfo.vue` have accessible names via `aria-label` when icon-only (FR-028).
  - Minimum touch target 44px on all interactive elements (FR-022).
  Run accessibility assertions in existing specs or add targeted `aria-*` checks.

- [x] T026 [P] No-inline-hex grep over new files:
  ```bash
  grep -rEn '(style=|: ?)#[0-9a-fA-F]{3,8}\b' \
    app/features/contact/ \
    app/pages/contact.vue
  ```
  Result MUST be zero. (SC-009)

- [x] T027 Run `pnpm check && pnpm typecheck && pnpm test && pnpm build`. All green. Verify `.output/public/contact/index.html` exists (static prerender output). (Gate IX, SC-003)

---

## Dependencies & Execution Order

### Phase dependencies

```
Phase 1 (Setup)
  └─→ Phase 2 (Foundational: types + i18n keys)
        ├─→ Phase 3 (US1: useContact + ContactForm)   [MVP — deliver first]
        ├─→ Phase 4 (US2: ContactInfo)                [parallel with Phase 3 after T004/T005/T006]
        │
        └─→ Phase 5 (US3: page assembly)              [needs Phase 3 + Phase 4 done]
              └─→ Phase 6 (US4: i18n verification)    [needs Phase 5 + T005/T006]
                    └─→ Phase 7 (Polish)
```

### Within each phase

- Tests written and FAILING before implementation (Article IV).
- TDD order per task group: spec → implement → pass.
- [P]-marked tasks within the same phase share no file dependencies.
- `contact.vue` (T019) is written after `ContactForm` (T011) and `ContactInfo` (T015) are done.

### Parallel opportunities

- T005 and T006 (i18n) can run in parallel with each other after T004.
- Phase 3 (ContactForm) and Phase 4 (ContactInfo) can run in parallel once Phase 2 is complete.
- T010 (ContactForm spec) and T014 (ContactInfo spec) can be written in parallel.
- T013 and T017 (stories) can be written in parallel after their respective component tests pass.
- T021 and T022 (i18n tests) can be added in parallel within Phase 6.
- T024, T025, T026 (polish) are fully parallel within Phase 7.

---

## Parallel Example: Phase 3 + Phase 4 (after Phase 2 complete)

```text
# Can run in parallel:
Task T010: Write failing ContactForm.spec.ts
Task T014: Write failing ContactInfo.spec.ts

# After T010/T014 exist and fail:
Task T011: Implement ContactForm.vue  (unblocks T012, T013)
Task T015: Implement ContactInfo.vue  (unblocks T016, T017)

# After T011/T015 pass tests:
Task T013: Add ContactForm.stories.ts
Task T017: Add ContactInfo.stories.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T006)
3. Complete Phase 3: US1 — `useContact` + `ContactForm` (T007–T013)
4. **STOP and VALIDATE**: Open `http://localhost:3000/contact`, fill the form, confirm WhatsApp opens.

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 → US1 done; wa.me flow works (MVP)
3. Phase 4 → US2 done; static info card works
4. Phase 5 → US3 done; full page assembled with graceful error handling
5. Phase 6 → US4 done; bilingual support verified
6. Phase 7 → Polish; build verified; static prerender confirmed

---

## Notes

- **[P]** = different files, no same-file dependency. Tasks touching `contact.vue` are sequential.
- Every new component ships `.vue` + `.spec.ts` + `.stories.ts` — no merge without a story (Gate VII.4).
- Verify each spec FAILS before implementing.
- Commit per task or logical group; Conventional Commits format (Gate IX).
- No new server route is created. `GET /api/v1/branches` is consumed as-is.
- NEVER import Drizzle/Neon under `app/` (Gate V.2, FR-004).
- NEVER use inline hex colors in `.vue` files (SC-009).
- Form fields MUST NOT be reset after submit (FR-015).
- `window.open` is the correct mechanism for opening the wa.me link (not `<a :href>`).
- The branch `phone` value is used verbatim in the wa.me URL — no transformation (FR-014).
