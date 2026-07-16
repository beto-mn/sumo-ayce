# Phase 0 Research: Menu Image Refresh & Express Branding

All three PART-level scope decisions (collage composition, sitewide watermark scope, map-only
logo scope) were pre-confirmed by the client and are fixed in `spec.md`. This phase resolves
the remaining **implementation-level** unknowns identified while reading the current codebase.

## R1 — Kids AYCE collage: blob pathname assignment

- **Decision**: Assign the new pathname `menu/kids/all_you_can_eat_kids.webp` to the "All You
  Can Eat Kids" item's `fileName` field in `server/db/seeds/kidsMenu.ts` (currently `null`),
  following the same `menu/kids/<slug>.webp` convention already used by the other 6 Kids items
  (`menu/kids/kid_burger.webp`, `menu/kids/sushi_kids.webp`, etc.).
- **Rationale**: Consistent with the existing naming convention in the same seed file; no new
  pattern introduced.
- **Sequencing implication**: `scripts/replace-blob-images.ts` only matches DB rows whose
  `fileName` is **already non-null** (`if (!r.file) continue`). Because this item's `fileName`
  is `null` today, the seed change MUST land and be re-applied to the database (reseed) BEFORE
  the upload script runs — otherwise the script has no target pathname to write to. Order:
  (1) edit `kidsMenu.ts` with the new `fileName`, (2) reseed `kids` category, (3) run the
  upload script (dry-run, then `--apply`).

## R2 — Composite/collage image production (no compositing library today)

- **Finding**: The project has no image-compositing dependency (`sharp`, `canvas`, etc.) in
  `package.json`, and Article X (KISS) forbids adding a library unless it saves 100+ lines or
  is otherwise infeasible by hand.
- **Decision**: Produce the composite as a **one-off, non-runtime asset-generation step** —
  the same category of work as `scripts/replace-blob-images.ts` itself (a one-off ops script,
  not a permanent project dependency). Use an ephemeral, one-time invocation of an image tool
  (e.g. `npx sharp-cli` or an equivalent no-install-footprint tool) to crop/arrange the 3
  source photos into a single grid/collage `webp`, OR produce it with a design tool outside
  the repo. Either way, **the compositing tool itself is NOT added to `package.json`** — only
  the resulting static `webp` file is a deliverable of this feature.
- **Deliverable location**: The produced composite is saved to
  `specs/024-menu-image-refresh-express-branding/assets/output/all_you_can_eat_kids.webp`
  for traceability, then uploaded to Vercel Blob at the pathname from R1. It is not committed
  anywhere else in the repo (menu images live in Blob storage only, matching how every other
  menu item image is served).
- **Alternatives considered**: (a) Add `sharp` as a permanent dependency — rejected, violates
  Article X since this is a single one-time creative asset, not a recurring runtime need.
  (b) Pick one of the 3 photos instead of compositing — rejected, contradicts the client's
  explicit, already-settled decision (spec.md FR-002).

## R3 — Upload script adaptation

- **Finding**: `scripts/replace-blob-images.ts` hardcodes its source folder
  (`SRC = '/Users/.../wetransfer_fotos-web_2026-07-13_1959'`), which was correct for the prior
  one-off image swap but is not this feature's source folder.
- **Decision**: Add a `--src <path>` CLI flag to the existing script (falling back to the
  current hardcoded default when omitted), rather than hardcoding a second constant or forking
  a duplicate script. Run it with
  `--src specs/024-menu-image-refresh-express-branding/assets/output --apply` for this
  feature. This keeps ONE script for all future one-off asset swaps (DRY, Article I) instead
  of accumulating copies.
- **Rationale**: A single added flag is a small, targeted change to an existing one-off ops
  script — not a new upload pipeline (per the feature's explicit "do not build a new upload
  pipeline" instruction), and avoids future duplication.
- **Precondition**: After R1's reseed, the DB row for "All You Can Eat Kids" has
  `fileName = 'menu/kids/all_you_can_eat_kids.webp'`, so the script's existing
  non-null-`fileName` matching logic (unchanged) picks it up automatically once the local file
  `all_you_can_eat_kids.webp` is present in the `--src` folder and its normalized name /
  override entry resolves to `nameEs: 'All You Can Eat Kids'`.

## R4 — Sitewide watermark: layering approach

- **Finding**: `app/layouts/default.vue`'s root wrapper already sets `bg-bg` (an opaque solid
  color from `body`/layout). The homepage's `HomeHero.vue` independently sets its own
  `bg-bg bg-hero-pop` on its own section element, which is opaque and therefore fully occludes
  anything painted behind it by the layout.
- **Decision**: Add a new Tailwind `backgroundImage` token (e.g. `watermark`) in
  `tailwind.config.ts`, alongside the existing `hero-pop` token, that references a tiled
  webp asset at `public/patterns/sumo-watermark.webp`. Apply it as a **second CSS layer on the
  same element that already sets `bg-bg`** in `app/layouts/default.vue` — i.e. the opaque
  cream color and the tiled pattern are painted together on one wrapper
  (`background: url(...) repeat, rgb(var(--bg))`), not as a separate absolutely-positioned
  overlay `<div>`. This avoids new stacking-context/z-index concerns entirely.
- **Opacity**: Bake the ~10–15% opacity into the exported `webp` asset itself (pre-blended
  against transparent), rather than applying CSS `opacity` to a wrapper — CSS `opacity` on a
  container would also dim any real content painted inside it. A pre-baked low-alpha tile
  keeps the watermark subtle without touching content opacity anywhere.
- **Composition with `hero-pop` / HomeHero**: Because `HomeHero.vue` paints its own opaque
  background on its own section, the layout-level watermark is expected to be visible in the
  shared page chrome around it (header, marquee, footer, and any section that does not set its
  own opaque background) but naturally occluded within the Hero section itself, which keeps its
  existing `hero-pop` treatment untouched. This matches spec.md's Edge Cases (a page-level
  texture is not forced through every nested opaque surface) and is the simplest option that
  satisfies FR-005–FR-008 without touching `HomeHero.vue` or any other component's own
  background rules.
- **Alternatives considered**: (a) A global absolutely-positioned `<div>` overlay with CSS
  `opacity` — rejected: adds a new stacking-context layer and risks interaction with existing
  `fixed`/`sticky` elements (`SiteHeader`, `SiteMarquee`) for no benefit over baking opacity
  into the asset. (b) Force the watermark to also render inside every component with its own
  opaque background (cards, panels) — rejected: would require touching many unrelated
  components for a purely decorative concern, contradicts Article I feature-folder boundaries
  and Article X KISS.
- **Asset prep**: The source `Fondo webp.webp` (781×1056, ~93 KB) is used as the base tile; it
  MUST be re-exported at the pre-baked low opacity described above and re-compressed to keep
  the per-page performance cost negligible (target roughly 15–25 KB after alpha bake +
  compression) to protect the Lighthouse 90+ budget (Article V, SC-005).

## R5 — Express map marker: integration point

- **Finding**: `app/composables/maps/adapters/mapboxAdapter.ts`'s `makeMarkerElement(color)` is
  the exact, single place that renders per-pin brand imagery today — it currently hardcodes
  `img.src = '/brand/sumo-vertical.svg'` for both `'orange'` and `'blue'` markers; only the
  pin's background color already differs by type. This file is also the ONLY file in `app/`
  allowed to import `mapbox-gl` per `docs/business/maps-strategy.md`'s adapter-contract rule,
  so this is where the change belongs — not a new prop on the public `MapView.vue` (which must
  stay provider-agnostic).
- **Decision**: In `makeMarkerElement(color)`, swap the `img.src` to a new Express asset
  (`/brand/sumo-express-vertical.svg` or `.webp`, converted/optimized from the client's
  `Logo .webp` vertical lockup) when `color === 'blue'`; keep `/brand/sumo-vertical.svg`
  unchanged when `color === 'orange'`.
- **Horizontal logo ("Logo 2.webp") scope decision**: There is currently NO Mapbox
  `Popup`/info-window implementation on marker click — `MapView.vue` only emits a
  `marker-click` event consumed by the branch list/card UI (`BranchCard.vue`,
  `BranchList.vue`), not a map-native popup. Building a new Mapbox Popup component purely to
  host the horizontal lockup would be net-new UI surface not required by any acceptance
  scenario in spec.md (US3 only requires the pin itself to carry Express branding, legible at
  the size it's shown). **Decision: out of scope for this feature.** The horizontal lockup
  asset is retained under `specs/024-menu-image-refresh-express-branding/assets/source/` for a
  future feature that might introduce a marker popup; only the vertical lockup ships in this
  pass. This keeps the change inside the existing adapter function (Article X KISS — no new
  Popup abstraction is justified by this feature's requirements).
- **Alternatives considered**: (a) Build a Mapbox Popup now to also use the horizontal
  logo — rejected per Article X (no concrete second use case in this feature beyond the pin
  itself; would add complexity spec.md doesn't ask for). (b) Add a new `logoUrl` prop to the
  public `MapMarker`/`MapView` contract — rejected: violates the maps-strategy.md rule that
  per-provider marker rendering details stay inside the adapter, not the public interface.

## R6 — Testing approach for the marker-branding conditional

- **Finding**: `mapboxAdapter.ts` has no dedicated Vitest spec today (its DOM-construction
  logic is exercised only indirectly, since `MapView.spec.ts` mocks the whole adapter via
  `tests/mocks/mapbox.ts`).
- **Decision**: Add a co-located `app/composables/maps/adapters/mapboxAdapter.spec.ts` (Article
  IV — co-located tests) that exports/tests `makeMarkerElement` (or an equivalent testable
  seam) directly against jsdom, asserting the Express (`blue`) marker's `<img>` `src` differs
  from the AYCE (`orange`) marker's `src`, without touching the real `mapbox-gl` module (the
  existing centralized mock in `tests/mocks/mapbox.ts` stays the single source of `mapbox-gl`
  mocking per the project's Gate IV.6 convention).
- **Rationale**: This is the only way to assert FR-009/FR-010 (Express pins branded, AYCE pins
  unchanged) without a browser E2E test, and keeps the existing `MapView.spec.ts` focused on
  the adapter *contract* rather than pin-rendering details.
