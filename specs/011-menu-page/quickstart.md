# Quickstart: Menu Page

## Local dev

```bash
# Start dev server
pnpm dev

# Navigate to:
# AYCE buffet
open http://localhost:3000/menu?type=ayce

# AYCE à la carte
open http://localhost:3000/menu?type=ayce&modality=carta

# Express
open http://localhost:3000/menu?type=express

# Smoke-test API
curl "http://localhost:3000/api/v1/menu?type=ayce" | jq '.categories | length'
curl "http://localhost:3000/api/v1/menu?type=ayce&modality=carta" | jq '.categories[0].dishes[0]'
curl "http://localhost:3000/api/v1/menu?type=express" | jq '.locationType'
```

## Pre-implementation image copy

Run once before starting Phase 3:

```bash
BASE="/Users/betonajera/Documents/Projects/Clients/SUMO/Assets/Menu/AYCE"
mkdir -p public/menu/ayce public/menu/ala-carta public/menu/drinks public/menu/kids public/menu/desserts public/menu/express
cp "$BASE/AYCE/"*.webp       public/menu/ayce/
cp "$BASE/A la carta/"*.webp public/menu/ala-carta/
cp "$BASE/Drinks/"*.webp     public/menu/drinks/
cp "$BASE/Kids/"*.webp       public/menu/kids/
cp "$BASE/Desserts/"*.webp   public/menu/desserts/
```

Verify count:
```bash
ls public/menu/ayce | wc -l       # expect 46
ls public/menu/ala-carta | wc -l  # expect 43
ls public/menu/drinks | wc -l     # expect 20
ls public/menu/kids | wc -l       # expect 9
ls public/menu/desserts | wc -l   # expect 5
```

## Acceptance checklist

### Gate verification

- [ ] `grep '/menu' nuxt.config.ts` shows `isr: 3600`
- [ ] `grep -r 'drizzle-orm\|@neondatabase' app/` returns empty
- [ ] `wc -l app/pages/menu.vue` template section ≤ 100 lines
- [ ] Stories exist: `MenuDishCard.stories.ts`, `MenuSaucePicker.stories.ts`, `MenuTypeToggle.stories.ts`, `MenuModalityToggle.stories.ts`
- [ ] `pnpm biome check .` → zero errors
- [ ] `pnpm vue-tsc --noEmit` → zero errors
- [ ] `pnpm vitest run --coverage app/features/menu/composables/` → ≥ 70% line coverage
- [ ] `grep '"menu\.' locales/es.json | wc -l` → ≥ 35
- [ ] `grep '"menu\.' locales/en.json | wc -l` → ≥ 35
- [ ] `ls public/menu/ayce/ | head -1` returns a `.webp` file

### Manual acceptance

1. **AYCE buffet**: `/menu?type=ayce` — orange accent, no prices shown, "Incluido" on cards ✓
2. **AYCE à la carte**: `/menu?type=ayce&modality=carta` — same page, prices visible ✓
3. **Express**: `/menu?type=express` — blue accent, no modality toggle, Express items only ✓
4. **Type switch**: click AYCE↔Express — accent changes, URL updates, category resets ✓
5. **Modality switch**: click "À la carte" — prices appear, URL updates ✓
6. **Category chips**: click "Sushi Frío" — page scrolls to cold_rolls section ✓
7. **Wings sauce picker**: scroll to Alitas — sauce picker visible, clicking a sauce highlights it ✓
8. **Drinks groups**: scroll to Bebidas — group headers visible (Coctelería Jumbo, etc.) ✓
9. **Language toggle**: switch to EN — all labels and dish names change ✓
10. **Images**: dish photos load from `/menu/ayce/`, `/menu/drinks/`, etc. ✓
11. **Missing image**: any dish with no `imageUrl` shows SUMO placeholder ✓
