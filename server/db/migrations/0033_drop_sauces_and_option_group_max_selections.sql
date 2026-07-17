-- Reverts feature 028 Part B's sauce-selection half (spec.md "Revision
-- 2026-07-17", FR-014 through FR-019) — the client decided against an
-- interactive sauce picker after seeing the final thermometer graphic.
-- Additive-only per the project's migration convention: this is a NEW
-- migration that drops the now-dead surface; migrations 0016 (sauces table)
-- and 0032 (max_selections column) are NOT edited.
ALTER TABLE "menu_item_option_groups" DROP CONSTRAINT IF EXISTS "menu_item_option_groups_max_selections_positive";

--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" DROP COLUMN IF EXISTS "max_selections";

--> statement-breakpoint
ALTER TABLE "menu_items" DROP COLUMN IF EXISTS "requires_sauce";

--> statement-breakpoint
DROP TABLE IF EXISTS "sauces";
