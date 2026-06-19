# Repository structure (canonical)

> Single source of truth for **where every file goes**. Enforced by the reviewer
> (see `.claude/agents/reviewer.md` → "Folder structure") and by `CHECKPOINTS.md` C3.
> This expands Constitution **Article I** (Code Organization & Reusability). If this
> doc and Article I ever disagree, Article I wins and this doc MUST be corrected.

## Principle: organize by **feature** (vertical slice), not by technical layer

A *feature* is a coherent unit of business functionality (homepage, menu, reservations,
loyalty, branches, staff…). Each feature owns its components, composables, data, utils
and types **in its own folder**. Pages stay thin; shared primitives are lifted out.

## Frontend tree (`app/`)

```
app/
  pages/                      # ROUTES ONLY (Nuxt file-based routing).
                              #   Thin: compose feature components. ≤100 lines of template.
                              #   e.g. index.vue (home), menu.vue, sucursales.vue
  layouts/                    # default.vue (public shell), staff.vue
  components/
    ui/                       # SHARED primitives reused across features.
                              #   Button, Card, Chip, Sticker, Kicker, Marquee, Nav, Input…
                              #   Auto-imported with the `Ui` prefix → <UiButton>, <UiNav>
    layout/                   # SHARED app shell: SiteHeader, SiteFooter, SiteLogo, SiteMarquee
  composables/                # SHARED composables used by >1 feature. e.g. useReservationModal
  features/
    <feature>/                # one folder per feature (homepage, menu, …)
      components/             # components owned by this feature (HomeHero, DishCard, PromoCard…)
      composables/            # composables owned by this feature (usePromotions, useHeroConfig…)
      data/                   # static fixtures owned by this feature (reviews, featured-dishes)
      utils/                  # pure helpers owned by this feature (select-promotions, bilingual)
      types.ts               # feature-local types (optional)
```

## Backend tree (`server/`)

```
server/
  api/v1/<feature>/           # endpoints + validators + utils for one feature
  utils/                      # CROSS-FEATURE only: db, twilio, drive, env, error-handler, logger
  db/                         # schema, migrations, client, seed
```

Shared types that cross the front/back boundary live in top-level `types/`.

## The decision rule (memorize this)

| The code is… | It goes in… |
|---|---|
| A route | `app/pages/<route>.vue` (thin) |
| Used by **>1 feature** (a primitive) | `app/components/ui/` |
| The app shell (header/footer/logo/marquee) | `app/components/layout/` |
| A composable used by **>1 feature** | `app/composables/` |
| Owned by **one feature** (component/composable/data/util/type) | `app/features/<feature>/…` |
| A server endpoint for one feature | `server/api/v1/<feature>/` |
| A cross-feature server util | `server/utils/` |

## Hard rules (reviewer rejects on violation)

- A feature MUST NOT import from another feature. Shared code is lifted to
  `components/ui/`, `composables/`, or `server/utils/`.
- A page (`app/pages/*.vue`) MUST NOT contain non-trivial inline markup — it composes
  components. Template ≤100 lines.
- A new feature MUST live entirely under `app/features/<feature>/` and
  `server/api/v1/<feature>/`. Spreading a feature across `app/components/` is prohibited.
- Shell components (header/footer/logo/marquee) live in `app/components/layout/`, NOT in
  `app/components/` root and NOT in a feature folder.
- Every UI component (in `ui/`, `layout/`, or a feature's `components/`) ships a co-located
  `<Name>.spec.ts` (Vitest) **and** `<Name>.stories.ts` (Storybook).
- Component files ≤200 lines (Constitution Article VIII).

## Styling (so it isn't re-litigated)

- **Tailwind utility classes for ALL styling.** No `<style>` blocks in `app/` components.
- **Tokens only** — use the named tokens (`bg-orange`, `text-ink`, `rounded-pop`,
  `shadow-pop`, `text-h-xl`, …). NO default-palette classes (`bg-orange-500`), NO inline
  hex outside `app/assets/css/tokens.css`, and NO arbitrary value classes
  (`bg-[#…]`, `text-[clamp(…)]`, `shadow-[…]`). If a value is missing, add it as a named
  token to `tokens.css` + `tailwind.config.ts`, then use the named utility.
- `hover:` is desktop-only (`future.hoverOnlyWhenSupported: true`).
