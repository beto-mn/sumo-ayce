# Feature Specification: Storybook Full UI/UX Documentation Coverage

**Feature Branch**: `chore/021-storybook-coverage`  
**Created**: 2026-06-29  
**Status**: Draft  
**Input**: User description: "Upgrade Storybook from minimal single-story coverage to full documentation-grade for all 50+ Vue components in the SUMO AYCE Nuxt 4 project."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Fix Broken Story Images (Priority: P1)

A developer opens Storybook and currently sees broken image placeholders wherever component stories reference `/menu/**/*.webp` paths. Those assets were deleted when feature 018 migrated to Vercel Blob. The developer needs all story images to display correctly so visual review is reliable.

**Why this priority**: Broken images undermine the trust and usability of Storybook as a review tool. Every other improvement builds on top of correctly rendering stories. This is the highest-impact, lowest-effort fix.

**Independent Test**: Open Storybook, navigate every story that has an image prop, confirm no image 404 errors appear in the browser console or network tab.

**Acceptance Scenarios**:

1. **Given** a story file that previously set `imageUrl: '/menu/dish.webp'`, **When** Storybook renders that story, **Then** a valid placeholder image displays (no broken image icon, no console 404 error).
2. **Given** any story file under `app/**/*.stories.ts`, **When** Storybook builds, **Then** zero network requests are made to paths matching `/menu/**/*.webp`.
3. **Given** a component whose image prop is optional, **When** the story sets the image prop to `null` or `undefined`, **Then** the component renders gracefully without an image (uses its built-in fallback state).

---

### User Story 2 — Add Viewport and Accessibility Addons (Priority: P1)

A developer or designer needs to review each component's mobile, tablet, and desktop layout inside Storybook, and also audit for accessibility (WCAG AA) violations without leaving the tool.

**Why this priority**: The SUMO AYCE design context is mobile-first (primary breakpoints 520 px and 880 px). Without the viewport addon, responsive review is blind. The accessibility addon catches violations before they reach production.

**Independent Test**: Open Storybook, confirm the toolbar has a "Viewport" selector with Mobile (375 px), Tablet (768 px), and Desktop (1280 px) presets, and an "Accessibility" panel showing pass/fail audits for the active story.

**Acceptance Scenarios**:

1. **Given** Storybook is running, **When** the developer selects the "Mobile" viewport preset, **Then** the canvas renders at 375 px width.
2. **Given** Storybook is running, **When** the developer selects the "Tablet" viewport preset, **Then** the canvas renders at 768 px width.
3. **Given** Storybook is running, **When** the developer selects the "Desktop" viewport preset, **Then** the canvas renders at 1280 px width.
4. **Given** the accessibility panel is open for any Default story, **When** the story renders, **Then** the panel shows a WCAG AA audit result; zero violations on all Default stories.
5. **Given** both addons are installed, **When** `npm run storybook` starts, **Then** Storybook boots without errors referencing missing addon modules.

---

### User Story 3 — Enable Autodocs for Every Component (Priority: P2)

A developer or designer opens the Storybook Docs tab for any component and sees an auto-generated documentation page with the component description, prop table, and interactive controls — without needing to manually write MDX.

**Why this priority**: Autodocs turns Storybook into a living design system reference, satisfying Article VII's requirement for full component documentation. Without it, the Docs tab only shows custom MDX and misses interactive prop exploration.

**Independent Test**: Open Storybook, navigate to any component entry in the sidebar, click the "Docs" entry, confirm an auto-generated page with a props/controls table is visible.

**Acceptance Scenarios**:

1. **Given** autodocs is enabled globally in `.storybook/main.ts`, **When** Storybook builds, **Then** every component with a `Meta` object gets a Docs page without requiring a `tags: ['autodocs']` annotation on each individual story file.
2. **Given** a component story file includes `argTypes` with `description` and `control` fields, **When** the Docs page renders, **Then** the controls table shows the prop description, its type, and an interactive input.
3. **Given** a component has both `Default` and variant stories, **When** the Docs page renders, **Then** all named stories appear as embedded live examples on the Docs page.

---

### User Story 4 — Add Complete State Variant Stories (Priority: P2)

A developer reviews a component in Storybook and can immediately see all meaningful states: default, loading skeleton, empty/no-data, error/validation, disabled, and both Spanish and English locale variants — without needing to open the source code.

**Why this priority**: Single-story coverage hides states that only appear at runtime. Reviewers cannot verify that loading states, error messages, and bilingual content are correct without running the full app. Story variants make all states inspectable in isolation.

**Independent Test**: Navigate to any component in Storybook that has a loading state, empty state, error state, or i18n variants. Confirm each has a dedicated named story visible in the sidebar.

**Acceptance Scenarios**:

1. **Given** a component supports a loading state (e.g., skeleton UI), **When** the developer opens its story file in Storybook, **Then** a story named `Loading` or `Skeleton` is visible in the sidebar, rendering the loading variant.
2. **Given** a component displays a list that can be empty, **When** the developer opens its story file, **Then** a story named `Empty` or `NoData` renders the zero-items state.
3. **Given** a component displays an error or validation message, **When** the developer opens its story file, **Then** a story named `Error` or `ValidationError` renders the error state.
4. **Given** a component has a disabled prop, **When** the developer opens its story file, **Then** a story named `Disabled` renders the component in its disabled state.
5. **Given** a component renders user-facing text (labels, messages, placeholders), **When** the developer opens its story file, **Then** stories named `Spanish` and `English` (or `LocaleES` and `LocaleEN`) render the component in each locale.
6. **Given** a component has no loading state, empty state, error state, or disabled state by design, **When** those story variants are not applicable, **Then** the story file omits those variants (no forced empty stubs).

---

### User Story 5 — Add ArgTypes with Descriptions and Controls (Priority: P2)

A developer or designer uses the Controls panel in Storybook to live-edit any component's props and immediately sees the effect — and can read what each prop does from an inline description.

**Why this priority**: ArgTypes are the bridge between stories and interactive documentation. Without them, the Controls panel shows unlabeled inputs with no context. With them, Storybook functions as an interactive component playground.

**Independent Test**: Open any component in Storybook, open the Controls panel, confirm each prop shows a description, its expected value type, and an appropriate input control (toggle for booleans, text for strings, select for enum, etc.).

**Acceptance Scenarios**:

1. **Given** a component prop is a boolean (e.g., `disabled`, `loading`), **When** the Controls panel renders, **Then** it shows a toggle/checkbox control with a description.
2. **Given** a component prop is a string enum (e.g., `variant: 'primary' | 'secondary'`), **When** the Controls panel renders, **Then** it shows a select/radio control listing the allowed values with a description.
3. **Given** a component prop is a free-form string (e.g., `label`, `placeholder`), **When** the Controls panel renders, **Then** it shows a text input control with a description.
4. **Given** any story's args are modified via the Controls panel, **When** values change, **Then** the rendered story updates live without a page reload.

---

### User Story 6 — Add Feature-Slice Overview (ComponentDocs) Stories (Priority: P3)

A developer or designer opens Storybook and can navigate to a top-level entry for each feature slice (reservations, menu, branches, loyalty, staff, ui-primitives) to see a summary of all components in that slice with brief descriptions and navigation links.

**Why this priority**: As the component count exceeds 50, orientation within Storybook becomes difficult. Slice-level index stories serve as a table of contents, making the design system navigable for both new developers and non-technical reviewers.

**Independent Test**: Open Storybook, confirm the sidebar has top-level entries for each feature slice. Clicking each entry shows a docs page listing that slice's components.

**Acceptance Scenarios**:

1. **Given** a ComponentDocs story exists for each feature slice, **When** Storybook builds, **Then** each slice's entry appears in the sidebar under its feature category.
2. **Given** the ComponentDocs page for a slice renders, **When** a developer views it, **Then** it lists each component in that slice with at minimum its name and a one-line description.
3. **Given** all six slice overview stories exist (reservations, menu, branches, loyalty, staff, ui-primitives), **When** Storybook is fully built, **Then** the sidebar reflects all six groups.

---

### Edge Cases

- What happens when a component has no image prop at all? Story variant audits MUST NOT add an image prop that does not exist on the component — those components are left unchanged except for argTypes and state variants.
- How does the system handle a component story where all state variants (loading, empty, error, disabled) are genuinely inapplicable? The story file is updated with argTypes and locale variants only; no empty-stub stories are forced.
- What happens if a component's prop set changes after argTypes are written? ArgTypes become stale. This is expected and will be caught by future reviews; it is not in scope for this feature.
- How does the i18n locale variant work for components that do not use i18n? Those components do not receive locale stories — the locale variant only applies to components that render localized strings.
- What if `@storybook/addon-a11y` reports violations on a Default story? The violation is documented in the story (via `parameters.a11y.config.rules`) with a clear suppression reason, or the story's markup is corrected. Zero unaddressed violations at merge.

## Requirements *(mandatory)*

### Functional Requirements

**Gap 1 — Broken image references**

- **FR-001**: WHEN Storybook builds, THE SYSTEM SHALL resolve zero requests to paths matching `/menu/**/*.webp`; all previously broken image references MUST be replaced with either a valid placeholder URL (e.g., `https://placehold.co/400x300`) or `null`/`undefined`.
- **FR-002**: IF a component's image prop is optional, WHEN imageUrl is set to `null` or `undefined`, THE SYSTEM SHALL render the component without an image using its existing fallback UI.

**Gap 2 — Missing addons**

- **FR-003**: THE SYSTEM SHALL have `@storybook/addon-viewport` installed as a dev dependency and registered in `.storybook/main.ts` addons array.
- **FR-004**: THE SYSTEM SHALL configure `@storybook/addon-viewport` with three named presets: `mobile` (375 px wide), `tablet` (768 px wide), `desktop` (1280 px wide).
- **FR-005**: THE SYSTEM SHALL have `@storybook/addon-a11y` installed as a dev dependency and registered in `.storybook/main.ts` addons array.
- **FR-006**: WHEN Storybook runs the accessibility audit on any Default story, THE SYSTEM SHALL report zero WCAG AA violations at the time of merge.

**Gap 3 — Incomplete story variants**

- **FR-007**: FOR EACH component that has a loading/skeleton state, THE SYSTEM SHALL include a named `Loading` story in that component's `.stories.ts` file.
- **FR-008**: FOR EACH component that displays a list or content area that can be empty, THE SYSTEM SHALL include a named `Empty` story.
- **FR-009**: FOR EACH component that displays an error or validation message, THE SYSTEM SHALL include a named `Error` story.
- **FR-010**: FOR EACH component that has a `disabled` prop, THE SYSTEM SHALL include a named `Disabled` story with `disabled: true` in its args.
- **FR-011**: FOR EACH component that renders i18n-controlled strings (ES/EN), THE SYSTEM SHALL include both `Spanish` and `English` named stories (or equivalent `LocaleES`/`LocaleEN`).
- **FR-012**: Stories MUST NOT add state variants for states that do not exist on the component (no forced empty stubs).

**Autodocs**

- **FR-013**: THE SYSTEM SHALL set `docs: { autodocs: true }` globally in `.storybook/main.ts` so every component with a `Meta` object gets an auto-generated Docs page without requiring per-file `tags: ['autodocs']`.
- **FR-014**: IF the global autodocs flag conflicts with any existing story-level `tags` configuration, THEN the global flag takes precedence; conflicting per-file tags are removed.

**ArgTypes**

- **FR-015**: EVERY story file MUST define an `argTypes` object on its `Meta` export covering all component props; each entry MUST include at minimum a `description` string and a `control` config appropriate to the prop type (`boolean` → `{ type: 'boolean' }`, enum → `{ type: 'select', options: [...] }`, string → `{ type: 'text' }`).

**Feature-slice overview stories**

- **FR-016**: THE SYSTEM SHALL include one `ComponentDocs` index story file per feature slice: `reservations`, `menu`, `branches`, `loyalty`, `staff`, `ui-primitives`. Each file uses the `Meta` type with `title` set to the slice name and renders a docs-only page listing the slice's components.
- **FR-017**: ComponentDocs story files MUST use `tags: ['autodocs']` so the Docs entry is the primary entry in the sidebar (no blank Canvas tab).

**Scope boundary**

- **FR-018**: ALL changes MUST be confined to `.storybook/` config files and `app/**/*.stories.ts` files. NO `.vue`, `.ts` application files, `server/`, `types/`, or `tests/` files MAY be modified.

### Key Entities

- **Story file** (`*.stories.ts`): TypeScript module co-located with a Vue component, exporting a `Meta` object and one or more named story objects. This is the unit of work for this feature.
- **Addon**: An npm package registered in `.storybook/main.ts` that adds UI panels or tooling to the Storybook interface (e.g., viewport switcher, accessibility panel).
- **ArgTypes**: A metadata object on the `Meta` export describing each component prop's type, allowed values, description, and associated control widget.
- **Autodocs**: A Storybook feature that auto-generates a Docs page for each component based on its `Meta`, `argTypes`, and exported stories.
- **ComponentDocs story**: A special story file with no Canvas story, used purely as a slice-level index page in the sidebar.
- **Feature slice**: A logical grouping of Vue components by domain (reservations, menu, branches, loyalty, staff, ui-primitives) matching the folder structure in `app/features/` and `app/components/ui/`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Storybook builds with zero console errors or 404 warnings related to image assets after this feature is merged.
- **SC-002**: The Storybook toolbar contains a Viewport selector with Mobile, Tablet, and Desktop presets; selecting each preset resizes the story canvas to 375 px, 768 px, and 1280 px respectively.
- **SC-003**: The Accessibility panel is present in Storybook and reports zero WCAG AA violations on all Default stories at the time of merge.
- **SC-004**: Every component entry in the Storybook sidebar has a Docs tab showing an auto-generated documentation page with a props/controls table.
- **SC-005**: Every component story file that has applicable states contains at minimum a `Default` story plus stories for each applicable state (loading, empty, error, disabled, ES locale, EN locale). Components with no applicable additional states retain at minimum their `Default` story.
- **SC-006**: Every story file's Controls panel shows descriptions and appropriate input widgets for each prop; no prop is listed as "unknown" or without a description.
- **SC-007**: The Storybook sidebar contains six feature-slice overview entries (reservations, menu, branches, loyalty, staff, ui-primitives), each opening a Docs page listing the slice's components.
- **SC-008**: The Storybook process starts in under 60 seconds and the build completes without errors after all changes are applied.

## Assumptions

- The 50+ Vue components already have co-located `.stories.ts` files (confirmed by feature context); this feature updates those files, it does not create them from scratch.
- `@storybook/addon-viewport` and `@storybook/addon-a11y` are compatible with the currently installed Storybook 10 + `@storybook/vue3-vite` version; version pinning to the same major version as the installed Storybook is assumed to be sufficient.
- The placeholder image URL `https://placehold.co/400x300` is accessible from the developer's machine during Storybook development. If a fully offline workflow is required, a local placeholder image asset can be added to `public/images/placeholder.webp` (this decision is left to the implementer).
- Components that render i18n strings accept a `locale` prop or have another mechanism to switch language in isolation (e.g., a `lang` prop or a Storybook decorator that provides the i18n plugin). If no such mechanism exists on a component, locale variants for that component are deferred.
- The `autodocs: true` global flag in `.storybook/main.ts` is the preferred path over adding `tags: ['autodocs']` to every Meta object, as it is simpler and less error-prone. The implementer MAY choose the per-file approach if a technical constraint prevents the global flag.
- No app code changes (`.vue`, composables, server routes) are permitted under any circumstance for this feature; if a state variant cannot be expressed through props and args alone, the story uses a `render` function or decorator — not a modification to the component.
- The `ComponentDocs` index story files are docs-only MDX-free pages written as `.stories.ts` with an MDX-free `Meta` and a default export that Storybook renders as a Docs page. If CSF-only docs pages are not supported by the current Storybook version, the implementer may use MDX (`.stories.mdx`) files instead — this does not constitute an app code change.
