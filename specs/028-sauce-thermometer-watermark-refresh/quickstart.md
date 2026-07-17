# Quickstart: Sauce Heat Thermometer Graphic + Sitewide Watermark Asset Refresh

> **⚠️ AMENDED 2026-07-17**: Part B's interactive-picker steps below describe
> the ORIGINAL `df3a13c` implementation, since reversed (see `spec.md`
> "Revision 2026-07-17"). After the Phase 7 revert in `tasks.md`, Wings/Boneless
> dishes must show NO interactive sauce control — only the thermometer graphic
> and descriptive text. Part A steps below remain fully valid.

## Part A — Verify the watermark refresh

1. Place the optimized new artwork at `public/patterns/sumo-watermark.webp`
   (replacing the existing file in place — same path).
2. Confirm `tailwind.config.ts`'s `backgroundImage.watermark` token still points
   at `url('/patterns/sumo-watermark.webp')` (no path change needed) and add the
   explicit `background-size` sizing (research.md R1) alongside the existing
   `bg-watermark bg-repeat` utility usage in `app/layouts/default.vue`.
3. Run `npm run dev`, load `/`, `/menu`, `/sucursales` — visually confirm:
   - The new artwork (not the old lockups) is visible in the background.
   - The tile's on-screen size/repeat frequency looks the same as before (no
     sudden "zoomed in/out" pattern).
   - Text and cards remain fully legible (opacity baseline unchanged).
4. Run `npx vitest run app/layouts/default.spec.ts` — the existing contract
   (`bg-bg`, `bg-watermark`, `bg-repeat` classes present) MUST still pass
   unmodified.

## Part B — Verify sauce selection + heat thermometer

1. Apply migration `0032_add_menu_item_option_group_max_selections.sql`
   (additive; coordinate with the human before running against the Neon
   production database, per existing project convention).
2. Extend `server/db/seeds/menuItemOptions.ts`'s `DISH_OPTIONS_SEED` with the 8
   Wings/Boneless dishes (data-model.md table), each with a `sauce` option group
   sourced from the 12 `sauces` rows, and the correct `maxSelections` per dish.
   Re-run the seed script.
3. Place the thermometer asset at
   `public/menu/thermometer/sauce-heat-thermometer.webp` (optimized webp; the
   client's placeholder reference for now, per FR-012 a drop-in replacement is
   expected later).
4. Extend `MenuSaucePicker.vue` with the additive `maxSelections` prop
   (data-model.md) and write/extend `MenuSaucePicker.spec.ts` for the new
   multi-select branch BEFORE writing the implementation (Article IV).
5. Extend `MenuDishGrid.vue` to render the thermometer graphic once inside the
   `wings` category section (alongside the existing `category-note` block), and
   pass `group.maxSelections` through `MenuDishCard.vue` to `MenuSaucePicker`.
6. Run `npm run dev`, load `/menu`:
   - AYCE and Express → "Alitas & Boneless" section shows the thermometer
     graphic once, and each dish (Alitas, Boneless) shows a working single-sauce
     picker (12 sauces, exactly one selectable).
   - AYCE → À la Carta modality → the 4 Wings/Boneless packages each show a
     working bounded multi-select picker (2 or 3 sauces selectable, extra clicks
     beyond the limit are a no-op).
7. Run `npx vitest run` across the touched files
   (`MenuSaucePicker.spec.ts`, `MenuDishCard.spec.ts`, `MenuDishGrid.spec.ts`,
   `menu-queries.test.ts`) — all pass, including the pre-existing Ramen XL/Vaso
   Sumo single-select assertions (unaffected by the additive `maxSelections`
   default of `1`).
8. Run Storybook (`npm run storybook`) and confirm `MenuSaucePicker.stories.ts`'s
   new `MultiSelect` story renders correctly at mobile and desktop viewports.
