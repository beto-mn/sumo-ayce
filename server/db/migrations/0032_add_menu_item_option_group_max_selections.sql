-- Additive column enabling bounded multi-select option groups (feature 028,
-- Part B). `1` (default) preserves every existing group's implicit
-- single-select behavior (Ramen XL, Vaso Sumo) unchanged; `2`/`3` are used by
-- the new À la Carta Wings/Boneless multi-sauce packages.
ALTER TABLE "menu_item_option_groups" ADD COLUMN IF NOT EXISTS "max_selections" integer NOT NULL DEFAULT 1;

--> statement-breakpoint
ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_option_groups_max_selections_positive" CHECK ("max_selections" >= 1);
