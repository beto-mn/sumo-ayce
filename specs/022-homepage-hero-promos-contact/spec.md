# Feature Specification: Homepage hero font + Promotions carousel + Contact job card (consolidated)

**Feature Branch**: `feat/021-menu-experience-overhaul` (consolidated — ships on the existing 021 branch, no new branch)
**Created**: 2026-07-13
**Status**: Implemented (spec reconciled to delivered scope on 2026-07-14)
**Input**: Consolidated urgent feature 022 (client folded former 022/023/024 into one deliverable/PR).

> **Reconciliation note (2026-07-14).** Delivered deltas vs this draft: (1) each carousel slide
> overlays a **type pill** top-left (AYCE orange / Express blue / Ambos two-tone gradient) and the
> carousel **navigation is coloured by the active slide's type**; (2) the homepage promotions
> section shows the **"Promociones" title** with NO "ver todas" link (both surfaces show the same
> full-bleed carousel, all active, no cap); (3) the Bolsa de trabajo card uses the **real RH
> WhatsApp number** `wa.me/525584406639` with visible text `+52 55 8440 6639` (no longer a TEST
> placeholder); (4) the Graphik Super `woff2` binary was delivered (the draft flagged it pending).

## Overview

Three independent, client-requested changes bundled into one deliverable so they ship together on the existing 021 branch:

- **PART A** — Swap the homepage "ALL YOU CAN EAT" hero headline font from self-hosted **Titan One** to self-hosted **Graphik Super** (client-licensed).
- **PART B** — The WordPress `promociones` content model was **already restructured** (three responsive images, title moved to the post title, editorial text fields removed). The site must (1) fix the content pipeline that currently drops every promotion and (2) present promotions as a **responsive image carousel** on both the homepage and the promotions page.
- **PART C** — Add a static **"Bolsa de trabajo"** (job board) info card to the contact page with copy and a phone/WhatsApp call-to-action (real RH number `wa.me/525584406639`). No form, no backend.

All three parts are bilingual (ES/EN) with strict key parity and follow the Mercado Pop design system.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Promotions render again as a responsive carousel (Priority: P1)

Because the WordPress promotions model changed, the live site currently drops **every** promotion (the content validator still requires the removed `titulo_es` field). A visitor on the homepage or promotions page sees no promotions at all. This story restores promotions and presents them as a swipeable image carousel that adapts its image to the device.

**Why this priority**: This is a live content regression — the client edits promotions constantly and none are currently visible. It is the highest-value part of the deliverable.

**Independent Test**: With the restructured WordPress payload, load `/` and `/promociones`; verify active promotions appear as carousel slides, each showing the correct image for the viewport, a colored badge overlay, and a title-derived accessible label; verify drag, dots and arrows navigate slides.

**Acceptance Scenarios**:

1. **Given** the WordPress `promociones` endpoint returns active promotions in the new model, **When** the homepage loads, **Then** ALL active promotions (newest-first, no cap) render as carousel slides — ONE full-bleed promo image per slide (previously zero rendered) — under a "Promociones" section title with NO "ver todas" link. The homepage queries the SAME `?activa=1` list as the promotions page (the `home=1` filter was removed — it served a stale WordPress cache with deleted media IDs and no promo is home-flagged).
2. **Given** a promotion whose WordPress post title is `2&#215;1 en sushi`, **When** it renders, **Then** the accessible image label reads `2×1 en sushi` (HTML entities decoded).
3. **Given** a viewport ≤ 520px, **When** a slide renders, **Then** the mobile image (`imagen_movil`) is used; at 521–880px the tablet image; above 880px the desktop image.
4. **Given** a promotion where a tablet or mobile image is missing or duplicates the placeholder, **When** the slide renders, **Then** it falls back to the desktop image and never shows a broken image.
5. **Given** a promotion with `color = pink`, **When** it renders, **Then** the top-RIGHT badge sticker uses the pink accent; unknown colors fall back to orange.
6. **Given** a promotion with `tipo = ayce | express | all`, **When** it renders, **Then** a **type pill** appears top-LEFT labelled AYCE / Express / "AYCE + EXPRESS", coloured orange (ayce) / blue (express) / orange→blue gradient (all); AND the carousel's arrows and active dot follow the ACTIVE slide's type colour, updating as the slide changes.
7. **Given** a pointer/touch device, **When** the user drags or clicks a dot/arrow, **Then** the carousel advances to the corresponding slide.
8. **Given** the promotions page (`/promotions`), **When** it loads, **Then** it uses the **same** full-bleed carousel component as the homepage and shows all active promotions (one per slide, no cap) under the "Promociones Sumo" page header.
9. **Given** `prefers-reduced-motion` is set, **When** the carousel mounts, **Then** any auto-advance motion is disabled (embla re-inits with `duration: 0`).
10. **Given** promotions each have distinct desktop/tablet/mobile media IDs, **When** the route resolves them, **Then** all media is fetched in a SINGLE batched request (`/wp/v2/media?include=…`); a promo with at least one configured image ID is retained even if a transient media fetch fails, and only promos with NO configured image at all are skipped.

---

### User Story 2 - Hero headline uses the licensed Graphik Super font (Priority: P2)

The client wants the homepage hero wordmark to use their licensed Graphik Super typeface instead of the placeholder Titan One, keeping the exact logo-style rendering (white fill, thick black outline).

**Why this priority**: Brand-correctness on the most visible element of the site. Visually important but not a functional regression.

**Independent Test**: Load the homepage on mobile, tablet and desktop; confirm the "ALL YOU CAN EAT" headline is rendered in Graphik Super, retains white fill + black stroke + drop shadow, and that the font is preloaded (no visible swap flash on the hero LCP text).

**Acceptance Scenarios**:

1. **Given** the homepage loads, **When** the hero headline renders, **Then** its font family resolves to Graphik Super (self-hosted woff2).
2. **Given** the hero headline renders, **When** compared to the prior look, **Then** white fill, thick black `-webkit-text-stroke`, paint-order and drop shadow are preserved at every breakpoint.
3. **Given** the page `<head>`, **When** inspected, **Then** the font preload link points at the new Graphik Super woff2 (not `titan-one-regular.woff2`).
4. **Given** the codebase after this change, **When** searched, **Then** no Titan One reference remains in the hero font-face, `.hero-headline` rule, or the preload link.
5. **Given** a screen-reader user, **When** they reach the hero, **Then** the existing i18n aria label on the headline is unchanged.

---

### User Story 3 - Contact page shows a "Bolsa de trabajo" job card (Priority: P3)

A prospective employee visiting the contact page sees a static job-board card inviting them to join the team, with the exact client copy and a phone/WhatsApp button to reach a manager. There is no application form.

**Why this priority**: Additive static content; no dependencies and no regression risk.

**Independent Test**: Load the contact page; verify the job card renders the exact ES copy (heading, lead, body) in Spanish and translated EN copy when the locale is English, and that a phone pill links out via WhatsApp/tel.

**Acceptance Scenarios**:

1. **Given** the ES locale, **When** the contact page renders, **Then** the card shows heading "Bolsa de trabajo", the exact lead and body copy provided by the client.
2. **Given** the EN locale, **When** the contact page renders, **Then** the card shows the English translations of heading, lead and body.
3. **Given** the card, **When** the user taps the phone CTA, **Then** it opens `https://wa.me/525584406639` (real RH number, display `+52 55 8440 6639`), styled like the existing whatsapp pill.
4. **Given** the card, **When** inspected, **Then** there are no form fields — text and phone CTA only.

---

### Edge Cases

- **All three images identical (placeholder)**: every size falls back cleanly to the desktop URL; the slide still renders one image.
- **WordPress endpoint unreachable / times out**: the promotions surface degrades to empty (section hides) exactly as today — no error shown to the user.
- **A promotion with an empty/whitespace post title**: the slide still renders the image; the accessible label falls back to a generic promotions label rather than an empty string.
- **Single active promotion**: the carousel renders one slide with dots/arrows hidden or inert (no navigation needed).
- **No active promotions**: the promotions section does not render (homepage) / shows an empty state (promotions page) — unchanged from current behavior.
- **Graphik Super woff2 fails to load**: the headline falls back to the system sans-serif stack; layout must not break.
- **Job-card phone number**: the real RH WhatsApp number `+525584406639` is used; the CTA renders and links via `wa.me`.

## Requirements *(mandatory)*

### Functional Requirements

#### Part A — Hero font

- **FR-A1**: The system MUST render the homepage hero headline ("ALL YOU CAN EAT") using a self-hosted Graphik Super web font.
- **FR-A2**: The system MUST convert the client-supplied Graphik Super `.ttf` to `woff2` and serve it from the public fonts location.
- **FR-A3**: The system MUST preserve the existing logo-style headline treatment: white fill, thick black text stroke, paint-order, and drop shadow, at all defined breakpoints.
- **FR-A4**: The system MUST preload the new Graphik Super woff2 as the hero LCP font and MUST NOT preload or reference the previous Titan One font for the hero.
- **FR-A5**: The system MUST keep the existing i18n aria label on the hero headline unchanged.

#### Part B — Promotions content model + carousel

- **FR-B1**: The content pipeline MUST accept the restructured WordPress `promociones` ACF model whose only fields are: `badge_es`, `badge_en`, `color`, `tipo`, `activa`, `imagen_desktop`, `imagen_tablet`, `imagen_movil` (three media IDs), plus the existing `home`/`activa` selection flags.
- **FR-B2**: The content pipeline MUST derive the promotion title from the WordPress post `title.rendered` and MUST HTML-entity-decode it (e.g. `2&#215;1` → `2×1`).
- **FR-B3**: The content pipeline MUST NOT require or read the removed fields `titulo_es/en`, `descripcion_es/en`, `vigencia_es/en`, or the old single `imagen`; promotions previously dropped for lacking `titulo_es` MUST now be retained.
- **FR-B4**: The content pipeline MUST resolve the three media IDs to image URLs via a SINGLE batched WordPress media request (`/wp/v2/media?include=<ids>&per_page=100`, one call for the whole page) and MUST fall back to the desktop image URL for any size that is missing, zero, or unresolved. A promo that HAS at least one configured image media ID MUST NOT be dropped merely because a transient media fetch failed; only promos with NO configured image at all are skipped.
- **FR-B5**: The content pipeline MUST keep `badge` (bilingual), `color`, `tipo`, and `active` on the projected promotion.
- **FR-B6**: Selection logic: BOTH the homepage and the promotions page query the SAME `?activa=1` list and show ALL active promotions newest-first with NO cap. The `home=1` filter was removed (it served a stale WordPress cache with deleted media IDs and no promo is home-flagged); home-flag curation, if wanted later, is a separate feature. Each promo occupies one full-bleed carousel slide.
- **FR-B7**: The promotions surface MUST render as a carousel showing ONE full-bleed promo image per view at every breakpoint (no card frame/letterbox), supporting touch/drag, dot indicators, and previous/next arrows, on both the homepage and the promotions page, using a single shared carousel component.
- **FR-B8**: Each carousel slide MUST render a responsive `<picture>` that selects the mobile image at ≤ 520px, the tablet image at 521–880px, and the desktop image above 880px, filling the slide width edge-to-edge.
- **FR-B9**: Each slide MUST overlay (a) a **badge sticker top-right** whose accent is driven by the promotion `color` (default orange) showing the bilingual `badge`, and (b) a **type pill top-left** labelled and coloured by the promotion `type` (AYCE → orange, Express → blue, Ambos/`all` → orange→blue gradient, always text-labelled for a11y). Each slide MUST set the image alt text to the decoded promotion title (generic fallback when empty).
- **FR-B9a**: The carousel navigation (prev/next arrows + active dot) MUST be coloured by the ACTIVE slide's `type` (orange / blue / gradient) and update reactively as the active slide changes; the border/outline and 44px tap targets are unaffected.
- **FR-B9b**: On the homepage the promotions section MUST show the "Promociones" title (via the `home.promotions.*` keys) with NO "ver todas" / "see all" link; both the homepage and the promotions page render the identical shared full-bleed carousel over the same all-active list.
- **FR-B10**: The carousel MUST respect `prefers-reduced-motion` by disabling any auto-advance/autoplay motion.
- **FR-B11**: The promotions route MUST continue to run server-side within the existing rendering windows (homepage ISR 3600, promotions page ISR 60) and MUST degrade gracefully to an empty result on upstream failure.

#### Part C — Contact job card

- **FR-C1**: The contact page MUST display a static "Bolsa de trabajo" card sourced entirely from i18n, with no backend call and no form fields.
- **FR-C2**: The card MUST render the exact client-provided Spanish copy for heading, lead, and body (verbatim, see Assumptions).
- **FR-C3**: The card MUST provide English translations for the heading, lead, and body.
- **FR-C4**: The card MUST include a phone call-to-action styled like the existing whatsapp pill, linking out via WhatsApp (`wa.me`) using the real RH (HR) number: link `https://wa.me/525584406639` (built from the digits-only i18n `contact.jobs.phone` = `+525584406639`) with visible display text `+52 55 8440 6639` (`contact.jobs.phoneDisplay`).

#### Cross-cutting

- **FR-X1**: Every changed or new UI component (hero, promotions carousel, promotion slide/card, contact info) MUST have Storybook stories covering default, significant variants, and mobile/desktop breakpoints.
- **FR-X2**: Every changed or new component and the rewritten content pipeline MUST have co-located automated tests.
- **FR-X3**: All new/changed user-facing strings MUST exist in both ES and EN with strict key parity (identical key sets in both locale files).
- **FR-X4**: All code MUST comply with the constitution: feature-folder boundaries (Article I), TypeScript strict / no `any` (Article II), separated WordPress vs Neon data sources (Article V), and Storybook coverage (Article VII).

### Key Entities *(include if feature involves data)*

- **Promotion (projected)**: `id`, `badge` (bilingual), `title` (single decoded string from the post title), `color` (orange | pink | blue | yellow | green), `type` (all | ayce | express), `active`, `publishedAt`, and three resolved image URLs (`imageDesktopUrl`, `imageTabletUrl`, `imageMovilUrl`, each `string | null` with desktop fallback). Removes the former `description`, `validity`, and single `imageUrl` fields.
- **Raw WordPress promotion**: top-level `id`, `date`, `title.rendered`; `acf` group with `badge_es/en`, `color`, `tipo`, `activa`, `home`, and three media-ID image fields.
- **Job card content**: static i18n block under `contact.jobs.*` — `heading`, `lead`, `body`, phone-CTA label, `phone` (`+525584406639`, digits-only for the `wa.me` link) and `phoneDisplay` (`+52 55 8440 6639`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of active promotions returned by WordPress render on the site (currently 0% render due to the validator regression).
- **SC-002**: Promotion titles containing HTML entities display the decoded character (e.g. `×`) with 0 raw-entity leaks.
- **SC-003**: The correct image size is served for each of the three breakpoint bands (mobile ≤520, tablet 521–880, desktop >880) in 100% of slides, with desktop fallback whenever a size is unavailable.
- **SC-004**: Visitors can navigate promotions by drag, dots, and arrows on both the homepage and promotions page.
- **SC-005**: The hero headline renders in Graphik Super at every breakpoint with the white-fill/black-stroke treatment preserved, and no Titan One reference remains for the hero.
- **SC-005a**: Each slide shows a type pill (top-left, coloured/labelled by `type`) and a colour badge (top-right); the carousel nav follows the active slide's type colour.
- **SC-006**: The contact job card renders the exact ES copy in Spanish and translated EN copy in English, with a working `wa.me/525584406639` phone CTA (display `+52 55 8440 6639`) and no form fields.
- **SC-007**: ES and EN locale files have identical key sets (parity check passes).
- **SC-008**: Every changed/new component has a Storybook story and passing co-located tests.

## Assumptions

- **Client copy (ES, verbatim)** — heading: "Bolsa de trabajo"; lead: "¡Únete a nuestro equipo! No te pierdas la oportunidad de trabajar con nosotros."; body: "¿Cómo puedes ser parte? Buscamos chicos Sumo proactivos, responsables y con la mejor actitud en servicio, si crees cumplir con esos requisitos ya solamente tienes que llenar con tus datos personales el siguiente formulario y esperar a que un encargado se comunique contigo." EN translations are authored by the team and reviewed by the client later.
- The Graphik Super font is properly licensed for web/self-hosted use (client confirmed). The `woff2` binary (`public/fonts/graphik-super.woff2`) + license note were delivered.
- The job-card phone number is the real RH (HR) WhatsApp number `+525584406639` (link `wa.me/525584406639`, display `+52 55 8440 6639`), sourced from i18n and swappable without code changes to the card structure.
- Recommended (non-enforced) asset ratios: mobile 4:5 (1080×1350), tablet 1:1 (1536×1536), desktop 16:9 (2400×1350). The site does not enforce these; it renders whatever WordPress serves.
- The three restructured image fields currently all point to the same placeholder media ID; the fallback logic must handle identical/duplicate sizes gracefully.
- The `promociones` ISR window (60s) and homepage ISR window (3600s) are unchanged.
- Homepage promotions selection: the SAME `?activa=1` all-active query as the promotions page, newest-first, NO cap — each promo is a full-bleed carousel slide. (Two client-review changes: the former 3-newest cap was removed so the homepage shows the same multi-slide carousel as the promotions page; and the `home=1` primary query was removed because WordPress served a stale/broken cache for that filter and no promo is home-flagged. Home-flag curation is deferred to a separate future feature.)
- This feature ships on the existing `feat/021-menu-experience-overhaul` branch as one PR; no new git branch is created.
- The reference doc `docs/business/wordpress-endpoints.md` documents the OLD promotions ACF contract and will need a follow-up update; this spec's `contracts/promotions-wp.md` is the authoritative new contract for the implementation.
