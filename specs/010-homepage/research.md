# Phase 0 Research: Homepage (`/`)

Decisions and rationale grounding the plan. Each entry: **Decision → Rationale → Alternatives rejected.**

> **Content-sourcing reconciliation (2026-06-19).** The human confirmed the real
> content sourcing, which differs from the first pass: **promotions** from a WordPress
> `promociones` endpoint (R2/R3); **reviews** from a static fixture (R5).
>
> **Build reconciliation (2026-06-20).** During implementation the featured-dishes
> source was further simplified from a DB-backed Nitro route to a **static fixture**
> (`app/features/homepage/data/featured-dishes.ts`) consumed via `useFeaturedDishes`
> with a route-compatible shape (drop-in swap later). There is **no** Drizzle/Neon
> import anywhere for this feature. R2 and R4 below carry this as the built decision;
> the original `menu_item`/DB-route paths are marked SUPERSEDED. The promotions route
> selection was finalized to a two-step home-flag → active-fallback with fetch
> timeouts + `acf.imagen` flyer resolution opened in a lightbox (see R3, R12 below).

## R1 — Rendering mode for `/`

**Decision**: Keep `routeRules['/'] = { isr: 3600 }` (already present in `nuxt.config.ts`); no change.
**Rationale**: `docs/business/rendering-strategy.md` §2 fixes `/` at ISR 3600 (WordPress-driven content that changes rarely; long revalidation). The constitution (Article V) defers per-route mode to that doc.
**Alternatives rejected**: SSR every request (loses edge cache, fails Lighthouse/4G budget); `isr: 60` (unnecessary — home content is not as volatile as `/promociones`).

## R2 — How dynamic content reaches the page (UPDATED 2026-06-19)

**Decision (built)**: One thin Nitro route for the single live source, plus two static fixtures:
- `GET /api/v1/content/promotions` — fetches the WordPress `promociones` endpoint (with 4s/3s timeouts), validates with Zod, applies the two-step selection (home-flag → active fallback, cap 3 newest), resolves each `acf.imagen` media ID to a flyer URL, returns `{ promotions, ok }`. Consumed via `usePromotions` → `useFetch`.
- Featured dishes — a **static committed fixture** consumed via `useFeaturedDishes` (route-compatible `{ dishes, ok, pending }`; no fetch, no DB). NOT a Nitro/DB route as built.
- Reviews — a static committed fixture (no route).

**Rationale**: The promotions route keeps validation/error-handling out of Vue components and satisfies Gate III.2 (server-side, cached), VI.1 (validate before returning), XII.1 (centralized error handling + documented fallback) and V.3 (source separation). Featured dishes being a static fixture (rather than a DB route) is a deliberate KISS simplification (Gate X): no live dependency, no Drizzle/Neon anywhere, and a drop-in swap path via the route-compatible composable. The promotions route is Nitro-cached within the ISR window.
**Alternatives rejected**:
- A single bundled `GET /api/v1/content/home` route fetching both WordPress and the DB — **rejected**: merges WordPress and Neon in one fetch layer (violates the data-source-separation gate); one source's outage would couple to the other's response.
- `useFetch('https://cms.sumo.com.mx/...')` / `db.select(...)` directly in the page — bypasses validation, centralized error handling, and (for the DB) the no-DB-import-under-`app/` gate; flagged anti-patterns in rendering-strategy.md §6.
- A WPGraphQL query — constitution Article III says REST only.

> **SUPERSEDED (first pass):** the original R2 specified one `GET /api/v1/content/home`
> route fetching three WordPress collections (`menu_item`, `promociones`, `reviews`) into
> a single `HomeContent` bundle consumed by one `useHomeContent` composable. That model is
> replaced because dishes are DB-backed (not WordPress) and reviews are static.

## R3 — "Top 3" promotions selection & ordering (built)

**Decision (built)**: Selection happens server-side in `promotions.get.ts` — two-step: PRIMARY `?activa=1&home=1` (active + editor home-flag) capped to the 3 newest (publish-date desc); FALLBACK `?activa=1` (all active) capped to 3 newest only when PRIMARY is empty; both empty → section hides. Any `tipo` (`all`/`ayce`/`express`) is admitted. `select-promotions.ts` remains as a pure, page-side **defensive** filter (`active`, sort desc, slice 3) even though the route already selects.
**Rationale**: The client added an `acf.home` "show on homepage" flag, making it the explicit selection signal (better than inferring from `tipo`); the active fallback guarantees the home still shows promos when none are flagged. Admitting Express is safe because Express is rendered via a decorative type-bar (blue) + the editor `acf.color` badge — it does not force blue onto a non-Express surface (the badge color is editor-controlled). Pure defensive function → unit-testable in isolation (Gate IV).
**Alternatives rejected**: Filtering to `tipo ∈ {all, ayce}` (superseded — the `home` flag is the real selector and Express is now safely admitted); requiring a manual ordering field (publish-date-desc is the defensible default; not needed).

## R4 — Featured dishes source (BUILT: static fixture)

**Decision (built)**: Featured dishes (and any drinks/bebidas) are served from a **static fixture** committed in the repo (`app/features/homepage/data/featured-dishes.ts`, typed `FeaturedDish[]`), consumed via `useFeaturedDishes()` which returns `{ dishes, ok, pending }` (`ok` true, `pending` false). No DB read, no Drizzle/Neon import anywhere. Empty fixture → rail hides. Current fixture dishes have `imageUrl: null` (neutral placeholder).
**Rationale**: A static fixture removes a second live dependency from a public ISR page while still rendering the rail. The composable's `{ dishes, ok, pending }` contract is route-compatible, so swapping to a real data source (e.g. a Nitro route) later is drop-in with no rail/page change (KISS, Gate X; Gate V.2 holds trivially since nothing imports a DB client). A `// TODO:` marker on both the fixture and the composable records the future swap.
**Alternatives rejected**: A DB-backed Drizzle route now (the data is not yet modeled/seeded; deferred without blocking the page — built as a fixture instead); importing Drizzle into the page/composable (violates Gate V.2); a WordPress `menu_item` CPT (superseded — see below).

> **SUPERSEDED (first pass):** the original R4 read featured dishes from a WordPress
> `menu_item` CPT filtered by a `featured` ACF flag.
> **SUPERSEDED (2026-06-19 clarification):** a read-only Drizzle query on Neon via a
> `GET /api/v1/content/featured-dishes` Nitro route. Neither was built — dishes are a
> static fixture (above).

## R5 — Google reviews source (UPDATED 2026-06-19)

**Decision**: Reviews are a **static/hardcoded fixture committed in the repo** (a typed code constant or a local JSON, e.g. `app/features/homepage/data/reviews.ts`/`reviews.json`). They are NOT fetched from WordPress, NOT from the DB, NOT from the Google Places API. The reviews section renders them normally. The fixture is typed against the `Review` interface so a later feature can swap it for a real source without changing the section's component contract.
**Rationale**: Confirmed by the human on 2026-06-19 — reviews are static "for now." Avoids a third live dependency, an API key on a public ISR page, and any fetch/error-handling for a section whose content is currently fixed (KISS, Gate X). No graceful-degradation path is needed because there is no fetch to fail.
**Alternatives rejected**: Direct Google Places API call (exposes/needs a key, adds latency, second failure mode); surfacing reviews via WordPress (superseded — see below); a DB table for reviews (over-engineering for static content).

> **SUPERSEDED (first pass):** the original R5 sourced reviews from WordPress (client-curated
> Google reviews) through the bundled content route. Replaced — reviews are now a static fixture.
> Open question #3 below (the reviews CPT/endpoint shape) is therefore moot and removed.

## R6 — Opening the reservation modal (feature 014 not built yet)

**Decision**: A cross-feature composable `app/composables/useReservationModal.ts` exposing `openReservation()` and reactive `isOpen` state (e.g. via `useState`). Feature 014 will mount the actual modal subscribing to this state. The homepage CTA calls `openReservation()`; today it flips state with no mounted consumer → no-op-safe (no error).
**Rationale**: Lifts the only cross-feature concern to `app/composables/` (Gate I.2), avoids importing from a non-existent feature folder, and is the single concrete abstraction needed now (Gate X — no speculative layering).
**Alternatives rejected**: Hard-coding a prefilled WhatsApp link on home (the prototype did this, but production routes through Twilio per `features.md §5`; would create dead code to rip out in 014); importing from `app/features/reservations/` (doesn't exist; cross-feature import forbidden).

## R7 — Reused design-system primitives (feature 007)

**Decision**: Reuse, unmodified:
- `Card` (`accent: 'ayce' | 'express'`, `tone`, `shadowSize`) — type selector cards + content cards.
- `Sticker` (`tone: 'yellow' | 'pink'`, `rotate`) — hero price sticker, promo badges.
- `Kicker` (`tone: 'ink' | 'accent'`, `rotate`) — hero kicker.
- `Button` (`variant: 'primary' | 'ink' | 'ghost'`) — CTAs.
- `Marquee` (`tone: 'ink' | 'yellow'`) — the global `SiteMarquee` band below the nav (already respects `prefers-reduced-motion`).
- `Chip`, `Nav` — as needed.
- `Lightbox` (NEW, `app/components/ui/Lightbox.vue`) — reusable modal for promo flyers (teleported dialog, Esc/backdrop close, focus management, scroll lock).
**Rationale**: Article I/VII — DRY and Storybook-proven primitives. The `--accent` swap is built into `Card` via the `scope-express` class; Express blue is confined to the Express type card + the express type-bar on promos (the promo badge color is the independent editor `acf.color`). The flyer lightbox is a genuine new reusable primitive (also used by the promotions page 012), not a duplicate.
**Alternatives rejected**: New bespoke hero/promo primitives (duplicates existing primitives); inlining the flyer in the card (the reference design shows text-only cards opening a large flyer).

## R8 — Reduced motion

**Decision**: Marquee already pauses under `prefers-reduced-motion` (verified in `Marquee.vue`). Section entrance/bounce animations use a reveal that animates only `transform` and is fully disabled under reduced motion (per `overview.md §3`); content is readable without motion.
**Rationale**: FR-022 / SC-008 / Article VII. Animate `transform` only (never `opacity` from 0) so content is never hidden when motion is off.
**Alternatives rejected**: Opacity-based reveals (content invisible if JS/observer fails or motion disabled).

## R9 — i18n

**Decision**: Add a `home.*` namespace to `i18n/locales/es.json` (default) and `en.json` for all static homepage copy (headline, kicker, section titles, CTA labels, fallback strings). Editorial content stays bilingual from WordPress (`*_es`/`*_en`), with ES fallback when the active-language string is missing.
**Rationale**: Article VII/`features.md §0` — every UI string bilingual, ES default, toggled via existing nav. Existing config: `defaultLocale: 'es'`, `strategy: 'prefix_except_default'`, browser detection off.
**Alternatives rejected**: Hard-coded Spanish strings in components (untranslatable, violates i18n rule).

## R10 — Testing & Storybook conventions (feature 008)

**Decision**: Co-locate `Component.vue ↔ Component.spec.ts` (happy-dom) and `Component.stories.ts` for every new component; co-locate `usePromotions.spec.ts` and `useFeaturedDishes.spec.ts`; the promotions server route is tested (node env) with the WordPress mock centralized in `tests/mocks/wordpress.ts`; a `home-degradation.spec.ts` covers the WordPress-outage path. No DB/Drizzle mock is needed (dishes are a static fixture). Tailwind-token-only — no `<style>` blocks, no inline hex / arbitrary color values (the no-inline-hex grep must stay clean).
**Rationale**: Conventions established in feature 008 (`docs/harness/conventions.md`, `verification.md`); Article IV + VII; CHECKPOINTS C4 now requires `app/` coverage.
**Alternatives rejected**: `.test.ts` suffix (legacy; new tests use `.spec.ts`); skipping stories (component without a story MUST NOT merge).

## R11 — Brand copy & palette guardrails

**Decision**: Use "All You Can Eat" (never "Buffet") and "Estilo americano-japonés" (never "comida japonesa"). Use the design tokens shipped in feature 007 (`--orange`/`--blue` etc.); do NOT re-decide the palette here.
**Rationale**: `features.md §0`, `overview.md §2`. The orange/blue official-vs-prototype value conflict (overview.md §2) is owned by feature 007's tokens (already shipped) — not re-opened by the homepage.
**Alternatives rejected**: Reintroducing prototype hex values inline (violates no-inline-hex rule and Gate VII.1).

## R12 — Visual language, layout shell & promo/lightbox behavior (built)

**Decision (built)**: "Mercado Pop" — cream `--bg`, 22px diagonal stripes + a yellow radial sun on the hero, an ink full-bleed marquee band below the nav (`SiteMarquee`, orange ✺ separator, i18n phrases, adaptive repetition), Bricolage Grotesque + Hanken Grotesk fonts, official SUMO logos in `public/brand/` (hero frame transparent, nav/footer logos bare). Global shell components live under `app/components/layout/` (`SiteHeader` with a Reservar button, `SiteFooter` ink band without one, `SiteLogo`, `SiteMarquee`). Footer social links are the official Instagram/Facebook/TikTok URLs (WhatsApp removed from social; Contacto links to `/contacto`). Promo badge color = `acf.color`; a decorative type-bar = `acf.tipo` (express→blue/ayce→orange/all→ink); the `acf.imagen` flyer opens in `UiLightbox` (not inline). Tailwind-token-only, `hover:` desktop-only.
**Rationale**: Matches the client's reference design and `docs/harness/structure.md` (shell under `app/components/layout/`, styling rule: tokens only, no `<style>`/inline hex/arbitrary values). Separating the editor-set badge color from the type-bar lets editors pick any badge color while preserving the per-type visual cue. The lightbox keeps cards compact and readable while still exposing the full flyer.
**Alternatives rejected**: Inline flyers (cluttered cards); a black hero frame fill (the official logo carries its own outline); `<style>` blocks / inline hex (violates the styling rule).

## Open questions for the human (non-blocking; resolved/defaults applied)

1. Final hero/ambiance + dish photography is pending — dishes render the neutral "SUMO" placeholder until real images are supplied.

> Resolved: featured dishes source — **static fixture** as built (R4); reviews source — static fixture (R5);
> promotions selection — two-step home-flag → active fallback (R3); visual language + lightbox — R12.
