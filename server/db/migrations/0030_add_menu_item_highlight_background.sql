-- Standalone per-dish highlight flag (feature 027, Part D). Replaces the
-- scrapped shared `display_variant` enum column — now that Part C's 'hero'
-- concept no longer exists, a plain boolean is simplest (mirrors the existing
-- `featured` boolean already on this same table). `true` only for "All You
-- Can Eat Kids"; `false` (default) everywhere else.
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "highlight_background" boolean NOT NULL DEFAULT false;
