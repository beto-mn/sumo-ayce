# Feature Specification: Contact Page (`/contact`)

**Feature ID**: 017
**Feature Branch**: `feat/017-contact-page`
**Created**: 2026-06-22
**Status**: spec_ready
**Depends on**: 007 (design system, done), 008 (test setup, done), 013 (branches page — `/api/v1/branches` API already exists and is in production)
**Blocks**: nothing (standalone content page)

---

## Overview

The Contact Page (`/contact`) is the dedicated surface for visitors to reach any SUMO branch
directly via WhatsApp. The page is split into two cards side-by-side on desktop and stacked
on mobile:

- **Left card (form)**: The visitor fills in their name, a target branch (selected from a
  live dropdown), and a freeform message. On submit the browser opens a `wa.me` deep-link to
  the selected branch's WhatsApp number with name and message pre-encoded in the `text`
  parameter. No backend call is made; no data is stored anywhere.
- **Right card (dynamic info)**: Contact details for the selected branch. When no branch is
  selected, the WhatsApp section shows a prompt to select a branch. When a branch is selected,
  a pill button appears with that branch's phone number. The email address and social media
  pill buttons (Instagram, Facebook, TikTok) are always visible and sourced from i18n config.

The branch dropdown is populated client-side (after the static shell is served) by calling
`GET /api/v1/branches`. Only branches that have a WhatsApp number (`phone !== null`) appear
in the dropdown. While the branch list is loading, the form shows a loading state; if the
fetch fails the dropdown is hidden and a friendly error message is shown.

The page shell has no WordPress dependency and no Neon dependency, so it is pre-rendered
as a static HTML file (`prerender: true`). The branch list is the only dynamic piece and
is always fetched fresh client-side.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Contact a specific branch via WhatsApp (Priority: P1)

A visitor wants to ask a question to a specific SUMO branch. They navigate to `/contact`,
fill in the form (name, choose a branch, type a message), and click
"Iniciar chat por WhatsApp". The browser opens WhatsApp (web or app) with the branch's
number pre-dialled and the message pre-filled. The visitor just hits Send — no additional
typing needed.

**Why this priority**: This is the sole conversion event of the page. If the wa.me link
does not open with the correct number and pre-composed message, the page delivers zero
value.

**Independent Test**: On a device with WhatsApp installed, fill all three fields, pick any
branch from the dropdown, click the button. Confirm WhatsApp opens, the conversation is
addressed to the branch's stored phone number, and the message body contains the visitor's
name and the typed message.

**Acceptance Scenarios**:

1. **Given** the branch list has loaded and the visitor has filled all three fields, **When**
   they click "Iniciar chat por WhatsApp", **Then** the browser navigates to
   `https://wa.me/<branch.phone>?text=<encoded text>` in a new tab.
2. **Given** the visitor has not filled every required field, **When** they attempt to
   submit, **Then** the button remains disabled (or HTML5 validation fires) and no wa.me
   URL is opened.
3. **Given** the visitor fills all fields and picks a branch, **When** the wa.me URL is
   constructed, **Then** the `text` parameter contains the visitor's name and their freeform
   message, URL-encoded so no characters are lost.
4. **Given** a branch with phone `5215512345678` is selected, **When** the wa.me link is
   built, **Then** the URL host is `wa.me/5215512345678` (the `phone` field value used
   verbatim, without formatting changes).

---

### User Story 2 — Browse contact info for the selected branch (Priority: P2)

A visitor wants the phone number of the branch they are about to contact. As they select a
branch in the form dropdown, the right card immediately updates to show that branch's
WhatsApp pill button. They also find the pre-filled email link and social media links in the
same card.

**Why this priority**: The right card is immediately visible on page load. It serves visitors
who want a quick lookup before committing to the form, and the dynamic WhatsApp section
reinforces which branch they are about to contact.

**Independent Test**: Load `/contact`. Confirm the right card renders with a "Elige una
sucursal para ver su número" prompt (no pill yet), the email link to `contacto@sumo.com.mx`,
and three social pills. Select a branch in the form dropdown. Confirm the WhatsApp prompt is
replaced by a pill button showing that branch's phone number, linking to the correct `wa.me`
URL. Confirm the email `mailto:` link updates with the form's current name and message.

**Acceptance Scenarios**:

1. **Given** no branch has been selected, **When** the page loads, **Then** the right card
   shows the text "Elige una sucursal para ver su número" (ES) / "Select a branch to see its
   number" (EN) in place of a WhatsApp pill button.
2. **Given** the visitor selects a branch in the form dropdown, **When** the selection
   changes, **Then** the right card replaces the prompt with a pill button showing the
   branch's phone number, linking to `https://wa.me/<branch.phone>` in a new tab.
3. **Given** the visitor clicks the email address, **When** the navigation fires, **Then**
   the browser opens `mailto:contacto@sumo.com.mx?subject=...&body=...` pre-populated with
   the current form state (name and message).
4. **Given** the visitor clicks an Instagram pill, **When** the navigation fires, **Then**
   the browser navigates to `https://www.instagram.com/sumo_allyoucaneat` in a new tab.

---

### User Story 3 — Form degrades gracefully when branch list fails (Priority: P2)

The visitor loads `/contact` but the `/api/v1/branches` call returns an error or times out.
The page does not crash. The form shows a friendly message in place of the dropdown. The
visitor can still use the right card (static info, no fetch dependency).

**Why this priority**: A failing branch API must not make the entire page useless. The
static contact info remains available, and the visitor is informed clearly rather than
facing a broken UI.

**Independent Test**: Block `GET /api/v1/branches` at the network level (DevTools). Load
`/contact`. Confirm the dropdown area is replaced by an error message. Confirm the right
card and all static content remain functional.

**Acceptance Scenarios**:

1. **Given** the branch API returns a network error, **When** the page finishes loading,
   **Then** the dropdown is hidden and a user-friendly error message is shown in its place
   (no stack trace, no HTTP status code exposed).
2. **Given** the branch list is still loading, **When** the page is in the loading state,
   **Then** a loading indicator is visible inside the form card so the visitor knows
   something is in progress.
3. **Given** the branch API returns successfully but all branches have `phone === null`,
   **When** the dropdown renders, **Then** it is empty and an explanatory message is shown
   ("No hay sucursales disponibles en este momento").

---

### User Story 4 — Language toggle (Priority: P3)

A visitor prefers English. They click the language toggle in the nav. All visible text on
the Contact page switches to English — page header, form labels, placeholder text, button
label, right card section headings, and error/empty messages.

**Why this priority**: Bilingual support is a cross-cutting requirement for all public
pages. It is deprioritised here only because it is an enhancement on top of the primary
flow.

**Independent Test**: With the page loaded in Spanish, toggle the language. Verify every
visible text element updates to English without a full page reload.

**Acceptance Scenarios**:

1. **Given** the default language (Spanish) is active, **When** the page loads, **Then**
   all labels, placeholders, headings, and the CTA button use Spanish copy.
2. **Given** the visitor switches to English via the language toggle, **When** the locale
   changes, **Then** all visible text on the page updates to English without a page reload.
3. **Given** English is active, **When** the visitor submits the form, **Then** the wa.me
   link is constructed with the message content the visitor typed (language-agnostic — no
   copy is injected into the wa.me text by the system).

---

### Edge Cases

- **Branch with `phone === null`**: excluded from the dropdown silently; the visitor never
  sees it as an option.
- **Very long branch name**: wraps within the `<option>` or custom select component; no
  overflow out of the dropdown.
- **Mobile WhatsApp not installed**: `wa.me` redirects to `web.whatsapp.com`; this is
  native browser behaviour and outside the app's responsibility.
- **Branch phone contains formatting characters** (spaces, dashes): the `phone` field is
  used verbatim as the wa.me path segment; the existing API already stores numbers in a
  consistent format (`whatsappReservaciones` column).
- **Very long message**: `encodeURIComponent` applied to the full text; URL length is not
  expected to be a problem for WhatsApp deep-links in practice.
- **No branch selected (initial state)**: right card WhatsApp section shows the "Elige una
  sucursal para ver su número" prompt; the branch pill button is not rendered.
- **All form fields empty**: submit button is disabled; no wa.me URL is opened.
- **Rapid re-submit**: button is disabled while the wa.me link is opening (single-fire
  guard, purely UX; no backend is called so double-submission is not a data integrity risk).
- **Reduced motion**: entrance animations for cards are instant (no transform transitions).
  The loading spinner is exempt and may still animate since it conveys meaningful state.
- **No branches returned (empty API response)**: form shows "No hay sucursales disponibles
  en este momento" in the dropdown area.

---

## Requirements *(mandatory)*

### Functional Requirements

**Page composition & rendering**

- **FR-001**: The system MUST serve the contact page at the route `/contact` with no
  authentication required.
- **FR-002**: The page MUST be pre-rendered as a static HTML file
  (`routeRules['/contact'] = { prerender: true }` in `nuxt.config.ts`). No ISR interval,
  no SSR — the shell content never changes.
- **FR-003**: The static HTML shell MUST include the full page header and both cards
  (form card and static info card) without any client-side fetch for the shell content.
- **FR-004**: No Drizzle/Neon client may be imported anywhere under `app/`. Branch data
  reaches the page exclusively via the existing `GET /api/v1/branches` endpoint.

**Branch dropdown (client-side fetch)**

- **FR-005**: On mount, the form card MUST fetch `GET /api/v1/branches` client-side
  (i.e., with `server: false` so it does not execute at prerender time). The fetch MUST
  NOT block the static HTML shell from being served.
- **FR-006**: The branch dropdown MUST include only branches where `phone !== null`. All
  other branches are silently excluded.
- **FR-007**: Branches in the dropdown MUST be sorted alphabetically by `name`
  (ascending, case-insensitive).
- **FR-008**: While the branch list is loading, a loading indicator MUST be shown inside
  the form card in place of the dropdown. The rest of the form (name, message) MUST be
  visible during loading.
- **FR-009**: If the branch fetch fails (network error, non-2xx response), the dropdown
  MUST be replaced by a user-friendly error message. The CTA button MUST be disabled in
  this state. No stack trace or HTTP status code is exposed to the visitor.
- **FR-010**: If the branch fetch returns successfully but no branch has a `phone` value,
  an empty-state message MUST be shown in place of the dropdown, and the CTA button MUST
  be disabled.

**Form validation & wa.me link construction**

- **FR-011**: The form MUST have three fields: Nombre (text, required), Elige sucursal
  (select, required), and Mensaje (textarea, required). All three MUST be filled and a
  branch MUST be selected before the CTA button becomes active.
- **FR-012**: On a valid submission, the system MUST construct a wa.me URL of the form
  `https://wa.me/<branch.phone>?text=<encodedMessage>` and open it in a new browser tab.
  No backend call is made; no data is stored.
- **FR-013**: The `text` parameter in the wa.me URL MUST include, at minimum: the
  visitor's name and their freeform message. The exact format is defined in the i18n
  message template under the key `contact.waMessage`.
- **FR-014**: The `<branch.phone>` value MUST be used verbatim as the wa.me path segment
  (no transformations, no stripping of country code formatting).
- **FR-015**: After the wa.me link fires, the form fields MUST NOT be reset automatically.
  The visitor may want to send a follow-up to a different branch without re-typing.

**Right card — static contact info**

- **FR-016**: The right card MUST display a dynamic branch WhatsApp section that reacts to
  the branch selected in the form dropdown. When no branch is selected, the section shows
  the i18n text `contact.info.whatsappPrompt` ("Elige una sucursal para ver su número" /
  "Select a branch to see its number") and no pill button. When a branch is selected, a
  pill button appears with the branch's phone number, linking to
  `https://wa.me/<branch.phone>` in a new tab. There is no global SUMO WhatsApp number on
  this card. The selected-branch state MUST be lifted to `contact.vue` (or a shared
  composable) so both `ContactForm` and `ContactInfo` share it.
- **FR-017**: The right card MUST display a `mailto:` link for `contacto@sumo.com.mx`.
  The link MUST be constructed as
  `mailto:contacto@sumo.com.mx?subject=<subject>&body=<body>` where subject and body are
  reactively pre-populated from the current form state: subject = "Contacto SUMO — [branch
  name if selected]", body = "Nombre: [name]\n\nMensaje: [message]". If form fields are
  empty the mailto opens with an empty subject and body. The email address is sourced from
  the i18n key `contact.email`.
- **FR-018**: The right card MUST display pill buttons for Instagram, Facebook, and TikTok
  using these exact URLs, hardcoded in i18n locale files:
  - Instagram: `https://www.instagram.com/sumo_allyoucaneat`
  - Facebook: `https://www.facebook.com/sumoallyoucaneat`
  - TikTok: `https://www.tiktok.com/@sumooficial`
  Each pill opens its URL in a new tab. URLs are sourced from i18n config keys
  `contact.socialInstagram`, `contact.socialFacebook`, `contact.socialTiktok`.
- **FR-019**: The email address and social URLs in the right card MUST be sourced from i18n
  config — never hardcoded inline in the component template. The branch WhatsApp number
  comes from the shared selected-branch state, not from i18n.

**Layout & responsiveness**

- **FR-020**: On viewports ≥ 880px, the two cards MUST be displayed side by side (two
  equal or proportionally balanced columns). On viewports < 880px, they MUST stack
  vertically (form card on top, info card below).
- **FR-021**: The page template (`app/pages/contact.vue`) MUST NOT exceed 100 lines of
  template. The form card is `app/features/contact/components/ContactForm.vue`; the info
  card is `app/features/contact/components/ContactInfo.vue`.
- **FR-022**: All interactive form elements (inputs, select, textarea, button) MUST have a
  minimum touch target height of 44px.

**Internationalisation**

- **FR-023**: All UI copy (page header, form labels, placeholders, CTA button text, error
  messages, section headings in the right card) MUST be available in Spanish (default) and
  English via `@nuxtjs/i18n`, switchable without a full page reload.
- **FR-024**: The wa.me message template (key `contact.waMessage`) MUST be defined in both
  locales so the composed message reads naturally in whichever language the visitor is
  using.

**SEO**

- **FR-025**: The page MUST set a bilingual `<title>` and `<meta name="description">` via
  `useSeoMeta` using i18n keys (`contact.seo.title`, `contact.seo.description`).

**Accessibility**

- **FR-026**: All form fields MUST have associated `<label>` elements (or `aria-label`
  equivalents). Required fields MUST be marked with `aria-required="true"`.
- **FR-027**: The CTA button MUST be keyboard-operable and MUST convey its disabled state
  to assistive technologies (`disabled` attribute or `aria-disabled="true"`).
- **FR-028**: All pill buttons in the right card (WhatsApp, social) MUST have accessible
  names either via visible text or `aria-label` when icon-only.

### Key Entities

- **ContactBranch** (client-side view of `BranchPublicRow`): `{ id: string, name: string,
  phone: string }` — derived from the API response by filtering branches where
  `phone !== null` and projecting only the fields the contact form needs.
- **ContactFormState**: `{ name: string, branchId: string, message: string }` — ephemeral
  reactive state; never persisted.
- **WaLinkConfig**: `{ email: string, socialInstagram: string, socialFacebook: string,
  socialTiktok: string }` — sourced from i18n config; used by the right card. The branch
  WhatsApp number is not part of this config — it comes from the selected `ContactBranch`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can go from landing on `/contact` to having WhatsApp open with a
  pre-composed message to the correct branch in under 60 seconds, including typing all
  three fields.
- **SC-002**: The Lighthouse score on `/contact` is ≥ 90 on all four metrics (Performance,
  Accessibility, Best Practices, SEO).
- **SC-003**: The page HTML shell is served from the static pre-render cache — the CDN
  does not call a Nuxt server to render `/contact` for any visitor request.
- **SC-004**: The branch dropdown renders with correct options within 2 seconds of page
  load on a standard 4G connection.
- **SC-005**: The page renders correctly (no horizontal overflow, all content legible) at
  the 360px minimum viewport width.
- **SC-006**: A branch API failure never exposes an unhandled exception or technical error
  to the visitor; the error state message renders instead within the form card.
- **SC-007**: `ContactForm` unit tests cover: dropdown shows only branches with non-null
  phone, CTA disabled until all three fields filled, correct wa.me URL constructed on
  submit (name + message only, no user phone), loading state renders, error state renders.
- **SC-008**: `ContactInfo` unit tests cover: WhatsApp section shows prompt when no branch
  selected, WhatsApp pill appears with correct `wa.me` URL when a branch is passed,
  email link is a `mailto:contacto@sumo.com.mx` with reactive subject/body, social pills
  link to the correct hardcoded URLs.
- **SC-009**: No inline hex (`#xxxxxx`) in any new `.vue` or `.ts` file (verified by
  grep).
- **SC-010**: The page is fully functional with the language set to English — all labels,
  placeholders, headings, and the wa.me message template switch correctly.

---

## Assumptions

- **`BranchPublicRow.phone` is the WhatsApp number** — the field named `phone` in the API
  response maps to the `whatsappReservaciones` column in the database (confirmed by reading
  `server/api/v1/branches/index.get.ts`). The contact form uses this number verbatim in
  the wa.me path segment.
- **`GET /api/v1/branches` returns only active branches** — the existing route already
  filters by `isActive === true`. No additional filtering is needed client-side beyond
  excluding branches with `phone === null`.
- **Email and social URLs are stable** — they do not change between deployments and do not
  need to be editable via a CMS. They are stored in the i18n locale files and updated by a
  developer when needed. The branch WhatsApp number is dynamic and comes from the API.
- **The `wa.me` format strips non-numeric characters automatically** — however, since the
  API already stores numbers in a consistent format, no client-side stripping is performed.
  If the format ever changes, the `server/api/v1/branches` contract is the right place to
  fix it, not the contact page.
- **`UiPageHeader` component exists** (created in feature 007) and accepts `badge`,
  `badge-tone`, `title`, and optionally a `subtitle` prop. The badge tone `"pink"`
  is supported.
- **`@nuxtjs/i18n` is installed and configured** (feature 007). The contact page adds new
  i18n keys under the `contact.*` namespace to the existing locale files.
- **No pagination or search is needed for the branch dropdown** — 29 branches is well
  within the usable range of a native `<select>` element.
- **The contact page has no per-user state** — it is purely a static utility page. There
  is no authentication requirement and no session data needed.
- **`routeRules['/contact'] = { prerender: true }` does not yet exist** in `nuxt.config.ts`
  and MUST be added as part of this feature. The rendering strategy doc
  (`docs/business/rendering-strategy.md`) MUST be updated to include `/contact` in the
  per-route table.
