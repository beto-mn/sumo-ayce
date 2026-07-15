# Research — Feature 022

## R1 — embla-carousel-vue in Nuxt 4 / Vue 3 (SSR)

**Decision**: Add `embla-carousel-vue` as a runtime dependency and initialize embla **client-side only**.

**Rationale**: Embla is headless, ~small, framework-native (`emblaCarouselVue` composable returns `[emblaRef, emblaApi]`), and provides drag physics, snap, pointer/keyboard nav, and event hooks for dot/arrow sync. Building an equivalent accessible carousel by hand exceeds the Article X 100-line threshold.

**Integration notes**:
- Embla touches the DOM; guard init so it runs after hydration (`onMounted` / `import.meta.client`). The slide markup renders server-side (SSR-safe HTML: a scroll container with slides), embla enhances it on mount. This preserves the ISR-rendered HTML and progressively enhances navigation.
- Dots/arrows: derive from `emblaApi.scrollSnapList()` + `on('select', …)`; disable arrows at bounds when not looping.
- Reduced motion: read `window.matchMedia('(prefers-reduced-motion: reduce)')`; if set, do NOT start autoplay (autoplay is optional/off by default).
- Single slide: hide/inert dots + arrows.
- Testing: in happy-dom, embla's DOM measurement may be inert; component specs assert rendered slide content, `<picture>` sources, badge color, and alt text rather than embla scroll internals. Keep embla logic thin and behind a guard so specs mount cleanly.

**Alternatives considered**: hand-rolled CSS scroll-snap (rejected — no drag momentum/robust a11y/arrow sync); `swiper` (heavier, more opinionated styling to override for Mercado Pop).

## R2 — TTF → WOFF2 conversion for Graphik Super

**Decision**: Convert once at setup and commit the `.woff2`. Do not ship the `.ttf`.

**Command (documented; run once)**:
```bash
# via fonttools (pip install fonttools brotli):
fonttools ttLib.woff2 compress -o public/fonts/graphik-super.woff2 \
  "/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Fonts/Graphik-Super.ttf"
# or: woff2_compress Graphik-Super.ttf  (Google woff2 CLI), then move/rename.
```

**Rationale**: woff2 is the smallest widely-supported web font format; a single self-hosted latin file matches the existing Titan One setup. `@nuxt/fonts` handles Bricolage/Hanken; the hero font stays a plain self-hosted `@font-face` (as Titan One is today) so the logo-style stroke rendering is unchanged.

**Notes**: add a `GRAPHIK-SUPER-LICENSE.txt` note file (client-licensed, not OFL). Remove `titan-one-regular.woff2` + `OFL-TitanOne.txt` — no remaining consumer (only the hero used Titan One). Keep `font-display: swap`; preload the woff2 (LCP text). Verify the ttf has the Latin glyphs needed for "ALL YOU CAN EAT".

## R3 — HTML entity decoding (server-side, dependency-free)

**Decision**: Small util `server/api/v1/content/html-entities.ts` decoding numeric (`&#215;`, `&#x2715;`, `&#8211;`) and a fixed set of named entities (`&amp; &lt; &gt; &quot; &#039;/&apos; &nbsp; &ndash; &mdash; &times; &hellip;`).

**Rationale**: WordPress `title.rendered` returns HTML-encoded text (e.g. `2&#215;1`). Titles are short and use a limited entity set; a full HTML parser is overkill (KISS, no new dep). Decode numeric entities via `String.fromCodePoint` + a small named-entity map; strip stray tags defensively.

**Alternatives considered**: `he`/`entities` npm packages (rejected — new dep for a trivial, bounded need); `DOMParser` (not available in Nitro server runtime without a DOM shim).

## R4 — Three responsive images with desktop fallback (delivered: batched)

**Decision (as delivered)**: Resolve ALL distinct media IDs across every promo in ONE batched
request (`/wp/v2/media?include=<ids>&per_page=100`) into a `Map<id, source_url>`, then project each
promo: `imageDesktopUrl` from the desktop ID; `imageTabletUrl`/`imageMovilUrl` fall back to the
desktop URL when their ID is null or unresolved; desktop itself falls back to whichever size DID
resolve. A promo with any configured image ID is kept; a promo with no image ID at all is dropped.

**Rationale**: The three fields may all point to the same placeholder ID; a single batched call
replaces ~15 fragile parallel `/media/{id}` calls and guarantees `<picture>` never emits a broken
source. The `<picture>` uses `<source media="(max-width:520px)" srcset=movil>`,
`<source media="(max-width:880px)" srcset=tablet>`, `<img src=desktop>` (baseline) with
`alt = decoded title`.

## R6 — Type pill + type-coloured nav (delivered)

**Decision**: Each slide overlays a **type pill top-left** (`promo.type`: AYCE orange / Express blue
/ Ambos orange→blue gradient, always text-labelled for a11y) alongside the top-right colour badge;
the carousel's prev/next arrows and active dot follow the **active slide's** type colour (reactive
to `selectedIndex`). **Rationale**: distinguishes the branch scope of each promo and keeps the
carousel chrome on-brand per slide; label-plus-colour keeps it accessible (never colour-only).

## R7 — Selection: single all-active query, no cap (delivered)

**Decision**: BOTH the homepage and the promotions page query `?activa=1&per_page=100` (all active,
newest-first, NO cap). **Rationale**: no promo is home-flagged and WordPress served a stale/broken
cache for `home=1`; unifying on `activa=1` keeps the two surfaces consistent and correct. Home-flag
curation + the former homepage 3-cap are deferred to a future feature.

## R5 — Shared carousel placement (Article I)

**Decision**: `app/components/ui/PromotionsCarousel.vue` (`Ui`-prefixed). Props: `promotions: Promotion[]`, optional display mode/cap. Homepage `HomePromotions.vue` and the promotions page/feature both consume it; `PromotionCard.vue` stays in `ui/` as the per-slide renderer.

**Rationale**: A component used by two features MUST be lifted to `app/components/ui/` (Article I). This removes the current `PromotionsGrid` duplication and the cross-feature-import risk.
