# Quickstart — Feature 022

Consolidated feature. Ships on `feat/021-menu-experience-overhaul` (no new branch).

## Part A — Hero font (Titan One → Graphik Super)

1. Convert the client font once and commit the woff2:
   ```bash
   fonttools ttLib.woff2 compress -o public/fonts/graphik-super.woff2 \
     "/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Fonts/Graphik-Super.ttf"
   ```
   Add `public/fonts/GRAPHIK-SUPER-LICENSE.txt` (client-licensed note).
2. `app/assets/css/base.css`: replace the Titan One `@font-face` with a Graphik Super one
   (`src: url("/fonts/graphik-super.woff2") format("woff2")`, `font-display: swap`); update
   `.hero-headline { font-family: "Graphik Super", system-ui, sans-serif }`. Keep white fill
   (`--panel`), `-webkit-text-stroke` (`--ink`), paint-order, drop shadow.
3. `nuxt.config.ts`: change the preload `href` from `/fonts/titan-one-regular.woff2` to
   `/fonts/graphik-super.woff2`.
4. Delete `public/fonts/titan-one-regular.woff2` + `OFL-TitanOne.txt`.
5. Verify: hero renders in Graphik Super at 360/768/1280; look preserved; aria key unchanged;
   grep shows no `Titan` reference for the hero.

## Part B — Promotions pipeline + carousel

1. `types/wordpress.ts`: update `WpPromotionAcf` (new fields + drop removed), add `title.rendered`.
2. `types/content.ts`: `Promotion.title: string`; drop `description`/`validity`/`imageUrl`; add
   `imageDesktopUrl`/`imageTabletUrl`/`imageMovilUrl`.
3. `server/api/v1/content/html-entities.ts`: new dependency-free decode util (+ spec).
4. `server/api/v1/content/validators.ts`: rewrite `acfSchema`/`rawPromotionSchema`/`mapPromotion`/
   `ParsedPromotion` (three media IDs, decoded title). Tests first (Red).
5. `server/api/v1/content/promotions.get.ts`: batched media fetch (`/wp/v2/media?include=…`) →
   desktop/any-resolved fallback; BOTH surfaces query `?activa=1&per_page=100` (NO cap, `home=1`
   removed; `?all=1` kept for logging only); `ExternalServiceError` (WARN + 502) → empty result.
6. `npm i embla-carousel-vue` (adds to package.json dependencies).
7. `app/components/ui/PromotionsCarousel.vue` (NEW, `Ui`-prefixed): embla carousel, drag + dots +
   arrows, client-only init, reduced-motion guard; nav coloured by the active slide's `type`. + stories + spec.
8. `app/components/ui/PromotionCard.vue`: per-slide full-bleed `<picture>` (≤520 / ≤880 / desktop) +
   colour **badge top-right** (`promo.color`) + **type pill top-left** (`promo.type`), `alt = title`. Update stories + spec.
9. `app/features/homepage/components/HomePromotions.vue` (shows the "Promociones" title, no "ver
   todas" link) + `app/pages/promotions.vue`: both consume `UiPromotionsCarousel` over ALL active
   promos (no cap). Update `select-promotions`, `usePromotions` (both features), and all affected specs/stories.
10. Verify: promos render again on `/` and `/promociones`; title entity-decoded; correct image per
    breakpoint with desktop fallback; type pill + colour badge + type-coloured nav; drag/dots/arrows work.

## Part C — Contact job card

1. Add `contact.jobs.*` keys to ES + EN locale files (heading/lead/body verbatim ES; EN translated;
   phone label; `phone`=`+525584406639`, `phoneDisplay`=`+52 55 8440 6639`). Keep strict key parity.
2. `app/features/contact/components/ContactInfo.vue`: add the static job-card section
   (`data-testid="jobs-card"`) + a phone pill mirroring `whatsapp-pill` linking `wa.me/525584406639`
   (digits-only from `contact.jobs.phone`) with visible `phoneDisplay`. No form.
3. Update `ContactInfo.stories.ts` + `ContactInfo.spec.ts`.
4. Verify: exact ES copy in ES locale; EN present; phone CTA links; no form fields.

## Gates before merge

- `vue-tsc` + Biome pass; all specs pass; ES/EN key parity check passes.
- Every changed/new component has a Storybook story (Default + variants + breakpoints).
- Phase -1 gates in `plan.md` all `[x]`.
