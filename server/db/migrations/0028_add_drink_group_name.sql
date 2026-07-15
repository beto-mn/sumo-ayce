-- Add display labels to drink_group — makes the Bebidas chip + section heading
-- DB-driven (single source of truth), mirroring menu_categories.name_es/en, so
-- the labels are no longer read from i18n. Additive, low-risk: both columns are
-- nullable text, backfilled by the drinkGroups seed.
ALTER TABLE "drink_group" ADD COLUMN IF NOT EXISTS "name_es" text;
ALTER TABLE "drink_group" ADD COLUMN IF NOT EXISTS "name_en" text;
