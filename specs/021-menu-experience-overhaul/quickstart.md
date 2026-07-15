# Quickstart — Menu Experience Overhaul (021)

## What this feature does

Turns `/menu` into a **4-way primary navigation** (AYCE | Express segmented pill + standalone
**Bebidas y coctelería** and **Kids** buttons) with an AYCE-only modality (All You Can Eat /
Carta), each showing a **curated, ordered category set** (or, for Kids, two sub-sections) and
landing on a **single default category**. Category + drink-group **labels come from the DB** (not
i18n). Also: Destilados split into its own group (`beers_spirits`→`beers`; `non_alcoholic`→`sodas`),
the 2x1 promo note rendered once, Vaso Sumo consolidated into one **six-base** selector card
(Tropical Sumo separate), café image-first, sauce picker removed from wings, homepage "Garantías
Sumo" rail deduped to exactly 11 unique dishes (star badge on featured cards), plus dish-card polish
(whole-card hover-zoom, half-width no-image drink cards, "Carta"/"Menu" label). Robustness: image
cache-busting, Neon retry, graceful empty-menu degradation.

## Migrations

**Three additive migrations** (hand-written, applied to production Neon, then reseeded):
- `0027_add_drink_group_display_order.sql` — `drink_group.display_order`
- `0028_add_drink_group_name.sql` — `drink_group.name_es` / `name_en`
- `0029_add_menu_category_note.sql` — `menu_categories.note_es` / `note_en`

```bash
# after editing server/db/schema.ts (drinkGroups + menuCategories tables)
# apply the hand-written migrations to production Neon (no Docker) per the project procedure
pnpm db:migrate                 # or the project's migrate command
pnpm db:seed                    # re-run seeds (destilados split, kids, featured 11, vaso sumo, ordering, DB labels)
```

Everything else (curated sets, Kids split, featured flags, promo move, Vaso Sumo, sub-group
ordering, wings sauce removal, labels, hover-zoom, half-width cards, robustness) is seed / i18n /
component only.

## Run locally

```bash
pnpm dev            # /menu
pnpm test           # Vitest (app/ happy-dom, server/ node)
pnpm storybook      # verify changed component stories
pnpm typecheck && pnpm check && pnpm build
```

## Manual verification checklist

- [ ] Fresh `/menu` load lands on AYCE · All You Can Eat · **Entradas** (single category).
- [ ] Nav is a **AYCE | Express** pill + standalone **Bebidas** + **Kids** buttons; AYCE modality sits between the pill and standalone buttons.
- [ ] AYCE·buffet shows the 8 categories in order (incl. **Sándwiches**; sweet rolls = "Sushi Dulce").
- [ ] AYCE·Carta shows the **11** categories in order (**no** Sándwiches, Burritos or Kids).
- [ ] Express shows the 8 categories in order (incl. **Burritos**, no modality selector).
- [ ] Bebidas shows the 6 groups in order, default **Coctelería Jumbo**, no modality selector.
- [ ] **Kids**: no chip row; two sections — "All You Can Eat Kids" ($179) then "Combo Infantil" (6 × $149) with the DB inclusion note.
- [ ] **Destilados** is its own button; its 2x1 note shows **once**; **Caguamón** first in Cervezas.
- [ ] Café y Digestivos: image items (carajillos) before no-image items.
- [ ] **One** Vaso Sumo card with a working **six-base** selector (Ron/Tequila/Vodka/Whisky/New Mix/Jack Daniel's); Tropical Sumo separate.
- [ ] Alitas & Boneless: **no** sauce picker.
- [ ] Homepage rail: exactly the **11** unique Garantías Sumo dishes; star badge on featured cards.
- [ ] Whole dish card zooms on hover (desktop pointer), not on touch; disabled under reduced-motion.
- [ ] No-image drink cards render at **half width** (6/row desktop vs 3).
- [ ] Modality label: "Carta" (ES) / "Menu" (EN); buffet "All You Can Eat" (both).
- [ ] Category/drink-group labels come from the DB (no `menu.category.*`/`menu.drink_group.*` i18n keys).
- [ ] Switching selection/modality resets to the new set's first category; deep-link `type=kids` restores Kids.
- [ ] `/menu` renders `ssr: true`; Neon down → `menu.unavailable` empty state (no 500); no Drizzle/Neon import under `app/**`.

## Key files

- Schema/migration: `server/db/schema.ts`, `server/db/migrations/00XX_*.sql`
- Seeds: `server/db/seeds/{drinkGroups,drinkSubGroups,drinks,ayceMenu,alaCarta,expressMenu,kidsMenu,desserts}.ts`
- Query: `server/utils/menu-queries.ts` (live path); cleanup `server/db/queries/menu.ts` (orphaned)
- Types: `types/menu.ts` (`DrinkGroup` + `destilados`)
- UI: `app/features/menu/components/*`, `app/features/menu/composables/useMenuFilters.ts`,
  `app/features/menu/menu-sets.ts` (new curated-set config)
- i18n: `i18n/locales/{es,en}.json`
