# Storybook UI primitive story alignment

Scoped quality pass on feature `020-storybook-full-coverage`
(branch `chore/021-storybook-coverage`). No specs/features created; no
`feature_list.json` changes.

## Goal

Make hand-written demo content in UI primitive stories reflect the REAL site
instead of inventing content that drifts from it. Feature/layout stories that
render the real component were left untouched.

## Real data sourced

- Public nav link set from `app/components/layout/SiteHeader.vue`:
  home / menu / promotions / branches / contact (NO "Lealtad"/"Loyalty").
- Localized nav labels from `i18n/locales/es.json` + `en.json` (`nav.*`):
  - ES: Inicio, Menú, Promos, Sucursales, Contacto
  - EN: Home, Menu, Promotions, Branches, Contact
- Marquee phrases from `home.marquee` array (ES/EN) and the real `✺`
  orange-star separator pattern from `app/components/layout/SiteMarquee.vue`:
  - ES: Sushi ilimitado / Ramen 12 h de caldo / Teppanyaki en vivo /
    Smash burgers / $269 todos los días
  - EN: Unlimited sushi / 12-hour ramen broth / Live teppanyaki /
    Smash burgers / $269 every day
- Design tokens from `app/assets/css/tokens.css` / `tailwind.config.ts`
  (`bg-bg2`, `bg-bg`, `text-soft`, `text-ink`, `border-ink`, `border-pop`,
  `rounded-pop`, `text-orange`).

## Files changed

- `app/components/ui/Nav.stories.ts`
  - Removed the invented "Lealtad"/"Loyalty" link from every render (default
    render, LocaleES, LocaleEN).
  - Aligned the demo `#links` to the real public nav set with correct
    localized labels (added missing home/Inicio, fixed Promos vs "Promociones").
  - Kept the primitive mechanics demos intact (accent ayce/express, sticky,
    slot-driven Chips) — only the content was corrected.

- `app/components/ui/Marquee.stories.ts`
  - Default render, `InkTone`, `LocaleES`, `LocaleEN` now use the real
    `home.marquee` phrases and the `✺` orange-star separator (with
    `aria-hidden="true"`) matching `SiteMarquee.vue`, replacing invented
    phrases and the plain `★`/`✳` separators.

- `app/components/ui/MapView.stories.ts`
  - Removed inline hex colors (`#f5f0eb`, `#1A1209`, `#555`, `#ede8e3`) from
    the visual stub and fallback markup; switched to token utility classes
    (`bg-bg2`/`bg-bg`, `border-ink`, `border-pop`, `rounded-pop`, `text-soft`).
    Stub still avoids a live Mapbox token (component intentionally not rendered).

## Not changed (intentional)

- `Card`, `Chip`, `Button`, `Kicker`, `Sticker`, `Input`, `Select`,
  `Textarea`, `Lightbox` stories: generic primitive demo content is
  expected and already respects brand rules ("All You Can Eat", "Estilo
  americano-japonés") and uses only project tokens. No nav/menu/promo content
  invented. Left as-is.
- Feature/layout stories that render the real component: untouched.

## Constraints honored

- Edits confined to `app/components/ui/*.stories.ts`.
- `satisfies Meta<typeof Component>` typing and `tags: ['autodocs']` preserved.
- No Tailwind default-palette colors, no arbitrary `bg-[#...]`, no inline hex
  in the touched files.

## Verification

- `pnpm check` → exit 0 (only pre-existing biome deprecation infos, unrelated).
- `pnpm typecheck` → exit 0.
- `pnpm storybook:build` → exit 0 ("Storybook build completed successfully").

## Known issues / TODOs

None.

- Nav #logo slot now uses real SiteLogo: added `<template #logo><SiteLogo /></template>` to the meta render and the LocaleES/LocaleEN story renders in `app/components/ui/Nav.stories.ts`, replacing Nav.vue placeholder fallback. Verified: pnpm check (exit 0), pnpm typecheck (exit 0), pnpm storybook:build (exit 0).
