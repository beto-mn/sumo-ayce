-- Add display_order to drink_group — deterministically orders the drink-group
-- buttons in the Bebidas view (Coctelería Jumbo … Café y Digestivos), needed
-- after splitting Destilados into its own group. Additive, low-risk:
-- nullable-safe integer with a default, backfilled by the drinkGroups seed.
ALTER TABLE "drink_group" ADD COLUMN IF NOT EXISTS "display_order" integer DEFAULT 0 NOT NULL;
