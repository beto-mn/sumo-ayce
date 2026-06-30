# Research: Storybook Full UI/UX Documentation Coverage

**Feature**: 020-storybook-full-coverage  
**Date**: 2026-06-29  
**Branch**: `chore/021-storybook-coverage`

## 1. Addon version compatibility

**Decision**: Install `@storybook/addon-viewport@^10.4.1` and `@storybook/addon-a11y@^10.4.1`.

**Rationale**: The project uses `storybook@^10.4.1` and `@storybook/vue3-vite@^10.4.1`. Storybook addons must match the same major + minor release to avoid peer dependency conflicts. Pinning to `^10.4.1` satisfies the semver peer requirement while allowing patch-level updates.

**Alternatives considered**:
- `@latest` — rejected; would install Storybook 9.x (latest stable at research time) causing peer conflicts with the already-installed 10.4.1 core
- `^10.0.0` — accepted alternative but less specific; `^10.4.1` is preferred to match the exact installed baseline

---

## 2. Autodocs strategy — global flag vs. per-file tags

**Decision**: Set `docs: { autodocs: true }` globally in `.storybook/main.ts`.

**Rationale**: Adding `tags: ['autodocs']` to 51 existing Meta objects is error-prone and creates ongoing maintenance burden (every new story file must remember the tag). The global flag in `main.ts` generates Docs pages for all components without per-file annotation. Storybook 10 supports this via the `docs.autodocs` config key.

**Alternatives considered**:
- Per-file `tags: ['autodocs']` — rejected for scale reasons (51 files); acceptable fallback if a technical constraint prevents the global flag
- MDX pages — rejected; adds complexity and a new file type; CSF3 autodocs covers the same use case

---

## 3. Viewport configuration location — main.ts vs. preview.ts

**Decision**: Register `@storybook/addon-viewport` in `main.ts` addons array. Configure custom viewport presets in `.storybook/preview.ts` (or `preview.js` if `.ts` does not exist) using the `parameters.viewport` key.

**Rationale**: Storybook 10's addon architecture separates addon registration (in `main.ts`) from addon configuration (in `preview.ts`). Custom viewport definitions live in `parameters.viewport.viewports` in the preview file, not as a top-level key in `main.ts`. This is the documented Storybook pattern.

**Viewport presets**:
```ts
// .storybook/preview.ts
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport'

export const parameters = {
  viewport: {
    viewports: {
      mobile:  { name: 'Mobile (375px)',  styles: { width: '375px',  height: '812px'  } },
      tablet:  { name: 'Tablet (768px)',  styles: { width: '768px',  height: '1024px' } },
      desktop: { name: 'Desktop (1280px)', styles: { width: '1280px', height: '900px'  } },
    },
    defaultViewport: 'mobile',
  },
}
```

**Why these widths**: Match the Mercado Pop design context (primary collapse breakpoints at 520 px and 880 px). The chosen viewport widths (375, 768, 1280) bracket the breakpoints: mobile is below both, tablet is between them, desktop is above both.

**Alternatives considered**:
- Using built-in `INITIAL_VIEWPORTS` (iPhone/iPad device names) — rejected; device names are less meaningful than the semantic widths used in the project's CSS
- Configuring in `main.ts` directly — rejected; Storybook 10 does not read `parameters` from `main.ts`

---

## 4. Broken image fix strategy

**Decision**: Replace all `/menu/**/*.webp` references in story files with `https://placehold.co/400x300`.

**Specific files affected** (confirmed by `grep`):
- `app/features/menu/components/MenuDishCard.stories.ts` — line 33: `imageUrl: '/menu/ayce/bora_bora.webp'`
- `app/features/menu/components/MenuDishGrid.stories.ts` — lines 33, 110: `imageUrl: '/menu/ayce/bora_bora.webp'`

**Rationale**: `https://placehold.co/400x300` returns a neutral grey placeholder image with the dimensions annotated. It is widely used for exactly this purpose. No asset commit required. The URL is clearly a placeholder — it does not mislead reviewers into thinking the image is production data.

**Alternative — set to `null`**: Acceptable for components that handle `imageUrl?: string | null` with a fallback slot. Chosen as the secondary option: if a component does not gracefully handle `null` (e.g., renders a broken `<img>` with no `src`), use `https://placehold.co/400x300` instead.

**Alternative — local placeholder in `public/`**: Acceptable for fully offline workflows. Not chosen as the default because it requires committing a binary asset and increases repo size unnecessarily.

---

## 5. Locale variant strategy — i18n in Storybook

**Decision**: Pass localized string props directly in each locale story rather than mounting the full `@nuxtjs/i18n` plugin in Storybook.

**Rationale**: SUMO AYCE components are designed to receive their display strings as props (e.g., `label`, `placeholder`, `title`, `description` — derived from i18n keys at the page/composable level). In Storybook, the component is rendered in isolation. Mounting the full Nuxt i18n plugin requires a Storybook decorator and a complex plugin initialization chain that is fragile and hard to maintain. Since the components accept strings as props, it is simpler and more robust to pass Spanish strings in the `LocaleES` story and English strings in the `LocaleEN` story.

**Example pattern**:
```ts
export const LocaleES: Story = {
  args: { label: 'Nombre completo', placeholder: 'Tu nombre' }
}
export const LocaleEN: Story = {
  args: { label: 'Full name', placeholder: 'Your name' }
}
```

**Exception**: If a component internally calls `useI18n()` and does not accept string props, a decorator providing a minimal i18n plugin (with `{ es: {...}, en: {...} }` messages) MUST be used. The component source is not modified.

---

## 6. ComponentDocs index story format

**Decision**: Use CSF3 `.stories.ts` files with `tags: ['autodocs']` and a docs-only meta title. Each file exports a default Meta and a single named story that renders a simple descriptive `<div>` listing the components in the slice.

**Rationale**: Storybook 10 CSF3 supports docs-only stories by setting `tags: ['autodocs']` on the Meta and providing a simple render. This avoids MDX and keeps all story files in the same `.stories.ts` format. The ComponentDocs stories do not test behavior — they serve as a navigable index in the sidebar.

**Pattern**:
```ts
import type { Meta, StoryObj } from '@storybook/vue3'

const meta: Meta = {
  title: 'Features/Reservation',
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => ({
    template: `
      <div style="font-family: sans-serif; padding: 2rem;">
        <h1>Reservation Feature</h1>
        <p>Components in this slice:</p>
        <ul>
          <li><strong>ReservationForm</strong> — full multi-step reservation form</li>
          <li><strong>ReservationFieldsPrimary</strong> — branch + party size fields</li>
          <li><strong>ReservationFieldsDateTime</strong> — date + time slot picker</li>
          <li><strong>ReservationFieldsContact</strong> — name + phone fields</li>
          <li><strong>ReservationConfirmation</strong> — success state after submission</li>
        </ul>
      </div>
    `,
  }),
}
```

---

## 7. 200-line overflow handling

**Decision**: If adding variants to an existing story file would exceed 200 lines (Article VIII), create a sibling file named `ComponentName.variants.stories.ts` in the same directory.

**Rationale**: Article VIII sets a hard 200-line limit on all files. Story files for complex components (e.g., `ReservationForm`, `MenuShell`) may exceed this limit when loading + empty + error + locale variants are added. Splitting is the cleanest solution: the base file retains Default and primary variants; the variants file holds the additional state stories.

**Storybook compatibility**: Storybook's `stories` glob in `main.ts` (`'../app/**/*.stories.@(ts|tsx)'`) already matches `*.variants.stories.ts` files, so no config change is needed.

---

## 8. WCAG AA compliance baseline

**Decision**: Before adding `@storybook/addon-a11y`, audit the known high-risk components: `Button` (color contrast), `Input`/`Select`/`Textarea` (label association), `Nav` (keyboard navigation), `Lightbox` (focus trap + aria-modal). Address any violations in the story's `parameters.a11y.config.rules` suppression with documented reasons, OR fix the aria attributes in the story's render function (not in the component).

**Note**: Article IV testing requirements do not apply to Storybook stories (they are not unit tests). The accessibility gate (zero WCAG AA violations on Default stories) is enforced by the `addon-a11y` panel at review time, not by CI automation in this feature. CI integration of `axe-storybook-testing` is out of scope for feature 020.

**Rationale**: CI-enforced a11y testing requires `@axe-core/storybook` or similar — adding that is a separate feature (Article X KISS). The spec requires zero violations at merge time, which is achievable via manual panel review during PR review.
