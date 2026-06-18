# Research: Library versions & compatibility for feature 007

**Date**: 2026-06-17
**Stack baseline**: Node 24.12.0 (Vercel runtime Node 20+), pnpm 10.27.0, Nuxt ^4.4.6, Vue ^3.5.34, vue-router ^5.0.7, TypeScript via vue-tsc 3.3.1, Storybook ^10.4.1, Vitest ^4.1.7, @types/node ^25.9.1, Biome ^2.4.15.

All version data sourced from the authoritative npm registry endpoint `https://registry.npmjs.org/<pkg>` on 2026-06-17.

## Summary table

| Library | Current pin in spec | Latest stable on npm | Recommended pin | Nuxt 4 / Vue 3.5 OK? | Notes |
|---|---|---|---|---|---|
| `@nuxtjs/tailwindcss` | (TBD — spec picked "v3 LTS") | `6.14.0` (published 2025-04-27) | `^6.14.0` | Yes (works on Nuxt 4) | Ships `tailwindcss ~3.4.17` as direct dep. The v7 branch (Tailwind v4) is **beta only** (`7.0.0-beta.0`, May 2025) and has not been promoted to `latest`. v3 is in LTS (`tailwindcss` dist-tag `v3-lts: 3.4.19`). Spec direction is correct — keep v6 module + Tailwind v3 LTS. |
| `@nuxtjs/i18n` | (TBD) | `10.4.0` (published 2026-05-21) | `^10.4.0` | Yes (depends on `@nuxt/kit ^4.4.4`, `vue-router ^5.0.4`) | The v10 line IS the Nuxt 4 line. v9 was the Nuxt 3 line (still maintained via `9x` dist-tag at 9.5.6). Internally configures Vue I18n v11. `strategy: 'prefix_except_default'` and `vueI18n` config option are both still valid in v10. Requires Node ≥ 20.11.1 — OK. |
| `mapbox-gl` | (TBD) | `3.25.0` (published 2026-06-17) | `^3.25.0` | N/A (framework-agnostic) | License: **proprietary Mapbox TOS** (not OSS). npm registry incorrectly reports `SEE LICENSE IN LICENSE.txt`; actual `LICENSE.txt` requires an active Mapbox account and prohibits independent commercial deployment. v1.13 and earlier were BSD-3-Clause; v2 relicensed. v3 retains the same Mapbox TOS as v2. Acceptable for SUMO commercial use only if we hold a Mapbox account with a paid plan or stay under free-tier limits. **Action**: confirm with the client before adding billing-bound deps. |
| `@nuxt/fonts` | (TBD) | `0.14.0` (published 2026-02-14) | `^0.14.0` | Yes (depends on `@nuxt/kit ^4.2.2`) | Still pre-1.0 but actively maintained. Providers shipped out of the box: `google`, `bunny`, `fontshare`, `fontsource`, `adobe`, `npm`, `local`. **Both target fonts confirmed available via `google` provider at requested weights**: Bricolage Grotesque (200–800, includes 800), Hanken Grotesk (100–900, includes 400/600/700). Source: Fontsource API. |

## Cross-cutting notes

### Why `vue-router 5.x` is not a typo
This was the most suspicious pin in the brief. Confirmed it is genuine and current:
- Registry dist-tags: `latest: 5.1.0`, `legacy: 3.6.5`, `next: 4.0.13`.
- 5.1.0 published 2025-12-11, 5.0.0 published 2025-10-14 — Vue Router jumped from the 4.x line to 5.x in late 2025, folding `unplugin-vue-router` into core.
- `vue-router@5.1.0` peerDependencies: `vue: ^3.5.34`, `vite: ^7 || ^8`, `pinia: ^3.0.4`, `@pinia/colada: >=0.21.2`, `@vue/compiler-sfc: ^3.5.34`.
- `@nuxtjs/i18n@10.4.0` itself depends on `vue-router ^5.0.4`, confirming this is the Nuxt 4 line.
- **Recommendation**: keep `^5.0.7`. Optionally bump to `^5.1.0` to align with the current minor.

## Compatibility risks & resolutions

### 1. Tailwind v3 vs v4 — keep v3 LTS (matches spec direction)
- `@nuxtjs/tailwindcss` stable on `latest` is **6.14.0**, which pins `tailwindcss ~3.4.17`.
- A v7 branch targeting Tailwind v4 exists but only as `7.0.0-beta.0` (May 2025). No promotion to `latest` for over a year — treat as not production-ready.
- Tailwind core publishes a dedicated `v3-lts` dist-tag (`3.4.19`), explicitly signalling v3 is in long-term support — exactly the scenario this spec was designed for.
- **Concrete recommendation**: pin `@nuxtjs/tailwindcss ^6.14.0` with `tailwindcss ^3.4.19` (or pull via the module). Defer v4 migration until `@nuxtjs/tailwindcss@7.x` reaches `latest` dist-tag. The spec's reasoning ("module maturity on Nuxt 4") is still correct as of 2026-06-17.
- Do **not** swap to `@nuxt/ui` solely to chase v4 — that introduces a much larger component-library coupling that wasn't scoped.

### 2. Mapbox GL license — flag for client confirmation
- npm reports `SEE LICENSE IN LICENSE.txt`. The actual license is the Mapbox TOS (proprietary), not BSD. Mapbox relicensed at v2.0 and v3 keeps the same model.
- Usage requires a Mapbox account; runtime usage data is collected; modifications to billing/accounting code paths are prohibited.
- Free tier covers limited monthly map loads. For a commercial restaurant site (feature 012, branch finder) this is usually fine but **not** automatically license-clean.
- **Recommendation**: install `mapbox-gl ^3.25.0` and document the Mapbox account requirement in feature 012's research. Get explicit client sign-off before shipping to production. If commercial terms are blocking, the standard OSS alternative is `maplibre-gl` (BSD-3-Clause fork of mapbox-gl v1.13 with continued development) — drop-in API compatible for most use cases.

### 3. Expected `pnpm install` peer warnings
With Node 24.12.0 + Nuxt ^4.4.6 + Vue ^3.5.34 + vue-router ^5.0.7:
- `@nuxtjs/i18n@10.4.0` itself has no peerDependencies block (uses direct deps). Clean.
- `@nuxtjs/tailwindcss@6.14.0` has no peerDependencies block. Clean.
- `@nuxt/fonts@0.14.0` has no peerDependencies block. Clean.
- `mapbox-gl@3.25.0` has no peerDependencies block. Clean.
- `vue-router@5.1.0` peer-requires `vite ^7 || ^8`. Nuxt 4.4.x ships Vite 7, so OK. If a transitive dep drags in Vite 6, expect a warning.
- `@storybook/vue3-vite@10.4.1` accepts Vite `^5 || ^6 || ^7 || ^8` — OK with Nuxt 4's Vite 7.

No blocking peer conflicts expected. Worst case is a single warning if vue-router 5.x is bumped before Nuxt updates its internal Vite.

### 4. `@nuxt/fonts` is still 0.x
Not a blocker — it's the official Nuxt module, actively maintained (0.14.0 released 2026-02-14, 0.12.x line in Q4 2025), and used in production by many Nuxt 4 sites. Just be aware breaking changes can ship on minor bumps until 1.0; pin tightly (`^0.14.0`, not `^0`) and review release notes on bumps.

## Final recommended pins

```jsonc
{
  "dependencies": {
    "@nuxtjs/i18n": "^10.4.0",
    "@nuxt/fonts": "^0.14.0",
    "mapbox-gl": "^3.25.0"
  },
  "devDependencies": {
    "@nuxtjs/tailwindcss": "^6.14.0",
    "tailwindcss": "^3.4.19"
  }
}
```

`vue-router ^5.0.7` is fine as-is; optionally bump to `^5.1.0`.

## Sources
- npm registry: `registry.npmjs.org/{@nuxtjs/tailwindcss,@nuxtjs/i18n,mapbox-gl,@nuxt/fonts,vue-router,tailwindcss,vue-i18n,@storybook/vue3-vite}` — fetched 2026-06-17.
- GitHub: `nuxt-modules/tailwindcss` README + releases, `mapbox/mapbox-gl-js/LICENSE.txt`, `nuxt/fonts` README, `vuejs/router` release notes for v5.0.0.
- Docs: `i18n.nuxtjs.org/docs/api/options`, `i18n.nuxtjs.org/docs/getting-started`.
- Fontsource API: `api.fontsource.org/v1/fonts/{bricolage-grotesque,hanken-grotesk}` for weight availability.
