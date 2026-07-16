# Quickstart & Verification: Menu Image Refresh & Express Branding

## Prerequisites

- Branch `feat/024-menu-image-refresh-express-branding` checked out.
- Node deps installed; dev server runnable.
- The 6 client source assets already copied into `assets/source/` in this feature folder.
- A local/dev database reachable for reseeding (`DATABASE_URL` set).

## Implementation order (high level)

1. **Kids AYCE collage (US1)**:
   - Produce the composite `webp` from the 3 source photos (research.md R2); save to
     `assets/output/all_you_can_eat_kids.webp`.
   - Update `server/db/seeds/kidsMenu.ts`: set `fileName: 'menu/kids/all_you_can_eat_kids.webp'`
     for the `nameEs: 'All You Can Eat Kids'` item.
   - Reseed the `kids` category so the DB row picks up the new `fileName`.
   - Add the `--src` flag to `scripts/replace-blob-images.ts` (research.md R3); dry-run, review
     the plan output, then `--apply` to upload the asset to Vercel Blob at the exact pathname.
2. **Sitewide watermark (US2)**:
   - Re-export `assets/source/Fondo webp.webp` at pre-baked ~10–15% opacity, compressed, saved
     to `public/patterns/sumo-watermark.webp`.
   - Add the `watermark` `backgroundImage` token in `tailwind.config.ts`.
   - Apply the token as a second background layer on `app/layouts/default.vue`'s root wrapper
     (alongside the existing `bg-bg`).
3. **Express map branding (US3)**:
   - Convert/optimize `assets/source/Logo .webp` (vertical lockup) to
     `public/brand/sumo-express-vertical.{svg,webp}`, used unmodified.
   - Edit `makeMarkerElement(color)` in `app/composables/maps/adapters/mapboxAdapter.ts` to
     branch the `img.src` by `color` (blue → Express asset).
   - Export `makeMarkerElement` (or an equivalent testable seam) for direct unit testing.
4. Add/extend tests:
   - `app/composables/maps/adapters/mapboxAdapter.spec.ts` (new) — asserts Express vs AYCE
     marker `img.src` differ.
   - Extend any layout-level test/story covering `app/layouts/default.vue` if one exists, or add
     a Storybook story/viewport demonstrating the watermark at mobile + desktop breakpoints.
   - Extend `MapView.stories.ts` / `BranchCard.stories.ts` fixtures if useful to visually
     demonstrate an Express-branded pin.
5. Run gates: Biome lint + format, `vue-tsc --noEmit`, Vitest, Storybook build.

## Verification checklist (maps to Success Criteria)

- [ ] **SC-001**: On `/menu`, switch to the Kids view — "All You Can Eat Kids" shows the new
      composite image (previously blank/no-image).
- [ ] **SC-002**: Visit `/`, `/menu`, `/promotions`, `/branches` (or `/sucursales`), `/contact`
      — the watermark pattern is visible at low opacity on every one.
- [ ] **SC-003**: Spot-check text contrast on at least one section per page after the watermark
      ships — no visible readability regression versus pre-feature screenshots.
- [ ] **SC-004**: On the branch map, every Express-type pin shows the new Express mark; every
      AYCE-type pin is pixel-identical to before.
- [ ] **SC-005**: Lighthouse run on `/` (and `/menu`, `/sucursales`) stays ≥90 after the new
      collage, watermark, and Express marker assets ship.
- [ ] Global header/footer `SiteLogo.vue` is untouched — `git diff` shows no changes to it.
- [ ] `menu-sets.ts` and menu category/chip logic are untouched — `git diff` shows no changes
      to them (explicitly out of scope per spec.md).
