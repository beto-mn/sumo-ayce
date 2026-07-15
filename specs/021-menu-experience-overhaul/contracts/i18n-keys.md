# Contract — i18n keys (021)

> **Reconciled 2026-07-14 to delivered scope.** The big change vs the original draft: category and
> drink-group **labels moved OUT of i18n into the database** (single source of truth). The
> `menu.category.*` (except `empty`) and `menu.drink_group.*` keys were **removed**; new keys were
> added for the Kids view, the Vaso Sumo six-base selector, the Garantía badge alt, and the
> DB-unavailable state.

All keys under the `menu.*` namespace in `i18n/locales/es.json` and `en.json`, kept at ES↔EN parity.

## Labels moved to the DB (keys REMOVED)

| Removed keys | Now sourced from |
|---|---|
| `menu.category.*` (all except `menu.category.empty`) | `menu_categories.name_es/en` (DB) |
| `menu.drink_group.*` (all) | `drink_group.name_es/en` (DB, migration 0028) |

`menu.category.empty` ("Sin platillos en esta categoría") is retained. The sweet-rolls label is
**"Sushi Dulce"** and lives in the `menu_categories` seed, not i18n.

## Modality label (value change)

| Key | ES | EN |
|---|---|---|
| `menu.modality.buffet` | "All You Can Eat" | "All You Can Eat" |
| `menu.modality.carta` | "Carta" | "Menu" |

## Primary navigation labels (keys)

| Key | ES | EN |
|---|---|---|
| `menu.type.ayce` | "AYCE" | "AYCE" |
| `menu.type.express` | "Express" | "Express" |
| `menu.type.drinks` | "Bebidas y coctelería" | (EN value) |
| `menu.type.kids` | "Kids" | "Kids" |
| `menu.type.selector_label` | "Selecciona tipo de restaurante: AYCE o Express" | (EN value) |

## Kids view headings (new keys)

| Key | ES | EN |
|---|---|---|
| `menu.kids.ayce_heading` | "All You Can Eat Kids" | "All You Can Eat Kids" |
| `menu.kids.combo_heading` | "Combo Infantil" | (EN value) |

(The Kids combo inclusion NOTE is DB-driven — `menu_categories.note_es/en` for the `kids` row.)

## Vaso Sumo base selector (new keys) — SIX bases

The consolidated Vaso Sumo card uses the reused picker with base option labels:

| Key | ES | EN |
|---|---|---|
| `menu.vaso_sumo.picker_label` | "Elige tu base" | (EN value) |
| `menu.vaso_sumo.flavor.ron` | "Ron" | "Rum"/"Ron" |
| `menu.vaso_sumo.flavor.tequila` | "Tequila" | "Tequila" |
| `menu.vaso_sumo.flavor.vodka` | "Vodka" | "Vodka" |
| `menu.vaso_sumo.flavor.whisky` | "Whisky" | "Whisky" |
| `menu.vaso_sumo.flavor.new_mix` | "New Mix" | "New Mix" |
| `menu.vaso_sumo.flavor.jack_daniels` | "Jack Daniel's" | "Jack Daniel's" |

## Other new keys

| Key | ES | EN |
|---|---|---|
| `menu.guarantee_alt` | "Garantía Sumo" | (EN value) — alt for the star badge |
| `menu.unavailable` | "El menú no está disponible por el momento. Vuelve a intentarlo en unos minutos." | (EN value) — DB-unavailable state |

## Parity rule

ES and EN MUST have identical key sets after these additions/removals (project gate; mirrors the
feature-019 parity check).
