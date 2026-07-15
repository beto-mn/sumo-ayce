-- Add optional section note to menu_categories — a per-category note rendered
-- at the TOP of the category section (e.g. the Kids "Combo incluye…" box),
-- mirroring the drink_group promo note. Additive, low-risk: both columns are
-- nullable text, backfilled (only for `kids`) by the menuCategories seed.
ALTER TABLE "menu_categories" ADD COLUMN IF NOT EXISTS "note_es" text;
ALTER TABLE "menu_categories" ADD COLUMN IF NOT EXISTS "note_en" text;
